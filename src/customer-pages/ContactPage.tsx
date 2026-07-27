import { Instagram, MapPin, MessageCircle, Music2, Send } from "lucide-react";
import { type FormEvent } from "react";
import { useI18n } from "../i18n";

export function ContactPage() {
  const { t, list } = useI18n();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const firstName = formData.get("firstName")?.toString().trim() ?? "";
    const lastName = formData.get("lastName")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";
    const subject = formData.get("topic")?.toString().trim() ?? "";
    const message = formData.get("message")?.toString().trim() ?? "";
    const whatsappMessage = `Hello YARA, I have a website inquiry.\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}\n\nSource: YARA website contact form`;

    window.location.assign(`https://wa.me/94741266855?text=${encodeURIComponent(whatsappMessage)}`);
  };

  const contacts = [
    { icon: MessageCircle, title: t("contact.sriLankaWhatsApp"), text: "+94 74 1266 855", href: "https://wa.me/94741266855" },
    { icon: MessageCircle, title: t("contact.uaeWhatsApp"), text: "+971 54 370 2924", href: "https://wa.me/971543702924" },
    { icon: Instagram, title: "Instagram", text: "yaraproduction1", href: "https://www.instagram.com/yaraproduction1", newTab: true },
    { icon: Music2, title: "TikTok", text: "@yaraproduction1", href: "https://www.tiktok.com/@yaraproduction1", newTab: true }
  ];

  return (
    <div className="page-shell py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center"><p className="eyebrow">{t("contact.eyebrow")}</p><h1 className="mt-4 text-balance text-5xl sm:text-6xl">{t("contact.title")}</h1><p className="mt-6 text-sm font-light leading-7 text-yara-taupe">{t("contact.copy")}</p></div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {contacts.map(({ icon: Icon, title, text, href, newTab }) => <a key={title} href={href} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} className="surface-card p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-soft"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-yara-rose text-yara-wine"><Icon className="h-5 w-5" /></span><h2 className="mt-5 text-lg">{title}</h2><p className="mt-2 text-xs font-light leading-5 text-yara-taupe">{text}</p></a>)}
      </div>

      <div className="mt-12 grid overflow-hidden rounded-[2.4rem] bg-white shadow-soft lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-7 sm:p-10 lg:p-12">
          <p className="eyebrow">{t("contact.sendEyebrow")}</p><h2 className="mt-3 text-3xl sm:text-4xl">{t("contact.sendTitle")}</h2>
          <form onSubmit={handleSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
            <label><span className="field-label">{t("checkout.firstName")}</span><input name="firstName" required className="field" /></label><label><span className="field-label">{t("checkout.lastName")}</span><input name="lastName" required className="field" /></label>
            <label className="sm:col-span-2"><span className="field-label">{t("layout.emailAddress")}</span><input type="email" name="email" required className="field" /></label>
            <label className="sm:col-span-2"><span className="field-label">{t("contact.subject")}</span><select name="topic" className="field">{list("contact.topics").map((topic) => <option key={topic}>{topic}</option>)}</select></label>
            <label className="sm:col-span-2"><span className="field-label">{t("contact.message")}</span><textarea name="message" required rows={5} className="field resize-none rounded-[1.5rem]" /></label>
            <button className="btn-primary sm:col-span-2">{t("contact.send")} <Send className="h-4 w-4" /></button>
          </form>
        </div>
        <div className="relative min-h-[420px] bg-yara-rose sm:min-h-[540px] lg:min-h-full"><img src="/images/contact/yara-contact-support-products.png" alt="YARA skincare customer support and product inquiry setup" className="h-full w-full object-cover" /><div className="absolute inset-x-5 bottom-5 rounded-[1.5rem] bg-white/90 p-5 backdrop-blur"><p className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-yara-wine" /> YARA Productions</p><p className="mt-2 text-xs font-light leading-5 text-yara-taupe">{t("contact.serving")}</p></div></div>
      </div>
    </div>
  );
}
