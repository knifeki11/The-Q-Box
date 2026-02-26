"use client";

import { useEffect, useState } from "react";
import { Download, Share, Plus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "qbox-install-prompt-seen";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome?: string } | void>;
}

const t = {
  en: {
    title: "Download App",
    subtitle: "Install QBox on your home screen for quick access and a smoother experience.",
    cta: "Download App",
    ctaIos: "Add to Home Screen",
    iosHint: "Tap the Share button, then tap Add to Home Screen.",
    later: "Maybe later",
  },
  ar: {
    title: "تنزيل التطبيق",
    subtitle: "ثبّت QBox على الشاشة الرئيسية للوصول السريع وتجربة أفضل.",
    cta: "تنزيل التطبيق",
    ctaIos: "أضف إلى الشاشة الرئيسية",
    iosHint: "اضغط على زر المشاركة، ثم اضغط على إضافة إلى الشاشة الرئيسية.",
    later: "ربما لاحقاً",
  },
};

function getLang(): "en" | "ar" {
  if (typeof window === "undefined") return "en";
  const nav = navigator.language || (navigator as { userLanguage?: string }).userLanguage || "";
  const docLang = document.documentElement.lang;
  if (docLang === "ar") return "ar";
  if (nav.startsWith("ar")) return "ar";
  return "en";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InstallPromptDrawer() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<{ outcome: string } | void>;
  } | null>(null);

  useEffect(() => {
    setLang(getLang());
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      setDeferredPrompt({ prompt: () => ev.prompt() });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMobile) return;
    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [isMobile]);

  const handleDismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        const result = await deferredPrompt.prompt();
        if (result && (result as { outcome?: string }).outcome === "accepted") {
          handleDismiss();
        }
      } catch {
        /* ignore */
      }
    } else if (isIOS()) {
      handleDismiss();
    } else {
      handleDismiss();
    }
  };

  if (!isMobile) return null;

  const labels = t[lang];
  const isIOSDevice = isIOS();
  const rtl = lang === "ar";

  return (
    <Drawer open={open} onOpenChange={(o) => !o && handleDismiss()}>
      <DrawerContent dir={rtl ? "rtl" : "ltr"}>
        <DrawerHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <img
              src="/images/QBOX_logo_upscaled.png"
              alt="QBox"
              className="h-12 w-12 object-contain"
            />
          </div>
          <DrawerTitle className="text-xl">{labels.title}</DrawerTitle>
          <DrawerDescription className="text-base">{labels.subtitle}</DrawerDescription>
          {isIOSDevice && (
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Share size={16} />
              {labels.iosHint}
            </p>
          )}
        </DrawerHeader>
        <DrawerFooter className="flex-row gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDismiss}
            asChild
          >
            <DrawerClose>{labels.later}</DrawerClose>
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={isIOSDevice ? handleDismiss : handleInstall}
          >
            {isIOSDevice ? (
              <Plus size={18} />
            ) : (
              <Download size={18} />
            )}
            {isIOSDevice ? labels.ctaIos : labels.cta}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
