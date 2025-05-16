
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useWallet, WalletName } from '@aptos-labs/wallet-adapter-react';
import { jsonStorageClient } from '@/integrations/jsonStorage/client';

/**
 * Creates a SHA-256 hash of the input string using WebCrypto API if available
 * with a fallback to a simple string hashing algorithm
 */
async function createSHA256Hash(input: string): Promise<string> {
  try {
    // Use browser's native WebCrypto API if available
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input.toLowerCase());
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      
      // Convert buffer to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      throw new Error('WebCrypto not available');
    }
  } catch (error) {
    console.error("Error creating crypto hash:", error);
    
    // Fallback hashing method
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Create a hex string
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

// Helper function to clean up auth state
const cleanupAuthState = () => {
  localStorage.removeItem('json_session');
  
  // Remove any keys related to auth state
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('json_auth.') || key.includes('json-session')) {
      localStorage.removeItem(key);
    }
  });
};

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

  // Handle wallet connection changes with improved persistence
  useEffect(() => {
    if (connected && account?.address) {
      console.log("Account connected:", account.address.substring(0, 10) + "...");
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

  // Check for auth state changes
  useEffect(() => {
    const { data: { subscription } } = jsonStorageClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast({
          title: "Authentication Successful",
          description: "You've been successfully authenticated with your wallet",
        });
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Handle authentication with improved error handling and state cleanup
  const handleAuthentication = async (address: string) => {
    try {
      setAuthenticating(true);
      
      // Clean up existing auth state
      cleanupAuthState();
      
      // Try to sign out globally first
      try {
        await jsonStorageClient.auth.signOut();
      } catch (err) {
        // Continue even if this fails
        console.log("Sign out failed, continuing with authentication");
      }
      
      console.log("Authenticating wallet address:", address.substring(0, 10) + "...");
      
      // Check if a profile with this wallet address already exists
      const { data: existingProfiles } = await jsonStorageClient
        .from('profiles')
        .select()
        .eq('wallet_address', address)
        .limit(1);
      
      if (!existingProfiles || existingProfiles.length === 0) {
        console.log("No existing profile found, creating new account");
        
        // Authenticate with wallet address
        const { error: authError } = await jsonStorageClient.auth.authenticateWithWallet(address);
        
        if (authError) {
          console.error("Authentication error:", authError);
          throw authError;
        }
        
        toast({
          title: "Wallet Connected",
          description: "Your wallet is now connected and authenticated.",
        });
      } else {
        console.log("Existing profile found, signing in");
        
        // Authenticate with existing wallet address
        const { error: authError } = await jsonStorageClient.auth.authenticateWithWallet(address);
        
        if (authError) {
          console.error("Authentication error:", authError);
          throw authError;
        }
        
        toast({
          title: "Wallet Connected",
          description: "Your wallet is now connected and authenticated.",
        });
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate with wallet",
        variant: "destructive",
      });
      
      // If authentication fails, disconnect the wallet
      disconnect();
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
      
      // Sign out and clean up auth state
      await jsonStorageClient.auth.signOut();
      cleanupAuthState();
      
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
