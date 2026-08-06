const PRODUCTION_ORIGIN = "https://reponseastrale.fr";
const PRODUCTION_CALLBACK = `${PRODUCTION_ORIGIN}/callback`;
const NEON_PRODUCTION_ENDPOINT = "ep-curly-brook-a2smc636";
const NEON_PREVIEW_ENDPOINT = "ep-small-feather-a2x8uj2j";

export type EnvironmentMap = Record<string, string | undefined>;
export type DeploymentKind = "development" | "deploy-preview" | "branch-deploy" | "production" | "test";

export class EnvironmentValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Configuration invalide : ${issues.join(", ")}`);
    this.name = "EnvironmentValidationError";
    this.issues = issues;
  }
}

const requiredCommon = [
  "APP_URL",
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ONE_SUN",
  "STRIPE_PRICE_THREE_SUNS",
  "STRIPE_ENVIRONMENT",
  "STRIPE_AUTOMATIC_TAX",
  "WORKOS_CLIENT_ID",
  "WORKOS_API_KEY",
  "WORKOS_COOKIE_PASSWORD",
  "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
] as const;

function value(env: EnvironmentMap, name: string) {
  return env[name]?.trim() ?? "";
}

function isPlaceholder(candidate: string) {
  return !candidate || /^(?:change[-_ ]?me|todo|replace|placeholder|example|xxx)|<[^>]+>|your[-_]/i.test(candidate);
}

function isHttpsUrl(candidate: string) {
  try {
    return new URL(candidate).protocol === "https:";
  } catch {
    return false;
  }
}

function isPostgresUrl(candidate: string) {
  try {
    const protocol = new URL(candidate).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}

function databaseHostname(candidate: string) {
  try {
    return new URL(candidate).hostname;
  } catch {
    return "";
  }
}

export function getDeploymentKind(env: EnvironmentMap = process.env): DeploymentKind {
  const context = value(env, "CONTEXT");
  if (context === "production" || context === "deploy-preview" || context === "branch-deploy") return context;
  if (value(env, "NODE_ENV") === "test") return "test";
  if (value(env, "APP_URL") === PRODUCTION_ORIGIN
    && value(env, "NEON_BRANCH") === "production"
    && value(env, "STRIPE_ENVIRONMENT") === "live"
    && value(env, "WORKOS_ENVIRONMENT") === "production") {
    return "production";
  }
  return "development";
}

export function validateCommonEnvironment(env: EnvironmentMap = process.env) {
  const issues: string[] = [];
  for (const name of requiredCommon) {
    if (isPlaceholder(value(env, name))) issues.push(`${name}: absent ou placeholder`);
  }
  if (present(env, "WORKOS_COOKIE_PASSWORD") && value(env, "WORKOS_COOKIE_PASSWORD").length < 32) issues.push("WORKOS_COOKIE_PASSWORD: 32 caractères minimum");
  if (present(env, "APP_URL") && !isHttpsUrl(value(env, "APP_URL"))) issues.push("APP_URL: URL HTTPS requise");
  if (present(env, "NEXT_PUBLIC_WORKOS_REDIRECT_URI") && !isHttpsUrl(value(env, "NEXT_PUBLIC_WORKOS_REDIRECT_URI"))) issues.push("NEXT_PUBLIC_WORKOS_REDIRECT_URI: URL HTTPS requise");
  if (present(env, "DATABASE_URL") && !isPostgresUrl(value(env, "DATABASE_URL"))) issues.push("DATABASE_URL: URL PostgreSQL requise");
  if (present(env, "DATABASE_URL_UNPOOLED") && !isPostgresUrl(value(env, "DATABASE_URL_UNPOOLED"))) issues.push("DATABASE_URL_UNPOOLED: URL PostgreSQL requise");
  if (present(env, "DATABASE_URL") && !databaseHostname(value(env, "DATABASE_URL")).includes("-pooler")) issues.push("DATABASE_URL: connexion pooled requise");
  if (present(env, "DATABASE_URL_UNPOOLED") && databaseHostname(value(env, "DATABASE_URL_UNPOOLED")).includes("-pooler")) issues.push("DATABASE_URL_UNPOOLED: connexion directe requise");
  if (present(env, "STRIPE_PRICE_ONE_SUN") && !/^price_[A-Za-z0-9]+$/.test(value(env, "STRIPE_PRICE_ONE_SUN"))) issues.push("STRIPE_PRICE_ONE_SUN: identifiant Price invalide");
  if (present(env, "STRIPE_PRICE_THREE_SUNS") && !/^price_[A-Za-z0-9]+$/.test(value(env, "STRIPE_PRICE_THREE_SUNS"))) issues.push("STRIPE_PRICE_THREE_SUNS: identifiant Price invalide");
  if (present(env, "STRIPE_WEBHOOK_SECRET") && !value(env, "STRIPE_WEBHOOK_SECRET").startsWith("whsec_")) issues.push("STRIPE_WEBHOOK_SECRET: secret de signature invalide");
  if (present(env, "STRIPE_AUTOMATIC_TAX") && value(env, "STRIPE_AUTOMATIC_TAX") !== "false") issues.push("STRIPE_AUTOMATIC_TAX: doit valoir false");
  if (present(env, "NEXT_PUBLIC_WORKOS_REDIRECT_URI") && present(env, "APP_URL")
    && value(env, "NEXT_PUBLIC_WORKOS_REDIRECT_URI") !== `${value(env, "APP_URL").replace(/\/$/, "")}/callback`) {
    issues.push("NEXT_PUBLIC_WORKOS_REDIRECT_URI: incohérente avec APP_URL");
  }
  return issues;
}

function present(env: EnvironmentMap, name: string) {
  return Boolean(value(env, name));
}

export function validatePreviewEnvironment(env: EnvironmentMap = process.env) {
  const issues = validateCommonEnvironment(env);
  if (value(env, "STRIPE_ENVIRONMENT") !== "test") issues.push("STRIPE_ENVIRONMENT: test requis hors production");
  if (!value(env, "STRIPE_SECRET_KEY").startsWith("sk_test_") && !value(env, "STRIPE_SECRET_KEY").startsWith("rk_test_")) {
    issues.push("STRIPE_SECRET_KEY: clé test requise hors production");
  }
  if (value(env, "APP_URL") === PRODUCTION_ORIGIN) issues.push("APP_URL: le domaine Production est interdit en Deploy Preview");
  if (value(env, "NEON_BRANCH") === "production") issues.push("NEON_BRANCH: la branche Production est interdite en Deploy Preview");
  if (present(env, "DATABASE_URL") && present(env, "DATABASE_URL_UNPOOLED")
    && (!databaseHostname(value(env, "DATABASE_URL")).includes(NEON_PREVIEW_ENDPOINT)
    || !databaseHostname(value(env, "DATABASE_URL_UNPOOLED")).includes(NEON_PREVIEW_ENDPOINT))) {
    issues.push("DATABASE_URL: endpoint codex-sales-funnel requis en Deploy Preview");
  }
  if (value(env, "WORKOS_ENVIRONMENT") === "production") issues.push("WORKOS_ENVIRONMENT: Production est interdite en Deploy Preview");
  return issues;
}

export function validateDevelopmentEnvironment(env: EnvironmentMap = process.env) {
  const issues = validateCommonEnvironment(env).filter((issue) => !issue.includes("URL HTTPS requise"));
  const appUrl = value(env, "APP_URL");
  const callback = value(env, "NEXT_PUBLIC_WORKOS_REDIRECT_URI");
  if (!/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(appUrl) && !isHttpsUrl(appUrl)) {
    issues.push("APP_URL: URL locale HTTP ou URL HTTPS requise");
  }
  if (!/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/callback$/.test(callback) && !isHttpsUrl(callback)) {
    issues.push("NEXT_PUBLIC_WORKOS_REDIRECT_URI: callback local HTTP ou HTTPS requis");
  }
  if (value(env, "STRIPE_ENVIRONMENT") !== "test") issues.push("STRIPE_ENVIRONMENT: test requis en développement");
  if (!value(env, "STRIPE_SECRET_KEY").startsWith("sk_test_") && !value(env, "STRIPE_SECRET_KEY").startsWith("rk_test_")) {
    issues.push("STRIPE_SECRET_KEY: clé test requise en développement");
  }
  return issues;
}

export function validateProductionEnvironment(env: EnvironmentMap = process.env) {
  const issues = validateCommonEnvironment(env);
  if (present(env, "APP_URL") && value(env, "APP_URL") !== PRODUCTION_ORIGIN) issues.push(`APP_URL: doit valoir ${PRODUCTION_ORIGIN}`);
  if (present(env, "NEXT_PUBLIC_WORKOS_REDIRECT_URI") && value(env, "NEXT_PUBLIC_WORKOS_REDIRECT_URI") !== PRODUCTION_CALLBACK) {
    issues.push(`NEXT_PUBLIC_WORKOS_REDIRECT_URI: doit valoir ${PRODUCTION_CALLBACK}`);
  }
  if (present(env, "STRIPE_ENVIRONMENT") && value(env, "STRIPE_ENVIRONMENT") !== "live") issues.push("STRIPE_ENVIRONMENT: live requis en Production");
  if (present(env, "STRIPE_SECRET_KEY") && !value(env, "STRIPE_SECRET_KEY").startsWith("sk_live_") && !value(env, "STRIPE_SECRET_KEY").startsWith("rk_live_")) {
    issues.push("STRIPE_SECRET_KEY: clé live requise en Production");
  }
  if (value(env, "NEON_BRANCH") !== "production") issues.push("NEON_BRANCH: production requis en Production");
  if (present(env, "DATABASE_URL") && present(env, "DATABASE_URL_UNPOOLED")
    && (!databaseHostname(value(env, "DATABASE_URL")).includes(NEON_PRODUCTION_ENDPOINT)
    || !databaseHostname(value(env, "DATABASE_URL_UNPOOLED")).includes(NEON_PRODUCTION_ENDPOINT))) {
    issues.push("DATABASE_URL: endpoint Neon Production requis");
  }
  if (databaseHostname(value(env, "DATABASE_URL")).includes(NEON_PREVIEW_ENDPOINT)
    || databaseHostname(value(env, "DATABASE_URL_UNPOOLED")).includes(NEON_PREVIEW_ENDPOINT)) {
    issues.push("DATABASE_URL: endpoint codex-sales-funnel interdit en Production");
  }
  if (value(env, "WORKOS_ENVIRONMENT") !== "production") issues.push("WORKOS_ENVIRONMENT: production requis en Production");
  const cookieDomain = value(env, "WORKOS_COOKIE_DOMAIN");
  if (cookieDomain && cookieDomain !== "reponseastrale.fr" && cookieDomain !== ".reponseastrale.fr") {
    issues.push("WORKOS_COOKIE_DOMAIN: domaine Production incorrect");
  }
  return issues;
}

export function assertEnvironment(kind: DeploymentKind, env: EnvironmentMap = process.env) {
  const issues = kind === "production"
    ? validateProductionEnvironment(env)
    : kind === "development" || kind === "test"
      ? validateDevelopmentEnvironment(env)
      : validatePreviewEnvironment(env);
  if (issues.length) throw new EnvironmentValidationError([...new Set(issues)]);
}

export const productionEnvironment = {
  origin: PRODUCTION_ORIGIN,
  callback: PRODUCTION_CALLBACK,
  required: [...requiredCommon, "NEON_BRANCH", "WORKOS_ENVIRONMENT"] as const,
};
