import { Instagram, Mail, MapPin, MessageCircle, Music2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createWhatsAppLink } from "../lib/format";

export function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };

  const contacts = [
    { icon: MessageCircle, title: "Sri Lanka WhatsApp", text: "+94 74 126 6855", href: createWhatsAppLink("Hello YARA, I would like some help.", "sri-lanka") },
    { icon: MessageCircle, title: "UAE / Dubai WhatsApp", text: "+971 54 370 2924", href: createWhatsAppLink("Hello YARA, I would like some help.", "uae") },
    { icon: Instagram, title: "Instagram", text: "@YARALuxe", href: "https://instagram.com/yaraluxe" },
    { icon: Music2, title: "TikTok", text: "@YARALuxe", href: "https://tiktok.com/@yaraluxe" },
    { icon: Mail, title: "Email", text: "hello@yaraskincare.com", href: "mailto:hello@yaraskincare.com" }
  ];

  return (
    <div className="page-shell py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center"><p className="eyebrow">Contact YARA</p><h1 className="mt-4 text-balance text-5xl sm:text-6xl">We’re here to help.</h1><p className="mt-6 text-sm font-light leading-7 text-yara-taupe">Reach our team for product questions, ordering support, delivery information, or general enquiries.</p></div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {contacts.map(({ icon: Icon, title, text, href }) => <a key={title} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="surface-card p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-soft"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-yara-rose text-yara-wine"><Icon className="h-5 w-5" /></span><h2 className="mt-5 text-lg">{title}</h2><p className="mt-2 text-xs font-light leading-5 text-yara-taupe">{text}</p></a>)}
      </div>

      <div className="mt-12 grid overflow-hidden rounded-[2.4rem] bg-white shadow-soft lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-7 sm:p-10 lg:p-12">
          <p className="eyebrow">Send a message</p><h2 className="mt-3 text-3xl sm:text-4xl">How can we help?</h2>
          {sent && <div role="status" className="mt-6 rounded-2xl bg-[#e8f8ed] p-4 text-sm text-[#176b38]">Thank you—your message is ready for our care team.</div>}
          <form onSubmit={handleSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
            <label><span className="field-label">First name</span><input name="firstName" required className="field" /></label><label><span className="field-label">Last name</span><input name="lastName" required className="field" /></label>
            <label className="sm:col-span-2"><span className="field-label">Email address</span><input type="email" name="email" required className="field" /></label>
            <label className="sm:col-span-2"><span className="field-label">Subject</span><select name="topic" className="field"><option>Product question</option><option>Order support</option><option>Delivery information</option><option>Wholesale enquiry</option><option>General enquiry</option></select></label>
            <label className="sm:col-span-2"><span className="field-label">Your message</span><textarea name="message" required rows={5} className="field resize-none rounded-[1.5rem]" /></label>
            <button className="btn-primary sm:col-span-2">Send message <Send className="h-4 w-4" /></button>
          </form>
        </div>
        <div className="relative min-h-[420px] bg-yara-rose"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQDQ-bXHjYtKzlrJjyK1Rv8rkouhUavXzrCTKOkmqXJaNub880KJOAX5-15nqJxZo3oBHEYEcpGvxI7JjnsY5xU9Yexbl8TlO50HWWWF6NC5CKW3ppaP207NkV6HTdDviKKo3c7LjpJZxTsDdNyl9zEtQExjhkVXdVJ4s-ccXEhY6Ou2Tym7DF1gENg2VDCiYlkPvLaDgpvbc8loDFpkm2CIpsiaSGFtfkJ1JN1YeqNgrLDjqmOO7zFgOWKafmKs2aDpMxlsgeipI4" alt="YARA customer care" className="h-full w-full object-cover" /><div className="absolute inset-x-5 bottom-5 rounded-[1.5rem] bg-white/90 p-5 backdrop-blur"><p className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-yara-wine" /> YARA Productions</p><p className="mt-2 text-xs font-light leading-5 text-yara-taupe">Serving customers in Sri Lanka and UAE / Dubai</p></div></div>
      </div>
    </div>
  );
}
