import React from "react";
import { Card, Stack, Title, Text } from "@mantine/core";


type EmbedType = "youtube" | "vimeo" | "iframe" | "image";

const YOUTUBE_REGEX = /(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{6,})/;
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/;

interface EmbedProps {
  header: string;
  embedType: EmbedType;
  src: string;
  description?: string; 
  aspectRatio?: `${number} / ${number}` | number; 
  alt?: string; 
}


const fixSrc = (embedType: EmbedType, src: string) => {
  if (embedType === "youtube") {
    const link = src.match(YOUTUBE_REGEX)?.[1] ?? null;
    return link ? `https://www.youtube.com/embed/${link}` : src;
  }

  if (embedType === "vimeo") {
    const link = src.match(VIMEO_REGEX)?.[1] ?? null;
    return link ? `https://player.vimeo.com/video/${link}` : src;
  }

  return src;
};


export default function Embed({
  header,
  embedType,
  src,
  description,
  aspectRatio = "16 / 9",
  alt,
}: EmbedProps) {
  const embedSrc = fixSrc(embedType, src);

  return (
  <Card maw={960} mx="auto" padding="md" shadow="sm">
    <Stack>
      <Title order={2}>{header}</Title>
      {description && (
        <Text c="dimmed">{description}</Text>
      )}

      <div
        style={{
          position: "relative",
          aspectRatio: typeof aspectRatio === "number" ? `${aspectRatio}` : aspectRatio,
          overflow: "hidden",
          borderRadius: 12,
          background: "#00000010",
        }}
      >
        {embedType === "image" ? (
          <img
            src={src}
            alt={alt ?? header}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            loading="lazy"
          />
        ) : (
          <iframe
            title={header}
            src={embedSrc}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        )}
      </div>
    </Stack>
  </Card>
);

}

