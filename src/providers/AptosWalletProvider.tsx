
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

export const AptosWalletProvider: React.FC<AptosWalletProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize the wallet plugins
  const wallets = [new PetraWallet(), new MartianWallet()];
  
  // Check authentication state on component mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Set up auth state listener FIRST
        const { data: { subscription } } = jsonStorageClient.auth.onAuthStateChange((event, session) => {
          setIsAuthenticated(!!session);
          console.log("Auth state changed:", event, !!session);
        });
        
        // THEN check for existing session
        const { data: { session } } = await jsonStorageClient.auth.getSession();
        setIsAuthenticated(!!session);
        setIsLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error checking auth state:", error);
        setIsLoading(false);
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
