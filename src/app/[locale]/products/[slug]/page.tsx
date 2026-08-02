import { permanentRedirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  permanentRedirect(`/${locale}/product/${slug}`);
}
