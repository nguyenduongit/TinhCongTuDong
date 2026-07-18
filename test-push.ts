import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC = "BN2br3pB7RDQM3rO4BKjiQYlRXBvf-Qnhdwin5rOoeKK2l9daNIilN_VPeJoHH1zpt8vwvp0vwbVgw0WqGY68R8";
const VAPID_PRIVATE = "D7kXf1BnadTVq4lNZPNBFO1Z2V4DjbUO_CKCwoDIVjE";

webpush.setVapidDetails(
  'mailto:nguyenduongit89@gmail.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

const subscription = {
  endpoint: "https://web.push.apple.com/QBPhIXaMeos3IHMnHOYdPeAQf4_O1fzLnc7z8RrGA7qGEtgwDQfA3dmfdbaPpsgAfDs3xxe7uARNcgHFdB_p-bzoOZtkxvrkJsW4qSiM5PcX8k81JZBlkMCYKaD8Kbt6U-sunZgbm2O-2PAgwgCW9SYCODBCtvBetAOeX2HPWFM",
  keys: {
    p256dh: "BLC-PvtTZaNkngeTjRV7CXVNKoIWPnvB0KD3bGlfs3WoxEj47puLddvwRr9tQSmNNrafhqi_reQsPyjW6VK6CBQ",
    auth: "3Ns0lmOIiwrHgK90qbzocg"
  }
};

const payload = JSON.stringify({
  title: 'Test Debug',
  body: 'Đây là tin nhắn debug',
  url: 'https://tinh-cong-tu-dong.vercel.app/'
});

async function run() {
  try {
    const res = await webpush.sendNotification(subscription, payload);
    console.log("Success:", res.statusCode, res.headers);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
