import { getAppUrl } from "@/lib/env";

export async function sendRetractionVerification(email: string, token: string) {
  if (process.env.EMAIL_PROVIDER !== "resend" || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "Vérifiez votre demande de rétractation",
      html: `<p>Confirmez votre demande en ouvrant ce lien à usage unique :</p><p><a href="${getAppUrl()}/api/retraction/verify?token=${encodeURIComponent(token)}">Vérifier ma demande</a></p>`,
    }),
  });
  return response.ok;
}
