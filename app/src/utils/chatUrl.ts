/**
 * Shared URL builder for embedding policyengine-uk-chat.
 *
 * Used by the report-page ChatDrawer. The standalone chat is served through
 * the /uk/chat multizone route instead of an iframe.
 */

const CHAT_ORIGIN =
  process.env.NEXT_PUBLIC_UK_CHAT_ORIGIN || 'https://policyengine-uk-chat.vercel.app';
const CHAT_BASE_URL = `${CHAT_ORIGIN.replace(/\/$/, '')}/uk/chat`;

// Vercel "Protection Bypass for Automation" secret — only needed when the
// iframe targets a protected preview deployment. Production chat is public,
// so this is empty there and the param is omitted.
const CHAT_BYPASS_TOKEN = process.env.NEXT_PUBLIC_UK_CHAT_BYPASS_TOKEN || '';

interface BuildChatUrlOptions {
  /** Optional report-derived context. Forwarded as a system-prompt seed. */
  scenarioContext?: string;
}

export function buildChatUrl({ scenarioContext }: BuildChatUrlOptions = {}): string {
  const params = new URLSearchParams();
  if (scenarioContext) {
    params.set('scenario_context', scenarioContext);
  }
  // model_backend=uk_python so the chat runs against the same Python engine
  // app-v2's reports use — needed for chat numbers to be comparable to the
  // report numbers the user is looking at.
  params.set('model_backend', 'uk_python');
  if (CHAT_BYPASS_TOKEN) {
    params.set('x-vercel-protection-bypass', CHAT_BYPASS_TOKEN);
    // samesitenone is required so the cookie Vercel sets is sent on
    // cross-origin iframe requests in modern browsers (Lax/Strict won't be).
    params.set('x-vercel-set-bypass-cookie', 'samesitenone');
  }
  return `${CHAT_BASE_URL.replace(/\/$/, '')}?${params.toString()}`;
}

/** Permissions the iframe needs to match the chat's standalone behaviour. */
export const CHAT_IFRAME_SANDBOX =
  'allow-scripts allow-same-origin allow-forms allow-popups allow-clipboard-read allow-clipboard-write';
