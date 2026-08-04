"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { createAuthClient } from "@neondatabase/auth/next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { safeInternalRedirect } from "@/lib/auth/security";

export function AuthProvider({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  if (!enabled) return children;
  return <EnabledAuthProvider>{children}</EnabledAuthProvider>;
}

function EnabledAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authClient] = useState(() => createAuthClient());
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={(target) => router.push(safeInternalRedirect(target))}
      replace={(target) => router.replace(safeInternalRedirect(target))}
      onSessionChange={() => router.refresh()}
      redirectTo="/espace"
      basePath="/connexion"
      Link={Link}
      emailOTP
      credentials={false}
      defaultTheme="light"
      localization={{
        SIGN_IN: "Connexion",
        SIGN_IN_DESCRIPTION: "Saisissez votre e-mail pour recevoir votre code de connexion.",
        EMAIL: "Adresse e-mail",
        EMAIL_PLACEHOLDER: "vous@exemple.fr",
        EMAIL_OTP: "Code par e-mail",
        EMAIL_OTP_SEND_ACTION: "Recevoir mon code",
        EMAIL_OTP_VERIFY_ACTION: "Vérifier le code",
        EMAIL_OTP_DESCRIPTION: "Saisissez votre e-mail pour recevoir un code à usage unique.",
        EMAIL_OTP_VERIFICATION_SENT: "Consultez votre e-mail pour récupérer le code de vérification.",
        RESEND_CODE: "Renvoyer le code",
        INVALID_CODE: "Ce code est invalide.",
        OTP_HAS_EXPIRED: "Ce code a expiré. Demandez-en un nouveau.",
      }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
