import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tailor",
    short_name: "Tailor",
    description: "Paste a job description, get a tailored resume.",
    start_url: "/",
    display: "standalone",
    background_color: "#762D46",
    theme_color: "#762D46",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
