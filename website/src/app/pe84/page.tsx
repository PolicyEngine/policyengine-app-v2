import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PE-84 — The graphing microsimulator",
  description:
    "Introducing the PE-84. Ten million households per second. Fifty thousand tax and benefit parameters. In your pocket.",
};

export default function PE84Page() {
  return (
    <iframe
      src="https://april-fools-2026-two.vercel.app/calculator"
      title="PE-84 — The graphing microsimulator"
      style={{
        width: "100%",
        height: "calc(100vh - 58px)",
        border: "none",
      }}
    />
  );
}
