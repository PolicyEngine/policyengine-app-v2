import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

export interface LegalSection {
  heading: string;
  content: React.ReactNode;
}

export interface LegalPageLayoutProps {
  title: string;
  sections: LegalSection[];
}

export default function LegalPageLayout({
  title,
  sections,
}: LegalPageLayoutProps) {
  return (
    <div
      style={{
        paddingTop: spacing["4xl"],
        paddingBottom: spacing["4xl"],
        backgroundColor: colors.white,
        paddingLeft: "6.125%",
        paddingRight: "6.125%",
      }}
    >
      <div style={{ maxWidth: "768px" }}>
        <h1
          style={{
            fontSize: typography.fontSize["4xl"],
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.primary,
            marginTop: 0,
            marginBottom: spacing["3xl"],
          }}
        >
          {title}
        </h1>

        {sections.map((section, index) => (
          <div key={index} style={{ marginBottom: spacing["2xl"] }}>
            <h2
              style={{
                fontSize: typography.fontSize["2xl"],
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamily.primary,
                color: colors.text.primary,
                marginTop: 0,
                marginBottom: spacing.lg,
              }}
            >
              {section.heading}
            </h2>

            <div className="legal-content">
              <style>{`
                .legal-content p {
                  font-size: ${typography.fontSize.base};
                  line-height: ${typography.lineHeight.relaxed};
                  font-family: ${typography.fontFamily.body};
                  color: ${colors.text.secondary};
                  margin-bottom: ${spacing.md};
                  margin-top: 0;
                }
                .legal-content p:last-child {
                  margin-bottom: 0;
                }
                .legal-content strong,
                .legal-content b {
                  font-weight: ${typography.fontWeight.semibold};
                  color: ${colors.text.primary};
                }
                .legal-content a {
                  color: ${colors.primary[600]};
                  text-decoration: underline;
                }
                .legal-content a:hover {
                  color: ${colors.primary[700]};
                }
                .legal-content ul,
                .legal-content ol {
                  margin-bottom: ${spacing.md};
                  margin-top: ${spacing.sm};
                  padding-left: ${spacing.xl};
                }
                .legal-content li {
                  margin-bottom: ${spacing.xs};
                }
              `}</style>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
