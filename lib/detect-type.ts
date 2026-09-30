import type { ResourceType } from "@/lib/constants";

const COURSE_HOSTS = [
  "coursera.org",
  "udemy.com",
  "edx.org",
  "khanacademy.org",
  "udacity.com",
  "codecademy.com",
  "freecodecamp.org",
  "pluralsight.com",
  "skillshare.com",
  "datacamp.com",
  "brilliant.org",
  "ocw.mit.edu",
  "nptel.ac.in",
  "classroom.google.com",
];

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/**
 * Accepts what a person typed and returns a clean http/https URL,
 * or null if it is not a proper web link.
 */
export function parseHttpUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname;
  if (!host || (!host.includes(".") && host !== "localhost")) return null;
  return url;
}

/** If someone types "youtube.com/..." without https://, add it for them. */
export function addMissingProtocol(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return /^[^\s/]+\.[^\s/]+/.test(trimmed) ? `https://${trimmed}` : trimmed;
}

/** Guess the resource type from its link. The user can always override it. */
export function detectResourceType(input: string): ResourceType {
  const url = parseHttpUrl(input);
  if (!url) return "other";

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.toLowerCase();

  if (
    hostMatches(host, "youtube.com") ||
    hostMatches(host, "youtube-nocookie.com") ||
    host === "youtu.be"
  ) {
    return "youtube";
  }
  if (
    host === "github.com" ||
    host === "gist.github.com" ||
    host === "raw.githubusercontent.com"
  ) {
    return path.endsWith(".pdf") ? "pdf" : "github";
  }
  if (host === "drive.google.com" || host === "docs.google.com") {
    return "drive";
  }
  if (path.endsWith(".pdf") || (hostMatches(host, "arxiv.org") && path.startsWith("/pdf/"))) {
    return "pdf";
  }
  if (
    COURSE_HOSTS.some((domain) => hostMatches(host, domain)) ||
    (hostMatches(host, "linkedin.com") && path.startsWith("/learning")) ||
    /\/(course|courses)\//.test(path)
  ) {
    return "course";
  }
  return "website";
}
