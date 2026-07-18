import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generatePayOSSignature(data: Record<string, any>, checksumKey: string): Promise<string> {
  const sortedKeys = Object.keys(data).sort();
  const signData = sortedKeys.map(k => `${k}=${data[k]}`).join('&');
  const encoder = new TextEncoder();
  const keyData = encoder.encode(checksumKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(signData));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing auth header");
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const origin = body.origin || 'http://localhost:5173';

    // Mã order code kiểu INT32 (Dưới 9007199254740991)
    const orderCode = Number(String(Date.now()).slice(-9) + Math.floor(Math.random() * 1000));
    const amount = 50000;
    const description = "Nang cap Pro";
    const returnUrl = `${origin}/cai-dat?status=success`;
    const cancelUrl = `${origin}/cai-dat?status=cancel`;

    // Lấy API keys
    const payosClientId = Deno.env.get('PAYOS_CLIENT_ID');
    const payosApiKey = Deno.env.get('PAYOS_API_KEY');
    const payosChecksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY');

    if (!payosClientId || !payosApiKey || !payosChecksumKey) {
      throw new Error("Missing PayOS configuration. Please setup .env vars.");
    }

    // 1. Tạo order trong DB (Dùng service role key)
    const { error: insertError } = await supabaseClient
      .from('orders')
      .insert({
        id: orderCode,
        user_id: user.id,
        amount: amount,
        plan_id: 'pro_90_days',
        status: 'pending'
      });

    if (insertError) {
      console.error(insertError);
      throw new Error("Error creating order in DB");
    }

    // 2. Gọi PayOS
    const bodyData = {
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl,
    };

    const signature = await generatePayOSSignature(bodyData, payosChecksumKey);
    const finalBody = {
      ...bodyData,
      signature
    };

    const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": payosClientId,
        "x-api-key": payosApiKey
      },
      body: JSON.stringify(finalBody)
    });

    const result = await response.json();
    if (result.code !== "00") {
      console.error(result);
      throw new Error(result.desc);
    }

    // Cập nhật checkoutUrl vào DB
    await supabaseClient
      .from('orders')
      .update({ checkout_url: result.data.checkoutUrl })
      .eq('id', orderCode);

    return new Response(JSON.stringify({ checkoutUrl: result.data.checkoutUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
