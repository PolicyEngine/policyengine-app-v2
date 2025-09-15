import { Box, SimpleGrid, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { CardProps, SingleCard } from './SingleCard';

interface CardsContainerProps {
  containerTitle: string;
  cards: CardProps[];
}

export function CardsWithHeader({ containerTitle, cards }: CardsContainerProps) {
  return (
    <Box
      style={{
        paddingTop: spacing['2xl'],
        paddingBottom: spacing['2xl'],
        borderBottom: `1px solid ${colors.border.dark}`,
      }}
    >
      <Title
        size={typography.fontSize['4xl']}
        fw={typography.fontWeight.semibold}
        c={colors.text.title}
        mb={spacing['2xl']}
        style={{ fontFamily: typography.fontFamily.primary }}
      >
        {containerTitle}
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="3xl">
        {cards.map((card, idx) => (
          <SingleCard
            key={idx}
            title={card.title}
            description={card.description}
            onClick={card.onClick}
            icon={card.icon}
            background={card.background}
            tags={card.tags}
            footerText={card.footerText}
            image={card.image}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}
