
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
  const [mintingSuccess, setMintingSuccess] = useState(false);
  
  const collectionId = "0xbd74942508d56631e1e7869ccef33866413b6253c65397c79d5e07fe26d1fd50";
  
  const handleMintNFT = async () => {
    if (!walletAddress) {
      toast.error("Please enter a wallet address");
      return;
    }
    
    setIsLoading(true);
    setShowCorsError(false);
    setMintingSuccess(false);
    
    try {
      // Use our Supabase Edge Function instead of directly calling Crossmint
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mint-nft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // No API key needed in headers as it's stored securely in the Edge Function
        },
        body: JSON.stringify({
          recipient: `aptos:${walletAddress}`
        }),
      });
      
      const data = await response.json();
      
      console.log("Minting response:", data);
      
      if (data.id) {
        setMintingSuccess(true);
        toast.success("NFT minted successfully!");
      } else if (data.error) {
        toast.error(`Failed to mint NFT: ${data.error}`);
      } else {
        toast.error("Failed to mint NFT. Please check console for details.");
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      setShowCorsError(true);
      toast.error("Error minting NFT. Please try again later.");
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
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                <p>Unable to connect to the minting service.</p>
                <p className="mt-2">This could be due to:</p>
                <ul className="list-disc ml-5 mt-2">
                  <li>Network connectivity issues</li>
                  <li>The backend service may be down</li>
                  <li>Missing Supabase configuration</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {mintingSuccess && (
            <Alert className="mb-6 bg-green-100/20 border-green-500/40">
              <AlertTitle className="text-green-500">Success!</AlertTitle>
              <AlertDescription>
                <p>Your NFT was successfully minted to address: {walletAddress}</p>
                <p className="mt-2">You can now use this NFT to access gated content on the platform.</p>
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
