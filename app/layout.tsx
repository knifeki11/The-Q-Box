import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Playfair_Display } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const retroGaming = localFont({
  src: "../public/images/secondary-font/Retro Gaming.ttf",
  variable: "--font-sans",
  display: "swap",
});
const armyFont = localFont({
  src: "../public/images/secondary-font/18 ARMY.otf",
  variable: "--font-portal",
  display: "swap",
});
const _playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Q-BOX Play Lounge | Premium PS5 Gaming Experience",
  description:
    "The future of gaming. Premium PS5 stations, competitive play, and the ultimate gaming experience at Q-BOX Play Lounge.",
  generator: "v0.app",
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${retroGaming.variable} ${armyFont.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
