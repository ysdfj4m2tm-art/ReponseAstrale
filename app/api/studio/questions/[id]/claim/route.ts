import { NextResponse } from "next/server";
import { getSqlClient } from "@/db/client";
import { authorizeStudio } from "@/lib/studio-auth";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const denied=authorizeStudio(request);if(denied)return denied;const{id}=await params;const sql=getSqlClient();const rows=await sql`UPDATE questions SET status='processing', processing_started_at=now() WHERE id=${id}::uuid AND status='submitted' RETURNING id`;return rows.length?NextResponse.json({claimed:true}):NextResponse.json({error:"NOT_CLAIMABLE"},{status:409});}
