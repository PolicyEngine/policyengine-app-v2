interface CodeBlockProps {
  title: string;
  content: string;
  maxHeight?: string;
}

/**
 * Reusable code block for displaying formatted code/JSON content
 */
export function CodeBlock({ title, content, maxHeight = '185px' }: CodeBlockProps) {
  return (
    <div>
      <p className="tw:text-sm tw:font-medium tw:mb-xs">
        {title}
      </p>
      <code
        className="tw:block tw:bg-gray-100 tw:px-sm tw:py-sm tw:rounded-md tw:text-xs tw:font-mono"
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight,
          overflow: 'auto',
          fontSize: '11px',
        }}
      >
        {content}
      </code>
    </div>
  );
}
