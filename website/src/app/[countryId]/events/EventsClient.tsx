"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HeroSection from "@/components/static/HeroSection";
import OptimisedImage from "@/components/ui/OptimisedImage";
import { Container } from "@/components/ui/Container";
import { Text } from "@/components/ui/Text";
import eventsData from "@/data/events.json";
import { colors, spacing, typography } from "@/designTokens";

type EventType =
  | "webinar"
  | "talk"
  | "conference"
  | "panel"
  | "podcast"
  | "workshop";

interface PolicyEngineEvent {
  /** Event title */
  title: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Kind of engagement */
  type: EventType;
  /** Physical location or "Virtual" */
  location: string;
  /** Hosting organization (e.g. "National Tax Association") */
  host: string;
  /** Short description shown on the card */
  description?: string;
  /** URL to recording (video) */
  recordingUrl?: string;
  /** URL to slides (PDF or deck) */
  slidesUrl?: string;
  /** Registration URL for upcoming events (Zoom, Eventbrite, etc.) */
  registrationUrl?: string;
  /** Generic event page URL (used if no recording/slides) */
  url?: string;
  /** Image filename in public/assets/events/ */
  image?: string;
  /** Tags for filtering (country + topic) */
  tags: string[];
  /** Pin featured upcoming events to the top of the Upcoming list */
  featured?: boolean;
}

const locationLabels: Record<string, string> = {
  all: "All",
  us: "US",
  uk: "UK",
  ca: "Canada",
  global: "Global",
};

const typeLabels: Record<EventType, string> = {
  webinar: "Webinar",
  talk: "Talk",
  conference: "Conference",
  panel: "Panel",
  podcast: "Podcast",
  workshop: "Workshop",
};

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function startOfTodayUTC(): number {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  ).getTime();
}

function eventTimestamp(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getTime();
}

function TypePill({ type }: { type: EventType }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: `2px ${spacing.sm}`,
        borderRadius: "999px",
        backgroundColor: colors.primary[50],
        color: colors.primary[700],
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontFamily: typography.fontFamily.primary,
      }}
    >
      {typeLabels[type] ?? type}
    </span>
  );
}

function EventLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        color: colors.primary[600],
        fontWeight: 600,
        fontSize: "13px",
        textDecoration: "none",
        fontFamily: typography.fontFamily.primary,
      }}
      className="tw:hover:underline"
    >
      {label} →
    </a>
  );
}

// Slides are designed for ~1280px viewports, so we render the iframe at that
// virtual width and scale it down to fit the card thumbnail with `transform`.
const SLIDE_VIRTUAL_WIDTH = 1280;
const SLIDE_VIRTUAL_HEIGHT = 720;

function NavArrow({ direction }: { direction: "right" }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "50%",
        [direction]: "10px",
        transform: "translateY(-50%)",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "18px",
        fontWeight: 600,
        lineHeight: 1,
        pointerEvents: "none",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        userSelect: "none",
      }}
    >
      ›
    </div>
  );
}

function SlidesPreview({
  src,
  title,
  interactive,
}: {
  src: string;
  title: string;
  interactive: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SLIDE_VIRTUAL_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        backgroundColor: colors.gray[900],
        overflow: "hidden",
        position: "relative",
      }}
    >
      <iframe
        src={src}
        title={`Slides preview — ${title}`}
        loading="lazy"
        scrolling="no"
        tabIndex={-1}
        aria-hidden={interactive ? undefined : true}
        onLoad={() => setLoaded(true)}
        style={{
          width: `${SLIDE_VIRTUAL_WIDTH}px`,
          height: `${SLIDE_VIRTUAL_HEIGHT}px`,
          border: "none",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: interactive ? "auto" : "none",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
      {/* Shimmer skeleton while iframe loads */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: loaded ? 0 : 1,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
          background: `linear-gradient(110deg, ${colors.gray[800]} 30%, ${colors.gray[700]} 50%, ${colors.gray[800]} 70%)`,
          backgroundSize: "200% 100%",
          animation: "pe-events-shimmer 1.4s linear infinite",
        }}
      />
      {/* Forward arrow hint — only visible when interactive (hovered).
          Google Slides advances on click anywhere in the embed, so a single
          forward arrow accurately telegraphs that behavior. pointer-events:
          none lets the click pass through to the iframe. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: interactive && loaded ? 1 : 0,
          transition: "opacity 0.2s ease",
          pointerEvents: "none",
        }}
      >
        <NavArrow direction="right" />
      </div>
    </div>
  );
}

function youtubeVideoId(url: string): string | null {
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]+)/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

function VideoPreview({
  recordingUrl,
  thumbnail,
  host,
  title,
  active,
}: {
  recordingUrl: string;
  thumbnail?: string;
  host: string;
  title: string;
  active: boolean;
}) {
  const videoId = youtubeVideoId(recordingUrl);

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        backgroundColor: colors.gray[100],
        overflow: "hidden",
        position: "relative",
      }}
    >
      {thumbnail ? (
        <OptimisedImage
          src={`/assets/events/${thumbnail}`}
          alt={`${title} — ${host}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.style.display = "flex";
              parent.style.alignItems = "center";
              parent.style.justifyContent = "center";
              parent.style.padding = "24px";
              parent.innerHTML = `<span style="color: ${colors.gray[400]}; font-family: ${typography.fontFamily.primary}; font-size: 18px; font-weight: 600; text-align: center;">${host}</span>`;
            }
          }}
        />
      ) : null}
      {/* Play badge — only when not actively previewing */}
      {!active && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(0,0,0,0.35) 100%)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "rgba(0,0,0,0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                width: 0,
                height: 0,
                borderTop: "10px solid transparent",
                borderBottom: "10px solid transparent",
                borderLeft: "16px solid white",
                marginLeft: "4px",
              }}
            />
          </div>
        </div>
      )}
      {/* YouTube embed — only mounted when active, unmounted on leave to stop playback */}
      {active && videoId && (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`}
          title={`${title} recording`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      )}
    </div>
  );
}

function EventCardInner({
  event,
  interactive,
  hovered,
}: {
  event: PolicyEngineEvent;
  interactive: boolean;
  hovered: boolean;
}) {
  const hasVideo = !!event.recordingUrl && !!youtubeVideoId(event.recordingUrl);

  return (
    <div
      style={{
        borderRadius: spacing.radius.container,
        overflow: "hidden",
        border: `1px solid ${hovered ? colors.primary[300] : colors.border.light}`,
        transition:
          "box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease",
        cursor: interactive ? "pointer" : "default",
        backgroundColor: colors.white,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transformOrigin: "center center",
        // Modest scale + translateZ to force GPU compositing layer.
        // Larger scales blur text via bitmap interpolation; 1.18 keeps text
        // readable while still giving a visible "pop out" feel.
        transform: hovered
          ? "scale(1.18) translateZ(0)"
          : "scale(1) translateZ(0)",
        boxShadow: hovered
          ? "0 20px 50px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.12)"
          : "none",
        willChange: interactive ? "transform" : "auto",
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {hasVideo && event.recordingUrl ? (
        <VideoPreview
          recordingUrl={event.recordingUrl}
          thumbnail={event.image}
          host={event.host}
          title={event.title}
          active={hovered}
        />
      ) : event.image ? (
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundColor: colors.gray[100],
            overflow: "hidden",
          }}
        >
          <OptimisedImage
            src={`/assets/events/${event.image}`}
            alt={`${event.title} — ${event.host}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.style.display = "flex";
                parent.style.alignItems = "center";
                parent.style.justifyContent = "center";
                parent.style.padding = "24px";
                parent.innerHTML = `<span style="color: ${colors.gray[400]}; font-family: ${typography.fontFamily.primary}; font-size: 18px; font-weight: 600; text-align: center;">${event.host}</span>`;
              }
            }}
          />
        </div>
      ) : event.slidesUrl ? (
        <SlidesPreview
          src={event.slidesUrl}
          title={event.title}
          interactive={hovered}
        />
      ) : null}
      <div
        style={{
          padding: spacing.lg,
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: spacing.sm,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <TypePill type={event.type} />
          <Text
            size="xs"
            style={{
              color: colors.primary[600],
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {event.host}
          </Text>
        </div>
        <Text
          size="md"
          style={{
            color: colors.gray[800],
            fontWeight: 600,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {event.title}
        </Text>
        {event.description ? (
          <Text
            size="sm"
            style={{
              color: colors.gray[600],
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event.description}
          </Text>
        ) : null}
        <Text size="xs" style={{ color: colors.gray[500] }}>
          {formatDate(event.date)} · {event.location}
        </Text>
        {(event.recordingUrl || event.slidesUrl) && (
          <div
            style={{
              display: "flex",
              gap: spacing.lg,
              marginTop: "auto",
              paddingTop: spacing.sm,
            }}
          >
            {event.recordingUrl ? (
              <EventLink href={event.recordingUrl} label="Recording" />
            ) : null}
            {event.slidesUrl ? (
              <EventLink href={event.slidesUrl} label="Slides" />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: PolicyEngineEvent }) {
  const [hovered, setHovered] = useState(false);
  const primaryHref =
    event.recordingUrl || event.url || event.slidesUrl || undefined;

  // The outer wrapper keeps the grid cell at its natural size while the inner
  // card scales on hover (transform doesn't affect layout). z-index lifts the
  // hovered card above its siblings.
  const wrapperStyle: React.CSSProperties = {
    height: "100%",
    position: "relative",
    zIndex: hovered ? 50 : 1,
  };

  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  };

  if (primaryHref) {
    return (
      <div style={wrapperStyle} {...handlers}>
        <a
          href={primaryHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: "none",
            color: "inherit",
            height: "100%",
            display: "block",
          }}
        >
          <EventCardInner event={event} interactive hovered={hovered} />
        </a>
      </div>
    );
  }

  return (
    <div style={wrapperStyle} {...handlers}>
      <EventCardInner event={event} interactive={false} hovered={hovered} />
    </div>
  );
}

function LocationFilter({
  selected,
  onChange,
  options,
}: {
  selected: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: spacing.xs,
        flexWrap: "wrap",
      }}
    >
      {options.map((option) => {
        const isActive = selected === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: "999px",
              border: `1px solid ${isActive ? colors.primary[500] : colors.border.light}`,
              backgroundColor: isActive ? colors.primary[500] : colors.white,
              color: isActive ? colors.white : colors.gray[600],
              fontSize: "14px",
              fontFamily: typography.fontFamily.primary,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {locationLabels[option] || option}
          </button>
        );
      })}
    </div>
  );
}

function EventGrid({ events }: { events: PolicyEngineEvent[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: spacing["2xl"],
      }}
    >
      {events.map((event, i) => (
        <EventCard
          key={`event-${event.date}-${event.title}-${i}`}
          event={event}
        />
      ))}
    </div>
  );
}

function FeaturedHero({ event }: { event: PolicyEngineEvent }) {
  // Registration takes priority for upcoming events; fall back to whatever
  // other link is most actionable.
  const primaryHref =
    event.registrationUrl ||
    event.url ||
    event.recordingUrl ||
    event.slidesUrl ||
    undefined;
  const primaryLabel = event.registrationUrl
    ? "Register"
    : event.url
      ? "Open tool"
      : event.recordingUrl
        ? "Watch live"
        : event.slidesUrl
          ? "View slides"
          : "Learn more";
  // Secondary CTA: show the tool/page link alongside the register button when
  // both exist, so users who can't attend can still explore the artifact.
  const secondaryHref =
    event.registrationUrl && event.url ? event.url : undefined;
  const secondaryLabel = secondaryHref ? "Open tool" : undefined;

  const dateObj = new Date(`${event.date}T00:00:00`);
  const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" });
  const dayNumber = dateObj.getDate();
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const fullDate = formatDate(event.date);

  return (
    <a
      href={primaryHref}
      target={primaryHref ? "_blank" : undefined}
      rel={primaryHref ? "noopener noreferrer" : undefined}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        borderRadius: spacing.radius.container,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${colors.primary[800]} 0%, ${colors.primary[600]} 100%)`,
        boxShadow:
          "0 10px 30px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        marginBottom: spacing["2xl"],
      }}
      className="tw:hover:shadow-2xl tw:hover:-translate-y-0.5"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: spacing["2xl"],
          padding: spacing["3xl"],
          alignItems: "center",
        }}
        className="tw:max-md:grid-cols-1"
      >
        {/* Left: info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing.md,
            color: colors.white,
            minWidth: 0,
          }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              padding: `4px ${spacing.md}`,
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(8px)",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: colors.white,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            Upcoming · {typeLabels[event.type] ?? event.type}
          </span>
          <Text
            size="xl"
            style={{
              color: colors.white,
              fontWeight: 700,
              lineHeight: 1.2,
              fontSize: "clamp(24px, 3vw, 32px)",
            }}
          >
            {event.title}
          </Text>
          {event.description ? (
            <Text
              size="md"
              style={{
                color: "rgba(255, 255, 255, 0.85)",
                lineHeight: 1.55,
                maxWidth: "640px",
              }}
            >
              {event.description}
            </Text>
          ) : null}
          <Text
            size="sm"
            style={{
              color: "rgba(255, 255, 255, 0.75)",
              fontWeight: 500,
            }}
          >
            {event.host} · {event.location}
          </Text>
          {primaryHref ? (
            <div
              style={{
                marginTop: spacing.sm,
                display: "flex",
                gap: spacing.lg,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  padding: `${spacing.sm} ${spacing.xl}`,
                  borderRadius: "999px",
                  backgroundColor: colors.white,
                  color: colors.primary[700],
                  fontWeight: 600,
                  fontSize: "15px",
                  fontFamily: typography.fontFamily.primary,
                  textDecoration: "none",
                  transition: "transform 0.15s ease",
                }}
              >
                {primaryLabel} →
              </span>
              {secondaryHref && secondaryLabel ? (
                <a
                  href={secondaryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: colors.white,
                    fontWeight: 500,
                    fontSize: "14px",
                    fontFamily: typography.fontFamily.primary,
                    textDecoration: "none",
                    opacity: 0.85,
                  }}
                  className="tw:hover:underline"
                >
                  {secondaryLabel} →
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Right: date block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: `${spacing.lg} ${spacing["2xl"]}`,
            borderRadius: spacing.radius.container,
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(8px)",
            minWidth: "180px",
            color: colors.white,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              opacity: 0.85,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {monthShort}
          </span>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 700,
              lineHeight: 1,
              marginTop: "4px",
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {dayNumber}
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              opacity: 0.85,
              marginTop: spacing.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {weekday}
          </span>
          <span
            style={{
              fontSize: "11px",
              opacity: 0.65,
              marginTop: "2px",
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {fullDate.split(",")[1]?.trim() /* year */}
          </span>
        </div>
      </div>
    </a>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      size="lg"
      style={{
        fontWeight: 600,
        color: colors.gray[800],
        marginBottom: spacing.xl,
      }}
    >
      {children}
    </Text>
  );
}

export default function EventsClient({ countryId }: { countryId: string }) {
  const [locationFilter, setLocationFilter] = useState(countryId);

  const events = eventsData as PolicyEngineEvent[];

  const locationOptions = useMemo(() => {
    const countryTags = new Set<string>();
    for (const e of events) {
      for (const tag of e.tags) {
        if (["us", "uk", "ca", "global"].includes(tag)) {
          countryTags.add(tag);
        }
      }
    }
    return [
      "all",
      ...["us", "uk", "ca", "global"].filter((t) => countryTags.has(t)),
    ];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (locationFilter === "all") {
      return events;
    }
    return events.filter(
      (e) => e.tags.includes(locationFilter) || e.tags.includes("global"),
    );
  }, [events, locationFilter]);

  const { upcoming, past } = useMemo(() => {
    const today = startOfTodayUTC();
    const up: PolicyEngineEvent[] = [];
    const pa: PolicyEngineEvent[] = [];
    for (const e of filteredEvents) {
      if (eventTimestamp(e.date) >= today) {
        up.push(e);
      } else {
        pa.push(e);
      }
    }
    up.sort((a, b) => {
      // Featured upcoming events first, then soonest date first
      if (!!a.featured !== !!b.featured) {
        return a.featured ? -1 : 1;
      }
      return eventTimestamp(a.date) - eventTimestamp(b.date);
    });
    pa.sort((a, b) => eventTimestamp(b.date) - eventTimestamp(a.date));
    return { upcoming: up, past: pa };
  }, [filteredEvents]);

  const upcomingFeatured = upcoming.filter((e) => e.featured);
  const upcomingRest = upcoming.filter((e) => !e.featured);

  return (
    <div>
      {/* Shimmer keyframes for slide-iframe loading skeleton */}
      <style>{`
        @keyframes pe-events-shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
      `}</style>

      <HeroSection
        title="Events"
        description="Webinars, talks, and conference appearances from the PolicyEngine team."
      />

      <Container size="xl" className="tw:py-xl">
        {events.length > 0 && (
          <div style={{ marginBottom: spacing.xl }}>
            <LocationFilter
              selected={locationFilter}
              onChange={setLocationFilter}
              options={locationOptions}
            />
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div
            className="tw:text-center"
            style={{
              padding: spacing["3xl"],
              backgroundColor: colors.gray[50],
              borderRadius: spacing.radius.container,
            }}
          >
            <Text style={{ color: colors.gray[500] }}>
              No events scheduled yet — check back soon.
            </Text>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section style={{ marginBottom: spacing["3xl"] }}>
                <SectionHeading>Upcoming</SectionHeading>
                {upcomingFeatured.map((event, i) => (
                  <FeaturedHero
                    key={`featured-${event.date}-${event.title}-${i}`}
                    event={event}
                  />
                ))}
                {upcomingRest.length > 0 && <EventGrid events={upcomingRest} />}
              </section>
            )}

            {past.length > 0 && (
              <section>
                <SectionHeading>Past events</SectionHeading>
                <EventGrid events={past} />
              </section>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
