export default async function HomePage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  return (
    <div>
      <h1>PolicyEngine {countryId.toUpperCase()}</h1>
    </div>
  );
}
