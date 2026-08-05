import { signOut } from "@workos-inc/authkit-nextjs";

export const dynamic = "force-dynamic";

async function logOut() {
  await signOut();
}

export const GET = logOut;
export const POST = logOut;
