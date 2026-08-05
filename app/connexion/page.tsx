import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { safeInternalRedirect } from "@/lib/auth/redirects";

export const dynamic = "force-dynamic";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  redirect(await getSignInUrl({ returnTo: safeInternalRedirect(returnTo) }));
}
