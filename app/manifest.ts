import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QBox",
    short_name: "QBox",
    description: "Premium PS5 gaming experience at Q-BOX Play Lounge",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#121212",
    orientation: "portrait-primary",
    icons: [
      { src: "/images/QBOX_logo_upscaled.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/QBOX_logo_upscaled.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/images/QBOX_logo_upscaled.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/images/QBOX_logo_upscaled.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
