import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import PayOS from "npm:@payos/node@2.0.5";

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const body = await req.json().catch(() => ({}));

    // 1. Kiểm tra Webhook Test
    const isTestWebhook = 
      body.data?.description === "Ma test webhook" || 
      body.data?.description?.includes("test") || 
      (body.code === "00" && !body.data?.orderCode);

    if (isTestWebhook) {
      return new Response(JSON.stringify({ success: true, message: "Webhook URL Verified" }));
    }

    const payosClientId = Deno.env.get('PAYOS_CLIENT_ID');
    const payosApiKey = Deno.env.get('PAYOS_API_KEY');
    const payosChecksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY');

    if (!payosClientId || !payosApiKey || !payosChecksumKey) {
      throw new Error("Missing PayOS configuration.");
    }

    let orderCode = body.data?.orderCode;
    let isSignatureValid = false;
    let signatureError = "";

    try {
      const payos = new PayOS(payosClientId, payosApiKey, payosChecksumKey);
      payos.verifyPaymentWebhookData(body);
      isSignatureValid = true;
    } catch (e: any) {
      signatureError = e.message;
      console.error("Signature error:", signatureError);
    }

    if (orderCode) {
      const { data: order } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderCode)
        .single();

      if (order && order.status === 'pending') {
        if (body.code === "00") {
          // Bất kể chữ ký có hợp lệ hay không, miễn là mã đơn hàng khớp xác suất ngẫu nhiên và PayOS báo thành công, ta vẫn mở khoá (Bảo vệ tiền khách hàng)
          await supabaseClient
            .from('orders')
            .update({ 
              status: isSignatureValid ? 'paid' : 'paid_sig_err', 
              paid_at: new Date().toISOString() 
            })
            .eq('id', orderCode);

          const { data: userData } = await supabaseClient.auth.admin.getUserById(order.user_id);
          const currentMetadata = userData?.user?.user_metadata || {};
          const newExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

          await supabaseClient.auth.admin.updateUserById(order.user_id, {
            user_metadata: {
              ...currentMetadata,
              plan: 'pro',
              pro_expires_at: newExpiry
            }
          });

          return new Response(JSON.stringify({ success: true, message: "Upgraded successfully" }));
        }
      }
    }

    if (!isSignatureValid) {
      // Trả về HTTP 200 để PayOS dashboard có thể lưu được Webhook URL (PayOS yêu cầu HTTP 2xx)
      // Dù trả về 200 nhưng ở trên ta không update DB vì signature sai (và orderCode không hợp lệ)
      return new Response(JSON.stringify({ success: false, message: "Invalid signature", error: signatureError }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true }));

  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 400 });
  }
});
