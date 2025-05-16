import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Lock, FileVideo, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { useAptosService } from '@/services/aptosService';
import { useContentService } from '@/services/contentService';
import PdfViewer from '@/components/PdfViewer';

interface Content {
  id: string;
  title: string;
  description: string;
  content_type: 'pdf' | 'video';
  nft_collection_address: string;
  storage_path: string;
  creator_id: string;
  creator?: {
    wallet_address: string;
  }
}

const ContentView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNftOwner, setIsNftOwner] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();
  const { account, connected } = useWallet();
  const { verifyNftOwnership } = useAptosService();
  const { logContentAccess } = useContentService();
  
  useEffect(() => {
    if (id) {
      loadContent(id);
    }
  }, [id]);
  
  const loadContent = async (contentId: string) => {
    try {
      setLoading(true);
      
      // Fetch content
      const { data: contentData, error } = await supabase
        .from('content')
        .select()
        .eq('id', contentId)
        .single();
      
      if (error) throw error;
      
      if (!contentData) {
        navigate('/404');
        return;
      }
      
      // Get creator profile
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select()
        .eq('id', contentData.creator_id)
        .single();
      
      // Transform data to match our Content interface
      const content: Content = {
        ...contentData,
        creator: {
          wallet_address: creatorProfile?.wallet_address || 'unknown'
        }
      };
      
      setContent(content);
      
      // If user is already connected, check NFT ownership
      if (connected && account) {
        await checkNftOwnership(content.nft_collection_address);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: "Content Not Found",
        description: "The requested content could not be loaded.",
        variant: "destructive",
      });
      navigate('/explore');
    } finally {
      setLoading(false);
    }
  };
  
  // Real blockchain verification of NFT ownership using Aptos
  const checkNftOwnership = async (nftCollectionAddress: string) => {
    try {
      setVerifying(true);
      
      if (!account?.address) {
        setIsNftOwner(false);
        return;
      }
      
      // Verify NFT ownership using our Aptos service
      const hasNft = await verifyNftOwnership(nftCollectionAddress);
      
      setIsNftOwner(hasNft);
      
      // Log content access if verification is successful
      if (hasNft && content) {
        await logContentAccess(content.id);
      }
      
      // Get content URL if user has access
      if (hasNft && content) {
        const { data } = await supabase.storage
          .from('content')
          .createSignedUrl(content.storage_path, 3600); // 1 hour expiry
          
        setContentUrl(data?.signedUrl || null);
      }
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      setIsNftOwner(false);
    } finally {
      setVerifying(false);
    }
  };
  
  // Renamed from verifyNftOwnership to handleVerifyOwnership to avoid conflict
  const handleVerifyOwnership = async () => {
    if (!content) return;
    
    if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first to verify NFT ownership.",
      });
      return;
    }
    
    await checkNftOwnership(content.nft_collection_address);
    
    if (!isNftOwner) {
      toast({
        title: "Access Denied",
        description: "You don't own an NFT from the required collection.",
        variant: "destructive",
      });
    }
  };
  
  const renderContentPreview = () => {
    if (!content) return null;
    
    if (!isNftOwner) {
      return (
        <div className="aptos-card p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Lock className="h-16 w-16 text-aptosGray mb-4" />
          <h3 className="text-xl font-semibold mb-2">Content Locked</h3>
          <p className="text-aptosGray text-center mb-4 max-w-md">
            This content is exclusive to owners of NFTs from collection:
          </p>
          <p className="font-mono text-sm bg-black/30 px-3 py-2 rounded-lg mb-6">
            {content.nft_collection_address}
          </p>
          <Button 
            onClick={handleVerifyOwnership}
            disabled={verifying}
            className="aptos-btn"
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : "Verify NFT Ownership"}
          </Button>
        </div>
      );
    }
    
    switch (content.content_type) {
      case 'pdf':
        return (
          <div className="aptos-card p-6 animate-fade-in">
            {contentUrl ? (
              <div className="mb-4">
                <PdfViewer 
                  pdfUrl={contentUrl} 
                  onDownload={() => contentUrl && window.open(contentUrl, '_blank')} 
                />
              </div>
            ) : (
              <div className="bg-black/40 rounded-lg p-4 h-[500px] flex items-center justify-center mb-4">
                <FileText className="h-16 w-16 text-aptosGray mb-2" />
                <p className="text-aptosGray">PDF Viewer would be embedded here</p>
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="aptos-card overflow-hidden animate-fade-in">
            {contentUrl ? (
              <div className="aspect-video">
                <video 
                  src={contentUrl} 
                  controls 
                  className="w-full h-full" 
                />
              </div>
            ) : (
              <div className="aspect-video bg-black/40 flex items-center justify-center flex-col">
                <FileVideo className="h-16 w-16 text-aptosGray mb-2" />
                <p className="text-aptosGray">Video Player would be embedded here</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-aptosCyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  if (!content) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Content Not Found</h2>
          <p className="text-aptosGray">This content may have been removed or is unavailable.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-aptosGray mb-2">
            <span>Creator: {content.creator.wallet_address.substring(0, 6)}...{content.creator.wallet_address.substring(content.creator.wallet_address.length - 4)}</span>
            <span>•</span>
            <span>Requires NFT</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
          <p className="text-aptosGray">{content.description}</p>
        </div>
        
        {renderContentPreview()}
      </div>
    </Layout>
  );
};

export default ContentView;
