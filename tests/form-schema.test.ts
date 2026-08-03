import { describe, expect, it } from "vitest";
import { formSchema, type AnalysisFormData } from "@/lib/form-schema";
import { resolveRuntimeConfig } from "@/content/site";

const valid:AnalysisFormData={category:"amour",question:"Que révèle mon thème sur ma manière d’aimer aujourd’hui ?",birthDate:"1990-05-05",birthTime:"12:30",birthTimeUnknown:false,birthPlace:"Lille, France",firstName:"Camille",email:"camille@example.fr",designation:"non-precise",ageConfirmed:true,consentData:true,consentMarketing:false,consentLimits:true,partnerName:"",partnerBirthDate:"",partnerBirthTime:"",partnerTimeUnknown:false,partnerBirthPlace:"",relationshipType:"",thirdPartyConsent:false,eventDate:"",eventTime:"",eventTimeUnknown:false,eventPlace:"",eventType:"",eventDescription:"",periodStart:"",periodEnd:"",periodPlace:"",periodContext:"","company-website":""};

describe("formSchema",()=>{
  it("accepte une demande adulte complète",()=>expect(formSchema.safeParse(valid).success).toBe(true));
  it("refuse une personne mineure",()=>expect(formSchema.safeParse({...valid,birthDate:"2012-01-01"}).success).toBe(false));
  it("accepte une heure inconnue et ignore une heure vide",()=>expect(formSchema.safeParse({...valid,birthTime:"",birthTimeUnknown:true}).success).toBe(true));
  it("refuse une question trop courte ou trop longue",()=>{expect(formSchema.safeParse({...valid,question:"Trop court"}).success).toBe(false);expect(formSchema.safeParse({...valid,question:"a".repeat(2001)}).success).toBe(false)});
  it("valide les champs conditionnels de compatibilité",()=>{expect(formSchema.safeParse({...valid,category:"compatibilite"}).success).toBe(false);expect(formSchema.safeParse({...valid,category:"compatibilite",partnerBirthDate:"1991-06-01",partnerBirthPlace:"Bruxelles, Belgique",relationshipType:"Partenaire",thirdPartyConsent:true}).success).toBe(true)});
  it("valide les champs conditionnels de date et période",()=>{expect(formSchema.safeParse({...valid,category:"date-importante"}).success).toBe(false);expect(formSchema.safeParse({...valid,category:"date-importante",eventDate:"2026-09-10",eventType:"Entretien",eventDescription:"Un entretien professionnel important à préparer."}).success).toBe(true);expect(formSchema.safeParse({...valid,category:"periode-future",periodStart:"2026-10-01",periodContext:"Une période de transition professionnelle à mieux comprendre."}).success).toBe(true)});
  it("exige les consentements obligatoires",()=>expect(formSchema.safeParse({...valid,consentData:false,consentLimits:false}).success).toBe(false));
});

describe("configuration opérationnelle",()=>{it("désactive le formulaire et personnalise le délai",()=>expect(resolveRuntimeConfig({NEXT_PUBLIC_FORM_ENABLED:"false",NEXT_PUBLIC_PROCESSING_DELAY:"5 jours"})).toMatchObject({formEnabled:false,processingDelay:"5 jours"}));it("active le message de forte demande",()=>expect(resolveRuntimeConfig({NEXT_PUBLIC_HIGH_DEMAND:"true"}).highDemand).toBe(true))});
