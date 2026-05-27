/**
 * Chat.page — full-page chat surface.
 *
 * Alternative positioning of policyengine-uk-chat: the user comes here
 * directly (no report) and asks a question. Complements ChatDrawer, which
 * is the supplement positioning (drawer attached to a report). Both surfaces
 * share buildChatUrl() so the bypass-token / model_backend plumbing stays
 * in one place.
 *
 * Reachable at /:countryId/chat — registered in both CalculatorRouter (Vite
 * legacy build) and calculator-app/src/app/[countryId]/(calculator)/chat/
 * (Next.js production build). The CTA that points here is UK-gated; the
 * chat backend doesn't model US policy yet.
 */
import { Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { buildChatUrl, CHAT_IFRAME_SANDBOX } from '@/utils/chatUrl';

export default function ChatPage() {
  return (
    <div className="tw:flex tw:flex-col tw:h-full tw:min-h-0">
      <div style={{ marginBottom: spacing.lg }}>
        <Title
          order={1}
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.title,
            marginBottom: spacing.sm,
          }}
        >
          Ask PolicyEngine
        </Title>
        <Text size="md" style={{ color: colors.text.secondary, maxWidth: '600px' }}>
          Ask a policy question in plain English. The assistant runs a UK microsimulation behind the
          scenes and shows its working.
        </Text>
      </div>

      <div
        className="tw:flex-1 tw:min-h-0"
        style={{
          borderRadius: spacing.radius.container,
          border: `1px solid ${colors.border.light}`,
          overflow: 'hidden',
        }}
      >
        <iframe
          src={buildChatUrl()}
          title="PolicyEngine chat"
          className="tw:w-full tw:h-full tw:border-0 tw:block"
          sandbox={CHAT_IFRAME_SANDBOX}
        />
      </div>
    </div>
  );
}
