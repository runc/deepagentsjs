import { createContext, useContext, type ReactNode } from "react";
import { getMessages, type DocAgentLocale, type DocAgentMessages } from "./i18n.js";

const LocaleContext = createContext<DocAgentLocale>("en");

export interface LocaleProviderProps {
  locale?: DocAgentLocale;
  children: ReactNode;
}

export function LocaleProvider({ locale = "en", children }: LocaleProviderProps) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): DocAgentLocale {
  return useContext(LocaleContext);
}

export function useMessages(): DocAgentMessages {
  return getMessages(useLocale());
}
