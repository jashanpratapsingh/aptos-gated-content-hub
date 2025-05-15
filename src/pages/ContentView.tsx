
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Content {
  id: string;
  title: string;
  description: string;
  contentType: 'pdf' | 'video' | 'link';
  nftCollection: string;
  creatorName: string;
  thumbnail?: string;
  contentUrl?: string;
}

const ContentView = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNftOwner, setIsNftOwner] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Simulate fetching content data
    setTimeout(() => {
      // Mock data for this example
      const mockContent: Content = {
        id: id || '1',
        title: "Exclusive Aptos Development Guide",
        description: "Learn how to build on Aptos blockchain with this comprehensive development guide. This guide covers everything from basic setup to advanced Move programming concepts.",
        contentType: 'pdf',
        nftCollection: '0x1234...abcd',
        creatorName: "Aptos Labs",
        thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e',
        contentUrl: '#'
      };
      
      setContent(mockContent);
      setLoading(false);
    }, 1000);
  }, [id]);
  
  const verifyNftOwnership = () => {
    setVerifying(true);
    
    // Simulate NFT verification process
    setTimeout(() => {
      setVerifying(false);
      
      // For demo purposes, randomly determine if user owns the NFT
      const hasNft = Math.random() > 0.5;
      
      if (hasNft) {
        setIsNftOwner(true);
        toast({
          title: "Access Granted",
          description: "NFT ownership verified. You now have access to this content.",
        });
      } else {
        toast({
          title: "Access Denied",
          description: "You don't own an NFT from the required collection.",
          variant: "destructive",
        });
      }
    }, 2000);
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
            {content.nftCollection}
          </p>
          <Button 
            onClick={verifyNftOwnership}
            disabled={verifying}
            className="aptos-btn"
          >
            {verifying ? "Verifying..." : "Verify NFT Ownership"}
          </Button>
        </div>
      );
    }
    
    switch (content.contentType) {
      case 'pdf':
        return (
          <div className="aptos-card p-6 animate-fade-in">
            <div className="bg-black/40 rounded-lg p-4 h-[500px] flex items-center justify-center mb-4">
              <p className="text-aptosGray">PDF Viewer would be embedded here</p>
            </div>
            <Button className="aptos-btn w-full">Download PDF</Button>
          </div>
        );
      case 'video':
        return (
          <div className="aptos-card overflow-hidden animate-fade-in">
            <div className="aspect-video bg-black/40 flex items-center justify-center">
              <p className="text-aptosGray">Video Player would be embedded here</p>
            </div>
          </div>
        );
      case 'link':
        return (
          <div className="aptos-card p-8 animate-fade-in">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">External Link Unlocked</h3>
              <p className="text-aptosGray mb-6">
                You've successfully unlocked access to this external resource.
              </p>
              <Button className="aptos-btn" asChild>
                <a href={content.contentUrl} target="_blank" rel="noopener noreferrer">
                  Open Link
                </a>
              </Button>
            </div>
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
            <span>Created by {content.creatorName}</span>
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
