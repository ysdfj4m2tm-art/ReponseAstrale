import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialPage } from "@/components/seo/EditorialPage";
import { understandPages } from "@/content/seo-pages";

export function generateStaticParams(){return understandPages.map(({slug})=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const data=understandPages.find(x=>x.slug===slug);if(!data)return{};return{title:data.title,description:data.description,alternates:{canonical:`/comprendre/${slug}`},openGraph:{title:data.title,description:data.description}}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const data=understandPages.find(x=>x.slug===slug);if(!data)notFound();return <EditorialPage data={data} parentLabel="Comprendre" parentHref="/comprendre"/>}
