
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
    collection_id?: string;
    token_data_id?: {
      collection?: string;
      creator?: string;
      name?: string;
    };
    current_collection?: {
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
      
      // Method 1: Using the direct API approach matching the example provided
      try {
        console.log("Attempting Method 1: Direct API approach...");
        // Step 1: Fetch all resources owned by the wallet
        const resourcesUrl = `${APTOS_API_URL}/accounts/${formattedUserAddress}/resources`;
        console.log("Fetching resources from:", resourcesUrl);
        
        const resourcesResponse = await fetch(resourcesUrl);
        if (!resourcesResponse.ok) {
          console.error("Resources API error:", resourcesResponse.status, await resourcesResponse.text());
          throw new Error(`API error: ${resourcesResponse.status}`);
        }
        
        const resources = await resourcesResponse.json();
        console.log(`Found ${resources.length} resources`);
        
        // Step 2: Find the TokenStore resource
        const tokenStoreType = "0x3::token::TokenStore";
        console.log("Looking for TokenStore resource type:", tokenStoreType);
        
        const tokenStore = resources.find(
          (r: TokenStoreResource) => r.type === tokenStoreType
        );
        
        if (!tokenStore) {
          console.log("No TokenStore resource found in", resources.map((r: any) => r.type).join(", "));
          console.log("Looking for alternative token store types...");
          
          // Check for alternative token resource types
          const possibleTokenStoreTypes = resources
            .filter((r: any) => r.type.includes("token") || r.type.includes("Token"))
            .map((r: any) => r.type);
          
          console.log("Possible token related resources:", possibleTokenStoreTypes);
          
          // No TokenStore resource, continue to method 2
          throw new Error("No TokenStore resource found");
        }
        
        if (!tokenStore.data?.tokens?.handle) {
          console.log("TokenStore found but missing handle:", tokenStore);
          throw new Error("TokenStore missing handle");
        }
        
        // Step 3: Fetch all NFTs using the handle
        const handle = tokenStore.data.tokens.handle;
        console.log("Found tokens handle:", handle);
        
        const tokensUrl = `${APTOS_API_URL}/tables/${handle}/items?limit=100`;
        console.log("Fetching tokens from:", tokensUrl);
        
        const tokensResponse = await fetch(tokensUrl);
        if (!tokensResponse.ok) {
          console.error("Tokens API error:", tokensResponse.status, await tokensResponse.text());
          throw new Error(`API error: ${tokensResponse.status}`);
        }
        
        const tokens = await tokensResponse.json();
        console.log(`Found ${tokens.length} tokens in wallet`);
        
        if (tokens.length > 0) {
          console.log("Sample token:", JSON.stringify(tokens[0], null, 2));
        }
        
        // Step 4: Check if any NFT's collection matches the collectionAddress
        const collectionMatch = tokens.some((token: TokenItem) => {
          if (!token.value) {
            console.log("Token missing value property");
            return false;
          }
          
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
            console.log("✅ Match found in method 1!");
          }
          
          return isMatch;
        });
        
        if (collectionMatch) {
          console.log("Collection match found via TokenStore method");
          return true;
        } else {
          console.log("No collection match found in method 1, falling back to method 2");
        }
      } catch (error) {
        console.error("Error with TokenStore method:", error);
        // Fall back to the getAccountOwnedTokens method
      }
      
      // Method 2: Using getAccountOwnedTokens from Aptos SDK
      console.log("Attempting Method 2: Using SDK getAccountOwnedTokens...");
      let response;
      try {
        response = await aptosClient.getAccountOwnedTokens({
          accountAddress: formattedUserAddress,
        }) as unknown as TokenOwnershipResponse[];
        
        console.log("NFT response received:", response ? response.length : 0, "tokens found");
        
        // If the user has no tokens
        if (!response || response.length === 0) {
          console.log("No tokens found for this account");
          
          // Method 3: Fall back to direct Token V2 API (another approach)
          console.log("Attempting Method 3: Direct Token V2 API...");
          try {
            const tokenV2Url = `${APTOS_API_URL}/accounts/${formattedUserAddress}/tokens`;
            console.log("Fetching from Token V2 API:", tokenV2Url);
            
            const tokenV2Response = await fetch(tokenV2Url);
            if (!tokenV2Response.ok) {
              console.error("Token V2 API error:", tokenV2Response.status);
              return false;
            }
            
            const tokenV2Data = await tokenV2Response.json();
            console.log("Token V2 API returned:", tokenV2Data.length, "tokens");
            
            if (tokenV2Data && tokenV2Data.length > 0) {
              // Check if any token belongs to our collection
              const hasMatch = tokenV2Data.some((token: any) => {
                console.log("Checking token:", JSON.stringify(token, null, 2));
                
                // Extract collection ID from various possible locations
                const collectionId = 
                  token.collection_id || 
                  token.current_token_data?.collection_id || 
                  token.current_token_data?.current_collection?.collection_id;
                
                console.log(`Token collection ID: ${collectionId}, Expected: ${formattedCollectionAddress}`);
                
                const isMatch = collectionId && 
                  collectionId.toLowerCase() === formattedCollectionAddress.toLowerCase();
                
                if (isMatch) console.log("✅ Match found in Token V2 API!");
                
                return isMatch;
              });
              
              if (hasMatch) {
                console.log("Match found via Token V2 API");
                return true;
              }
            }
            
            console.log("No match found in Token V2 API");
            return false;
          } catch (error) {
            console.error("Error with Token V2 API:", error);
            return false;
          }
        }
      } catch (error) {
        console.error("Error with getAccountOwnedTokens:", error);
        // If we can't get the tokens through SDK, return false
        return false;
      }

      // Log the entire first token for debugging
      if (response && response.length > 0) {
        console.log("Full token data:", JSON.stringify(response[0], null, 2));
      }
      
      // Check if any token belongs to the specified collection
      const result = response.some(token => {
        console.log("Processing token:", token.token_data_id);
        
        // Raw token data ID is often in the format: "creator_address::collection_name::token_name"
        const tokenDataId = typeof token.token_data_id === 'string' ? token.token_data_id : '';
        
        // First try to parse the token_data_id if it's a string with a specific format
        const tokenParts = tokenDataId.split('::');
        const creatorAddress = tokenParts.length > 0 ? tokenParts[0] : '';
        const collectionName = tokenParts.length > 1 ? tokenParts[1] : '';
        
        // Extract information from current_token_data if available
        const currentTokenData = token.current_token_data || {};
        const tokenDataIdObj = (currentTokenData.token_data_id || {}) as TokenDataId;
        
        // Check collection_id directly from current_token_data (primary method)
        const collectionId = currentTokenData.collection_id || '';
        
        // Check collection_id from nested current_collection (also reliable)
        const currentCollectionId = currentTokenData.current_collection?.collection_id || '';
        const currentCollectionName = currentTokenData.current_collection?.collection_name || '';
        const currentCreatorAddress = currentTokenData.current_collection?.creator_address || '';
        
        // Safely access potentially undefined properties
        const currentCreator = tokenDataIdObj.creator || '';
        const currentCollection = tokenDataIdObj.collection || '';
        
        // Also look for direct collection/creator properties
        const directCollection = token.collection || '';
        const directCreator = token.creator || '';
        
        // Log all collection IDs found for debugging
        console.log("Checking all possible collection identifiers:");
        console.log(`Direct collection_id: ${collectionId}`);
        console.log(`Nested collection_id: ${currentCollectionId}`);
        console.log(`Collection name: ${currentCollectionName}`);
        console.log(`Creator address: ${currentCreatorAddress}`);
        console.log(`Expected collection: ${formattedCollectionAddress}`);
        
        // PRIMARY CHECK: Check if any collection_id matches the collection address
        // This is the most reliable method
        const collectionIdMatch = 
          (collectionId && collectionId.toLowerCase() === formattedCollectionAddress.toLowerCase()) ||
          (currentCollectionId && currentCollectionId.toLowerCase() === formattedCollectionAddress.toLowerCase());
        
        if (collectionIdMatch) {
          console.log("✅ Collection ID match found!");
          return true;
        }
        
        // SECONDARY CHECKS: Try all possible collection/creator combinations as a fallback
        const possibleCreatorAddresses = [
          creatorAddress,
          currentCreator,
          directCreator,
          currentCreatorAddress
        ].filter(Boolean);
        
        const possibleCollectionIds = [
          collectionName,
          currentCollection,
          directCollection,
          currentCollectionName
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
