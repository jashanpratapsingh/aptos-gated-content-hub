
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface WalletType {
  name: string;
  icon: string;
  installed: boolean;
}

export const WalletSelector = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [showWallets, setShowWallets] = useState(false);
  const { toast } = useToast();

  // Mock wallet data - in a real app, this would come from Aptos Wallet Adapter
  const wallets: WalletType[] = [
    {
      name: 'Petra Wallet',
      icon: '🦊',
      installed: true
    },
    {
      name: 'Martian Wallet',
      icon: '👽',
      installed: true
    }
  ];

  // Simulate wallet connection
  const connectWallet = (walletName: string) => {
    // In a real app, this would use the Aptos Wallet Adapter to connect
    const mockAddress = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    setAccount(mockAddress);
    setIsConnected(true);
    setShowWallets(false);
    
    toast({
      title: "Wallet Connected",
      description: `Connected to ${walletName}`,
    });
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="relative">
      {!isConnected ? (
        <Button 
          onClick={() => setShowWallets(!showWallets)} 
          className="aptos-btn"
        >
          Connect Wallet
        </Button>
      ) : (
        <Button 
          variant="outline" 
          className="border border-aptosCyan text-white hover:bg-aptosCyan/20" 
          onClick={() => setShowWallets(!showWallets)}
        >
          {account && formatAddress(account)}
        </Button>
      )}
      
      {showWallets && (
        <div className="absolute right-0 mt-2 w-60 rounded-lg bg-card border border-border shadow-lg z-50">
          <div className="p-2">
            {!isConnected ? (
              <>
                <div className="px-3 py-2 text-sm font-medium text-white">
                  Connect a wallet
                </div>
                {wallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => connectWallet(wallet.name)}
                    className="flex items-center w-full px-3 py-2 text-sm hover:bg-white/10 rounded-md"
                  >
                    <span className="mr-2 text-lg">{wallet.icon}</span>
                    <span>{wallet.name}</span>
                    {!wallet.installed && (
                      <span className="ml-auto text-xs text-gray-400">Not installed</span>
                    )}
                  </button>
                ))}
              </>
            ) : (
              <>
                <div className="px-3 py-2 text-sm font-medium text-white">
                  Connected
                </div>
                <div className="px-3 py-2 text-sm text-aptosGray">
                  {account && formatAddress(account)}
                </div>
                <button
                  onClick={() => disconnectWallet()}
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
