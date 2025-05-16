
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Layout } from '../components/Layout';
import { ParticleBackground } from '../components/ParticleBackground';
import { ContentCard } from '../components/ContentCard';
import { Link } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { useContentService, type ContentItem } from '@/services/contentService';

const Index = () => {
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { getUserContent } = useContentService();

  useEffect(() => {
    const loadFeaturedContent = async () => {
      try {
        setLoading(true);
        const allContent = await getUserContent();
        
        // Get up to 3 most recent pieces of content
        const featured = allContent.slice(0, 3);
        setFeaturedContent(featured);
      } catch (error) {
        console.error("Error loading featured content:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedContent();
  }, []);

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
    <Layout transparentNavbar>
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        <ParticleBackground />
        <div className="container mx-auto px-4 z-10 pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-aptosCyan to-aptosPurple bg-clip-text text-transparent">
              Unlock Exclusive Content with NFTs on Aptos
            </h1>
            <p className="text-xl md:text-2xl text-aptosGray mb-8">
              Own the keys to exclusive content. Connect your Aptos wallet and gain access to premium resources, videos, and communities.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="aptos-btn text-lg py-6 px-8" asChild>
                <Link to="/explore">Get Started</Link>
              </Button>
              <Button variant="outline" className="border-aptosCyan text-white hover:bg-aptosCyan/20 text-lg py-6 px-8" asChild>
                <Link to="/dashboard">Create Content</Link>
              </Button>
            </div>
          </div>
          
          {/* Floating NFT Card */}
          <div className="mt-16 md:mt-24 animate-float">
            <div className="max-w-xs mx-auto frosted-glass p-6 rounded-xl border border-white/20 shadow-[0_8px_30px_rgb(0,255,163,0.12)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-aptosCyan to-aptosPurple" />
                  <h3 className="ml-2 font-bold">Premium Access</h3>
                </div>
                <div className="text-xs bg-aptosPurple/20 text-aptosPurple px-2 py-1 rounded-full">
                  NFT Gated
                </div>
              </div>
              <div className="h-32 bg-black/40 rounded-md flex items-center justify-center">
                <Lock className="h-8 w-8 text-white/60" />
              </div>
              <div className="mt-4">
                <div className="h-4 w-3/4 bg-white/20 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-white/20 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured Content Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-2">Featured Content</h2>
        <p className="text-aptosGray mb-8">Discover premium content unlockable with Aptos NFTs</p>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-aptosCyan" />
          </div>
        ) : featuredContent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContent.map((content) => (
              <ContentCard 
                key={content.id}
                title={content.title}
                description={content.description || ''}
                nftCollection={content.nft_collection_address}
                contentType={content.content_type}
                thumbnail={getThumbnailUrl(content.content_type, content.id)}
                isLocked={true}
                contentUrl={`/content/${content.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">No content available yet</h3>
            <p className="text-aptosGray mb-2">
              Be the first to create exclusive content!
            </p>
            <Button className="mt-4" asChild>
              <Link to="/dashboard">Create Content</Link>
            </Button>
          </div>
        )}
        
        <div className="mt-12 text-center">
          <Button variant="outline" className="border-aptosCyan text-white hover:bg-aptosCyan/20" asChild>
            <Link to="/explore">View All Content</Link>
          </Button>
        </div>
      </div>
      
      {/* How It Works */}
      <div className="bg-black/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-aptosCyan/20 flex items-center justify-center mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
              <p className="text-aptosGray">Connect your Aptos wallet to verify your NFT ownership.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-aptosCyan/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Verify NFTs</h3>
              <p className="text-aptosGray">We'll check if you own the required NFTs for the content.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-aptosCyan/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Access Content</h3>
              <p className="text-aptosGray">Instantly unlock and access exclusive creator content.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="frosted-glass p-8 md:p-12 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to share exclusive content?</h2>
              <p className="text-aptosGray">Create and gate your content with NFTs in minutes.</p>
            </div>
            <Button className="aptos-btn" asChild>
              <Link to="/dashboard">Start Creating</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
