import { useRef, useState, type CSSProperties } from 'react';
import { IconPencil } from '@tabler/icons-react';
import { Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

const COVER_TITLE_STYLE: CSSProperties = {
  margin: 0,
  maxWidth: '32ch',
  color: colors.text.inverse,
  fontSize: `clamp(${typography.fontSize['3xl']}, 3.5vw, ${spacing['4xl']})`,
  lineHeight: typography.lineHeight.tight,
  letterSpacing: '-0.035em',
};

/** The report's name in a line of its own, under a cover heading that differs from it. */
const NAME_LINE_STYLE: CSSProperties = {
  margin: 0,
  color: colors.primary[100],
  fontSize: typography.fontSize.sm,
};

const RENAME_FAILED_MESSAGE = 'Could not rename the report. Try again.';

/**
 * The name being edited: the cover title's size when the cover reads the
 * name, otherwise the size of the name's own line under the heading.
 */
function NameInput({
  value,
  large,
  disabled,
  onChange,
  onDone,
}: {
  value: string;
  large: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  /** Called once typing ends: `save` false when Escape gave the edit up. */
  onDone: (save: boolean) => void;
}) {
  // Escape blurs the field too; the blur then gives the edit up, not saves it.
  const cancelled = useRef(false);
  return (
    <input
      // Opened by the reader's click: the cursor goes straight to the name.
      autoFocus
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onFocus={(event) => event.target.select()}
      onBlur={() => {
        const save = !cancelled.current;
        cancelled.current = false;
        onDone(save);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === 'Escape') {
          cancelled.current = event.key === 'Escape';
          event.currentTarget.blur();
        }
      }}
      aria-label="Report name"
      placeholder="Name your report"
      className="tw:w-full tw:rounded-md tw:border tw:border-primary-300 tw:bg-white tw:focus:outline-none"
      style={{
        maxWidth: large ? '32ch' : '48ch',
        padding: `2px ${spacing.sm}`,
        marginLeft: `-${spacing.sm}`,
        color: colors.text.primary,
        fontFamily: typography.fontFamily.primary,
        ...(large
          ? {
              fontSize: COVER_TITLE_STYLE.fontSize,
              fontWeight: typography.fontWeight.bold,
              lineHeight: typography.lineHeight.tight,
              letterSpacing: COVER_TITLE_STYLE.letterSpacing,
            }
          : { fontSize: typography.fontSize.sm }),
      }}
    />
  );
}

/** The pencil after the name; it opens the name to typing. */
function RenameButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Rename report"
      title="Rename report"
      className="tw:inline-flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-md tw:border tw:border-transparent tw:hover:border-primary-300 tw:max-sm:size-10"
      style={{
        padding: spacing.xs,
        background: 'transparent',
        color: colors.primary[100],
      }}
    >
      <IconPencil size={18} aria-hidden />
    </button>
  );
}

/**
 * The report cover's title. Everyone reads the heading; with `onRename`
 * (the session that ran the report), the report's name also opens to
 * typing from a pencil after it. Enter or a click away saves the new name,
 * Escape gives it up, and a failed save keeps the typed name to try again.
 * The cover usually reads the name itself; when it reads something else
 * (a single Child Tax Credit change), the name sits under it to rename.
 */
export default function ReportCoverTitle({
  heading,
  name,
  onRename,
}: {
  heading: string;
  /** The report's own name, which a rename changes. */
  name: string;
  /** Saves a new name; rejects when it could not be saved. */
  onRename?: (name: string) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const coverHeading = (
    <Title order={1} style={COVER_TITLE_STYLE}>
      {heading}
    </Title>
  );
  if (!onRename) {
    return coverHeading;
  }
  const saveName = onRename;
  const headingIsName = heading === name;

  function startEditing() {
    setDraftName(name);
    setFailed(false);
    setEditing(true);
  }

  async function finishEditing(save: boolean) {
    const newName = draftName.trim();
    // Nothing to save: an empty name keeps the old one.
    if (!save || !newName || newName === name) {
      setEditing(false);
      setFailed(false);
      return;
    }
    setSaving(true);
    try {
      await saveName(newName);
      setEditing(false);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const nameInput = (
    <NameInput
      value={draftName}
      large={headingIsName}
      disabled={saving}
      onChange={setDraftName}
      onDone={(save) => void finishEditing(save)}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      {headingIsName ? (
        editing ? (
          nameInput
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
            {coverHeading}
            <RenameButton onClick={startEditing} />
          </div>
        )
      ) : (
        <>
          {coverHeading}
          {editing ? (
            nameInput
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Text style={NAME_LINE_STYLE}>Report name: {name}</Text>
              <RenameButton onClick={startEditing} />
            </div>
          )}
        </>
      )}
      {failed && (
        <Text
          role="alert"
          style={{ margin: 0, color: colors.warning, fontSize: typography.fontSize.sm }}
        >
          {RENAME_FAILED_MESSAGE}
        </Text>
      )}
    </div>
  );
}
