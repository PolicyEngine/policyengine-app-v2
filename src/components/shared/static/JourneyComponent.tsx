import React from "react";
import { Card, Title, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";


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
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div
      style={{
        width: "100%",
        maxWidth: isMobile ? "95%" : "800px",
        margin: "0 auto",
        marginBottom: "2rem",
        padding: isMobile ? "0 1rem" : "0", 
      }}
    >
      <Title
        order={2}
        style={{
          color: "#1B3A57",
          marginBottom: "1rem",
          fontSize: isMobile ? "1.5rem" : "2rem", 
          textAlign: isMobile ? "center" : "left", 
        }}
      >
        {title}
      </Title>

      <Card
        shadow="sm"
        radius="md"
        p={isMobile ? "md" : "lg"} 
        style={{
          backgroundColor: backgroundColors[bgColor],
        }}
      >
        {children}
      </Card>
    </div>
  );
};

export default function AIJourneyDemo() {
  return (
    <AIJourneySection title="PolicyEngine: A Journey Through AI" bgColor="gray">
      <div style={{ marginBottom: "1.5rem" }}>
        <Title order={4} style={{ color: "#1B3A57", marginBottom: "0.5rem" }}>
          Machine learning foundations: 2021–2022
        </Title>
        <Text size="md" color="dark">
          PolicyEngine pioneered the use of machine learning to enhance microsimulation models, applying gradient descent...
        </Text>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <Title order={4} style={{ color: "#1B3A57", marginBottom: "0.5rem" }}>
          Data science innovation: 2023
        </Title>
        <Text size="md" color="dark">
          We expanded our AI capabilities in 2023 with the Enhanced Current Population Survey (ECPS)...
        </Text>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <Title order={4} style={{ color: "#1B3A57", marginBottom: "0.5rem" }}>
          AI-Powered Analysis: 2023–Present
        </Title>
        <Text size="md" color="dark">
          When OpenAI released GPT-4, we immediately recognized its potential to democratize policy understanding...
        </Text>
      </div>
    </AIJourneySection>
  );
}
