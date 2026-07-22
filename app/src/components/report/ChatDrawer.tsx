/**
 * ChatDrawer — slide-out panel that embeds policyengine-uk-chat as an iframe,
 * seeded with the report scenario the user is currently viewing.
 *
 * The chat reads `?scenario_context=` from its URL and forwards it to its
 * /chat/message backend, so the assistant knows what the user just saw
 * without us having to copy/parse report data into a structured payload.
 */
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { buildChatUrl, CHAT_IFRAME_SANDBOX } from '@/utils/chatUrl';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Plain-English summary of the scenario + headline figures. Forwarded
   *  to the chat as system-prompt context. */
  scenarioContext: string;
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
            src={buildChatUrl({ scenarioContext })}
            title="PolicyEngine chat"
            className="tw:flex-1 tw:w-full tw:border-0"
            sandbox={CHAT_IFRAME_SANDBOX}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
