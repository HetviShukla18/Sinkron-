import type { MetadataRoute } from "next";
import { contact } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/products", "/applications", "/contact"].map(path => ({
    url: `https://${contact.website}${path}`,
  }));
}
