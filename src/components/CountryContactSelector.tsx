import { Globe2, MessageCircle, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { countryContacts } from "../config/countryContacts";

interface CountryContactSelectorProps {
  variant: "desktop" | "mobile";
}

export function CountryContactSelector({ variant }: CountryContactSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstContactRef = useRef<HTMLAnchorElement>(null);
  const wasOpenRef = useRef(false);
  const listId = useId();
  const isMobile = variant === "mobile";

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!isMobile && !selectorRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobile, open]);

  useEffect(() => {
    if (open) firstContactRef.current?.focus();
    if (!open && wasOpenRef.current) triggerRef.current?.focus();
    wasOpenRef.current = open;
  }, [open]);

  const openSelector = () => setOpen(true);

  const handleListKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    const currentIndex = countryContacts.findIndex((contact) => contact.country === event.currentTarget.dataset.country);
    const nextIndex = event.key === "ArrowDown" ? (currentIndex + 1) % countryContacts.length : event.key === "ArrowUp" ? (currentIndex - 1 + countryContacts.length) % countryContacts.length : event.key === "Home" ? 0 : event.key === "End" ? countryContacts.length - 1 : null;

    if (nextIndex === null) return;
    event.preventDefault();
    selectorRef.current?.querySelector<HTMLAnchorElement>(`a[data-country="${countryContacts[nextIndex].country}"]`)?.focus();
  };

  const contactList = (
    <div className={isMobile ? "max-h-[min(62svh,34rem)] overflow-y-auto px-2 pb-4" : "max-h-[min(60vh,32rem)] overflow-y-auto p-2"}>
      <div className={isMobile ? "grid gap-1" : "grid gap-1 sm:grid-cols-2"} role="list">
        {countryContacts.map((contact, index) => (
          <a
            key={contact.country}
            ref={index === 0 ? firstContactRef : undefined}
            data-country={contact.country}
            href={`https://wa.me/${contact.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat with YARA ${contact.country} on WhatsApp`}
            onClick={() => setOpen(false)}
            onKeyDown={handleListKeyDown}
            tabIndex={open ? 0 : -1}
            className="group flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-yara-blush focus-visible:bg-yara-blush"
            role="listitem"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-yara-gold/35 bg-[#fffaf7] text-lg shadow-sm" aria-hidden="true">{contact.flag}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-yara-ink">{contact.country}</span>
              <span className="mt-0.5 block text-xs text-yara-taupe">{contact.displayPhone}</span>
            </span>
            <MessageCircle className="h-4 w-4 shrink-0 text-yara-wine transition group-hover:scale-110" aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div ref={selectorRef} className="mt-3">
        <button
          ref={triggerRef}
          type="button"
          onClick={openSelector}
          className="glass-control flex min-h-12 w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-yara-ink"
          aria-label="Contact YARA by country"
          aria-expanded={open}
          aria-controls={listId}
        >
          <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-yara-wine" aria-hidden="true" /> Contact YARA by country</span>
          <MessageCircle className="h-4 w-4 text-yara-wine" aria-hidden="true" />
        </button>

        <div className={`fixed inset-0 z-[60] flex items-end transition ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!open}>
          <button type="button" className="absolute inset-0 bg-yara-ink/30 backdrop-blur-[1px]" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} aria-label="Close country contact selector" />
          <section id={listId} className={`relative w-full rounded-t-[2rem] border-t border-yara-gold/45 bg-yara-ivory px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-18px_50px_rgba(76,39,48,0.16)] transition duration-300 ${open ? "translate-y-0" : "translate-y-full"}`} role="dialog" aria-modal="true" aria-label="Contact YARA by country">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-yara-taupe/30" />
            <div className="flex items-center justify-between px-2 pb-3">
              <div><p className="eyebrow">YARA worldwide</p><h2 className="mt-1 font-serif text-2xl text-yara-ink">Choose your country</h2></div>
              <button type="button" onClick={() => setOpen(false)} className="glass-icon h-10 w-10" aria-label="Close country contact selector"><X className="h-4 w-4" /></button>
            </div>
            {contactList}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div ref={selectorRef} className="relative hidden lg:block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="glass-icon h-10 w-10 text-yara-wine"
        aria-label="Contact YARA by country"
        aria-expanded={open}
        aria-controls={listId}
      >
        <Globe2 className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      <section id={listId} className={`glass-panel absolute right-0 top-[calc(100%+0.65rem)] w-[min(34rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] transition duration-200 ${open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`} aria-hidden={!open}>
        <div className="border-b border-yara-rose/50 px-4 py-3"><p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-yara-wine">YARA worldwide</p><p className="mt-1 font-serif text-lg text-yara-ink">Chat with your local YARA team</p></div>
        {contactList}
      </section>
    </div>
  );
}
