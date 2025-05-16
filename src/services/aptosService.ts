
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

      // Log the entire first token for debugging
      console.log("Full token data:", JSON.stringify(response[0], null, 2));
      
      // Check if any token belongs to the specified collection
      const result = response.some(token => {
        // Raw token data ID is often in the format: "creator_address::collection_name::token_name"
        const tokenDataId = typeof token.token_data_id === 'string' ? token.token_data_id : '';
        
        // First try to parse the token_data_id if it's a string with a specific format
        const tokenParts = tokenDataId.split('::');
        const creatorAddress = tokenParts.length > 0 ? tokenParts[0] : '';
        const collectionName = tokenParts.length > 1 ? tokenParts[1] : '';
        
        // Extract information from current_token_data if available
        const currentTokenData = token.current_token_data || {};
        const tokenDataIdObj = currentTokenData.token_data_id || {};
        const currentCreator = tokenDataIdObj.creator || '';
        const currentCollection = tokenDataIdObj.collection || '';
        
        // Also look for direct collection/creator properties
        const directCollection = token.collection || '';
        const directCreator = token.creator || '';
        
        // Try all possible collection/creator combinations
        const possibleCreatorAddresses = [
          creatorAddress,
          currentCreator,
          directCreator
        ].filter(Boolean);
        
        const possibleCollectionIds = [
          collectionName,
          currentCollection,
          directCollection
        ].filter(Boolean);
        
        console.log("Possible creators:", possibleCreatorAddresses);
        console.log("Possible collections:", possibleCollectionIds);
        
        // Also check if the token_data_id itself contains the collection address
        const tokenDataIdContainsCollection = tokenDataId.toLowerCase().includes(formattedCollectionAddress.toLowerCase());
        
        // On Aptos, sometimes the collection ID can be the creator's address
        const creatorMatches = possibleCreatorAddresses.some(
          creator => creator.toLowerCase() === formattedCollectionAddress.toLowerCase()
        );
        
        // Check if any collection name matches
        const collectionMatches = possibleCollectionIds.some(
          collection => collection.toLowerCase() === formattedCollectionAddress.toLowerCase()
        );
        
        const isMatch = creatorMatches || collectionMatches || tokenDataIdContainsCollection;
        
        if (isMatch) {
          console.log("✅ Match found!");
          if (creatorMatches) console.log("Creator address matched");
          if (collectionMatches) console.log("Collection name matched");
          if (tokenDataIdContainsCollection) console.log("Token data ID contains collection address");
        }
        
        return isMatch;
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
