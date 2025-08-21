import React from "react";
import { Card, Stack, Title, Text } from "@mantine/core";

type Kind = "youtube" | "vimeo" | "iframe" | "image";

type Props = {
  header: string;
  kind: Kind;
  src: string;                 // iframe src or image src
  description?: string;        // optional text under header
  aspectRatio?: `${number} / ${number}` | number; // default 16/9
  alt?: string;                // required if kind="image"
};

const fixSrc = (kind: Kind, src: string) => {
  if (kind === "youtube") {
    const id =
      src.match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{6,})/)?.[1] ?? null;
    return id ? `https://www.youtube.com/embed/${id}` : src;
  }
  if (kind === "vimeo") {
    const id = src.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] ?? null;
    return id ? `https://player.vimeo.com/video/${id}` : src;
  }
  return src;
};

export function Embed({
  header,
  kind,
  src,
  description,
  aspectRatio = "16 / 9",
  alt,
}: Props) {
  const normalized = fixSrc(kind, src);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 6px 0" }}>{header}</h2>
      {description ? (
        <p style={{ margin: "0 0 10px 0", color: "#6b7280" }}>{description}</p>
      ) : null}

      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: typeof aspectRatio === "number" ? `${aspectRatio}` : aspectRatio,
          overflow: "hidden",
          borderRadius: 12,
          background: "#00000010",
        }}
      >
        {kind === "image" ? (
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
            src={normalized}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
    </div>
  );
}

export default Embed;
