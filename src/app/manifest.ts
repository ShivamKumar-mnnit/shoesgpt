import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "shoesGPT: Compare Shoe Prices",
    short_name: "shoesGPT",
    description: "Compare shoe prices across every store and buy where it's cheapest.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f0ea",
    theme_color: "#121212",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
