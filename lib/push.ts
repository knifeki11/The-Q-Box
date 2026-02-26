import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    "mailto:support@the-q-box.com",
    publicKey,
    privateKey
  );
}

export interface PushPayload {
  title: string;
  body?: string;
  icon?: string;
  url?: string;
}

export async function sendPushToAll(payload: PushPayload): Promise<number> {
  if (!publicKey || !privateKey) {
    console.warn("VAPID keys not configured. Skipping push.");
    return 0;
  }

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (!subs?.length) return 0;

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 86400 }
      );
      sent++;
    } catch (e) {
      if ((e as { statusCode?: number }).statusCode === 410 || (e as { statusCode?: number }).statusCode === 404) {
        await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }
  return sent;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!publicKey || !privateKey) return 0;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return 0;

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 86400 }
      );
      sent++;
    } catch (e) {
      if ((e as { statusCode?: number }).statusCode === 410 || (e as { statusCode?: number }).statusCode === 404) {
        await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }
  return sent;
}
