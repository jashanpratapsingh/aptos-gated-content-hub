
import React from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const MintNFT = () => {
  const [copied, setCopied] = useState(false);
  
  const collectionId = "0xbd74942508d56631e1e7869ccef33866413b6253c65397c79d5e07fe26d1fd50";
  
  const mintingCode = `
// Replace with your wallet address
const walletAddress = "YOUR_APTOS_WALLET_ADDRESS"; 

// Make request to Crossmint API
fetch("https://www.crossmint.com/api/2022-06-09/collections/61c50a08-26da-4c76-ac3d-e9b4c865fd16/nfts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": "sk_staging.e1S7i.VDEvU30ceObJyMFUVZQ6JzVUQG8" // This is a public staging key
  },
  body: JSON.stringify({
    recipient: \`aptos:\${walletAddress}\`,
    metadata: {
      name: "AptosGate NFT #1",
      image: "ipfs://QmdZ2pxfRqah6SDFMuAiRXCBktvGeggTir6KbjDFmANoiQ",
      description: "First NFT in the AptosGate collection for accessing gated content"
    }
  })
})
.then(response => response.json())
.then(data => console.log("Success:", data))
.catch(error => console.error("Error:", error));
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mintingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Mint Sample NFTs</h1>
          
          <Alert className="mb-8 bg-blue-900/20 border-blue-500/40">
            <InfoIcon className="h-5 w-5 text-blue-500" />
            <AlertTitle className="text-blue-400">Important Note</AlertTitle>
            <AlertDescription>
              <p>Follow these steps to mint your own NFT for testing gated content on AptosGate.</p>
            </AlertDescription>
          </Alert>
          
          <Card className="frosted-glass border-white/20 mb-8">
            <CardHeader>
              <CardTitle>How to Mint a Test NFT</CardTitle>
              <CardDescription>
                Use the browser console to mint your NFT directly to your wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Step 1: Open Browser Console</h3>
                <p className="text-aptosGray">
                  Press <code className="bg-black/30 px-2 py-1 rounded">F12</code> or right-click and select "Inspect" then navigate to "Console" tab
                </p>
                
                <h3 className="font-medium text-lg">Step 2: Copy the Code Below</h3>
                <div className="relative">
                  <pre className="p-4 bg-black/40 rounded-lg border border-white/10 overflow-x-auto text-xs font-mono">
                    {mintingCode}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="absolute top-2 right-2 h-8 bg-black/50"
                    onClick={handleCopyCode}
                  >
                    {copied ? (
                      <><CheckIcon className="h-4 w-4 mr-1" /> Copied</>
                    ) : (
                      <><CopyIcon className="h-4 w-4 mr-1" /> Copy Code</>
                    )}
                  </Button>
                </div>
                
                <h3 className="font-medium text-lg">Step 3: Edit the Code</h3>
                <p className="text-aptosGray">
                  Replace <code className="bg-black/30 px-2 py-1 rounded">YOUR_APTOS_WALLET_ADDRESS</code> with your actual Aptos wallet address
                </p>
                
                <h3 className="font-medium text-lg">Step 4: Run the Code</h3>
                <p className="text-aptosGray">
                  Paste the edited code into your browser console and press Enter
                </p>
                
                <h3 className="font-medium text-lg">Step 5: Check Your Wallet</h3>
                <p className="text-aptosGray">
                  After a successful response, check your wallet for the new NFT (this may take a few minutes)
                </p>
              </div>
              
              <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <p className="text-sm">Your collection ID for this sample is:</p>
                <p className="mt-2 p-2 bg-black/30 rounded text-xs font-mono break-all">{collectionId}</p>
                <p className="mt-3 text-xs text-aptosGray">
                  This NFT will grant you access to gated content throughout this platform.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="frosted-glass border-white/20">
            <CardHeader>
              <CardTitle>What Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-aptosGray">
                Once you've minted your NFT successfully, you can visit the <a href="/explore" className="text-aptosCyan hover:underline">Explore</a> page to browse content and test your access to gated areas.
              </p>
              <p className="mt-4 text-aptosGray">
                If you're interested in creating your own gated content, head to the <a href="/dashboard" className="text-aptosCyan hover:underline">Dashboard</a> to get started.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MintNFT;
