"use client";

import posthog from "posthog-js";

type WebsiteEventProperties = Record<string, unknown>;

function getClient() {
  return posthog;
}

export function captureWebsiteEvent(
  eventName: string,
  properties: WebsiteEventProperties = {}
) {
  getClient().capture(eventName, {
    surface: "website",
    ...properties,
  });
}

export function captureWebsiteException(
  error: unknown,
  properties: WebsiteEventProperties = {}
) {
  const normalizedError =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : "Unknown website error");

  getClient().captureException(normalizedError, {
    surface: "website",
    ...properties,
  });
}

export function trackEnterCalculatorClicked(properties: WebsiteEventProperties = {}) {
  captureWebsiteEvent("enter_calculator_clicked", properties);
}

export function trackNewsletterSignupStarted(properties: WebsiteEventProperties = {}) {
  captureWebsiteEvent("newsletter_signup_started", properties);
}

export function trackNewsletterSignupSucceeded(properties: WebsiteEventProperties = {}) {
  captureWebsiteEvent("newsletter_signup_succeeded", properties);
}

export function trackNewsletterSignupFailed(properties: WebsiteEventProperties = {}) {
  captureWebsiteEvent("newsletter_signup_failed", properties);
}

export function trackResearchArticleViewed(properties: WebsiteEventProperties = {}) {
  captureWebsiteEvent("research_article_viewed", properties);
}

export function trackResearchFiltersChanged(properties: WebsiteEventProperties = {}) {
  captureWebsiteEvent("research_filters_changed", properties);
}

export function trackCountrySwitched(properties: WebsiteEventProperties = {}) {
  captureWebsiteEvent("country_switched", properties);
}
