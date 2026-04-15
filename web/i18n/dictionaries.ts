import { en, type Messages } from "./messages/en";
import { ptBR } from "./messages/pt-BR";
import type { Locale } from "./config";

export async function getDictionaryFor(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "pt-BR":
      return ptBR;
    case "en":
    default:
      return en;
  }
}

export type { Messages };
