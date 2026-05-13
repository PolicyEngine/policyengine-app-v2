/**
 * ChatDrawer — slide-out panel that embeds policyengine-uk-chat as an iframe,
 * seeded with the report scenario the user is currently viewing.
 *
 * The chat reads `?scenario_context=` from its URL and forwards it to its
 * /chat/message backend, so the assistant knows what the user just saw
 * without us having to copy/parse report data into a structured payload.
 */
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Plain-English summary of the scenario + headline figures. Forwarded
   *  to the chat as system-prompt context. */
  scenarioContext: string;
}

const CHAT_ORIGIN =
  import.meta.env.VITE_UK_CHAT_ORIGIN || 'https://policyengine-uk-chat.vercel.app';

function buildChatUrl(scenarioContext: string): string {
  const params = new URLSearchParams({ scenario_context: scenarioContext });
  // model_backend=uk_python so the chat runs against the same Python engine
  // app-v2's reports use — needed for chat numbers to be comparable to the
  // report numbers the user is looking at.
  params.set('model_backend', 'uk_python');
  return `${CHAT_ORIGIN}/?${params.toString()}`;
}

export function ChatDrawer({ open, onOpenChange, scenarioContext }: ChatDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="tw:!max-w-none tw:w-full tw:sm:w-[480px] tw:md:w-[560px] tw:lg:w-[640px] tw:p-0"
      >
        <SheetHeader className="tw:px-4 tw:py-3 tw:border-b">
          <SheetTitle>Ask a follow-up</SheetTitle>
        </SheetHeader>
        {open && (
          <iframe
            src={buildChatUrl(scenarioContext)}
            title="PolicyEngine chat"
            className="tw:flex-1 tw:w-full tw:border-0"
            // The chat needs the same permissions it has standalone:
            // forms (for sign-in if the user wants to), scripts (everything
            // is JS), same-origin (so SSE/streaming works), clipboard for
            // copy buttons. No top-navigation — keep navigation here.
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-clipboard-read allow-clipboard-write"
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
