import { ArrowLeft, ArrowRight, CircleCheck, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

type PolicySection = { title: string; paragraphs?: string[]; items?: string[] };

function PolicyPage({ eyebrow, title, introduction, sections }: { eyebrow: string; title: string; introduction: string; sections: PolicySection[] }) {
  return (
    <div className="overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.95),_transparent_32%),linear-gradient(135deg,_#fff9fa_0%,_#fbe7ed_50%,_#fff8e9_100%)]">
      <section className="page-shell py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[850px]">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.13em] text-yara-wine transition hover:bg-white/70"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to home</Link>
          <header className="mt-8 rounded-[2rem] border border-white/80 bg-white/65 p-6 shadow-card backdrop-blur-xl sm:mt-10 sm:rounded-[2.5rem] sm:p-10 lg:p-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl"><p className="eyebrow">{eyebrow}</p><h1 className="mt-4 text-balance text-4xl leading-tight sm:text-5xl lg:text-6xl">{title}</h1><p className="mt-5 text-sm font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">{introduction}</p></div>
              <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-yara-rose/65 px-4 py-3 text-sm text-yara-wine"><ShieldCheck className="h-5 w-5" aria-hidden="true" /><span><span className="block text-[0.6rem] font-semibold uppercase tracking-[0.13em]">Last Updated</span>29 July 2026</span></div>
            </div>
          </header>
          <article className="mt-6 rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-card backdrop-blur-xl sm:mt-8 sm:rounded-[2.5rem] sm:p-10 lg:p-12">
            <div className="space-y-10 sm:space-y-12">
              {sections.map((section) => {
                const id = section.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
                return <section key={section.title} aria-labelledby={id}><h2 id={id} className="text-2xl leading-tight text-yara-ink sm:text-3xl">{section.title}</h2><div className="mt-4 space-y-4 text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items && <ul className="grid gap-2.5 pl-1" role="list">{section.items.map((item) => <li key={item} className="flex gap-3"><CircleCheck className="mt-1.5 h-4 w-4 shrink-0 text-yara-wine" aria-hidden="true" /><span>{item}</span></li>)}</ul>}</div></section>;
              })}
              <section aria-labelledby="policy-contact"><h2 id="policy-contact" className="text-2xl leading-tight text-yara-ink sm:text-3xl">Contact YARA</h2><p className="mt-4 text-[0.95rem] font-light leading-7 text-yara-taupe sm:text-base sm:leading-8">Contact YARA before returning an item or if you need clarification about an order, delivery, cancellation, or payment.</p><Link to="/contact" className="btn-secondary mt-6">Contact YARA <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></section>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

export function ShippingPolicyPage() {
  return <PolicyPage eyebrow="Delivery information" title="Shipping & Delivery Policy" introduction="Delivery availability, timing, and charges depend on the destination and the delivery option confirmed during checkout." sections={[
    { title: "1. Delivery Destinations", paragraphs: ["YARA currently supports orders for Sri Lanka and the United Arab Emirates where a valid delivery method is offered at checkout."] },
    { title: "2. Delivery Charges", paragraphs: ["Any delivery charge must be displayed in the order summary before an order is submitted. YARA will not silently add an undisclosed delivery fee after checkout."] },
    { title: "3. Dispatch and Delivery Estimates", paragraphs: ["Delivery estimates begin after an order is confirmed and are estimates rather than guarantees. Public holidays, address issues, courier disruption, customs, and events outside YARA’s reasonable control may affect delivery."] },
    { title: "4. Customer Responsibilities", items: ["Provide a complete and accurate address and reachable phone number.", "Review delivery details before submitting the order.", "Respond to reasonable courier contact or delivery attempts."] },
    { title: "5. Damaged, Missing, or Incorrect Deliveries", paragraphs: ["Contact YARA promptly with the order number and clear evidence if a parcel is damaged, incomplete, or incorrect. The Returns & Refund Policy applies to eligible remedies."] },
  ]} />;
}

export function CancellationPolicyPage() {
  return <PolicyPage eyebrow="Order changes" title="Cancellation Policy" introduction="YARA will try to accommodate cancellation requests before an order enters fulfilment, but cancellation is not guaranteed after processing or dispatch begins." sections={[
    { title: "1. Requesting Cancellation", paragraphs: ["Contact YARA as soon as possible with the order number. A request is accepted only after YARA confirms it."] },
    { title: "2. Orders Already in Fulfilment", paragraphs: ["Orders that have been packed, shipped, delivered, personalised, or otherwise committed to fulfilment may no longer be cancellable. Eligible post-delivery concerns are handled under the Returns & Refund Policy."] },
    { title: "3. Refunds After Cancellation", paragraphs: ["If an eligible prepaid order is cancelled, any approved refund is returned to the original payment method. Provider and bank processing times may apply."] },
    { title: "4. YARA-Initiated Cancellation", paragraphs: ["YARA may cancel an order where stock is unavailable, customer details cannot be verified, fraud is suspected, payment is not confirmed, or fulfilment is not reasonably possible. The customer will be informed using the contact details supplied."] },
  ]} />;
}

export function PaymentPolicyPage() {
  return <PolicyPage eyebrow="Secure checkout" title="Payment Policy" introduction="Available payment methods are shown at checkout. Online payment methods remain unavailable until YARA’s approved provider credentials and verification are enabled." sections={[
    { title: "1. Payment Availability", paragraphs: ["A payment method is available only when it is visibly enabled at checkout. Disabled methods cannot be used and are not treated as successful."] },
    { title: "2. Online Payment Processing", paragraphs: ["Online payments are processed by the selected payment provider. YARA does not store complete card numbers or card security codes."] },
    { title: "3. Payment Confirmation", paragraphs: ["An order is not considered paid until YARA receives verified provider confirmation. A browser return page alone is not proof of payment."] },
    { title: "4. Pending, Failed, or Cancelled Payments", paragraphs: ["Pending payments remain unconfirmed until a verified status is received. Failed or cancelled attempts do not create a paid order. Contact YARA before retrying if an amount appears to have been charged."] },
    { title: "5. Refunds", paragraphs: ["Approved refunds are returned to the original payment method where possible and are subject to the Returns & Refund Policy and provider processing times."] },
  ]} />;
}

export function CookiePolicyPage() {
  return <PolicyPage eyebrow="Website preferences" title="Cookie Policy" introduction="YARA uses essential browser storage and may use optional analytics only when configured and permitted." sections={[
    { title: "1. Essential Storage", paragraphs: ["Essential storage supports the shopping cart, selected country, language, security, authentication, and checkout continuity. Disabling it may prevent core website functions from working."] },
    { title: "2. Analytics and Marketing", paragraphs: ["Analytics or marketing technologies must be environment-configured and should not be activated before applicable consent requirements are satisfied."] },
    { title: "3. Your Choices", paragraphs: ["You can remove or block browser storage using browser settings. Essential functions may need to store a limited amount of data to provide the service you request."] },
  ]} />;
}
