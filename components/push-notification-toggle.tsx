"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";
import { toast } from "sonner";

const t = {
  en: {
    enable: "Enable notifications",
    disable: "Disable notifications",
    enabled: "Notifications enabled",
    disabled: "Notifications disabled",
    error: "Failed to update notifications",
    unsupported: "Push notifications are not supported",
    descOn: "You will receive push notifications when offline.",
    descOff: "Enable to get notifications on your device.",
  },
  ar: {
    enable: "تفعيل الإشعارات",
    disable: "إيقاف الإشعارات",
    enabled: "الإشعارات مفعلة",
    disabled: "الإشعارات موقفة",
    error: "فشل تحديث الإشعارات",
    unsupported: "الإشعارات غير مدعومة",
    descOn: "ستتلقى إشعارات الدفع عند عدم الاتصال.",
    descOff: "فعّل للحصول على الإشعارات على جهازك.",
  },
};

function getLang(): "en" | "ar" {
  if (typeof window === "undefined") return "en";
  const nav = navigator.language || "";
  if (nav.startsWith("ar")) return "ar";
  return "en";
}

export function PushNotificationToggle() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [lang, setLang] = useState<"en" | "ar">("en");

  useEffect(() => {
    setLang(getLang());
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    setPermission(Notification.permission);

    const check = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscription(sub);
      } catch {
        setSubscription(null);
      }
    };
    check();
  }, []);

  const handleEnable = useCallback(async () => {
    if (!supported) {
      toast.error(t[lang].unsupported);
      return;
    }
    setLoading(true);
    try {
      if (permission === "default") {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") {
          toast.error(t[lang].error);
          setLoading(false);
          return;
        }
      }
      const sub = await subscribeToPush();
      setSubscription(sub);
      toast.success(t[lang].enabled);
    } catch {
      toast.error(t[lang].error);
    } finally {
      setLoading(false);
    }
  }, [supported, permission, lang]);

  const handleDisable = useCallback(async () => {
    if (!subscription) return;
    setLoading(true);
    try {
      await unsubscribeFromPush(subscription);
      setSubscription(null);
      toast.success(t[lang].disabled);
    } catch {
      toast.error(t[lang].error);
    } finally {
      setLoading(false);
    }
  }, [subscription, lang]);

  const labels = t[lang];

  if (!supported) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        {subscription ? (
          <Bell size={20} className="text-primary" />
        ) : (
          <BellOff size={20} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          {subscription ? labels.enabled : labels.disabled}
        </p>
        <p className="text-xs text-muted-foreground">
          {subscription ? labels.descOn : labels.descOff}
        </p>
      </div>
      <Button
        variant={subscription ? "outline" : "default"}
        size="sm"
        onClick={subscription ? handleDisable : handleEnable}
        disabled={loading}
      >
        {subscription ? labels.disable : labels.enable}
      </Button>
    </div>
  );
}
