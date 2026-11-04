import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track your job applications in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* One boundary here on purpose. It shows on a full page load, while page
            switches keep the old page up until the new one is ready. A loading.tsx
            per route would add React's 300ms minimum to every switch. */}
        <Suspense
          fallback={
            <main className="mx-auto w-full max-w-5xl px-4 py-8">
              <p
                role="status"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Loading…
              </p>
            </main>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}
