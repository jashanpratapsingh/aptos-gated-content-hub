
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { ContentCard } from '../components/ContentCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Mock data for content items
const contentItems = [
  {
    id: '1',
    title: 'Exclusive Aptos Development Guide',
    description: 'Learn how to build on Aptos blockchain with this comprehensive development guide.',
    nftCollection: '0x1234...abcd',
    contentType: 'pdf' as const,
    thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e',
    isLocked: true,
  },
  {
    id: '2',
    title: 'NFT Market Analysis',
    description: 'Deep dive into the current state of NFT markets with expert insights.',
    nftCollection: '0x5678...efgh',
    contentType: 'video' as const,
    thumbnail: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e',
    isLocked: true,
  },
  {
    id: '4',
    title: 'Aptos Move Advanced Tutorial',
    description: 'Advanced tutorial on Move programming language for Aptos blockchain.',
    nftCollection: '0xdef0...mnop',
    contentType: 'pdf' as const,
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
    isLocked: true,
  },
  {
    id: '6',
    title: 'Creator Workshop Recording',
    description: 'Workshop on creating successful NFT projects on the Aptos blockchain.',
    nftCollection: '0x5678...uvwx',
    contentType: 'video' as const,
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
    isLocked: true,
  },
];

const Explore = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const filteredItems = contentItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || item.contentType === selectedType;
    
    return matchesSearch && matchesType;
  });
  
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
        
        {/* Content grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ContentCard key={item.id} {...item} />
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
