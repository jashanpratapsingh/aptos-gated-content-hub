
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';

// Initialize Aptos client (using mainnet for production or testnet for testing)
const aptosClient = new Aptos(new AptosConfig({
  network: Network.MAINNET
}));

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

      // Check if the account has token data - use proper parameter object format
      const response = await aptosClient.getAccountOwnedTokens({
        accountAddress: formattedUserAddress,
      });
      
      // If the user has no tokens
      if (!response || response.length === 0) {
        return false;
      }

      // Check if any token belongs to the specified collection
      return response.some(token => {
        // Extract the collection address from the token data structure
        // The token_data_id is an object that contains the collection information
        const tokenDataId = token.current_token_data?.token_data_id;
        
        // Safely access the collection property if it exists in the structure
        let tokenCollectionId = '';
        
        // Add additional null check for tokenDataId
        if (tokenDataId !== null && tokenDataId !== undefined) {
          if (typeof tokenDataId === 'object' && tokenDataId !== null && 'collection' in tokenDataId) {
            tokenCollectionId = tokenDataId.collection as string;
          }
        }
        
        // Compare with the specified collection address
        return tokenCollectionId && 
               tokenCollectionId.toLowerCase() === formattedCollectionAddress.toLowerCase();
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
