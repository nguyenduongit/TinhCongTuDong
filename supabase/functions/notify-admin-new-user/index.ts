import { createClient } from "npm:@supabase/supabase-js@2.39.3"
import webpush from "npm:web-push@3.6.7"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = "BN2br3pB7RDQM3rO4BKjiQYlRXBvf-Qnhdwin5rOoeKK2l9daNIilN_VPeJoHH1zpt8vwvp0vwbVgw0WqGY68R8";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE") || "D7kXf1BnadTVq4lNZPNBFO1Z2V4DjbUO_CKCwoDIVjE";

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    // Verify it's an INSERT event from auth.users
    if (body.type !== 'INSERT' || body.table !== 'users') {
      return new Response(JSON.stringify({ error: "Invalid webhook payload" }), { status: 400 });
    }

    const newUser = body.record;
    const newUserName = newUser.raw_user_meta_data?.full_name || newUser.email || 'Một người dùng';

    // Query all users to find admins
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    // Filter admins based on raw_user_meta_data isAdmin flag
    const adminIds = users.users
      .filter((u) => {
        const meta = u.raw_user_meta_data || {};
        return String(meta.isAdmin).toLowerCase() === 'true' || String(meta.isadmin).toLowerCase() === 'true';
      })
      .map((u) => u.id);

    if (adminIds.length === 0) {
      return new Response(JSON.stringify({ message: "Không tìm thấy Admin nào để thông báo." }), { headers: { "Content-Type": "application/json" } });
    }

    // Lấy subscriptions của các admin
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', adminIds);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "Không có admin nào đăng ký nhận thông báo." }), { headers: { "Content-Type": "application/json" } });
    }

    const payload = JSON.stringify({
      title: 'Tài khoản mới đăng ký!',
      body: `${newUserName} vừa tạo tài khoản mới trên hệ thống.`,
      url: 'https://tinh-cong-tu-dong.vercel.app/admin'
    });

    const promises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(pushSubscription, payload)
        .catch(err => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            return supabase.from('push_subscriptions').delete().eq('id', sub.id);
          } else {
            console.error("Lỗi gửi push cho admin", sub.user_id, err);
          }
        });
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ 
      message: `Đã gửi thông báo tới ${subscriptions.length} thiết bị của admin.`
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
