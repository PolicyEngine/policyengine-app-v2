interface IframeContentProps {
  url: string;
}

export default function IframeContent({ url }: IframeContentProps) {
  return (
    <iframe
      src={url}
      style={{
        width: '100%',
        height: 'calc(100vh - var(--header-height, 58px))',
        border: 'none',
        display: 'block',
      }}
      title="Embedded content"
    />
  );
}
