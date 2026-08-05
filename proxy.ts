import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { assertEnvironment, getDeploymentKind } from "@/lib/env-rules";

const deploymentKind = getDeploymentKind();
if (deploymentKind === "production" || deploymentKind === "deploy-preview" || deploymentKind === "branch-deploy") {
  assertEnvironment(deploymentKind);
}

export default authkitProxy({
  redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
