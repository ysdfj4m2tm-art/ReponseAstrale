import { authkitProxy } from "@workos-inc/authkit-nextjs";

export default authkitProxy({
  redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
});

export const config = {
  matcher: [
    "/connexion",
    "/callback",
    "/espace/:path*",
    "/api/questions/:path*",
    "/api/retraction/:path*",
  ],
};
