import { Clock3, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createWhatsAppLink } from "../lib/format";

export function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };

  return (
    <div className="page-shell py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center"><p className="eyebrow">Here when you need us</p><h1 className="mt-4 text-balance text-5xl sm:text-6xl">Let’s talk about your ritual.</h1><p className="mt-6 text-sm font-light leading-7 text-yara-taupe">Questions about a formula, your order, or where to begin? Our care team would love to help.</p></div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: MessageCircle, title: "WhatsApp", text: "Personal ritual guidance", href: createWhatsAppLink("Hello YARA, I would love some help with my skincare ritual.") },
          { icon: Mail, title: "Email", text: "hello@yaraskincare.com", href: "mailto:hello@yaraskincare.com" },
          { icon: Phone, title: "Call", text: "+94 77 000 0000", href: "tel:+94770000000" },
          { icon: Clock3, title: "Care hours", text: "Mon–Sat, 9am–6pm", href: undefined }
        ].map(({ icon: Icon, title, text, href }) => {
          const card = <><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-yara-rose text-yara-wine"><Icon className="h-5 w-5" /></span><h2 className="mt-5 text-xl">{title}</h2><p className="mt-2 text-xs font-light leading-5 text-yara-taupe">{text}</p></>;
          return href ? <a key={title} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="surface-card p-6 text-center transition hover:-translate-y-1">{card}</a> : <div key={title} className="surface-card p-6 text-center">{card}</div>;
        })}
      </div>

      <div className="mt-12 grid overflow-hidden rounded-[2.4rem] bg-white shadow-soft lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-7 sm:p-10 lg:p-12">
          <p className="eyebrow">Send a note</p><h2 className="mt-3 text-3xl sm:text-4xl">How can we help?</h2>
          {sent && <div role="status" className="mt-6 rounded-2xl bg-[#e8f8ed] p-4 text-sm text-[#176b38]">Thank you—your note is ready for our care team.</div>}
          <form onSubmit={handleSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
            <label><span className="field-label">First name</span><input name="firstName" required className="field" /></label><label><span className="field-label">Last name</span><input name="lastName" required className="field" /></label>
            <label className="sm:col-span-2"><span className="field-label">Email address</span><input type="email" name="email" required className="field" /></label>
            <label className="sm:col-span-2"><span className="field-label">What can we help with?</span><select name="topic" className="field"><option>Product guidance</option><option>Order support</option><option>Shipping & returns</option><option>Wholesale enquiry</option><option>Something else</option></select></label>
            <label className="sm:col-span-2"><span className="field-label">Your message</span><textarea name="message" required rows={5} className="field resize-none rounded-[1.5rem]" /></label>
            <button className="btn-primary sm:col-span-2">Send message <Send className="h-4 w-4" /></button>
          </form>
        </div>
        <div className="relative min-h-[420px] bg-yara-rose"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQDQ-bXHjYtKzlrJjyK1Rv8rkouhUavXzrCTKOkmqXJaNub880KJOAX5-15nqJxZo3oBHEYEcpGvxI7JjnsY5xU9Yexbl8TlO50HWWWF6NC5CKW3ppaP207NkV6HTdDviKKo3c7LjpJZxTsDdNyl9zEtQExjhkVXdVJ4s-ccXEhY6Ou2Tym7DF1gENg2VDCiYlkPvLaDgpvbc8loDFpkm2CIpsiaSGFtfkJ1JN1YeqNgrLDjqmOO7zFgOWKafmKs2aDpMxlsgeipI4" alt="YARA skincare studio" className="h-full w-full object-cover" /><div className="absolute inset-x-5 bottom-5 rounded-[1.5rem] bg-white/90 p-5 backdrop-blur"><p className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-yara-wine" /> YARA Productions</p><p className="mt-2 text-xs font-light leading-5 text-yara-taupe">Colombo, Sri Lanka · Serving beautiful rituals worldwide</p></div></div>
      </div>

      <section className="mx-auto max-w-3xl py-20 sm:py-28"><div className="text-center"><p className="eyebrow">A few quick answers</p><h2 className="mt-3 text-4xl">Frequently Asked Questions</h2></div><div className="mt-8 border-t border-yara-rose">
        {[
          ["How do I choose the right YARA products?", "Start with your main skin concern and keep your ritual simple. Message us on WhatsApp for personalized guidance."],
          ["When will my order arrive?", "Orders are prepared within 1–2 business days. Delivery timing depends on your location and is confirmed after dispatch."],
          ["Are YARA products suitable for sensitive skin?", "Our formulas prioritize barrier support, but every skin is unique. Patch test new products and introduce one at a time."],
          ["Can I order directly through WhatsApp?", "Yes. Every product page and your cart include a pre-filled WhatsApp order option for easy assistance."]
        ].map(([question, answer]) => <details key={question} className="border-b border-yara-rose py-5"><summary className="cursor-pointer list-none font-serif text-lg">{question}</summary><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">{answer}</p></details>)}
      </div></section>
    </div>
  );
}
