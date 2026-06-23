import { ArrowRight, MapPin } from "lucide-react";
import { useCountry, type Country } from "../context/CountryContext";
import yaraLogo from "../assets/yara-logo-glow.png";

const choices: Array<{ id: Country; title: string; description: string; button: string; code: string }> = [
  { id: "sri-lanka", title: "Sri Lanka", description: "View products with LKR pricing.", button: "Continue to Sri Lanka", code: "LKR" },
  { id: "uae", title: "UAE / Dubai", description: "View products with AED pricing.", button: "Continue to UAE", code: "AED" }
];

export function CountryLanding() {
  const { selectCountry } = useCountry();

  return (
    <main className="country-landing relative isolate flex min-h-[100svh] items-center overflow-hidden px-5 py-10 sm:px-8">
      <div className="country-orb country-orb-one" /><div className="country-orb country-orb-two" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yara-gold to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
        <img src={yaraLogo.src} alt="YARA" className="country-reveal mx-auto h-28 w-40 scale-[1.45] object-contain sm:h-32" />
        <p className="country-reveal country-delay-1 mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-yara-gold">Your glow begins here</p>
        <h1 className="country-reveal country-delay-2 mt-5 text-balance text-4xl font-medium sm:text-6xl">Choose Your Country</h1>
        <p className="country-reveal country-delay-3 mx-auto mt-5 max-w-2xl text-sm font-light leading-7 text-yara-taupe sm:text-base">Select your country to continue shopping with the right prices and ordering options.</p>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-7">
          {choices.map((choice, index) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => selectCountry(choice.id)}
              className={`country-card country-reveal country-delay-${index + 4} group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-7 text-left shadow-soft backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-yara-gold/60 hover:shadow-[0_24px_70px_rgba(123,78,88,0.16)] sm:p-9`}
            >
              <span className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-yara-gold/10 blur-2xl" />
              <span className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-yara-gold/40 bg-[#fff8e7] text-yara-wine"><MapPin className="h-5 w-5" /></span>
                <span className="rounded-full border border-yara-gold/35 bg-white/70 px-3 py-1.5 text-[0.6rem] font-semibold tracking-[0.18em] text-yara-gold">{choice.code}</span>
              </span>
              <span className="mt-7 block font-serif text-3xl text-yara-ink sm:text-4xl">{choice.title}</span>
              <span className="mt-2 block text-sm font-light text-yara-taupe">{choice.description}</span>
              <span className="mt-8 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-yara-wine">{choice.button}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </button>
          ))}
        </div>
        <p className="country-reveal country-delay-6 mt-8 text-[0.58rem] uppercase tracking-[0.2em] text-yara-taupe/75">Luxury skincare, thoughtfully delivered</p>
      </div>
    </main>
  );
}
