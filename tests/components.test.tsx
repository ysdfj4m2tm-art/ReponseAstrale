import { fireEvent,render,screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe,expect,it } from "vitest";
import { AstralQuestionForm, AstroForm, findErrorStep } from "@/components/form/AstroForm";
import { ExampleModal } from "@/components/home/ExampleModal";

describe("AstroForm",()=>{
  it("affiche une erreur puis passe à l’étape suivante après sélection",async()=>{const user=userEvent.setup();render(<AstroForm/>);await user.click(screen.getByRole("button",{name:/Continuer/i}));expect(await screen.findByText("Choisissez un sujet.")).toBeInTheDocument();await user.click(screen.getByLabelText("Amour"));await user.click(screen.getByRole("button",{name:/Continuer/i}));expect(await screen.findByText("Posez votre première question gratuite")).toBeInTheDocument()});
  it("retrouve l’étape contenant un champ qui bloque la validation finale",()=>{
    expect(findErrorStep(["birthDate"])).toBe(2);
    expect(findErrorStep(["email"])).toBe(3);
    expect(findErrorStep(["consentData"])).toBe(4);
  });
  it("adapte le parcours payant sans rendre l’e-mail modifiable",async()=>{const user=userEvent.setup();render(<AstralQuestionForm mode="paid-new-chart" accountEmail="camille@example.fr"/>);await user.click(screen.getByLabelText("Amour"));await user.click(screen.getByRole("button",{name:/Continuer/i}));await user.click(screen.getByRole("button",{name:"Que révèle mon thème sur ma manière d’aimer ?"}));await user.click(screen.getByRole("button",{name:/Continuer/i}));await user.type(screen.getByLabelText(/Date de naissance/),"1990-05-05");await user.click(screen.getByLabelText("Je ne connais pas mon heure de naissance"));await user.type(screen.getByLabelText(/Ville de naissance/),"Lille");await user.type(screen.getByLabelText(/Pays de naissance/),"France");await user.click(screen.getByRole("button",{name:/Continuer/i}));await user.type(screen.getByLabelText(/Prénom/),"Camille");expect(screen.queryByRole("textbox",{name:/Adresse e-mail/})).not.toBeInTheDocument();expect(screen.getByText("camille@example.fr")).toBeInTheDocument();await user.click(screen.getByRole("button",{name:/Continuer/i}));expect(screen.getByRole("button",{name:/Envoyer ma question avec 1 Soleil/i})).toBeInTheDocument()});
  it("résume le thème existant sans redemander la naissance",()=>{render(<AstralQuestionForm mode="paid-existing-chart" accountEmail="camille@example.fr" chart={{id:"11111111-1111-4111-8111-111111111111",firstName:"Camille",birthDate:"1990-05-05",birthTime:null,birthTimeKnown:false,birthPlace:"Lille",birthCountry:"France"}}/>);expect(screen.getByText(/Camille · 1990-05-05/)).toBeInTheDocument();expect(screen.getByText(/Heure inconnue · Lille · France/)).toBeInTheDocument();expect(screen.getByText("Vérifier mes informations de naissance")).toBeInTheDocument();expect(screen.queryByLabelText("Date de naissance")).not.toBeInTheDocument()});
});
describe("ExampleModal",()=>{it("ouvre et ferme l’exemple anonymisé",async()=>{const user=userEvent.setup();render(<ExampleModal/>);const dialog=screen.getByRole("dialog",{hidden:true});expect(dialog).not.toHaveAttribute("open");await user.click(screen.getByRole("button",{name:"Voir un exemple anonymisé"}));expect(dialog).toHaveAttribute("open");fireEvent.click(screen.getAllByRole("button",{name:"Fermer l’exemple"})[1]);expect(dialog).not.toHaveAttribute("open")})});
