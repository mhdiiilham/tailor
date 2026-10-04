import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { UserMenu } from "@/components/userMenu";
import { getCurrentUser } from "@/infrastructure/auth/session";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-[100dvh] font-sans">
        <header className="border-b border-line">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:px-8">
            <Link href="/" className="text-[15px] font-semibold tracking-tight">
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
        <main className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">{children}</main>
      </body>
    </html>
  );
}
