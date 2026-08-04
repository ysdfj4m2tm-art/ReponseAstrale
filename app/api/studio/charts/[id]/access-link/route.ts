import { NextResponse } from "next/server";
import { getSqlClient } from "@/db/client";
import { getAppUrl } from "@/lib/env";
import { authorizeStudio } from "@/lib/studio-auth";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/security";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const denied=authorizeStudio(request);if(denied)return denied;const{id}=await params;const token=createOpaqueToken();const sql=getSqlClient();const rows=await sql`INSERT INTO chart_access_tokens(chart_id,token_hash,expires_at) SELECT id,${hashOpaqueToken(token)},now()+interval '30 days' FROM charts WHERE id=${id}::uuid RETURNING id`;if(!rows.length)return NextResponse.json({error:"CHART_NOT_FOUND"},{status:404});return NextResponse.json({url:`${getAppUrl()}/exploration?token=${encodeURIComponent(token)}`,expiresInDays:30});}
