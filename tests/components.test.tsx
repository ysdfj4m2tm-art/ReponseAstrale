import { fireEvent,render,screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe,expect,it } from "vitest";
import { AstroForm } from "@/components/form/AstroForm";
import { ExampleModal } from "@/components/home/ExampleModal";

describe("AstroForm",()=>{
  it("affiche une erreur puis passe à l’étape suivante après sélection",async()=>{const user=userEvent.setup();render(<AstroForm/>);await user.click(screen.getByRole("button",{name:/Continuer/i}));expect(await screen.findByText("Choisissez un sujet.")).toBeInTheDocument();await user.click(screen.getByLabelText("Amour"));await user.click(screen.getByRole("button",{name:/Continuer/i}));expect(await screen.findByText("Posez votre première question gratuite")).toBeInTheDocument()});
});
describe("ExampleModal",()=>{it("ouvre et ferme l’exemple anonymisé",async()=>{const user=userEvent.setup();render(<ExampleModal/>);const dialog=screen.getByRole("dialog",{hidden:true});expect(dialog).not.toHaveAttribute("open");await user.click(screen.getByRole("button",{name:"Voir un exemple anonymisé"}));expect(dialog).toHaveAttribute("open");fireEvent.click(screen.getAllByRole("button",{name:"Fermer l’exemple"})[1]);expect(dialog).not.toHaveAttribute("open")})});
