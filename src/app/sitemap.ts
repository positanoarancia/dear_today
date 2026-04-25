import type { MetadataRoute } from "next";
import { getSiteUrl } from "./site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl.origin,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
