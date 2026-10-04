import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tailor",
  description: "Paste a job description, get a tailored resume.",
};

const nav = [
  { href: "/", label: "Applications" },
  { href: "/new", label: "New" },
  { href: "/profile", label: "Profile" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-[100dvh] font-sans">
        <header className="border-b border-line">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-8">
            <Link href="/" className="text-[15px] font-semibold tracking-tight">
              Tailor
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-ui px-3 py-1.5 text-muted transition-colors hover:bg-raised hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">{children}</main>
      </body>
    </html>
  );
}
