"use client";

import { motion } from "framer-motion";
const CALCULATOR_URL =
  process.env.NEXT_PUBLIC_CALCULATOR_URL || "https://app.policyengine.org";
const CHAT_URL = "https://policyengine-uk-chat.vercel.app/";
import {
  colors,
  spacing,
  typography,
} from "@/designTokens";

const ctaVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      type: "spring" as const,
      stiffness: 80,
      damping: 18,
    },
  },
};

const buttonBase = {
  display: "inline-block",
  padding: `${spacing.lg} ${spacing["3xl"]}`,
  borderRadius: 40,
  fontFamily: typography.fontFamily.primary,
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.lg,
  textDecoration: "none",
  transition: "box-shadow 0.3s ease",
} as const;

export default function HeroCTA({ countryId }: { countryId: string }) {
  return (
    <motion.div
      variants={ctaVariant}
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: spacing.md,
      }}
    >
      <motion.a
        href={`${CALCULATOR_URL}/${countryId}/reports`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        style={{
          ...buttonBase,
          background: colors.primary[500],
          color: colors.white,
          boxShadow: `0 2px 12px ${colors.primary.alpha[40]}`,
        }}
      >
        Enter PolicyEngine
      </motion.a>

      {countryId === "uk" && (
        <motion.a
          href={CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          style={{
            ...buttonBase,
            background: colors.secondary[800],
            color: colors.white,
            boxShadow: `0 2px 12px ${colors.shadow.medium}`,
          }}
        >
          Try the AI chatbot
        </motion.a>
      )}
    </motion.div>
  );
}
