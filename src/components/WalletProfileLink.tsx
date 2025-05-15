
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';

export const WalletProfileLink = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { account } = useWallet();
  
  // No need to check wallet link manually since it's now part of the auth process
  // Just provide a way to update the profile if needed
  
  const updateProfile = async () => {
    try {
      setIsLoading(true);
      
      if (!account?.address) {
        throw new Error('Wallet not connected');
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be signed in to update your profile');
      }
      
      // Update profile with wallet address
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: account.address })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated with your wallet address.',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!account?.address) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <Button 
        variant="outline" 
        onClick={updateProfile}
        disabled={isLoading}
        className="text-sm bg-aptosCyan/20 border-aptosCyan hover:bg-aptosCyan/30"
      >
        {isLoading ? 'Processing...' : 'Update Profile'}
      </Button>
    </div>
  );
};
