import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Country = "sri-lanka" | "uae";

const sriLankaWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_SRI_LANKA?.trim();
const uaeWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_UAE?.trim();

export const countryDetails = {
  "sri-lanka": {
    name: "Sri Lanka",
    navbarLabel: "Sri Lanka · LKR",
    currency: "LKR",
    whatsapp: sriLankaWhatsApp || "94741266855"
  },
  uae: {
    name: "UAE / Dubai",
    navbarLabel: "UAE / Dubai · AED",
    currency: "AED",
    whatsapp: uaeWhatsApp || "971543702924"
  }
} as const;

interface CountryContextValue {
  country: Country | null;
  selectCountry: (country: Country) => void;
  changeCountry: () => void;
}

const CountryContext = createContext<CountryContextValue | null>(null);

const readCountry = (): Country | null => {
  const stored = localStorage.getItem("selectedCountry");
  return stored === "sri-lanka" || stored === "uae" ? stored : null;
};

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<Country | null>(readCountry);

  const value = useMemo(() => ({
    country,
    selectCountry: (nextCountry: Country) => {
      localStorage.setItem("selectedCountry", nextCountry);
      setCountry(nextCountry);
    },
    changeCountry: () => {
      localStorage.removeItem("selectedCountry");
      setCountry(null);
    }
  }), [country]);

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export const useCountry = () => {
  const context = useContext(CountryContext);
  if (!context) throw new Error("useCountry must be used within CountryProvider");
  return context;
};
