import Header from "@/components/Header";

export default function PE84Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tw:min-h-screen tw:flex tw:flex-col">
      <Header />
      <main className="tw:flex-1">{children}</main>
    </div>
  );
}
