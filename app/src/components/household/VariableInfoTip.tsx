import { useRef, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui';
import { colors } from '@/designTokens';

/**
 * A small "i" beside a variable's name: first the period its amount covers
 * ("Per year"), then what the variable is, from the country model's
 * description. It opens on hover, on keyboard focus and on a click or a
 * tap (a tooltip alone does not open on a phone), and a second click,
 * Escape or a click elsewhere closes it. With neither, it shows nothing.
 */
export default function VariableInfoTip({
  label,
  period,
  description,
}: {
  /** The variable's name as the reader sees it, e.g. "Employment income". */
  label: string;
  /** The period the amount covers, e.g. "Per year": what a reader most needs to know. */
  period?: string | null;
  description?: string | null;
}) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const text = description?.trim();
  if (!text && !period) {
    return null;
  }
  const open = hovered || pinned;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setHovered(false);
          setPinned(false);
        }
      }}
    >
      <PopoverAnchor asChild>
        <button
          ref={button}
          type="button"
          aria-label={`About ${label}`}
          aria-expanded={open}
          onClick={() => {
            // A mouse hovers before it clicks: the first click keeps the tip
            // open, the second closes it.
            setPinned(!pinned);
            if (pinned) {
              setHovered(false);
            }
          }}
          onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
          onPointerLeave={(event) => event.pointerType === 'mouse' && setHovered(false)}
          onFocus={(event) => {
            // Keyboard focus only: a click focuses the button too, and pins it.
            if (event.currentTarget.matches?.(':focus-visible')) {
              setHovered(true);
            }
          }}
          onBlur={() => setHovered(false)}
          className="tw:inline-flex tw:shrink-0 tw:items-center tw:justify-center tw:cursor-help tw:rounded-full tw:border-0 tw:bg-transparent tw:p-0 tw:align-middle tw:focus-visible:outline-2 tw:focus-visible:outline-offset-1"
          style={{ color: colors.text.tertiary, width: 16, height: 16 }}
        >
          <IconInfoCircle size={14} aria-hidden />
        </button>
      </PopoverAnchor>
      <PopoverContent
        side="top"
        role="tooltip"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // The button toggles it; a click on the button is not a click elsewhere.
        onInteractOutside={(event) => {
          if (button.current?.contains(event.target as Node)) {
            event.preventDefault();
          }
        }}
        className="tw:w-auto tw:max-w-72 tw:px-3 tw:py-2 tw:text-xs tw:font-normal tw:leading-snug tw:text-left tw:whitespace-normal"
      >
        {period && <span className="tw:block tw:font-semibold">{period}</span>}
        {text && <span className={period ? 'tw:mt-1 tw:block' : 'tw:block'}>{text}</span>}
      </PopoverContent>
    </Popover>
  );
}
