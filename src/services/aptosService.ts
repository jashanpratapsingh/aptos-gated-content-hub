
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
  collection?: string;
  creator?: string;
  name?: string;
  current_token_data?: {
    collection_name?: string;
    description?: string;
    metadata_uri?: string;
    name?: string;
    collection_id?: string; // Added this field which exists in the response
    token_data_id?: {
      collection?: string;
      creator?: string;
      name?: string;
    };
    current_collection?: { // Added this field which exists in the response
      collection_id?: string;
      collection_name?: string;
      creator_address?: string;
    };
  };
}

interface TokenDataId {
  collection?: string;
  creator?: string;
  name?: string;
}

interface TokenStoreResource {
  type: string;
  data: {
    tokens: {
      handle: string;
    };
  };
}

interface TokenItem {
  value: {
    collection?: string;
    name?: string;
    creator?: string;
  };
}

// Initialize Aptos client (using mainnet for production or testnet for testing)
const aptosClient = new Aptos(new AptosConfig({
  network: Network.MAINNET
}));

// Base Aptos API URL
const APTOS_API_URL = 'https://api.mainnet.aptoslabs.com/v1';

export const useAptosService = () => {
  const { toast } = useToast();
  const { account } = useWallet();

  /**
   * Verifies if a wallet owns an NFT from a specific collection
   * @param collectionAddress - The address or name of the NFT collection
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
      
      // Method 1: Using the approach from the example provided
      try {
        // Step 1: Fetch all resources owned by the wallet
        const resourcesResponse = await fetch(
          `${APTOS_API_URL}/accounts/${formattedUserAddress}/resources`
        );
        const resources = await resourcesResponse.json();
        
        // Step 2: Find the TokenStore resource
        const tokenStore = resources.find(
          (r: TokenStoreResource) => r.type === "0x3::token::TokenStore"
        );
        
        if (!tokenStore || !tokenStore.data?.tokens?.handle) {
          console.log("No TokenStore resource found");
          return false;
        }
        
        // Step 3: Fetch all NFTs using the handle
        const handle = tokenStore.data.tokens.handle;
        console.log("Found tokens handle:", handle);
        
        const tokensResponse = await fetch(
          `${APTOS_API_URL}/tables/${handle}/items?limit=100`
        );
        const tokens = await tokensResponse.json();
        
        console.log(`Found ${tokens.length} tokens in wallet`);
        
        if (tokens.length > 0) {
          console.log("Sample token:", JSON.stringify(tokens[0], null, 2));
        }
        
        // Step 4: Check if any NFT's collection matches the collectionAddress
        const collectionMatch = tokens.some((token: TokenItem) => {
          if (!token.value) return false;
          
          // Different ways the collection could be identified
          const collection = token.value.collection;
          const creator = token.value.creator;
          
          // Log what we're comparing
          console.log(`Token collection: ${collection}, creator: ${creator}`);
          console.log(`Comparing with: ${formattedCollectionAddress}`);
          
          // Check for matches in different fields
          const isMatch = 
            (collection && collection.toLowerCase() === formattedCollectionAddress.toLowerCase()) || 
            (creator && creator.toLowerCase() === formattedCollectionAddress.toLowerCase());
          
          if (isMatch) {
            console.log("✅ Match found!");
          }
          
          return isMatch;
        });
        
        if (collectionMatch) {
          console.log("Collection match found via TokenStore method");
          return true;
        }
      } catch (error) {
        console.error("Error with TokenStore method:", error);
        // Fall back to the original method if this fails
      }
      
      // Method 2: Fallback to getting owned tokens, with updated matching logic
      console.log("Trying fallback method with getAccountOwnedTokens...");
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
      if (response.length > 0) {
        console.log("Full token data:", JSON.stringify(response[0], null, 2));
      }
      
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
        const tokenDataIdObj = (currentTokenData.token_data_id || {}) as TokenDataId;
        
        // NEW: Check collection_id directly from current_token_data
        const collectionId = currentTokenData.collection_id || '';
        
        // NEW: Check collection_id from nested current_collection
        const currentCollectionId = currentTokenData.current_collection?.collection_id || '';
        
        // Safely access potentially undefined properties
        const currentCreator = tokenDataIdObj.creator || '';
        const currentCollection = tokenDataIdObj.collection || '';
        
        // Also look for direct collection/creator properties
        const directCollection = token.collection || '';
        const directCreator = token.creator || '';
        
        // Log collection IDs found for debugging
        console.log("Checking collection IDs:");
        console.log(`Direct collection_id: ${collectionId}`);
        console.log(`Nested collection_id: ${currentCollectionId}`);
        console.log(`Expected collection: ${formattedCollectionAddress}`);
        
        // NEW: Check if any collection_id matches the collection address
        const collectionIdMatch = 
          (collectionId && collectionId.toLowerCase() === formattedCollectionAddress.toLowerCase()) ||
          (currentCollectionId && currentCollectionId.toLowerCase() === formattedCollectionAddress.toLowerCase());
        
        if (collectionIdMatch) {
          console.log("✅ Collection ID match found!");
          return true;
        }
        
        // Try all possible collection/creator combinations as a fallback
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
          console.log("✅ Match found in fallback checks!");
          if (creatorMatches) console.log("Creator address matched");
          if (collectionMatches) console.log("Collection name matched");
          if (tokenDataIdContainsCollection) console.log("Token data ID contains collection address");
        }
        
        return collectionIdMatch || isMatch;
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

