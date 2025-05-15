
import React, { ReactNode } from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';

interface AptosWalletProviderProps {
  children: ReactNode;
}

export const AptosWalletProvider: React.FC<AptosWalletProviderProps> = ({ children }) => {
  // Initialize the wallets
  const wallets = [new PetraWallet(), new MartianWallet()];

  return (
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
      {children}
    </AptosWalletAdapterProvider>
  );
};
