import { authkitProxy } from "@workos-inc/authkit-nextjs";

export default authkitProxy();

export const config = {
  matcher: ["/espace/:path*", "/api/questions", "/deconnexion"],
};
