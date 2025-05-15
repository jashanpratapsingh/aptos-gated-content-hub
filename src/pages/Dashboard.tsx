
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Mock data for content items
const myContent = [
  {
    id: '1',
    title: 'Aptos Development Guide',
    type: 'PDF',
    date: '2023-05-15',
    nftCollection: '0x1234...abcd',
    views: 120,
  },
  {
    id: '2',
    title: 'NFT Market Analysis Video',
    type: 'Video',
    date: '2023-06-22',
    nftCollection: '0x5678...efgh',
    views: 85,
  },
  {
    id: '3',
    title: 'Private Discord Link',
    type: 'Link',
    date: '2023-07-01',
    nftCollection: '0x9abc...ijkl',
    views: 210,
  },
];

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [nftAddress, setNftAddress] = useState('');
  const [contentType, setContentType] = useState('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [contentUrl, setContentUrl] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate form
    if (!title || !description || !nftAddress || (contentType !== 'link' && !file) || (contentType === 'link' && !contentUrl)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    // Simulate upload process
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Content Created!",
        description: "Your content has been successfully uploaded and gated.",
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setNftAddress('');
      setFile(null);
      setContentUrl('');
    }, 2000);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const copyShareLink = (id: string) => {
    const link = `${window.location.origin}/content/${id}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Link Copied",
      description: "The share link has been copied to your clipboard.",
    });
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
        <p className="text-aptosGray mb-8">Upload and manage your NFT-gated content</p>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Content</TabsTrigger>
            <TabsTrigger value="manage">My Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Content</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        placeholder="Content title" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Describe your content" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nftAddress">NFT Collection Address</Label>
                      <Input 
                        id="nftAddress" 
                        placeholder="0x..." 
                        value={nftAddress} 
                        onChange={e => setNftAddress(e.target.value)}
                      />
                      <p className="text-xs text-aptosGray">
                        Users must own an NFT from this collection to access your content
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Content Type</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          type="button"
                          variant={contentType === 'pdf' ? "default" : "outline"}
                          onClick={() => setContentType('pdf')}
                          className={contentType === 'pdf' ? "bg-aptosCyan hover:bg-aptosCyan/80" : ""}
                        >
                          PDF Document
                        </Button>
                        <Button 
                          type="button"
                          variant={contentType === 'video' ? "default" : "outline"}
                          onClick={() => setContentType('video')}
                          className={contentType === 'video' ? "bg-aptosCyan hover:bg-aptosCyan/80" : ""}
                        >
                          Video
                        </Button>
                        <Button 
                          type="button"
                          variant={contentType === 'link' ? "default" : "outline"}
                          onClick={() => setContentType('link')}
                          className={contentType === 'link' ? "bg-aptosCyan hover:bg-aptosCyan/80" : ""}
                        >
                          External Link
                        </Button>
                      </div>
                    </div>
                    
                    {contentType === 'link' ? (
                      <div className="space-y-2">
                        <Label htmlFor="contentUrl">External URL</Label>
                        <Input 
                          id="contentUrl" 
                          placeholder="https://..." 
                          value={contentUrl} 
                          onChange={e => setContentUrl(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="file">Upload File</Label>
                        <div className="border border-dashed border-border rounded-lg p-6 text-center">
                          <input
                            id="file"
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          {file ? (
                            <div>
                              <p className="font-medium text-white">{file.name}</p>
                              <p className="text-sm text-aptosGray">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFile(null)}
                                className="mt-2"
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-aptosGray mb-2">
                                Drag & drop your file here, or click to browse
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('file')?.click()}
                              >
                                Select File
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-aptosGray">
                          {contentType === 'pdf' 
                            ? 'Supported formats: PDF. Maximum size: 50MB.'
                            : 'Supported formats: MP4, WebM. Maximum size: 500MB.'
                          }
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full aptos-btn"
                    >
                      {loading ? "Uploading..." : "Upload Content"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>My Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-4 py-3.5 text-left text-sm font-medium text-aptosGray">
                            Title
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-medium text-aptosGray">
                            Type
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-medium text-aptosGray">
                            Date
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-medium text-aptosGray">
                            Views
                          </th>
                          <th className="px-4 py-3.5 text-right text-sm font-medium text-aptosGray">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {myContent.map((content) => (
                          <tr key={content.id}>
                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium text-white">{content.title}</p>
                                <p className="text-xs text-aptosGray">
                                  NFT: {content.nftCollection}
                                </p>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-aptosGray">
                              {content.type}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-aptosGray">
                              {content.date}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-aptosGray">
                              {content.views}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="mr-2 hover:bg-aptosCyan/20 hover:border-aptosCyan"
                                onClick={() => copyShareLink(content.id)}
                              >
                                Copy Link
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-aptosGray/20 hover:border-aptosGray"
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
