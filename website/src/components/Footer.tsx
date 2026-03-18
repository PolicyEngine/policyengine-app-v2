"use client";

import { useState } from "react";
import jsonp from "jsonp";
import Link from "next/link";
import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandYoutube,
  IconMail,
} from "@tabler/icons-react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";
import { useCountryId } from "@/hooks/useCountryId";

const PolicyEngineLogo = "/assets/logos/policyengine/white.svg";

const SOCIAL_LINKS = [
  {
    icon: IconMail,
    href: "mailto:hello@policyengine.org",
    label: "Email",
  },
  {
    icon: IconBrandTwitter,
    href: "https://twitter.com/ThePolicyEngine",
    label: "Twitter",
  },
  {
    icon: IconBrandFacebook,
    href: "https://www.facebook.com/PolicyEngine",
    label: "Facebook",
  },
  {
    icon: IconBrandLinkedin,
    href: "https://www.linkedin.com/company/thepolicyengine",
    label: "LinkedIn",
  },
  {
    icon: IconBrandYoutube,
    href: "https://www.youtube.com/@policyengine",
    label: "YouTube",
  },
  {
    icon: IconBrandInstagram,
    href: "https://www.instagram.com/PolicyEngine/",
    label: "Instagram",
  },
  {
    icon: IconBrandGithub,
    href: "https://github.com/PolicyEngine",
    label: "GitHub",
  },
];

function FooterSubscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!email) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const MAILCHIMP_URL =
      "https://policyengine.us5.list-manage.com/subscribe/post-json?u=e5ad35332666289a0f48013c5&id=71ed1f89d8&f_id=00f173e6f0";
    const encodedEmail = encodeURIComponent(email);

    jsonp(
      `${MAILCHIMP_URL}&EMAIL=${encodedEmail}`,
      { param: "c" },
      (error, data) => {
        if (error) {
          setStatus("error");
          setMessage(
            "There was an issue processing your subscription; please try again later.",
          );
          return;
        }
        if (data?.result !== "error") {
          setStatus("success");
          setMessage(data?.msg || "Successfully subscribed!");
          setEmail("");
        } else {
          setStatus("error");
          setMessage(data?.msg || "Subscription failed. Please try again.");
        }
      },
    );
  };

  return (
    <div style={{ paddingLeft: spacing.lg }}>
      <p
        style={{
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.inverse,
          fontFamily: typography.fontFamily.primary,
          margin: 0,
          fontSize: typography.fontSize["2xl"],
        }}
      >
        Subscribe to PolicyEngine
      </p>
      <p
        style={{
          fontSize: typography.fontSize.lg,
          color: colors.text.inverse,
          fontFamily: typography.fontFamily.primary,
          margin: `${spacing.xs} 0 0`,
        }}
      >
        Get the latest posts delivered right to your inbox.
      </p>
      <div
        style={{
          marginTop: spacing.lg,
          width: "80%",
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm,
        }}
      >
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          style={{
            height: "44px",
            padding: "0 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "14px",
            fontFamily: typography.fontFamily.primary,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={status === "loading"}
          style={{
            height: "44px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: colors.primary[500],
            color: colors.text.inverse,
            fontWeight: typography.fontWeight.semibold,
            fontSize: "14px",
            fontFamily: typography.fontFamily.primary,
            letterSpacing: "0.05em",
            cursor: status === "loading" ? "wait" : "pointer",
            width: "100%",
          }}
        >
          {status === "loading" ? "Subscribing..." : "SUBSCRIBE"}
        </button>
        {message && (
          <p
            style={{
              fontSize: typography.fontSize.sm,
              textAlign: "center",
              fontFamily: typography.fontFamily.primary,
              margin: 0,
              color: status === "success" ? "#68D391" : "#FC8181",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Footer() {
  const countryId = useCountryId();

  const contactLinks = [
    { href: `/${countryId}/team`, text: "About us" },
    { href: `/${countryId}/donate`, text: "Donate" },
    { href: `/${countryId}/privacy`, text: "Privacy policy" },
    { href: `/${countryId}/terms`, text: "Terms and conditions" },
  ];

  return (
    <footer
      data-testid="site-footer"
      style={{
        width: "100%",
        padding: `${spacing["4xl"]} ${spacing["5xl"]}`,
        background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <img
          src={PolicyEngineLogo}
          alt="PolicyEngine"
          style={{ height: "52px", width: "auto" }}
        />

        <div
          style={{
            display: "grid",
            marginTop: spacing["2xl"],
            gap: spacing["4xl"],
          }}
          className="grid-cols-1 md:grid-cols-2"
        >
          {/* Left column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing["2xl"],
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing.xs,
              }}
            >
              {contactLinks.map(({ href, text }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    color: colors.text.inverse,
                    fontSize: "16px",
                    textDecoration: "none",
                    fontFamily: typography.fontFamily.primary,
                  }}
                >
                  {text}
                </Link>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing.md,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    style={{ color: colors.text.inverse }}
                  >
                    <Icon size={24} />
                  </a>
                ))}
              </div>
              <p
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.inverse,
                  margin: 0,
                  fontFamily: typography.fontFamily.primary,
                }}
              >
                &copy; {new Date().getFullYear()} PolicyEngine. All rights
                reserved.
              </p>
            </div>
          </div>

          {/* Right column */}
          <FooterSubscribe />
        </div>
      </div>
    </footer>
  );
}
