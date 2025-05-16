
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, FileVideo, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useAptosService } from '@/services/aptosService';

interface ContentCardProps {
  title: string;
  description: string;
  nftCollection: string;
  contentType: 'pdf' | 'video';
  thumbnail: string;
  isLocked: boolean;
  contentUrl?: string;
}

export const ContentCard = ({
  title,
  description,
  nftCollection,
  contentType,
  thumbnail,
  isLocked,
  contentUrl
}: ContentCardProps) => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hasNftAccess, setHasNftAccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { connected, account } = useWallet();
  const { verifyNftOwnership } = useAptosService();
  
  // Check NFT ownership when wallet connection changes
  useEffect(() => {
    if (connected && account && isLocked) {
      checkNftAccess();
    } else {
      setHasNftAccess(false);
    }
  }, [connected, account, nftCollection]);

  const checkNftAccess = async () => {
    try {
      setVerifying(true);
      if (!connected || !account) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to verify NFT ownership",
        });
        setHasNftAccess(false);
        return;
      }

      // Verify if the user owns an NFT from the collection
      console.log("Verifying NFT ownership for collection:", nftCollection);
      const hasAccess = await verifyNftOwnership(nftCollection);
      console.log("Verification result:", hasAccess);
      
      setHasNftAccess(hasAccess);
      
      if (hasAccess) {
        toast({
          title: "Access Granted!",
          description: "You own an NFT from this collection. Content unlocked.",
        });
      } else {
        toast({
          title: "Access Denied",
          description: "You don't own an NFT from this collection.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking NFT access:', error);
      toast({
        title: "Verification Error",
        description: "There was a problem verifying your NFT ownership.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };
  
  const handleViewContent = () => {
    if (!contentUrl) {
      toast({
        title: "Content Unavailable",
        description: "This content cannot be accessed at the moment.",
        variant: "destructive",
      });
      return;
    }
    
    if (isLocked && !hasNftAccess) {
      if (!connected) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to verify NFT ownership",
        });
      } else {
        toast({
          title: "Access Denied",
          description: "You don't own the required NFT to access this content",
          variant: "destructive",
        });
      }
      return;
    }
    
    // If user has access or content is not locked
    navigate(contentUrl);
  };
  
  const getContentIcon = () => {
    switch (contentType) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <FileVideo className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="aptos-card overflow-hidden">
      <div className="relative h-48">
        <img 
          src={thumbnail || "/placeholder.svg"} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        {isLocked && !hasNftAccess && (
          <div className="absolute inset-0 frosted-glass flex items-center justify-center">
            <Lock className="w-12 h-12 text-white/70" />
          </div>
        )}
        <div className="absolute top-4 right-4 bg-card px-2 py-1 rounded-md text-sm flex items-center gap-1">
          {getContentIcon()} {contentType.toUpperCase()}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-aptosGray mt-2 text-sm line-clamp-2">{description}</p>
        
        <div className="mt-4 flex items-center">
          <div className="w-8 h-8 rounded-full bg-aptosCyan flex items-center justify-center text-xs">
            NFT
          </div>
          <div className="ml-2">
            <p className="text-xs text-aptosGray">Required NFT Collection</p>
            <p className="text-xs text-white font-mono truncate max-w-[200px]">{nftCollection}</p>
          </div>
        </div>
        
        <div className="mt-4">
          {verifying ? (
            <Button disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying Ownership...
            </Button>
          ) : (
            <Button
              onClick={hasNftAccess ? handleViewContent : checkNftAccess}
              className={hasNftAccess || !isLocked ? "aptos-btn w-full" : "w-full"}
              variant={hasNftAccess || !isLocked ? "default" : "outline"}
            >
              {hasNftAccess || !isLocked ? "View Content" : "Verify NFT Ownership"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
