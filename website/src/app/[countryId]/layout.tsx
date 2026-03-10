import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const VALID_COUNTRIES = ["us", "uk", "ca", "ng", "il"];

export default async function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  if (!VALID_COUNTRIES.includes(countryId)) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
