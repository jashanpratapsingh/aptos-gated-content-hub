
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';
import { jsonStorageClient } from '@/integrations/jsonStorage/client';

interface AptosWalletProviderProps {
  children: ReactNode;
}

// Create auth context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

// Helper function to clean up auth state artifacts
const cleanupAuthState = () => {
  // Remove any stale auth tokens
  localStorage.removeItem('json_session');
  
  // Remove any keys related to auth state
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('json_auth.') || key.includes('json-session')) {
      localStorage.removeItem(key);
    }
  });
};

export const AptosWalletProvider: React.FC<AptosWalletProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize the wallet plugins
  const wallets = [new PetraWallet(), new MartianWallet()];
  
  // Check authentication state on component mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Set up auth state listener FIRST with improved error handling
        const { data: { subscription } } = jsonStorageClient.auth.onAuthStateChange((event, session) => {
          console.log("Auth state change event:", event);
          setIsAuthenticated(!!session);
          
          // If we get a sign_in event, make sure we're storing auth state properly
          if (event === 'SIGNED_IN' && session) {
            console.log("User authenticated successfully");
            
            // Use a setTimeout to avoid potential auth state deadlocks
            setTimeout(() => {
              // Any additional auth state setup can go here safely
            }, 0);
          }
        });
        
        // THEN check for existing session with cleaner error handling
        const { data: { session } } = await jsonStorageClient.auth.getSession();
        
        console.log("Initial auth check - session exists:", !!session);
        setIsAuthenticated(!!session);
        setIsLoading(false);
        
        return () => {
          // Cleanup on unmount
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error checking auth state:", error);
        setIsLoading(false);
        
        // If there's an error in auth state, clean up to prevent stuck states
        cleanupAuthState();
      }
    };
    
    checkAuthState();
  }, []);
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading }}>
      <AptosWalletAdapterProvider
        plugins={wallets as any} // Type assertion to bypass type mismatch
        autoConnect={true}
        onError={(error) => {
          console.log("Wallet adapter error:", error);
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </AuthContext.Provider>
  );
};
