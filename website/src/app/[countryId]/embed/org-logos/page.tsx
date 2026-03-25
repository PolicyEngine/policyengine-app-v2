import OrgLogos from "@/components/home/OrgLogos";

export default async function OrgLogosEmbedPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
        minHeight: "100vh",
        padding: 0,
        margin: 0,
      }}
    >
      <OrgLogos countryId={countryId} />
    </div>
  );
}
