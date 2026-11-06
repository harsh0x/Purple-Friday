import localFont from "next/font/local";

export const bricolage = localFont({
  src: "../fonts/BricolageGrotesque.woff2",
  variable: "--font-bricolage",
  display: "swap",
  weight: "200 800",
});

export const instrumentSans = localFont({
  src: [
    {
      path: "../fonts/InstrumentSans-Regular.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "../fonts/InstrumentSans-Italic.woff2",
      weight: "400 700",
      style: "italic",
    },
  ],
  variable: "--font-instrument",
  display: "swap",
});

export const dmMono = localFont({
  src: [
    {
      path: "../fonts/DMMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/DMMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-dm-mono",
  display: "swap",
});
