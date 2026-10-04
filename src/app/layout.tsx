import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Scissors } from "@phosphor-icons/react/dist/ssr";
import { UserMenu } from "@/components/userMenu";
import { getCurrentUser } from "@/infrastructure/auth/session";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tailor",
  description: "Paste a job description, get a tailored resume.",
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
            <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
              <span className="grid size-8 place-items-center rounded-ui bg-accent text-on-accent">
                <Scissors size={17} weight="bold" />
              </span>
              Tailor
            </Link>
            {user ? (
              <div className="flex min-w-0 items-center gap-1 md:gap-3">
                <nav className="flex items-center overflow-x-auto text-sm">
                  {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${item.wide ? "hidden sm:block" : ""} whitespace-nowrap rounded-ui px-2 py-1.5 text-muted transition-colors hover:bg-raised hover:text-ink md:px-3`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
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
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
