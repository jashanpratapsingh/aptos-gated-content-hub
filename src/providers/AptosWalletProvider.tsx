
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';
import { supabase } from '@/integrations/supabase/client';

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
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error("Error checking auth state:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthState();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
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
