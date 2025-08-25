import React from "react";
import { Card, Title, Text } from "@mantine/core";


type BgColor = "white" | "green" | "gray";

interface AIJourneySectionProps {
  title: string;
  children: React.ReactNode;
  bgColor?: BgColor;
}

const backgroundColors: Record<BgColor, string> = {
  white: "#FFFFFF",
  green: "#1B4332",
  gray: "#F5F5F5",
};

export const AIJourneySection: React.FC<AIJourneySectionProps> = ({
  title,
  children,
  bgColor = "white",
}) => {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", marginBottom: "2rem" }}>
      <Title order={2} style={{ color: "#1B3A57", marginBottom: "1rem" }}>
        {title}
      </Title>

      <Card
        shadow="sm"
        radius="md"
        p="lg"
        style={{
          backgroundColor: backgroundColors[bgColor],
        }}
      >
        {children}
      </Card>
    </div>
  );
};