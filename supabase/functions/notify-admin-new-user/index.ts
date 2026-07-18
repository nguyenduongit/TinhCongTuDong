import { createClient } from "npm:@supabase/supabase-js@2.39.3"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Reusing the same OneSignal config from your existing daily reminder
const ONESIGNAL_APP_ID = "c93d0d06-6e89-4bb3-b7fa-0d7f78e3e6f4";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY")!;

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

    // Prepare OneSignal Notification
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: {
        external_id: adminIds
      },
      target_channel: "push",
      headings: { "en": "User mới đăng ký!", "vi": "Tài khoản mới đăng ký!" },
      contents: { 
        "en": `${newUserName} vừa tạo tài khoản mới.`, 
        "vi": `${newUserName} vừa tạo tài khoản mới trên hệ thống.` 
      },
      url: "https://tinh-cong-tu-dong.vercel.app/admin" // Mở thẳng tab Admin
    };

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    return new Response(JSON.stringify({ 
      message: `Đã gửi thông báo tới ${adminIds.length} admin.`,
      onesignal: result 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
