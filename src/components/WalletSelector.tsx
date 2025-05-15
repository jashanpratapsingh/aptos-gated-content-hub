
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

  // Clean up Supabase auth state
  const cleanupAuthState = () => {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  // Handle authentication with Supabase
  const handleAuthentication = async (address: string) => {
    try {
      setAuthenticating(true);
      
      // Clean up existing auth state
      cleanupAuthState();
      
      // Try to sign out globally first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Global sign out failed, continuing with authentication");
      }
      
      // Check if a profile with this wallet address already exists
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', address)
        .limit(1);
      
      // Generate deterministic email and password based on wallet address
      // This makes the credentials consistent for the same wallet
      const emailAddress = `${address.toLowerCase()}@aptos-wallet.user`;
      const password = `${address.toLowerCase()}#WalletAuth!2025`;
      
      if (!existingProfiles || existingProfiles.length === 0) {
        // No existing profile - create a new account
        console.log("No existing profile found, creating new account");
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: emailAddress,
          password: password,
        });
        
        if (signUpError) {
          console.error("Error signing up:", signUpError);
          throw signUpError;
        }
        
        // Update the profile with the wallet address
        if (signUpData && signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ wallet_address: address })
            .eq('id', signUpData.user.id);
          
          if (profileError) {
            console.error("Error updating profile:", profileError);
            throw profileError;
          }
        }
        
        toast({
          title: "Account Created",
          description: "New wallet profile has been created and you're signed in.",
        });
      } else {
        // Profile exists - sign in to the existing account
        console.log("Existing profile found, signing in");
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailAddress,
          password: password,
        });
        
        if (signInError) {
          console.log("Sign-in failed, attempting alternative authentication");
          
          // If sign in fails, try to sign up anyway (this could happen if the account exists
          // but the password has changed or was created with a different algorithm)
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: emailAddress,
            password: password,
          });
          
          if (signUpError) {
            // If sign up also fails, we need to reset the password
            console.log("Sign-up failed, attempting password reset");
            
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
              emailAddress,
              { redirectTo: window.location.origin }
            );
            
            if (resetError) {
              console.error("Error resetting password:", resetError);
              throw new Error("Couldn't authenticate with wallet. Please try again later.");
            }
            
            // Try signing in one more time
            const { error: finalSignInError } = await supabase.auth.signInWithPassword({
              email: emailAddress,
              password: password,
            });
            
            if (finalSignInError) {
              console.error("Final sign-in attempt failed:", finalSignInError);
              throw new Error("Authentication failed. Please disconnect and try again.");
            }
          }
          
          // Make sure the wallet address is updated in the profile
          const { data: userData } = await supabase.auth.getUser();
          if (userData && userData.user) {
            await supabase
              .from('profiles')
              .update({ wallet_address: address })
              .eq('id', userData.user.id);
          }
        }
        
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
      
      // Sign out from Supabase and clean up auth state
      await supabase.auth.signOut({ scope: 'global' });
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
