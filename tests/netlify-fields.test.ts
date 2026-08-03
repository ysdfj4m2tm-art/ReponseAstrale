import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe,expect,it } from "vitest";
import { NETLIFY_FIELDS, serializeForNetlify } from "@/lib/form-submit";
import type { AnalysisFormData } from "@/lib/form-schema";

describe("Netlify Forms",()=>{
  it("garde le blueprint HTML aligné avec tous les champs React",()=>{
    const html=readFileSync(join(process.cwd(),"public","netlify-form.html"),"utf8");
    const names=[...html.matchAll(/<(?:input|textarea)[^>]*\sname="([^"]+)"/g)].map(x=>x[1]);
    expect([...new Set(names)].sort()).toEqual([...NETLIFY_FIELDS].sort());
    expect(html).toContain('data-netlify="true"');
    expect(html).toContain('netlify-honeypot="company-website"');
  });
  it("sérialise les champs techniques et fonctionnels",()=>{
    const data={category:"amour",question:"Une question suffisamment développée pour être envoyée.",birthDate:"1990-01-01",birthTime:"",birthTimeUnknown:true,birthPlace:"Lille, France",firstName:"Ariane",email:"ariane@example.fr",designation:"femme",ageConfirmed:true,consentData:true,consentMarketing:false,consentLimits:true,partnerName:"",partnerBirthDate:"",partnerBirthTime:"",partnerTimeUnknown:false,partnerBirthPlace:"",relationshipType:"",thirdPartyConsent:false,eventDate:"",eventTime:"",eventTimeUnknown:false,eventPlace:"",eventType:"",eventDescription:"",periodStart:"",periodEnd:"",periodPlace:"",periodContext:"","company-website":""} satisfies AnalysisFormData;
    const encoded=serializeForNetlify(data,{dossierId:"RA-20260803-ABCDEF",pageUrl:"https://reponseastrale.fr",referrer:"",submittedAt:"2026-08-03T10:00:00.000Z"});
    const parsed=new URLSearchParams(encoded);
    expect(parsed.get("form-name")).toBe("analyse-gratuite");
    expect(parsed.get("birthTimeUnknown")).toBe("true");
    expect(parsed.get("formVersion")).toBe("1");
  });
});
