import { Facebook, Instagram, type LucideProps } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

const footerWhatsAppMessage = "Hello YARA, I visited your website and would like to know more about your products.";
const configuredFacebookUrl = process.env.NEXT_PUBLIC_YARA_FACEBOOK_URL?.trim();

const isVerifiedFacebookUrl = (value: string | undefined) => {
  if (!value) return false;

  try {
    const url = new URL(value);
    const isFacebookHost = ["facebook.com", "www.facebook.com"].includes(url.hostname.toLowerCase());
    return url.protocol === "https:" && isFacebookHost && url.pathname !== "/";
  } catch {
    return false;
  }
};

type Icon = ComponentType<LucideProps | SVGProps<SVGSVGElement>>;

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M20.5 11.7a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.4-4.4A8.4 8.4 0 1 1 20.5 11.7Z" /><path d="M8.6 7.8c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.5l.7 1.7c.1.3.1.5 0 .7l-.5.7c.6 1.1 1.5 2 2.6 2.6l.7-.5c.2-.1.4-.1.7 0l1.7.7c.4.1.5.3.5.5v.5c0 .3 0 .6-.5.8-.5.2-1.5.4-2.5 0-1.1-.4-2.4-1.3-3.4-2.3s-1.9-2.3-2.3-3.4c-.4-1-.2-2 0-2.5Z" /></svg>;
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M14 4v9.2a3.2 3.2 0 1 1-2.4-3.1" /><path d="M14 4c.8 2.4 2.3 3.7 4.5 4" /></svg>;
}

export const footerSocialLinks: Array<{
  name: string;
  href?: string;
  icon: Icon;
  ariaLabel: string;
}> = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/yaraproduction1/",
    icon: Instagram,
    ariaLabel: "Visit YARA on Instagram",
  },
  {
    name: "WhatsApp",
    href: `https://wa.me/94741266855?text=${encodeURIComponent(footerWhatsAppMessage)}`,
    icon: WhatsAppIcon,
    ariaLabel: "Chat with YARA on WhatsApp",
  },
  {
    name: "Facebook",
    href: isVerifiedFacebookUrl(configuredFacebookUrl) ? configuredFacebookUrl : undefined,
    icon: Facebook,
    ariaLabel: "Visit YARA on Facebook",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@yaraproduction1",
    icon: TikTokIcon,
    ariaLabel: "Visit YARA on TikTok",
  },
];
