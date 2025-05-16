
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MintNFT = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCorsError, setShowCorsError] = useState(false);
  
  const collectionId = "0xbd74942508d56631e1e7869ccef33866413b6253c65397c79d5e07fe26d1fd50";
  
  const handleMintNFT = async () => {
    if (!walletAddress) {
      toast.error("Please enter a wallet address");
      return;
    }
    
    setIsLoading(true);
    setShowCorsError(false);
    
    try {
      const options = {
        method: "POST",
        headers: {
          "X-API-KEY": "sk_production_6BDE9YJ8KJnmdXGJcx6WHkdvDyabtZPZfqp83Zgi5ueaFUwpahna3NU2c7DWD9WAwwTmVfMDcsCk9vySWGbir31DHERPwuFJbiiQmBQNBxb1q8Ju17JumkhBQc9ZjhLmDkshy98NF3rRvaQYKyn1qNS8dTFx9Fs439eSbJGd1x7ky8PLLn8539WmQxCRyrMZ8xNPftcUk4DLoAdMBknDwpxH",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: `aptos:${walletAddress}`,
          metadata: {
            name: "AptosGate NFT #1",
            image: "ipfs://QmdZ2pxfRqah6SDFMuAiRXCBktvGeggTir6KbjDFmANoiQ",
            description: "First NFT in the AptosGate collection"
          }
        }),
      };

      const response = await fetch("https://www.crossmint.com/api/2022-06-09/collections/61c50a08-26da-4c76-ac3d-e9b4c865fd16/nfts", options);
      const data = await response.json();
      
      console.log("Minting response:", data);
      
      if (data.id) {
        toast.success("NFT minted successfully!");
      } else {
        toast.error("Failed to mint NFT. Please check console for details.");
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      setShowCorsError(true);
      toast.error("Error minting NFT. CORS policy error detected.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Mint Sample NFTs</h1>
          
          {showCorsError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>CORS Error Detected</AlertTitle>
              <AlertDescription>
                <p>The request to the Crossmint API was blocked due to CORS policy restrictions.</p>
                <p className="mt-2">To mint NFTs for testing:</p>
                <ol className="list-decimal ml-5 mt-2">
                  <li>Use the API details below with Postman or cURL</li>
                  <li>Deploy a backend proxy service that can forward the request</li>
                  <li>Contact Crossmint to whitelist your domain</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="frosted-glass border-white/20">
            <CardHeader>
              <CardTitle>Mint a Test NFT</CardTitle>
              <CardDescription>
                Enter your wallet address to mint a sample NFT for testing access to gated content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="wallet-address">
                  Your Wallet Address
                </label>
                <Input
                  id="wallet-address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="bg-background/50"
                />
              </div>
              
              <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <p className="text-sm">Your collection ID for this sample is:</p>
                <p className="mt-2 p-2 bg-black/30 rounded text-xs font-mono break-all">{collectionId}</p>
                <p className="mt-3 text-xs text-aptosGray">
                  This NFT will be minted to your wallet and can be used to access gated content on this platform.
                </p>
              </div>
              
              {showCorsError && (
                <div className="p-4 bg-black/20 rounded-lg border border-red-500/40">
                  <p className="text-sm font-medium mb-2">API Request Details (for manual testing):</p>
                  <pre className="overflow-x-auto p-2 bg-black/30 rounded text-xs font-mono whitespace-pre-wrap">
{`POST https://www.crossmint.com/api/2022-06-09/collections/61c50a08-26da-4c76-ac3d-e9b4c865fd16/nfts
X-API-KEY: sk_production_6BDE9YJ8KJnmdXGJcx6WHkdvDyabtZPZfqp83Zgi5ueaFUwpahna3NU2c7DWD9WAwwTmVfMDcsCk9vySWGbir31DHERPwuFJbiiQmBQNBxb1q8Ju17JumkhBQc9ZjhLmDkshy98NF3rRvaQYKyn1qNS8dTFx9Fs439eSbJGd1x7ky8PLLn8539WmQxCRyrMZ8xNPftcUk4DLoAdMBknDwpxH
Content-Type: application/json

{
  "recipient": "aptos:${walletAddress || '0xYOUR_WALLET_ADDRESS'}",
  "metadata": {
    "name": "AptosGate NFT #1",
    "image": "ipfs://QmdZ2pxfRqah6SDFMuAiRXCBktvGeggTir6KbjDFmANoiQ",
    "description": "First NFT in the AptosGate collection"
  }
}`}
                  </pre>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleMintNFT} 
                className="w-full aptos-btn" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : "Mint NFT"}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-aptosGray">
              After minting, you can use this NFT to access exclusive content on the platform.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MintNFT;
