import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

async function verifyPayOSWebhookSignature(data: Record<string, any>, signature: string, checksumKey: string): Promise<boolean> {
  const sortedKeys = Object.keys(data).filter(k => data[k] !== undefined && data[k] !== null).sort();
  const signData = sortedKeys.map(k => `${k}=${data[k]}`).join('&');
  const encoder = new TextEncoder();
  const keyData = encoder.encode(checksumKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(signData));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return expectedSignature === signature;
}

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));

    // 1. Kiểm tra nếu là webhook test từ màn hình cài đặt PayOS (ưu tiên kiểm tra trước tiên, không cần key)
    if (
      body.data?.description === "Ma test webhook" || 
      body.data?.description?.includes("test") || 
      (body.code === "00" && !body.data?.orderCode) ||
      body.desc === "success" // Một số test webhook của PayOS chỉ có desc="success"
    ) {
      return new Response(JSON.stringify({ success: true, message: "Webhook URL Verified" }));
    }

    const payosChecksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY');

    if (!payosChecksumKey) {
      throw new Error("Missing PayOS configuration in Supabase Secrets.");
    }

    // 2. Verify Signature cho các giao dịch thật
    if (body.data && body.signature) {
      const isValid = await verifyPayOSWebhookSignature(body.data, body.signature, payosChecksumKey);
      if (!isValid) {
        console.error("Invalid PayOS webhook signature");
        return new Response(JSON.stringify({ success: false, message: "Invalid signature" }), { status: 400 });
      }
    }

    const { orderCode, code } = body.data;

    // "00" nghĩa là giao dịch thành công
    if (code === "00") {
      // 2. Tìm order trong Database
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderCode)
        .single();

      if (orderError || !order) {
        throw new Error("Order not found");
      }

      if (order.status === 'paid') {
        return new Response(JSON.stringify({ success: true, message: "Order already paid" }));
      }

      // 3. Cập nhật trạng thái order
      await supabaseClient
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', orderCode);

      // 4. Lấy thông tin user metadata hiện tại
      const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(order.user_id);
      if (userError || !userData?.user) {
        throw new Error("User not found");
      }

      const currentMetadata = userData.user.user_metadata || {};
      const newExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // +90 days

      // 5. Cập nhật quyền Pro
      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(order.user_id, {
        user_metadata: {
          ...currentMetadata,
          plan: 'pro',
          pro_expires_at: newExpiry
        }
      });

      if (updateError) {
        throw updateError;
      }
    }

    return new Response(JSON.stringify({ success: true }));

  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 400,
    });
  }
});
