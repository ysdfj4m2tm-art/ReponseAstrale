import { handleAuth } from "@workos-inc/authkit-nextjs";
import type { NextRequest } from "next/server";
import { hasValidWorkOSCallbackParameters } from "@/lib/auth/callback";
import { ensureProfile } from "@/lib/profiles";

const workOSCallback = handleAuth({
  returnPathname: "/espace",
  onSuccess: async ({ user }) => {
    await ensureProfile({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified === true,
      name: user.firstName,
    });
  },
  onError: async () => new Response("Callback d’authentification invalide.", { status: 400 }),
});

export async function GET(request: NextRequest) {
  if (!hasValidWorkOSCallbackParameters(request)) {
    return new Response("Callback d’authentification invalide.", {
      status: 400,
      headers: { "Cache-Control": "no-store", Vary: "Cookie" },
    });
  }
  return workOSCallback(request);
}
