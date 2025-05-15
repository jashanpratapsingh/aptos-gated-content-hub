
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useWallet, WalletName } from '@aptos-labs/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';

export const WalletSelector = () => {
  const [showWallets, setShowWallets] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const { toast } = useToast();
  const { 
    connect, 
    disconnect, 
    account, 
    connected,
    wallets
  } = useWallet();

  // Sort wallets for better display
  const availableWallets = wallets.filter(wallet => 
    wallet.readyState === 'Installed' || wallet.readyState === 'Loadable'
  );
  
  const installableWallets = wallets.filter(wallet => 
    wallet.readyState === 'NotDetected'
  );

  // Handle wallet connection changes
  useEffect(() => {
    if (connected && account?.address) {
      handleAuthentication(account.address);
    }
  }, [connected, account?.address]);

  // Close wallet dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.wallet-selector')) {
        setShowWallets(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Handle authentication with Supabase
  const handleAuthentication = async (address: string) => {
    try {
      setAuthenticating(true);
      
      // First check if the user is already signed in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Generate a nonce for this session
        const nonce = Math.floor(Math.random() * 1000000).toString();
        
        // Sign in anonymously, using the wallet address as the id
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${address.toLowerCase()}@aptos-wallet.user`,
          password: `${address.toLowerCase()}-${nonce}`
        });
        
        if (error) {
          // If sign in fails, try to create a new account
          if (error.message.includes('email') || error.message.includes('password')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: `${address.toLowerCase()}@aptos-wallet.user`,
              password: `${address.toLowerCase()}-${nonce}`
            });
            
            if (signUpError) throw signUpError;
          } else {
            throw error;
          }
        }
        
        // Update the profile with the wallet address
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            wallet_address: address
          })
          .eq('id', supabase.auth.getUser().then(({ data }) => data.user?.id));
        
        if (profileError) console.error("Error updating profile:", profileError);
        
        toast({
          title: "Authentication Successful",
          description: "Your wallet is now connected and you're signed in.",
        });
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate with wallet",
        variant: "destructive",
      });
    } finally {
      setAuthenticating(false);
    }
  };

  const handleConnectWallet = async (walletName: string) => {
    try {
      console.log(`Attempting to connect to wallet: ${walletName}`);
      // Cast the string to WalletName type to satisfy TypeScript
      await connect(walletName as WalletName);
      setShowWallets(false);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${walletName}`,
      });
    } catch (error: any) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      
      // Sign out from Supabase as well
      await supabase.auth.signOut();
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected and you're signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative wallet-selector">
      {!connected ? (
        <Button 
          onClick={() => setShowWallets(!showWallets)} 
          className="aptos-btn"
          disabled={authenticating}
        >
          {authenticating ? "Connecting..." : "Connect Wallet"}
        </Button>
      ) : (
        <Button 
          variant="outline" 
          className="border border-aptosCyan text-white hover:bg-aptosCyan/20" 
          onClick={() => setShowWallets(!showWallets)}
          disabled={authenticating}
        >
          {account?.address && formatAddress(account.address)}
        </Button>
      )}
      
      {showWallets && (
        <div className="absolute right-0 mt-2 w-60 rounded-lg bg-slate-900 border border-border shadow-lg z-50">
          <div className="p-2">
            {!connected ? (
              <>
                <div className="px-3 py-2 text-sm font-medium text-white">
                  Connect a wallet
                </div>
                
                {/* Available (installed) wallets */}
                {availableWallets.length > 0 && (
                  <div className="mb-2">
                    {availableWallets.map((wallet) => (
                      <button
                        key={wallet.name}
                        onClick={() => handleConnectWallet(wallet.name)}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-white/10 rounded-md"
                      >
                        {wallet.icon && (
                          <img 
                            src={wallet.icon} 
                            alt={`${wallet.name} icon`} 
                            className="w-5 h-5 mr-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>{wallet.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Installable wallets */}
                {installableWallets.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-aptosGray">
                      Not installed
                    </div>
                    {installableWallets.map((wallet) => (
                      <a
                        key={wallet.name}
                        href={wallet.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-white/10 rounded-md"
                      >
                        {wallet.icon && (
                          <img 
                            src={wallet.icon} 
                            alt={`${wallet.name} icon`} 
                            className="w-5 h-5 mr-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>{wallet.name}</span>
                        <span className="ml-auto text-xs text-gray-400">Install</span>
                      </a>
                    ))}
                  </>
                )}

                {availableWallets.length === 0 && installableWallets.length === 0 && (
                  <div className="px-3 py-2 text-sm text-aptosGray">
                    No wallets available
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="px-3 py-2 text-sm font-medium text-white">
                  Connected
                </div>
                <div className="px-3 py-2 text-sm text-aptosGray">
                  {account?.address && formatAddress(account.address)}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-500 hover:bg-white/10 rounded-md"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
