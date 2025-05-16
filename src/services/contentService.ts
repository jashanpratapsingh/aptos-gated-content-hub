
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import type { ContentItem } from '@/integrations/jsonStorage/client';

export type { ContentItem };

export const useContentService = () => {
  const { toast } = useToast();
  const { account } = useWallet();
  
  // Get user's created content
  const getUserContent = async (): Promise<ContentItem[]> => {
    try {
      // Get content without authentication requirement
      const { data, error } = await supabase
        .from('content')
        .select();
        
      if (error) throw error;
      
      // Sort the content manually after fetching
      const sortedData = (data as ContentItem[])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
      return sortedData;
    } catch (error: any) {
      toast({
        title: 'Error fetching content',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
  };
  
  // Upload content file to storage and create content record without authentication requirement
  const uploadContent = async (
    file: File,
    title: string,
    description: string,
    nftAddress: string,
    contentType: 'pdf' | 'video'
  ): Promise<ContentItem | null> => {
    try {
      // Generate a guest ID if not authenticated
      const guestId = crypto.randomUUID();
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `guest/${guestId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('content')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL for the file
      const { data: urlData } = supabase.storage
        .from('content')
        .getPublicUrl(filePath);
        
      const publicUrl = urlData.publicUrl;
      
      // Create content record in the database without requiring authentication
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert([
          {
            creator_id: guestId, // Use the generated guest ID
            title,
            description,
            content_type: contentType,
            storage_path: filePath,
            nft_collection_address: nftAddress,
            views: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (contentError) throw contentError;
      
      toast({
        title: 'Content uploaded successfully',
        description: 'Your content has been published and is now available.',
      });
      
      return contentData as ContentItem;
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };
  
  // Delete content
  const deleteContent = async (contentId: string): Promise<boolean> => {
    try {
      // Get content details first to get the file path
      const { data: content, error: contentFetchError } = await supabase
        .from('content')
        .select()
        .eq('id', contentId)
        .single();
      
      if (contentFetchError || !content) {
        throw new Error('Content not found');
      }
      
      // Delete file from Supabase storage
      const { error: storageError } = await supabase.storage
        .from('content')
        .remove([content.storage_path]);
        
      if (storageError) throw storageError;
      
      // Delete content record from database
      const { error: contentError } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId);
        
      if (contentError) throw contentError;
      
      toast({
        title: 'Content deleted',
        description: 'The content has been successfully removed.',
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };
  
  // Log content access
  const logContentAccess = async (contentId: string): Promise<void> => {
    try {
      // Generate a guest ID for non-authenticated users
      const guestId = crypto.randomUUID();
      
      await supabase.from('content_access_logs').insert([
        {
          content_id: contentId,
          user_id: null, // No user_id for guests
          wallet_address: account?.address || null,
          accessed_at: new Date().toISOString()
        }
      ]);
      
      // Increment view count using a database function
      await supabase.rpc('increment_content_views', { content_id: contentId });
    } catch (error) {
      console.error('Failed to log content access:', error);
    }
  };
  
  return {
    getUserContent,
    uploadContent,
    deleteContent,
    logContentAccess,
  };
};
