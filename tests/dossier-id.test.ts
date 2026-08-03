import { describe,expect,it } from "vitest";
import { generateDossierId } from "@/lib/dossier-id";
describe("generateDossierId",()=>{it("produit un identifiant lisible, daté et non séquentiel",()=>{const id=generateDossierId(new Date("2026-08-03T10:00:00Z"),new Uint8Array([0,1,2,3,4,5]));expect(id).toBe("RA-20260803-ABCDEF");expect(id).toMatch(/^RA-\d{8}-[A-Z2-9]{6}$/)})});
