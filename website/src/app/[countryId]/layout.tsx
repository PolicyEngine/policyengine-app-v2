import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { VALID_COUNTRIES } from "@/lib/countries";

export function generateStaticParams() {
  return VALID_COUNTRIES.map((countryId) => ({ countryId }));
}

export default async function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  if (!(VALID_COUNTRIES as readonly string[]).includes(countryId)) {
    notFound();
  }

  return (
    <div className="tw:min-h-screen tw:flex tw:flex-col">
      <Header />
      <main className="tw:flex-1">{children}</main>
      <Footer />
    </div>
  );
}
