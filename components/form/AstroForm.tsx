"use client";
/* eslint-disable jsx-a11y/role-has-required-aria-props */
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, ArrowRight, Check, LoaderCircle, LockKeyhole } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { useRouter } from "next/navigation";
import { questionCategories } from "@/content/questions";
import { formatSunCount } from "@/content/commerce";
import { siteConfig } from "@/content/site";
import { trackEvent } from "@/lib/analytics";
import { generateDossierId } from "@/lib/dossier-id";
import { AnalysisFormData, defaultFormValues, formSchema } from "@/lib/form-schema";
import { persistConfirmation, serializeForNetlify } from "@/lib/form-submit";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

const stepFields: (keyof AnalysisFormData)[][] = [
  ["category"], ["question", "partnerBirthDate", "partnerBirthPlace", "relationshipType", "thirdPartyConsent", "eventDate", "eventType", "eventDescription", "periodStart", "periodContext"], ["birthDate", "birthTime", "birthTimeUnknown", "birthPlace"], ["firstName", "email", "designation", "ageConfirmed"], ["consentData", "consentLimits"],
];
const stepLabels = ["Sujet", "Question", "Naissance", "Coordonnées", "Vérification"];

export function findErrorStep(fieldNames: string[]) {
  const index = stepFields.findIndex((fields)=>fields.some((field)=>fieldNames.includes(String(field))));
  return index >= 0 ? index : 4;
}

function ErrorText({ message }: { message?: string }) { return message ? <p className="field-error" role="alert"><AlertCircle size={15}/>{message}</p> : null; }
function FieldLabel({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) { return <label htmlFor={htmlFor}>{children}{optional ? <small> facultatif</small> : <span aria-hidden="true"> *</span>}</label>; }

export type AstralQuestionFormMode = "free" | "paid-new-chart" | "paid-existing-chart";
export type ExistingChartSummary = { id: string; firstName: string; birthDate: string; birthTime: string | null; birthTimeKnown: boolean; birthPlace: string; birthCountry: string | null };
type AstralQuestionFormProps = { mode?: AstralQuestionFormMode; accountEmail?: string; chart?: ExistingChartSummary };

export function AstralQuestionForm({ mode = "free", accountEmail = "", chart }: AstralQuestionFormProps) {
  if (mode === "paid-existing-chart") return <PaidExistingChartForm accountEmail={accountEmail} chart={chart}/>;
  return <FullAstralQuestionForm mode={mode} accountEmail={accountEmail}/>;
}

export function AstroForm() { return <AstralQuestionForm mode="free"/>; }

function FullAstralQuestionForm({ mode, accountEmail }: { mode: "free" | "paid-new-chart"; accountEmail: string }) {
  const router = useRouter();
  const paid = mode === "paid-new-chart";
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle"|"sending"|"error">("idle");
  const [validationNotice, setValidationNotice] = useState("");
  const [success, setSuccess] = useState<{ remaining: number } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const idempotencyKey = useRef("");
  const methods = useForm<AnalysisFormData>({ resolver: zodResolver(formSchema), defaultValues: { ...defaultFormValues, email: accountEmail, ageConfirmed: paid ? true : defaultFormValues.ageConfirmed, consentData: paid ? true : defaultFormValues.consentData, consentLimits: paid ? true : defaultFormValues.consentLimits }, mode: "onTouched" });
  const { register, watch, setValue, setError, trigger, handleSubmit, formState: { errors } } = methods;
  // React Hook Form intentionally exposes an imperative watch API.
  // eslint-disable-next-line react-hooks/incompatible-library
  const category = watch("category"); const question = watch("question") || ""; const birthUnknown = watch("birthTimeUnknown"); const birthCountry = watch("birthCountry") || "";
  const selected = questionCategories.find((item)=>item.id===category);

  useEffect(()=>{ if(step>0) headingRef.current?.focus(); trackEvent("form_step_view",{step:step+1}); },[step]);
  useEffect(()=>{ if(validationNotice) noticeRef.current?.focus(); },[validationNotice]);
  useEffect(()=>{ if(birthUnknown) setValue("birthTime",""); },[birthUnknown,setValue]);

  async function next(){
    const relevant = stepFields[step].filter((field)=> {
      if (String(field).startsWith("partner") || field === "relationshipType" || field === "thirdPartyConsent") return category === "compatibilite";
      if (String(field).startsWith("event")) return category === "date-importante";
      if (String(field).startsWith("period")) return ["periode-passee","periode-future"].includes(category);
      return true;
    });
    let valid = await trigger(relevant, { shouldFocus: true });
    if (paid && step === 2 && !birthCountry.trim()) {
      setError("birthCountry", { type: "required", message: "Indiquez votre pays de naissance." });
      valid = false;
    }
    if(valid){ setValidationNotice(""); trackEvent("form_step_complete",{step:step+1}); setStep((value)=>Math.min(value+1,4)); }
    else { setValidationNotice("Corrigez les champs indiqués avant de continuer."); trackEvent("form_validation_error",{step:step+1}); }
  }

  function invalidSubmit(invalidFields: FieldErrors<AnalysisFormData>) {
    const invalidStep = findErrorStep(Object.keys(invalidFields));
    setStatus("idle");
    setValidationNotice(invalidStep === 4
      ? "Vérifiez les deux consentements obligatoires indiqués ci-dessous."
      : `Une information doit être corrigée à l’étape « ${stepLabels[invalidStep]} ». Nous vous y avons ramené.`);
    setStep(invalidStep);
    trackEvent("form_validation_error",{step:invalidStep+1});
  }

  async function submit(data: AnalysisFormData){
    if (status === "sending") return;
    setValidationNotice(""); setStatus("sending"); trackEvent("form_submit");
    try {
      if (!paid) {
        const dossierId = generateDossierId();
        const summary = { dossierId, category: selected?.title || data.category, question: data.question, delay: siteConfig.processingDelay };
        const body = serializeForNetlify(data,{dossierId,pageUrl:window.location.href,referrer:document.referrer});
        const response = await fetch("/netlify-form.html",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
        if(!response.ok) throw new Error("submission failed");
        persistConfirmation(summary);
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        try { trackEvent("form_submit_success"); } finally { window.location.assign("/merci"); }
        return;
      }
      if (!(data.birthCountry || "").trim()) {
        setError("birthCountry", { type: "required", message: "Indiquez votre pays de naissance." });
        setStep(2); setStatus("idle"); return;
      }
      if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
      const response = await fetch("/api/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        mode, firstName: data.firstName, birthDate: data.birthDate,
        birthTime: data.birthTimeUnknown ? null : data.birthTime,
        birthTimeKnown: !data.birthTimeUnknown, birthPlace: data.birthPlace,
        birthCountry: data.birthCountry, category: data.category,
        questionText: data.question, idempotencyKey: idempotencyKey.current,
      }) });
      const result = await response.json();
      if (!response.ok) {
        const messages: Record<string,string> = { NO_ACTIVE_SUN: "Aucun Soleil disponible.", SUN_EXPIRED: "Votre Soleil a expiré avant l’envoi.", SENSITIVE_CONTENT_REFORMULATE: "Reformulez votre question sans donnée personnelle sensible.", IDEMPOTENCY_CONFLICT: "Cette tentative ne correspond plus au formulaire actuel. Revenez à l’étape précédente puis réessayez." };
        setValidationNotice(messages[result.error] || "La question n’a pas pu être envoyée. Réessayez dans quelques instants.");
        setStatus("error"); return;
      }
      idempotencyKey.current = "";
      setSuccess({ remaining: Number(result.remaining) });
      setStatus("idle"); trackEvent("form_submit_success"); router.replace("/espace/questions?submitted=1");
    } catch { setStatus("error"); trackEvent("form_submit_error"); }
  }

  if(!paid && !siteConfig.formEnabled) return <div className="form-paused"><span className="eyebrow">Qualité des analyses</span><h3>Les nouvelles demandes sont temporairement suspendues</h3><p>Nous finalisons actuellement les analyses déjà reçues afin de préserver leur qualité. Le formulaire rouvrira prochainement.</p></div>;

  if (success) return <div className="astro-form paid-success" role="status"><Check/><span className="eyebrow">Demande confirmée</span><h3>Votre question a bien été transmise</h3><p>Votre thème va être préparé à partir de vos informations de naissance. Votre analyse personnalisée sera disponible sous 48 heures.</p><strong>Analyse en préparation</strong><p>{formatSunCount(success.remaining)} disponible{success.remaining > 1 ? "s" : ""}</p></div>;

  return <form name={paid ? "question-payante" : "analyse-gratuite"} method={paid ? undefined : "POST"} data-netlify={paid ? undefined : "true"} data-netlify-honeypot={paid ? undefined : "company-website"} className="astro-form" onSubmit={handleSubmit(submit,invalidSubmit)} noValidate>
    {!paid && <><input type="hidden" name="form-name" value="analyse-gratuite"/><div className="honeypot" aria-hidden="true"><label htmlFor="company-website">Ne pas remplir</label><input id="company-website" tabIndex={-1} autoComplete="off" {...register("company-website")}/></div></>}
    <ol className="form-progress" aria-label="Progression du formulaire">{stepLabels.map((label,index)=><li key={label} aria-current={index===step?"step":undefined} className={index<=step?"active":""}><span>{index<step?<Check size={15}/>:index+1}</span><em>{label}</em></li>)}</ol>
    {siteConfig.highDemand && <div className="high-demand"><AlertCircle/><p>{siteConfig.highDemandMessage}</p></div>}
    {validationNotice && <div className="submit-error" role="alert" tabIndex={-1} ref={noticeRef}><AlertCircle/><p>{validationNotice}</p></div>}
    <div className="form-stage" aria-live="polite">
      {step===0 && <section><span className="eyebrow">Étape 1 sur 5</span><h3 tabIndex={-1} ref={headingRef}>Quel sujet souhaitez-vous explorer ?</h3><p className="stage-lead">Choisissez le domaine le plus proche de votre question.</p><div className="form-category-grid">{questionCategories.map((item)=><label key={item.id} className={`select-card ${category===item.id?"selected":""}`} style={{"--accent":item.accent} as React.CSSProperties}><input type="radio" value={item.id} {...register("category")} onChange={(e)=>{register("category").onChange(e);trackEvent("category_select",{category:item.id});trackEvent("form_start");}}/><CategoryIcon name={item.icon}/><span>{item.shortTitle}</span>{category===item.id&&<Check className="select-check" size={17}/>}</label>)}</div><ErrorText message={errors.category?.message}/></section>}
      {step===1 && <section><span className="eyebrow">Étape 2 sur 5 · {selected?.title}</span><h3 tabIndex={-1} ref={headingRef}>{paid ? "Posez votre question personnelle" : "Posez votre première question gratuite"}</h3>{selected && <div className="question-suggestions" aria-label="Exemples de questions">{selected.examples.map((example)=><button type="button" key={example} onClick={()=>setValue("question",example,{shouldValidate:true})}>{example}</button>)}</div>}<div className="legal-warning"><strong>Protégez vos données</strong><p>Ne transmettez pas de donnée médicale, judiciaire, bancaire, de mot de passe, de document officiel ni d’information sensible concernant une autre personne. Limitez votre contexte aux éléments utiles à votre question.</p></div><div className="field"><FieldLabel htmlFor="question">Votre question</FieldLabel><textarea id="question" rows={7} maxLength={2000} aria-describedby="question-help question-count" {...register("question")}/><div className="field-meta"><span id="question-help">Pour protéger votre vie privée, RéponseAstrale peut demander la reformulation ou refuser un contenu contenant des données sensibles.</span><span id="question-count">{question.length}/2 000</span></div><ErrorText message={errors.question?.message}/></div>{selected?.warning&&<p className="gentle-warning">{selected.warning}</p>}{category==="compatibilite"&&<CompatibilityFields register={register} watch={watch} setValue={setValue} errors={errors}/>} {category==="date-importante"&&<DateFields register={register} watch={watch} setValue={setValue} errors={errors}/>} {["periode-passee","periode-future"].includes(category)&&<PeriodFields register={register} errors={errors}/>}</section>}
      {step===2 && <section><span className="eyebrow">Étape 3 sur 5</span><h3 tabIndex={-1} ref={headingRef}>Vos informations de naissance</h3><p className="stage-lead">Elles permettent de personnaliser l’interprétation de votre thème.</p><div className="field-grid"><div className="field"><FieldLabel htmlFor="birthDate">Date de naissance</FieldLabel><input id="birthDate" type="date" {...register("birthDate")}/><ErrorText message={errors.birthDate?.message}/></div><div className="field"><FieldLabel htmlFor="birthTime">Heure de naissance</FieldLabel><input id="birthTime" type="time" disabled={birthUnknown} {...register("birthTime")}/><ErrorText message={errors.birthTime?.message}/></div></div><label className="check-row"><input type="checkbox" {...register("birthTimeUnknown")}/><span>Je ne connais pas mon heure de naissance</span></label>{birthUnknown&&<p className="gentle-warning">Sans heure de naissance précise, l’ascendant et les maisons ne pourront pas être interprétés avec certitude. L’analyse restera partielle.</p>}<div className={paid ? "field-grid" : undefined}><div className="field"><FieldLabel htmlFor="birthPlace">{paid ? "Ville de naissance" : "Ville et pays de naissance"}</FieldLabel><input id="birthPlace" role="combobox" aria-expanded="false" autoComplete="address-level2" placeholder={paid ? "Ex. Lille" : "Ex. Lille, France"} {...register("birthPlace")}/><small>Saisie libre acceptée. Aucun lieu ou fuseau n’est inventé.</small><ErrorText message={errors.birthPlace?.message}/></div>{paid&&<div className="field"><FieldLabel htmlFor="birthCountry">Pays de naissance</FieldLabel><input id="birthCountry" autoComplete="country-name" placeholder="Ex. France" {...register("birthCountry")}/><ErrorText message={errors.birthCountry?.message}/></div>}</div></section>}
      {step===3 && <section><span className="eyebrow">Étape 4 sur 5</span><h3 tabIndex={-1} ref={headingRef}>{paid ? "Votre compte et votre prénom" : "Où devons-nous envoyer votre analyse ?"}</h3><div className="field-grid"><div className="field"><FieldLabel htmlFor="firstName">Prénom</FieldLabel><input id="firstName" autoComplete="given-name" {...register("firstName")}/><ErrorText message={errors.firstName?.message}/></div>{paid?<div className="account-email"><span>Cette demande sera associée à votre compte :</span><strong>{accountEmail}</strong></div>:<div className="field"><FieldLabel htmlFor="email">Adresse e-mail</FieldLabel><input id="email" type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.fr" {...register("email")}/><ErrorText message={errors.email?.message}/></div>}</div>{!paid&&<><div className="field"><FieldLabel htmlFor="designation">Comment souhaitez-vous être désigné·e ?</FieldLabel><select id="designation" {...register("designation")}><option value="femme">Femme</option><option value="homme">Homme</option><option value="autre">Autre</option><option value="non-precise">Je préfère ne pas préciser</option></select></div><label className="check-row"><input type="checkbox" {...register("ageConfirmed")}/><span>Je certifie avoir au moins 18 ans.</span></label><ErrorText message={errors.ageConfirmed?.message}/><p className="minor-note">RéponseAstrale est actuellement réservé aux personnes majeures. Une offre distincte pourra être proposée ultérieurement aux parents pour certaines questions éducatives.</p></>}</section>}
      {step===4 && <section><span className="eyebrow">Étape 5 sur 5</span><h3 tabIndex={-1} ref={headingRef}>Vérifiez et confirmez votre demande</h3><div className="summary-card"><div><span>Sujet</span><strong>{selected?.title}</strong><button type="button" onClick={()=>setStep(0)}>Modifier</button></div><div><span>Question</span><strong>{question}</strong><button type="button" onClick={()=>setStep(1)}>Modifier</button></div><div><span>Naissance</span><strong>{watch("birthDate")} · {birthUnknown?"heure inconnue":watch("birthTime")} · {watch("birthPlace")}{paid?` · ${watch("birthCountry")}`:""}</strong><button type="button" onClick={()=>setStep(2)}>Modifier</button></div><div><span>Envoi</span><strong>{watch("firstName")} · {paid?accountEmail:watch("email")}</strong><button type="button" onClick={()=>setStep(3)}>Modifier</button></div></div>{paid?<div className="paid-disclosures"><strong>1 Soleil sera utilisé</strong><p>Votre réponse personnalisée sera préparée sous 48 heures. Vos données de naissance seront utilisées pour préparer votre thème.</p><p>L’astrologie est ici un système symbolique d’interprétation et d’introspection. Consultez notre <a href="/confidentialite" target="_blank">politique de confidentialité</a>. Vous pouvez exporter ou supprimer vos données depuis « Mes données ».</p>{birthUnknown&&<p className="gentle-warning">Sans heure de naissance précise, l’ascendant et les maisons ne pourront pas être interprétés avec certitude. L’analyse restera partielle.</p>}</div>:<div className="consents"><label className="check-row"><input type="checkbox" {...register("consentData")}/><span>J’accepte que les informations transmises soient utilisées par RéponseAstrale et ses prestataires techniques afin de traiter ma demande et produire mon analyse. J’ai lu la <a href="/confidentialite" target="_blank">politique de confidentialité</a>.</span></label><ErrorText message={errors.consentData?.message}/><label className="check-row"><input type="checkbox" {...register("consentMarketing")}/><span>Je souhaite recevoir occasionnellement les actualités et offres de RéponseAstrale. Je pourrai me désabonner à tout moment. <em>Facultatif</em></span></label><label className="check-row"><input type="checkbox" {...register("consentLimits")}/><span>Je comprends que cette analyse astrologique constitue une interprétation symbolique et ne représente ni une certitude, ni un avis médical, psychologique, juridique ou financier.</span></label><ErrorText message={errors.consentLimits?.message}/></div>}{status==="error"&&<div className="submit-error" role="alert"><AlertCircle/><p>{validationNotice || "La demande n’a pas pu être envoyée. Vérifiez votre connexion puis réessayez."}</p></div>}</section>}
    </div>
    <div className="form-actions">{step>0?<button type="button" className="button button--ghost" onClick={()=>setStep((value)=>value-1)}><ArrowLeft/>Précédent</button>:<span/>}{step<4?<button type="button" className="button" onClick={next}>Continuer<ArrowRight/></button>:<button type="submit" className="button" disabled={status==="sending"}>{status==="sending"?<><LoaderCircle className="spin"/>Envoi en cours…</>:<>{paid?"Envoyer ma question avec 1 Soleil":"Recevoir ma réponse offerte"}<ArrowRight/></>}</button>}</div>
    <p className="form-micro"><LockKeyhole size={15}/> {paid?"1 Soleil sera utilisé · Réponse sous 48 heures · Données confidentielles":"Première analyse offerte par personne · Aucune carte bancaire · Données confidentielles"}</p>
  </form>;
}

function PaidExistingChartForm({ accountEmail, chart }: { accountEmail: string; chart?: ExistingChartSummary }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"error"|"success">("idle");
  const [message, setMessage] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const idempotencyKey = useRef("");
  const selected = questionCategories.find((item) => item.id === category);

  function next() {
    if (step === 0 && !category) return setMessage("Choisissez un sujet.");
    if (step === 1 && question.trim().length < 20) return setMessage("Décrivez votre question en au moins 20 caractères.");
    setMessage(""); setStep((value) => Math.min(value + 1, 2));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!chart || status === "sending") return;
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "paid-existing-chart", chartId: chart.id, category, questionText: question, idempotencyKey: idempotencyKey.current }) });
      const result = await response.json();
      if (!response.ok) {
        const messages: Record<string,string> = { NO_ACTIVE_SUN: "Aucun Soleil disponible.", SUN_EXPIRED: "Votre Soleil a expiré avant l’envoi.", CHART_NOT_FOUND: "Ce thème est introuvable.", CHART_FORBIDDEN: "Ce thème n’appartient pas à votre compte.", SENSITIVE_CONTENT_REFORMULATE: "Reformulez votre question sans donnée personnelle sensible.", IDEMPOTENCY_CONFLICT: "Cette tentative est en conflit avec une demande précédente." };
        setMessage(messages[result.error] || "La question n’a pas pu être envoyée."); setStatus("error"); return;
      }
      idempotencyKey.current = ""; setRemaining(Number(result.remaining)); setStatus("success"); router.replace("/espace/questions?submitted=1");
    } catch { setMessage("La question n’a pas pu être envoyée. Vérifiez votre connexion."); setStatus("error"); }
  }

  if (!chart) return null;
  if (status === "success") return <div className="astro-form paid-success" role="status"><Check/><span className="eyebrow">Demande confirmée</span><h3>Votre question a bien été transmise</h3><p>Votre analyse personnalisée sera disponible sous 48 heures.</p><strong>Analyse en préparation</strong><p>{formatSunCount(remaining ?? 0)} disponible{(remaining ?? 0) > 1 ? "s" : ""}</p></div>;

  return <form className="astro-form" onSubmit={submit} noValidate>
    <ol className="form-progress form-progress--compact" aria-label="Progression du formulaire">{["Sujet","Question","Vérification"].map((label,index)=><li key={label} aria-current={index===step?"step":undefined} className={index<=step?"active":""}><span>{index<step?<Check size={15}/>:index+1}</span><em>{label}</em></li>)}</ol>
    {message&&<div className="submit-error" role="alert"><AlertCircle/><p>{message}</p></div>}
    <div className="form-stage" aria-live="polite">
      {step===0&&<section><span className="eyebrow">Étape 1 sur 3</span><h3>Quel sujet souhaitez-vous explorer ?</h3><div className="chart-summary"><span>Thème utilisé</span><strong>{chart.firstName} · {chart.birthDate}</strong><p>{chart.birthTimeKnown?chart.birthTime:"Heure inconnue"} · {chart.birthPlace}{chart.birthCountry?` · ${chart.birthCountry}`:""}</p><a href="/espace/donnees">Vérifier mes informations de naissance</a></div><div className="form-category-grid">{questionCategories.map((item)=><label key={item.id} className={`select-card ${category===item.id?"selected":""}`} style={{"--accent":item.accent} as React.CSSProperties}><input type="radio" name="category" value={item.id} checked={category===item.id} onChange={()=>{setCategory(item.id);setMessage("");}}/><CategoryIcon name={item.icon}/><span>{item.shortTitle}</span>{category===item.id&&<Check className="select-check" size={17}/>}</label>)}</div></section>}
      {step===1&&<section><span className="eyebrow">Étape 2 sur 3 · {selected?.title}</span><h3>Posez votre question personnelle</h3>{selected&&<div className="question-suggestions">{selected.examples.map((example)=><button type="button" key={example} onClick={()=>setQuestion(example)}>{example}</button>)}</div>}<div className="field"><FieldLabel htmlFor="paid-question">Votre question</FieldLabel><textarea id="paid-question" rows={7} maxLength={2000} value={question} onChange={(event)=>setQuestion(event.target.value)}/><div className="field-meta"><span>Évitez toute donnée sensible inutile.</span><span>{question.length}/2 000</span></div></div></section>}
      {step===2&&<section><span className="eyebrow">Étape 3 sur 3</span><h3>Vérifiez et confirmez votre demande</h3><div className="summary-card"><div><span>Sujet</span><strong>{selected?.title}</strong><button type="button" onClick={()=>setStep(0)}>Modifier</button></div><div><span>Question</span><strong>{question}</strong><button type="button" onClick={()=>setStep(1)}>Modifier</button></div><div><span>Compte</span><strong>{accountEmail}</strong></div></div><div className="paid-disclosures"><strong>1 Soleil sera utilisé</strong><p>Votre réponse personnalisée sera préparée sous 48 heures.</p><p>L’astrologie est un système symbolique d’interprétation et d’introspection. Consultez notre <a href="/confidentialite" target="_blank">politique de confidentialité</a>. L’export et la suppression sont disponibles dans « Mes données ».</p></div></section>}
    </div>
    <div className="form-actions">{step>0?<button type="button" className="button button--ghost" onClick={()=>{setMessage("");setStep((value)=>value-1);}}><ArrowLeft/>Précédent</button>:<span/>}{step<2?<button type="button" className="button" onClick={next}>Continuer<ArrowRight/></button>:<button type="submit" className="button" disabled={status==="sending"}>{status==="sending"?<><LoaderCircle className="spin"/>Envoi en cours…</>:<>Poser cette question avec 1 Soleil<ArrowRight/></>}</button>}</div>
    <p className="form-micro"><LockKeyhole size={15}/> 1 Soleil sera utilisé · Réponse sous 48 heures · Données confidentielles</p>
  </form>;
}

type GroupProps = { register: ReturnType<typeof useForm<AnalysisFormData>>["register"]; watch?: ReturnType<typeof useForm<AnalysisFormData>>["watch"]; setValue?: ReturnType<typeof useForm<AnalysisFormData>>["setValue"]; errors: ReturnType<typeof useForm<AnalysisFormData>>["formState"]["errors"] };
function CompatibilityFields({register,watch,setValue,errors}:GroupProps){const unknown=watch?.("partnerTimeUnknown");useEffect(()=>{if(unknown)setValue?.("partnerBirthTime","");},[unknown,setValue]);return <fieldset className="conditional"><legend>Informations sur la seconde personne</legend><div className="field-grid"><div className="field"><FieldLabel htmlFor="partnerName" optional>Prénom ou pseudonyme</FieldLabel><input id="partnerName" {...register("partnerName")}/></div><div className="field"><FieldLabel htmlFor="relationshipType">Nature du lien</FieldLabel><select id="relationshipType" {...register("relationshipType")}><option value="">Choisir</option><option>Partenaire</option><option>Relation passée</option><option>Proche</option><option>Collègue</option><option>Autre</option></select><ErrorText message={errors.relationshipType?.message}/></div><div className="field"><FieldLabel htmlFor="partnerBirthDate">Date de naissance</FieldLabel><input id="partnerBirthDate" type="date" {...register("partnerBirthDate")}/><ErrorText message={errors.partnerBirthDate?.message}/></div><div className="field"><FieldLabel htmlFor="partnerBirthTime" optional>Heure de naissance</FieldLabel><input id="partnerBirthTime" type="time" disabled={unknown} {...register("partnerBirthTime")}/><label className="inline-check"><input type="checkbox" {...register("partnerTimeUnknown")}/> Heure inconnue</label></div></div><div className="field"><FieldLabel htmlFor="partnerBirthPlace">Ville et pays de naissance</FieldLabel><input id="partnerBirthPlace" {...register("partnerBirthPlace")}/><ErrorText message={errors.partnerBirthPlace?.message}/></div><label className="check-row"><input type="checkbox" {...register("thirdPartyConsent")}/><span>Je confirme être autorisé à communiquer ces informations et m’engage à ne transmettre aucune donnée inutile ou sensible concernant cette personne.</span></label><ErrorText message={errors.thirdPartyConsent?.message}/></fieldset>}
function DateFields({register,watch,setValue,errors}:GroupProps){const unknown=watch?.("eventTimeUnknown");useEffect(()=>{if(unknown)setValue?.("eventTime","");},[unknown,setValue]);return <fieldset className="conditional"><legend>La date à explorer</legend><div className="field-grid"><div className="field"><FieldLabel htmlFor="eventDate">Date concernée</FieldLabel><input id="eventDate" type="date" {...register("eventDate")}/><ErrorText message={errors.eventDate?.message}/></div><div className="field"><FieldLabel htmlFor="eventTime" optional>Heure</FieldLabel><input id="eventTime" type="time" disabled={unknown} {...register("eventTime")}/><label className="inline-check"><input type="checkbox" {...register("eventTimeUnknown")}/> Inconnue ou non pertinente</label></div><div className="field"><FieldLabel htmlFor="eventPlace" optional>Lieu</FieldLabel><input id="eventPlace" {...register("eventPlace")}/></div><div className="field"><FieldLabel htmlFor="eventType">Type d’événement</FieldLabel><select id="eventType" {...register("eventType")}><option value="">Choisir</option>{["Rendez-vous","Entretien","Signature","Lancement","Voyage","Événement familial","Autre"].map(x=><option key={x}>{x}</option>)}</select></div></div><div className="field"><FieldLabel htmlFor="eventDescription">Description de l’événement</FieldLabel><textarea id="eventDescription" rows={4} {...register("eventDescription")}/></div></fieldset>}
function PeriodFields({register,errors}:GroupProps){return <fieldset className="conditional"><legend>La période à explorer</legend><div className="field-grid"><div className="field"><FieldLabel htmlFor="periodStart">Début</FieldLabel><input id="periodStart" type="date" {...register("periodStart")}/><ErrorText message={errors.periodStart?.message}/></div><div className="field"><FieldLabel htmlFor="periodEnd" optional>Fin</FieldLabel><input id="periodEnd" type="date" {...register("periodEnd")}/></div></div><div className="field"><FieldLabel htmlFor="periodPlace" optional>Lieu</FieldLabel><input id="periodPlace" {...register("periodPlace")}/></div><div className="field"><FieldLabel htmlFor="periodContext">Contexte</FieldLabel><textarea id="periodContext" rows={4} {...register("periodContext")}/></div></fieldset>}
