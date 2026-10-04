export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Same naming as the /tailored skill: <company>_<name>_cv.pdf
export function resumeFileName(company: string, personName: string, ext: "pdf" | "typ"): string {
  return `${slugify(company) || "company"}_${slugify(personName).replace(/-/g, "")}_cv.${ext}`;
}
