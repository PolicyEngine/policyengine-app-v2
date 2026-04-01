import { colors, typography } from "@policyengine/design-system/tokens";

export default function PE84Banner() {
  return (
    <a
      href="/pe84"
      style={{
        display: "block",
        background: colors.primary[700],
        color: "white",
        textAlign: "center",
        padding: "10px 16px",
        fontFamily: typography.fontFamily.primary,
        fontSize: 14,
        fontWeight: 500,
        textDecoration: "none",
        letterSpacing: "0.02em",
      }}
    >
      Introducing the PE-84 — The graphing microsimulator.{" "}
      <span style={{ textDecoration: "underline", fontWeight: 600 }}>
        Learn more &rarr;
      </span>
    </a>
  );
}
