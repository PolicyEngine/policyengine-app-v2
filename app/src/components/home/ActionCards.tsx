import { useState } from 'react';
import { IconArrowRight, IconCalculator, IconChartBar } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Container, Group, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function ActionCards() {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const cards = [
    {
      id: 'reports',
      title: 'Enter PolicyEngine',
      description: 'Create and analyze policy simulations',
      icon: IconChartBar,
      route: `/${countryId}/reports`,
      color: colors.primary[600],
    },
    {
      id: 'calculator',
      title: 'Quick Calculator',
      description: 'Calculate tax and benefit impacts',
      icon: IconCalculator,
      route: `/${countryId}/calculator`,
      color: colors.blue[600],
    },
  ];

  return (
    <Container size="xl" pb={spacing['5xl']}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <Group
          justify="center"
          gap={spacing['2xl']}
          style={{
            flexWrap: 'wrap',
          }}
        >
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isHovered = hoveredCard === card.id;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.15, duration: 0.6 }}
                whileHover={{ y: -8 }}
                onHoverStart={() => setHoveredCard(card.id)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <Card
                  shadow="sm"
                  p={spacing['2xl']}
                  radius={spacing.radius.lg}
                  onClick={() => navigate(card.route)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    background: isHovered
                      ? `linear-gradient(135deg, ${card.color}15, ${card.color}08)`
                      : 'rgba(255, 255, 255, 0.7)',
                    borderColor: isHovered ? card.color : colors.primary[300],
                    borderWidth: 2,
                    borderStyle: 'solid',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    minWidth: '280px',
                    boxShadow: isHovered
                      ? `0 20px 40px ${card.color}20, 0 0 0 1px ${card.color}30`
                      : `0 4px 12px ${colors.shadow.light}`,
                    overflow: 'hidden',
                  }}
                >
                  {/* Animated gradient overlay */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(90deg, ${card.color}, ${colors.primary[400]})`,
                      transformOrigin: 'left',
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />

                  <Group gap={spacing.lg} wrap="nowrap">
                    <Box
                      style={{
                        padding: spacing.md,
                        borderRadius: spacing.radius.md,
                        background: `${card.color}15`,
                        transition: 'transform 0.3s ease',
                        transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
                      }}
                    >
                      <Icon size={32} color={card.color} strokeWidth={2} />
                    </Box>

                    <Box style={{ flex: 1 }}>
                      <Text
                        fw={typography.fontWeight.bold}
                        c={colors.text.primary}
                        size="xl"
                        style={{
                          fontFamily: typography.fontFamily.primary,
                          marginBottom: spacing.xs,
                        }}
                      >
                        {card.title}
                      </Text>
                      <Text
                        size={typography.fontSize.sm}
                        c={colors.text.secondary}
                        style={{
                          fontFamily: typography.fontFamily.body,
                        }}
                      >
                        {card.description}
                      </Text>
                    </Box>

                    <motion.div
                      animate={{
                        x: isHovered ? 5 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <IconArrowRight
                        size={24}
                        color={isHovered ? card.color : colors.gray[400]}
                        style={{
                          transition: 'color 0.3s ease',
                        }}
                      />
                    </motion.div>
                  </Group>
                </Card>
              </motion.div>
            );
          })}
        </Group>
      </motion.div>
    </Container>
  );
}
