"use client";

import type { Properties } from "posthog-js";
import posthog from "posthog-js";

type WebsiteWindow = Window & {
  __policyenginePostHogInitialized?: boolean;
};

type WebsiteProperties = Properties & {
  release?: string;
  surface?: "website";
};

function isPostHogReady() {
  return (
    typeof window !== "undefined" &&
    Boolean((window as WebsiteWindow).__policyenginePostHogInitialized)
  );
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : "Unknown website error");
}

export function captureWebsiteEvent(
  eventName: string,
  properties: WebsiteProperties = {},
) {
  if (!isPostHogReady()) {
    return;
  }

  posthog.capture(eventName, {
    surface: "website",
    ...properties,
  });
}

export function captureWebsiteException(
  error: unknown,
  properties: WebsiteProperties = {},
) {
  if (!isPostHogReady()) {
    return;
  }

  posthog.captureException(normalizeError(error), {
    surface: "website",
    ...properties,
  });
}

export function trackEnterCalculatorClicked(properties: {
  country_id: string;
  destination_url: string;
}) {
  captureWebsiteEvent("enter_calculator_clicked", properties);
}

export function trackNewsletterSignupStarted(properties: {
  has_email: boolean;
}) {
  captureWebsiteEvent("newsletter_signup_started", properties);
}

export function trackNewsletterSignupSucceeded(properties: {
  has_email: boolean;
}) {
  captureWebsiteEvent("newsletter_signup_succeeded", properties);
}

export function trackNewsletterSignupFailed(properties: {
  has_email: boolean;
  reason: string;
}) {
  captureWebsiteEvent("newsletter_signup_failed", properties);
}

export function trackResearchArticleViewed(properties: {
  country_id: string;
  slug: string;
  title: string;
  author_count: number;
  topic_tags: string[];
  location_tags: string[];
  is_notebook: boolean;
}) {
  captureWebsiteEvent("research_article_viewed", properties);
}

export function trackResearchFiltersChanged(properties: {
  country_id: string;
  search_query: string;
  selected_types: string[];
  selected_topics: string[];
  selected_locations: string[];
  selected_authors: string[];
  result_count: number;
}) {
  captureWebsiteEvent("research_filters_changed", properties);
}

export function trackCountrySwitched(properties: {
  from_country_id: string;
  to_country_id: string;
  pathname: string;
}) {
  captureWebsiteEvent("country_switched", properties);
}
