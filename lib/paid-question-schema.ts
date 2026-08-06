import { z } from "zod";
import { questionCategories } from "@/content/questions";

const categorySchema = z.string().refine(
  (value) => questionCategories.some((category) => category.id === value),
  "Choisissez un sujet valide.",
);
const questionTextSchema = z.string().trim()
  .min(20, "Décrivez votre question en au moins 20 caractères.")
  .max(2000, "Votre question ne peut pas dépasser 2 000 caractères.");
const idempotencyKeySchema = z.uuid("Clé d’idempotence invalide.");

const existingChartRequestSchema = z.object({
  mode: z.literal("paid-existing-chart"),
  chartId: z.uuid("Thème invalide."),
  category: categorySchema,
  questionText: questionTextSchema,
  idempotencyKey: idempotencyKeySchema,
});

const newChartRequestSchema = z.object({
  mode: z.literal("paid-new-chart"),
  firstName: z.string().trim().min(2, "Indiquez votre prénom.").max(80),
  birthDate: z.iso.date("Indiquez une date valide."),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Indiquez une heure valide.").nullable(),
  birthTimeKnown: z.boolean(),
  birthPlace: z.string().trim().min(2, "Indiquez votre ville de naissance.").max(120),
  birthCountry: z.string().trim().min(2, "Indiquez votre pays de naissance.").max(120),
  category: categorySchema,
  questionText: questionTextSchema,
  idempotencyKey: idempotencyKeySchema,
}).superRefine((data, context) => {
  if (data.birthTimeKnown && !data.birthTime) {
    context.addIssue({ code: "custom", path: ["birthTime"], message: "Indiquez l’heure ou cochez « heure inconnue »." });
  }
  if (!data.birthTimeKnown && data.birthTime !== null) {
    context.addIssue({ code: "custom", path: ["birthTime"], message: "L’heure doit être vide lorsqu’elle est inconnue." });
  }
  const birth = new Date(`${data.birthDate}T12:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age--;
  if (!Number.isFinite(age) || age < 18) {
    context.addIssue({ code: "custom", path: ["birthDate"], message: "RéponseAstrale est actuellement réservé aux personnes majeures." });
  }
});

export const paidQuestionRequestSchema = z.discriminatedUnion("mode", [
  existingChartRequestSchema,
  newChartRequestSchema,
]);

export type PaidQuestionRequest = z.infer<typeof paidQuestionRequestSchema>;

export type PaidQuestionSuccess = {
  questionId: string;
  chartId: string;
  remaining: number;
  replayed: boolean;
};

export type PaidQuestionErrorCode =
  | "INVALID_REQUEST"
  | "NO_SESSION"
  | "NO_ACTIVE_SUN"
  | "SUN_EXPIRED"
  | "CHART_NOT_FOUND"
  | "CHART_FORBIDDEN"
  | "IDEMPOTENCY_CONFLICT"
  | "SENSITIVE_CONTENT_REFORMULATE"
  | "RATE_LIMITED"
  | "QUESTION_FAILED";
