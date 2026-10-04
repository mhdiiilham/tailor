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
      <body className="min-h-[100dvh] font-sans">
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
            ) : null}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">{children}</main>
      </body>
    </html>
  );
}
