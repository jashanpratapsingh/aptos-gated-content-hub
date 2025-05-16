
import { AptosClient, Network, Types } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';

// Initialize Aptos client (using mainnet for production or testnet for testing)
const aptosClient = new AptosClient({ 
  NODE_URL: "https://fullnode.mainnet.aptoslabs.com/v1",
  NETWORK: Network.MAINNET
});

export const useAptosService = () => {
  const { toast } = useToast();
  const { account } = useWallet();

  /**
   * Verifies if a wallet owns an NFT from a specific collection
   * @param collectionAddress - The address of the NFT collection
   * @returns Promise<boolean> - Whether the wallet owns an NFT from the collection
   */
  const verifyNftOwnership = async (collectionAddress: string): Promise<boolean> => {
    try {
      if (!account?.address) {
        return false;
      }

      // Convert addresses to standard format if needed
      const formattedCollectionAddress = collectionAddress.startsWith('0x') 
        ? collectionAddress 
        : `0x${collectionAddress}`;
      const formattedUserAddress = account.address.startsWith('0x') 
        ? account.address 
        : `0x${account.address}`;

      // Query the blockchain to get NFTs owned by the wallet
      const userNftsResponse = await aptosClient.getAccountTokensCount(
        formattedUserAddress
      );

      // If the user has no tokens
      if (!userNftsResponse || Number(userNftsResponse) === 0) {
        return false;
      }

      // Get token data for the user
      const tokenData = await aptosClient.getAccountOwnedTokens({
        accountAddress: formattedUserAddress,
        options: {
          limit: 100 // Adjust as needed
        }
      });

      // Check if any token belongs to the specified collection
      return tokenData.some(token => {
        const tokenCollectionAddress = token.current_token_data?.collection_id || '';
        return tokenCollectionAddress.toLowerCase() === formattedCollectionAddress.toLowerCase();
      });
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      toast({
        title: 'Verification Error',
        description: 'Could not verify NFT ownership. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    verifyNftOwnership
  };
};
