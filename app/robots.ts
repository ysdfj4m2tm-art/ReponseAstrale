import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site";
export default function robots():MetadataRoute.Robots{
  const context = process.env.CONTEXT;
  if (context && context !== "production") return { rules: { userAgent: "*", disallow: "/" } };
  return {rules:{userAgent:"*",allow:"/",disallow:["/merci","/api/","/private/"]},sitemap:`${siteConfig.url}/sitemap.xml`,host:siteConfig.url};
}
