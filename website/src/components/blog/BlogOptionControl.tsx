"use client";

/**
 * The labelled option control shared by the blog's chart and household
 * blocks: a small uppercase label above either a segmented button group (a
 * radio group, for two to four short options that fit one row on a phone)
 * or a native drop-down with a custom chevron (for anything longer).
 *
 * Hover and focus states are Tailwind classes, as inline styles cannot carry
 * them; nothing that changes on hover or focus is also set inline. Colors
 * meet WCAG AA: the gray-500 boundary is 4.8:1 on white (3:1 needed), the
 * gray-600 label 7.6:1, white on the primary-600 choice 5.4:1, and the focus
 * ring is the solid primary color.
 */

import { useId, useRef, type KeyboardEvent } from "react";

export interface BlogOption {
  value: string;
  label: string;
}

export type BlogOptionForm = "segmented" | "select";

/** The narrowest content column the group must fit in one row, in px. */
const PHONE_ROW = 343;
/** About the mean advance of a 14px Inter character, in px. */
const CHAR_WIDTH = 7.5;
/** A button's horizontal padding (12px a side). */
const BUTTON_PADDING = 24;
/** The gap between buttons, and the track's padding and border. */
const BUTTON_GAP = 4;
const TRACK_INSET = 6;

/**
 * Which form suits a list of option labels: a segmented group for two to
 * four whose buttons fit one row at phone width, else a drop-down. Pass the
 * full, stable list, so a control keeps its form while its options vary.
 */
export function optionControlForm(labels: string[]): BlogOptionForm {
  if (labels.length < 2 || labels.length > 4) return "select";
  const width =
    labels.reduce((sum, l) => sum + l.length * CHAR_WIDTH + BUTTON_PADDING, 0) +
    BUTTON_GAP * (labels.length - 1) +
    TRACK_INSET;
  return width <= PHONE_ROW ? "segmented" : "select";
}

const LABEL_CLASS =
  "tw:block tw:mb-1 tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-600";

const FOCUS_RING =
  "tw:outline-none tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-primary";

const SELECT_CLASS = [
  "tw:block tw:w-full tw:min-w-0 tw:appearance-none tw:truncate tw:cursor-pointer",
  "tw:rounded-md tw:border tw:border-gray-500 tw:bg-background",
  "tw:py-1.5 tw:pl-3 tw:pr-9 tw:text-sm tw:leading-5 tw:text-foreground",
  "tw:transition-colors tw:hover:border-gray-700 tw:hover:bg-gray-50",
  FOCUS_RING,
].join(" ");

const TRACK_CLASS =
  "tw:flex tw:w-full tw:sm:inline-flex tw:sm:w-auto tw:gap-1 tw:rounded-md tw:border tw:border-gray-500 tw:bg-gray-50 tw:p-0.5";

const BUTTON_BASE = [
  "tw:flex-1 tw:sm:flex-none tw:cursor-pointer tw:whitespace-nowrap tw:rounded",
  "tw:px-3 tw:py-1 tw:text-sm tw:leading-5 tw:font-medium tw:transition-colors",
  FOCUS_RING,
].join(" ");

const BUTTON_ON = "tw:bg-primary tw:text-primary-foreground tw:shadow-sm";
const BUTTON_OFF =
  "tw:bg-transparent tw:text-gray-700 tw:hover:bg-background tw:hover:text-foreground";

interface BlogOptionControlProps {
  label: string;
  options: BlogOption[];
  value: string;
  onChange: (value: string) => void;
  /** Overrides the form chosen from `options`. */
  form?: BlogOptionForm;
  className?: string;
}

export function BlogOptionControl({
  label,
  options,
  value,
  onChange,
  form,
  className,
}: BlogOptionControlProps) {
  const id = useId();
  const chosen = form ?? optionControlForm(options.map((o) => o.label));
  return (
    <div
      className={["tw:min-w-0", className].filter(Boolean).join(" ")}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {chosen === "segmented" ? (
        <Segmented
          id={id}
          label={label}
          options={options}
          value={value}
          onChange={onChange}
        />
      ) : (
        <>
          <label htmlFor={id} className={LABEL_CLASS}>
            {label}
          </label>
          <div className="tw:relative">
            <select
              id={id}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className={SELECT_CLASS}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              width={16}
              height={16}
              className="tw:pointer-events-none tw:absolute tw:right-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-600"
            >
              <path
                d="M4 6l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * A radio group of buttons with a roving tab stop: Tab reaches the chosen
 * button, and the arrow keys, Home and End move the choice and the focus,
 * wrapping at the ends.
 */
function Segmented({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: BlogOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const move = (index: number) => {
    const n = options.length;
    const next = ((index % n) + n) % n;
    onChange(options[next].value);
    buttons.current[next]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const target = {
      ArrowRight: current + 1,
      ArrowDown: current + 1,
      ArrowLeft: current - 1,
      ArrowUp: current - 1,
      Home: 0,
      End: options.length - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    move(target);
  };
  return (
    <>
      <span id={`${id}-label`} className={LABEL_CLASS}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        className={TRACK_CLASS}
      >
        {options.map((o, i) => {
          const on = i === current;
          return (
            <button
              key={o.value}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(o.value)}
              onKeyDown={onKeyDown}
              className={`${BUTTON_BASE} ${on ? BUTTON_ON : BUTTON_OFF}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
