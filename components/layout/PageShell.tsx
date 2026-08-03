import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function PageShell({ children }: { children: ReactNode }) { return <><a className="skip-link" href="#contenu">Aller au contenu</a><Header/><main id="contenu">{children}</main><Footer/></>; }
