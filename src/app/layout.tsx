import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { NavLinks } from "@/components/navLinks";
import { SUPPORT_URL, SupportButton } from "@/components/supportButton";
import { UserMenu } from "@/components/userMenu";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, siteUrl } from "./seo/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

// Read per request (every page is dynamic), so the same image works on any domain.
// No canonical or og:url here: public pages set their own, and a default would point every page at "/".
export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
    twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  };
}

// Matches the page background, so the mobile browser bar blends into the header.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
  ],
};

// The wordmark already links home, so "Applications" is dropped on small screens to keep one line.
const nav = [
  { href: "/", label: "Applications", wide: true },
  { href: "/new", label: "New" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="flex min-h-[100dvh] flex-col font-sans">
        <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
            {/* The berry lockup is for light surfaces; the white one is for dark mode. */}
            <Link href="/" aria-label="Tailor home" className="shrink-0">
              <Image
                src="/brand/tailor-horizontal.svg"
                alt="Tailor"
                width={140}
                height={42}
                priority
                className="dark:hidden"
              />
              <Image
                src="/brand/tailor-horizontal-white.svg"
                alt="Tailor"
                width={140}
                height={42}
                priority
                className="hidden dark:block"
              />
            </Link>
            {user ? (
              <div className="flex min-w-0 items-center gap-1 md:gap-3">
                <NavLinks items={nav} />
                <UserMenu name={user.name} image={user.image} />
              </div>
            ) : (
              <nav className="flex items-center gap-1 text-sm">
                <Link href="/#how" className="hidden rounded-ui px-3 py-1.5 text-muted hover:text-ink sm:block">
                  How it works
                </Link>
                <Link href="/#security" className="hidden rounded-ui px-3 py-1.5 text-muted hover:text-ink sm:block">
                  Security
                </Link>
                <Link
                  href="/#signin"
                  className="rounded-ui border border-line px-3 py-1.5 text-ink transition-colors hover:bg-raised"
                >
                  Sign in
                </Link>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 md:py-12">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-sm text-faint md:px-8">
            <span>Tailor. For people 18 and over.</span>
            <nav className="flex flex-wrap gap-x-5 gap-y-1">
              <Link href="/privacy" className="hover:text-ink">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-ink">
                Terms and Conditions
              </Link>
              <a href="mailto:hi@muhammadilham.xyz" className="hover:text-ink">
                Contact
              </a>
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                Buy me a coffee
              </a>
            </nav>
          </div>
        </footer>
        <SupportButton />
      </body>
    </html>
  );
}
