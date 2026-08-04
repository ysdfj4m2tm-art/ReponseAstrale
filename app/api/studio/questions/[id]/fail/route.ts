import { NextResponse } from "next/server";
import { getSqlClient } from "@/db/client";
import { authorizeStudio } from "@/lib/studio-auth";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const denied=authorizeStudio(request);if(denied)return denied;const{id}=await params;const body=await request.json() as {reason?:string};if(!body.reason)return NextResponse.json({error:"REASON_REQUIRED"},{status:400});const sql=getSqlClient();const rows=await sql`SELECT mark_question_failed(${id}::uuid,${body.reason}) AS failed`;return rows[0]?.failed?NextResponse.json({failed:true}):NextResponse.json({error:"NOT_FAILABLE"},{status:409});}
