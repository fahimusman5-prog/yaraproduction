import { ArrowLeft, ArrowRight, CircleCheck, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

type PolicySection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const policySections: PolicySection[] = [
  { title: "1. Return Eligibility", paragraphs: ["Returns are accepted within 14 days of receiving your order.", "To qualify for a return, products must:", "Returns requested after 14 days may not be accepted."], items: ["Be unused", "Be unopened", "Be in their original packaging", "Be in the same condition they were received", "Include proof of purchase or order number"] },
  { title: "2. Hygiene & Safety Policy", paragraphs: ["For hygiene and safety reasons, opened or used cosmetic and skincare products cannot normally be returned.", "However, exceptions may be made if the product was received:", "Every request will be reviewed individually before approval."], items: ["Damaged", "Defective", "Incorrectly supplied"] },
  { title: "3. Damaged, Defective or Incorrect Products", paragraphs: ["If your order arrives damaged, defective, or incorrect, please contact YARA as soon as possible through our Contact Us page.", "Please include:"], items: ["Order number", "Product name", "Description of the issue", "Clear photos showing the product and packaging"] },
  { title: "4. How to Request a Return", paragraphs: ["To request a return:"], items: ["Contact YARA using the official Contact Us page.", "Provide your order number.", "Explain the reason for the return.", "Attach supporting photographs if required.", "Please wait for return instructions before sending any product back."] },
  { title: "5. Return Inspection", paragraphs: ["After we receive your returned item, it will be inspected to verify that it meets our return requirements.", "A refund may not be approved if:"], items: ["The product has been opened or used (unless damaged or defective)", "Original packaging is missing", "The return request falls outside the allowed period", "The returned item does not match the original order"] },
  { title: "6. Refund Processing", paragraphs: ["Once your returned item has been received and successfully inspected, your refund will be processed to the original payment method.", "Approved refunds are typically completed within 7–14 business days.", "The exact processing time may vary depending on your payment provider or bank."] },
  { title: "7. Replacements", paragraphs: ["If a product is confirmed to be damaged, defective, or incorrectly supplied, YARA may offer one of the following:"], items: ["Replacement product", "Correct item", "Refund", "Another suitable solution depending on the situation"] },
];

const sectionId = (title: string) => title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

export function RefundPolicyPage() {
  return (
    <div className="overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.95),_transparent_32%),linear-gradient(135deg,_#fff9fa_0%,_#fbe7ed_50%,_#fff8e9_100%)]">
      <section className="page-shell py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[850px]">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.13em] text-yara-wine transition hover:bg-white/70"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home</Link>
          <header className="mt-8 rounded-[2rem] border border-white/80 bg-white/65 p-6 shadow-card backdrop-blur-xl sm:mt-10 sm:rounded-[2.5rem] sm:p-10 lg:p-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl"><p className="eyebrow">Care after your order</p><h1 className="mt-4 text-balance text-4xl leading-tight sm:text-5xl lg:text-6xl">Returns &amp; Refund Policy</h1><p className="mt-5 text-sm font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">At YARA, customer satisfaction is important to us. We carefully inspect every product before dispatch. If you experience any issues with your order, this policy explains when a return or refund may be available.</p></div>
              <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-yara-rose/65 px-4 py-3 text-sm text-yara-wine"><ShieldCheck className="h-5 w-5" aria-hidden="true" /><span><span className="block text-[0.6rem] font-semibold uppercase tracking-[0.13em]">Last Updated</span>27 July 2026</span></div>
            </div>
          </header>
          <article className="mt-6 rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-card backdrop-blur-xl sm:mt-8 sm:rounded-[2.5rem] sm:p-10 lg:p-12"><div className="space-y-10 sm:space-y-12">
            {policySections.map((section) => <section key={section.title} aria-labelledby={sectionId(section.title)}><h2 id={sectionId(section.title)} className="text-2xl leading-tight text-yara-ink sm:text-3xl">{section.title}</h2><div className="mt-4 space-y-4 text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items && <ul className="grid gap-2.5 pl-1" role="list">{section.items.map((item) => <li key={item} className="flex gap-3"><CircleCheck className="mt-1.5 h-4 w-4 shrink-0 text-yara-wine" aria-hidden="true" /><span>{item}</span></li>)}</ul>}</div></section>)}
            <section aria-labelledby="related-policies"><h2 id="related-policies" className="text-2xl leading-tight text-yara-ink sm:text-3xl">Related Policies</h2><p className="mt-4 text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">Review YARA’s <Link to="/terms-and-conditions" className="font-medium text-yara-wine underline underline-offset-2">Terms and Conditions</Link> for applicable order conditions and the <Link to="/privacy-policy" className="font-medium text-yara-wine underline underline-offset-2">Privacy Policy</Link> for information about personal data.</p></section>
            <section aria-labelledby="contact-us"><h2 id="contact-us" className="text-2xl leading-tight text-yara-ink sm:text-3xl">8. Contact Us</h2><div className="mt-4 text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8"><p>For any questions regarding returns or refunds, please contact YARA using the official contact details already available on the website.</p><Link to="/contact" className="btn-secondary mt-6">Contact YARA <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></section>
          </div></article>
        </div>
      </section>
    </div>
  );
}
