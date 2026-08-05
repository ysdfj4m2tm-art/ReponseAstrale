import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { safeInternalRedirect } from "@/lib/auth/redirects";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const returnTo = new URL(request.url).searchParams.get("returnTo");
  redirect(await getSignInUrl({ returnTo: safeInternalRedirect(returnTo) }));
}
