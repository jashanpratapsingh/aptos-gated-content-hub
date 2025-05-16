
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
        console.log("No wallet address available");
        return false;
      }

      // Convert addresses to standard format if needed
      const formattedCollectionAddress = collectionAddress.startsWith('0x') 
        ? collectionAddress 
        : `0x${collectionAddress}`;
      const formattedUserAddress = account.address.startsWith('0x') 
        ? account.address 
        : `0x${account.address}`;

      console.log("Checking NFTs for address:", formattedUserAddress);
      console.log("Looking for collection:", formattedCollectionAddress);

      // Get the account's tokens with the correct type
      const response = await aptosClient.getAccountOwnedTokens({
        accountAddress: formattedUserAddress,
      }) as unknown as TokenOwnershipResponse[];
      
      console.log("NFT response received:", response ? response.length : 0, "tokens found");
      
      // If the user has no tokens
      if (!response || response.length === 0) {
        console.log("No tokens found for this account");
        return false;
      }

      // Debug: Log the first few tokens to see their structure
      console.log("Token sample:", JSON.stringify(response.slice(0, 2), null, 2));
      
      // Check if any token belongs to the specified collection
      const result = response.some(token => {
        // Extract the collection address from the token data structure
        let tokenCollectionId = '';
        let tokenCreator = '';
        
        // Try to get collection from different possible locations in the response
        if (token.current_token_data?.token_data_id?.collection) {
          // If token_data_id is an object with collection
          tokenCollectionId = token.current_token_data.token_data_id.collection;
          tokenCreator = token.current_token_data.token_data_id.creator;
        } else if (token.collection) {
          // Some responses might have collection directly
          tokenCollectionId = token.collection;
          tokenCreator = token.creator || '';
        } else if (typeof token.token_data_id === 'string' && token.token_data_id.includes('::')) {
          // Sometimes token_data_id is a string like "creator_address::collection_name::token_name"
          const parts = token.token_data_id.split('::');
          if (parts.length > 1) {
            // The first part is typically the creator address
            tokenCreator = parts[0];
            // The second part is typically the collection name
            if (parts.length > 1) {
              tokenCollectionId = parts[1];
            }
          }
        }
        
        // Log the collection ID we found for debugging
        console.log("Found token creator:", tokenCreator);
        console.log("Found token collection:", tokenCollectionId);
        
        // Try different comparison strategies:
        
        // 1. Direct comparison with collection address
        const directMatch = tokenCollectionId && 
                           tokenCollectionId.toLowerCase() === formattedCollectionAddress.toLowerCase();
        
        // 2. Compare with creator address (sometimes the collection is identified by creator address)
        const creatorMatch = tokenCreator && 
                            tokenCreator.toLowerCase() === formattedCollectionAddress.toLowerCase();
        
        // 3. Check if the token's token_data_id string contains the collection address
        const containsMatch = typeof token.token_data_id === 'string' && 
                             token.token_data_id.toLowerCase().includes(formattedCollectionAddress.toLowerCase());
        
        // Log all comparison results for debugging
        if (directMatch || creatorMatch || containsMatch) {
          console.log("✅ Match found! Strategy:", 
                     directMatch ? "Direct match" : 
                     creatorMatch ? "Creator match" : 
                     "Contains match");
        }
        
        return directMatch || creatorMatch || containsMatch;
      });
      
      console.log("Final verification result:", result);
      return result;
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
