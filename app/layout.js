import "./globals.css";
import { AppFrame } from "@/components/layout/app-frame";

export const metadata = {
  title: "SmartReview AI",
  description: "AI platform to review, improve, and prepare academic assignments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = window.localStorage.getItem("smartreview-theme");
                const theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                document.documentElement.dataset.theme = theme;
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
