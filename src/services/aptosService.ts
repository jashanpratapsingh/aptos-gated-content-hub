
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';

// Define interfaces for the actual token data structure returned from Aptos
interface TokenOwnershipResponse {
  token_standard: string;
  token_properties_mutated_v1?: any;
  token_data_id: string; // This is a string in actual response
  table_type_v1?: string;
  storage_id: string;
  property_version_v1: any;
  owner_address: string;
  last_transaction_version: any;
  collection?: string; // Some responses might have this directly
  creator?: string;
  name?: string;
  current_token_data?: {
    collection_name?: string;
    description?: string;
    metadata_uri?: string;
    name?: string;
    token_data_id?: {
      collection: string;
      creator: string;
      name: string;
    };
  };
}

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

      // Get the account's tokens with the correct type
      const response = await aptosClient.getAccountOwnedTokens({
        accountAddress: formattedUserAddress,
      }) as unknown as TokenOwnershipResponse[];
      
      // If the user has no tokens
      if (!response || response.length === 0) {
        return false;
      }

      // Check if any token belongs to the specified collection
      return response.some(token => {
        // Extract the collection address from the token data structure
        let tokenCollectionId = '';
        
        // Try to get collection from different possible locations in the response
        if (token.current_token_data?.token_data_id?.collection) {
          // If token_data_id is an object with collection
          tokenCollectionId = token.current_token_data.token_data_id.collection;
        } else if (token.collection) {
          // Some responses might have collection directly
          tokenCollectionId = token.collection;
        } else if (typeof token.token_data_id === 'string' && token.token_data_id.includes('::')) {
          // Sometimes token_data_id is a string like "creator_address::collection_name::token_name"
          const parts = token.token_data_id.split('::');
          if (parts.length > 1) {
            // The first part is typically the collection address
            tokenCollectionId = parts[0];
          }
        }
        
        // Compare with the specified collection address if we found a collection ID
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
