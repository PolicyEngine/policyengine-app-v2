import { MAX_STORE_NAME_LENGTH } from '@/libs/flagship/storeText';

/** The name its owner gives a report after running it. */
export const RENAMED_REPORT_TITLE = 'Child Tax Credit to $3,000';

/** The same name typed with spaces around it; it is saved trimmed. */
export const UNTRIMMED_RENAMED_REPORT_TITLE = `  ${RENAMED_REPORT_TITLE}  `;

/** A name of spaces only, which a rename refuses. */
export const BLANK_REPORT_TITLE = '   ';

/** A name longer than the Public API accepts. */
export const OVERLONG_REPORT_TITLE = 'A'.repeat(MAX_STORE_NAME_LENGTH + 20);

/** What a rename saves for OVERLONG_REPORT_TITLE: shortened, with an ellipsis. */
export const CLAMPED_REPORT_TITLE = `${'A'.repeat(MAX_STORE_NAME_LENGTH - 1)}…`;
