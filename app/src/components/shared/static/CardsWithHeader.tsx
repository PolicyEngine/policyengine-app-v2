import { Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { CardProps, SingleCard } from './SingleCard';

interface CardsContainerProps {
  containerTitle: string;
  cards: CardProps[];
}

export function CardsWithHeader({ containerTitle, cards }: CardsContainerProps) {
  return (
    <div
      style={{
        paddingLeft: spacing.container.xl,
        paddingRight: spacing.container.xl,
        paddingTop: spacing['2xl'],
        paddingBottom: spacing['2xl'],
      }}
    >
      <Title
        order={2}
        style={{
          fontSize: typography.fontSize['4xl'],
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.title,
          marginBottom: spacing['2xl'],
          fontFamily: typography.fontFamily.primary,
        }}
      >
        {containerTitle}
      </Title>

      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:md:grid-cols-3 tw:gap-8">
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
      </div>
    </div>
  );
}
