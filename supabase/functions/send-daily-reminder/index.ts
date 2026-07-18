
import { createClient } from "npm:@supabase/supabase-js@2.39.3"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ONESIGNAL_APP_ID = "c93d0d06-6e89-4bb3-b7fa-0d7f78e3e6f4";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function getTodayVNString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Kiểm tra API key ngay từ đầu
    if (!ONESIGNAL_REST_API_KEY) {
      return new Response(JSON.stringify({
        ok: false,
        error: "ONESIGNAL_REST_API_KEY chưa được cấu hình trong Supabase Secrets."
      }), { headers: corsHeaders });
    }

    let missingUserIds: string[] = [];
    let isTest = false;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.testUserId) {
          missingUserIds = [body.testUserId];
          isTest = true;
        }
      } catch (_e) {
        // Not JSON or empty body, ignore
      }
    }

    if (!isTest) {
      const today = getTodayVNString();
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;

      const { data: logs, error: logError } = await supabase
        .from('san_luong')
        .select('user_id')
        .eq('ngay', today);
      if (logError) throw logError;

      const usersWithLog = new Set(logs.map(log => log.user_id));
      missingUserIds = users.users
        .map(u => u.id)
        .filter(id => !usersWithLog.has(id));
    }

    if (missingUserIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "Mọi người đều đã nhập đủ!" }), { headers: corsHeaders });
    }

    // Gọi OneSignal để gửi thông báo
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: {
        external_id: missingUserIds
      },
      target_channel: "push",
      headings: { "en": "Nhắc nhở tính công!", "vi": "Nhắc nhở tính công!" },
      contents: { "en": "Bạn chưa nhập sản lượng hôm nay. Hãy nhập ngay nhé!", "vi": "Bạn chưa nhập sản lượng hôm nay. Hãy nhập ngay nhé!" },
      url: "https://tinh-cong-tu-dong.vercel.app/"
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

    if (!response.ok || result.errors) {
      // Trả về 200 nhưng báo lỗi trong body để supabase-js đọc được
      return new Response(JSON.stringify({
        ok: false,
        error: "OneSignal từ chối yêu cầu",
        onesignal_errors: result.errors ?? [],
        onesignal_status: response.status,
        isTest,
        targetCount: missingUserIds.length,
      }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      ok: true,
      message: `Đã gửi nhắc nhở tới ${missingUserIds.length} người.`,
      recipients: result.recipients ?? 0,
      isTest,
    }), { headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { headers: corsHeaders });
  }
});

