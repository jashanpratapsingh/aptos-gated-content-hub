
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ContentCard } from '../components/ContentCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/providers/AptosWalletProvider';
import { supabase } from '@/integrations/supabase/client';
import { useContentService, type ContentItem } from '@/services/contentService';

const Explore = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { getUserContent } = useContentService();
  
  useEffect(() => {
    loadContent();
  }, []);
  
  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getUserContent();
      setContentItems(data);
    } catch (error: any) {
      console.error('Error loading content:', error);
      setError(error.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };
  
  const filteredItems = contentItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || item.content_type === selectedType;
    
    return matchesSearch && matchesType;
  });
  
  // Generate a thumbnail URL for content
  const getThumbnailUrl = (contentType: string, id: string) => {
    const imageIds = [
      'photo-1526304640581-d334cdbbf45e',
      'photo-1620641788421-7a1c342ea42e',
      'photo-1558494949-ef010cbdcc31',
      'photo-1550745165-9bc0b252726f'
    ];
    const index = Math.abs(id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % imageIds.length;
    return `https://images.unsplash.com/${imageIds[index]}`;
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Explore NFT-Gated Content</h1>
          <p className="text-aptosGray">Discover exclusive content that can be unlocked with Aptos NFTs</p>
        </div>
        
        {/* Search and filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search content..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-card border-border"
          />
          
          <div className="flex gap-2">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              onClick={() => setSelectedType(null)}
              className={selectedType === null ? "bg-aptosCyan hover:bg-aptosCyan/80" : ""}
            >
              All
            </Button>
            <Button
              variant={selectedType === 'pdf' ? "default" : "outline"}
              onClick={() => setSelectedType('pdf')}
              className={selectedType === 'pdf' ? "bg-aptosCyan hover:bg-aptosCyan/80" : ""}
            >
              PDFs
            </Button>
            <Button
              variant={selectedType === 'video' ? "default" : "outline"}
              onClick={() => setSelectedType('video')}
              className={selectedType === 'video' ? "bg-aptosCyan hover:bg-aptosCyan/80" : ""}
            >
              Videos
            </Button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Content grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-aptosCyan" />
          </div>
        ) : contentItems.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No content available yet</h3>
            <p className="text-aptosGray mb-6">
              There's currently no content in the database to display.
            </p>
            {!isAuthenticated && (
              <p className="text-sm text-aptosGray">
                Connect your wallet to unlock content creation and access features.
              </p>
            )}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ContentCard 
                key={item.id}
                title={item.title}
                description={item.description || ''}
                nftCollection={item.nft_collection_address}
                contentType={item.content_type}
                thumbnail={getThumbnailUrl(item.content_type, item.id)}
                isLocked={true}
                contentUrl={`/content/${item.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-aptosGray">No content found matching your criteria</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Explore;
