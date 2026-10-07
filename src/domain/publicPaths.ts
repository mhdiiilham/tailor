// The landing, legal and HN Jobs pages (the list, each post and its share image), health
// check and auth endpoints are public; everything else needs a session.
const PUBLIC_PATHS = ["/", "/privacy", "/terms", "/jobs", "/api/health", "/sample-resume.pdf"];
// One job post, and the image shown when its link is shared, so a link to it opens for anyone.
const JOB_PATH = /^\/jobs\/\d+(\/opengraph-image)?$/;

export const isPublicPath = (path: string): boolean =>
  PUBLIC_PATHS.includes(path) || JOB_PATH.test(path) || path.startsWith("/api/auth");
