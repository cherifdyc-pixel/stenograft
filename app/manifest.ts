import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "STENOGRAFT",
    short_name: "STENOGRAFT",
    description: "Le réseau social souverain où la parole est tenue",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#E0492F",
    categories: ["social", "news"],
    icons: [
      {
        src: "/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
