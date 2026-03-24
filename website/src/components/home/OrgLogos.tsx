"use client";

import { useEffect, useState } from "react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";
import { getOrgsForCountry, type Organization } from "@/data/organizations";

const LOGO_WIDTH = 140;
const LOGO_GAP = 64;

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function LogoItem({ org }: { org: Organization }) {
  return (
    <a
      href={org.link}
      target="_blank"
      rel="noopener noreferrer"
      title={org.name}
      style={{
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${LOGO_WIDTH}px`,
        height: "80px",
        opacity: 0.7,
        transition: "opacity 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.7";
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={org.logo.src}
        alt={org.name}
        style={{
          maxWidth: `${LOGO_WIDTH}px`,
          maxHeight: "70px",
          width: "auto",
          height: "auto",
        }}
      />
    </a>
  );
}

export default function OrgLogos({ countryId }: { countryId: string }) {
  const [orgs, setOrgs] = useState<Organization[]>(() =>
    getOrgsForCountry(countryId),
  );

  useEffect(() => {
    setOrgs(shuffle(getOrgsForCountry(countryId)));
  }, [countryId]);

  if (orgs.length === 0) return null;

  const setWidth = orgs.length * (LOGO_WIDTH + LOGO_GAP);
  const duration = setWidth / 40;

  return (
    <div style={{ marginTop: spacing["4xl"], marginBottom: spacing["4xl"] }}>
      <p
        style={{
          textAlign: "center",
          marginBottom: spacing.xl,
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.lg,
          color: colors.primary[600],
          fontWeight: typography.fontWeight.medium,
        }}
      >
        {countryId === "us"
          ? "Trusted by researchers, governments, and benefit platforms"
          : "Trusted by researchers and policy organisations"}
      </p>

      <div
        style={{
          width: "100%",
          overflow: "hidden",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        <div
          className="org-logos-track"
          style={{
            display: "flex",
            gap: `${LOGO_GAP}px`,
            width: "max-content",
            animation: `marquee ${duration}s linear infinite`,
          }}
        >
          {orgs.map((org, i) => (
            <LogoItem key={`a-${i}`} org={org} />
          ))}
          {orgs.map((org, i) => (
            <LogoItem key={`b-${i}`} org={org} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${setWidth}px); }
        }
        .org-logos-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
