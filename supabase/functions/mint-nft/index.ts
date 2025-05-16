
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.log("NFT Minting Proxy Function started");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestData = await req.json();
    const { recipient } = requestData;
    
    if (!recipient || !recipient.startsWith('aptos:')) {
      return new Response(JSON.stringify({ error: 'Invalid wallet address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Crossmint API key - stored as a secret in Supabase
    const crossmintApiKey = Deno.env.get("CROSSMINT_API_KEY");
    if (!crossmintApiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const options = {
      method: "POST",
      headers: {
        "X-API-KEY": crossmintApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: recipient,
        metadata: {
          name: "AptosGate NFT #1",
          image: "ipfs://QmdZ2pxfRqah6SDFMuAiRXCBktvGeggTir6KbjDFmANoiQ",
          description: "First NFT in the AptosGate collection"
        }
      }),
    };

    // Forward request to Crossmint API
    const response = await fetch(
      "https://www.crossmint.com/api/2022-06-09/collections/61c50a08-26da-4c76-ac3d-e9b4c865fd16/nfts", 
      options
    );
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in mint-nft function:", error);
    
    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
