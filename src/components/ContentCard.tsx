
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, FileVideo, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleViewContent = () => {
    if (!contentUrl) {
      toast({
        title: "Content Unavailable",
        description: "This content cannot be accessed at the moment.",
        variant: "destructive",
      });
      return;
    }
    
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
        {isLocked && (
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
          <Button
            onClick={handleViewContent}
            disabled={loading}
            className={isLocked ? "w-full" : "aptos-btn w-full"}
            variant={isLocked ? "outline" : "default"}
          >
            {loading ? "Loading..." : "View Content"}
          </Button>
        </div>
      </div>
    </div>
  );
};
