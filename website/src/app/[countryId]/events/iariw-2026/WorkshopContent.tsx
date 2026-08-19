import HeroSection from "@/components/static/HeroSection";
import { Container } from "@/components/ui/Container";
import OptimisedImage from "@/components/ui/OptimisedImage";
import { colors, spacing, typography } from "@/designTokens";

export const REGISTRATION_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfpfDAGrAeAD4yG1aupgZnJ6VecBGZIaCHqWuVCYRXxuEDWeA/viewform";

const ASSETS = "/assets/events/iariw-2026";

const program: { time: string; title: string; detail?: string }[] = [
  { time: "13:00", title: "Coffee and welcome" },
  {
    time: "13:30–15:30",
    title: "Talks with live demos",
    detail:
      "Microsimulation as public infrastructure: BEAMM's open platform for Belgium (Tom Truyts, CAPE). Open models and simulation-ready microdata for the US and UK, and from models to executable law: encoding and certifying policy rules (Max Ghenis, PolicyEngine).",
  },
  { time: "15:30–16:00", title: "Coffee break" },
  {
    time: "16:00–17:00",
    title:
      "Roundtable: AI and new technologies for open, evidence-based policy making",
    detail:
      "With Koen Algoed (Director General, Budget and Finance Department, Flemish Region), Jean-Baptiste Traversa (Head of microsimulation modelling, Federal Public Service Finance), Tom Truyts and Max Ghenis.",
  },
  { time: "17:00", title: "Walk together to the IARIW reception" },
];

const hosts = [
  {
    src: `${ASSETS}/cape.png`,
    alt: "CAPE, Center for Applied Public Economics",
    href: "https://cape-saintlouis.be",
    height: 56,
  },
  {
    src: `${ASSETS}/beamm.png`,
    alt: "BEAMM, the Belgian tax-benefit microsimulation model",
    href: "https://beamm.brussels",
    height: 40,
  },
  {
    src: `${ASSETS}/uclouvain-saint-louis.jpg`,
    alt: "UCLouvain Saint-Louis Bruxelles",
    href: "https://uclouvain.be/fr/sites/saint-louis-bruxelles",
    height: 56,
  },
  {
    src: "/assets/logos/policyengine/teal.svg",
    alt: "PolicyEngine",
    href: "https://policyengine.org",
    height: 36,
  },
];

const h2Style = {
  fontFamily: typography.fontFamily.primary,
  fontSize: "1.5rem",
  fontWeight: 600,
  color: colors.primary[800],
  marginBottom: spacing.lg,
} as const;

const bodyStyle = {
  fontFamily: typography.fontFamily.primary,
  color: colors.text.primary,
  lineHeight: 1.6,
} as const;

const mutedStyle = { ...bodyStyle, color: colors.text.secondary } as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: spacing["3xl"] }}>
      <h2 style={h2Style}>{title}</h2>
      {children}
    </section>
  );
}

export default function WorkshopContent() {
  return (
    <>
      <HeroSection
        title="New technologies for evidence-based policy making"
        description={
          <>
            A free half-day workshop on open microsimulation, simulation-ready
            microdata, and executable law, co-hosted by CAPE (UCLouvain
            Saint-Louis) and PolicyEngine alongside the 39th IARIW General
            Conference. Thursday 27 August 2026, 13:00–17:00, Brussels.
          </>
        }
      />

      <Container size="lg" className="tw:py-xl">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: spacing.lg,
            padding: spacing.xl,
            marginBottom: spacing["3xl"],
            backgroundColor: colors.background.secondary,
            border: `1px solid ${colors.border.light}`,
            borderRadius: "8px",
            ...bodyStyle,
          }}
        >
          <div>
            <div style={mutedStyle}>When</div>
            <div style={{ fontWeight: 600 }}>Thursday 27 August 2026</div>
            <div>13:00–17:00</div>
          </div>
          <div>
            <div style={mutedStyle}>Where</div>
            <div style={{ fontWeight: 600 }}>
              UCLouvain Saint-Louis, Room P02
            </div>
            <div>Brussels, 10 minutes from the National Bank</div>
          </div>
          <div>
            <div style={mutedStyle}>Cost</div>
            <div style={{ fontWeight: 600 }}>Free</div>
            <div>No IARIW registration needed</div>
          </div>
          <div>
            <div style={mutedStyle}>Format</div>
            <div style={{ fontWeight: 600 }}>Talks, live demos, roundtable</div>
            <div>
              Everything runs in the browser; follow along on a laptop if you
              like
            </div>
          </div>
        </div>

        <Section title="Program">
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {program.map((item) => (
              <li
                key={item.time}
                className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-[120px_minmax(0,1fr)]"
                style={{
                  gap: spacing.lg,
                  padding: `${spacing.md} 0`,
                  borderTop: `1px solid ${colors.border.light}`,
                  ...bodyStyle,
                }}
              >
                <span
                  style={{ ...mutedStyle, fontVariantNumeric: "tabular-nums" }}
                >
                  {item.time}
                </span>
                <span>
                  <span style={{ fontWeight: 600 }}>{item.title}</span>
                  {item.detail && (
                    <span
                      style={{
                        display: "block",
                        marginTop: spacing.xs,
                        ...mutedStyle,
                      }}
                    >
                      {item.detail}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
          <p style={{ ...mutedStyle, marginTop: spacing.lg }}>
            The conference program has no sessions on Thursday afternoon, and
            the IARIW reception begins at 17:30. The final program goes to
            registrants by email.
          </p>
        </Section>

        <Section title="Register">
          <p style={{ ...bodyStyle, marginBottom: spacing.lg }}>
            Registration is free and helps us plan the room and the coffee. If
            the form does not load below,{" "}
            <a
              href={REGISTRATION_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: colors.primary[600], fontWeight: 600 }}
            >
              open it in a new tab
            </a>
            .
          </p>
          <iframe
            src={`${REGISTRATION_FORM_URL}?embedded=true`}
            title="Workshop registration form"
            width="100%"
            height="1500"
            style={{
              border: `1px solid ${colors.border.light}`,
              borderRadius: "8px",
              background: colors.white,
            }}
          >
            Loading…
          </iframe>
        </Section>

        <Section title="Venue and access">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: spacing.xl,
              alignItems: "start",
            }}
          >
            <div style={bodyStyle}>
              <p style={{ marginBottom: spacing.md }}>
                <strong>UCLouvain Saint-Louis Bruxelles, Room P02.</strong>{" "}
                Enter through the car park at Rue des Marais 119, then the
                &ldquo;Préfecture&rdquo; door at the back right of the car park.
                The room is immediately on the right.
              </p>
              <p style={{ marginBottom: spacing.md }}>
                About ten minutes on foot from the National Bank of Belgium (Rue
                Montagne aux Herbes Potagères 61), where the IARIW sessions take
                place.
              </p>
              <p style={mutedStyle}>
                Questions:{" "}
                <a
                  href="mailto:max@policyengine.org"
                  style={{ color: colors.primary[600] }}
                >
                  max@policyengine.org
                </a>
              </p>
            </div>
            <OptimisedImage
              src={`${ASSETS}/campus-map.png`}
              width={536}
              alt="Campus map showing the Rue des Marais 119 car park entrance and Room P02"
              style={{
                width: "100%",
                height: "auto",
                border: `1px solid ${colors.border.light}`,
                borderRadius: "8px",
              }}
            />
          </div>
        </Section>

        <Section title="Co-hosts">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: spacing["2xl"],
              padding: `${spacing.lg} 0`,
            }}
          >
            {hosts.map((h) => (
              <a
                key={h.alt}
                href={h.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={h.alt}
              >
                <OptimisedImage
                  src={h.src}
                  alt={h.alt}
                  width={320}
                  style={{ height: h.height, width: "auto" }}
                />
              </a>
            ))}
          </div>
          <p style={mutedStyle}>
            Held alongside the{" "}
            <a
              href="https://iariw.org/39th-iariw-general-conference/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: colors.primary[600] }}
            >
              39th IARIW General Conference
            </a>{" "}
            at the National Bank of Belgium, 24–28 August 2026.
          </p>
        </Section>
      </Container>
    </>
  );
}
