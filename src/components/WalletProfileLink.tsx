
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';

export const WalletProfileLink = () => {
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { account } = useWallet();
  
  useEffect(() => {
    if (account?.address) {
      checkWalletLink();
    } else {
      setIsLinked(false);
    }
  }, [account?.address]);
  
  const checkWalletLink = async () => {
    try {
      if (!account?.address) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', account.address)
        .single();
      
      setIsLinked(!!data);
    } catch (error) {
      setIsLinked(false);
    }
  };
  
  const linkWallet = async () => {
    try {
      setIsLoading(true);
      
      if (!account?.address) {
        throw new Error('Wallet not connected');
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be signed in to link a wallet');
      }
      
      // Check if wallet is already linked to another account
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', account.address)
        .neq('id', user.id)
        .single();
        
      if (existingProfile) {
        throw new Error('This wallet is already linked to another account');
      }
      
      // Link wallet to user profile
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: account.address })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setIsLinked(true);
      toast({
        title: 'Wallet linked',
        description: 'Your wallet has been successfully linked to your profile.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to link wallet',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const unlinkWallet = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be signed in to unlink a wallet');
      }
      
      // Unlink wallet from user profile
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: null })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setIsLinked(false);
      toast({
        title: 'Wallet unlinked',
        description: 'Your wallet has been successfully unlinked from your profile.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to unlink wallet',
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
      {isLinked ? (
        <Button 
          variant="outline" 
          onClick={unlinkWallet}
          disabled={isLoading}
          className="text-sm"
        >
          {isLoading ? 'Processing...' : 'Unlink Wallet from Profile'}
        </Button>
      ) : (
        <Button 
          variant="outline" 
          onClick={linkWallet}
          disabled={isLoading}
          className="text-sm bg-aptosCyan/20 border-aptosCyan hover:bg-aptosCyan/30"
        >
          {isLoading ? 'Processing...' : 'Link Wallet to Profile'}
        </Button>
      )}
    </div>
  );
};
