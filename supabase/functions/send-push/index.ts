import { createClient } from "npm:@supabase/supabase-js@2.39.3"
import webpush from "npm:web-push@3.6.7"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Hardcode VAPID for now or get from env if set
const VAPID_PUBLIC = "BN2br3pB7RDQM3rO4BKjiQYlRXBvf-Qnhdwin5rOoeKK2l9daNIilN_VPeJoHH1zpt8vwvp0vwbVgw0WqGY68R8";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE") || "D7kXf1BnadTVq4lNZPNBFO1Z2V4DjbUO_CKCwoDIVjE";

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { testUserId, userIds, payload } = await req.json();

    const targets = userIds || (testUserId ? [testUserId] : []);
    
    if (!targets || targets.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "No target users" }), { headers: corsHeaders });
    }

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targets);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "No subscriptions found for target users" }), { headers: corsHeaders });
    }

    const defaultPayload = JSON.stringify({
      title: 'Nhắc nhở tính công!',
      body: 'Bạn chưa nhập sản lượng hôm nay. Hãy nhập ngay nhé!',
      url: 'https://tinh-cong-tu-dong.vercel.app/'
    });

    const pushPayload = payload ? JSON.stringify(payload) : defaultPayload;

    const promises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(pushSubscription, pushPayload)
        .catch(err => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription expired or unsubscribed, delete it
            return supabase.from('push_subscriptions').delete().eq('id', sub.id);
          } else {
            console.error("Lỗi gửi push:", err);
          }
        });
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ 
      ok: true, 
      message: `Đã gửi push tới ${subscriptions.length} thiết bị.` 
    }), { headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { headers: corsHeaders });
  }
});
