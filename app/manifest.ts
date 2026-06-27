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
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
