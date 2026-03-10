import { notFound } from "next/navigation";

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
      <header data-testid="site-header">
        {/* Header will be ported from app/src/components/shared/HomeHeader.tsx */}
        <nav>PolicyEngine</nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer data-testid="site-footer">
        {/* Footer will be ported from app/src/components/Footer.tsx */}
      </footer>
    </div>
  );
}
