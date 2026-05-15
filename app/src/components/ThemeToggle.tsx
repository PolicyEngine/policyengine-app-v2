import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from '@/contexts/ThemeContext';
import { colors, spacing } from '@/designTokens';

const buttonSize = 32;

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const Icon = isDark ? IconSun : IconMoon;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      onClick={toggleTheme}
      style={{
        width: buttonSize,
        height: buttonSize,
        borderRadius: spacing.radius.container,
        border: `1px solid ${colors.primary.alpha[40]}`,
        background: 'rgba(255, 255, 255, 0.1)',
        color: colors.text.inverse,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
        event.currentTarget.style.borderColor = colors.primary[300];
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        event.currentTarget.style.borderColor = colors.primary.alpha[40];
      }}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
