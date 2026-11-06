import type { Config } from "tailwindcss";

  const config: Config = {
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          ink: {
            DEFAULT: "#15101F",
            50: "#F8F6FA",
            100: "#ECE7F2",
            200: "#DDD4E6",
            300: "#BEB0CF",
            400: "#9F8CB8",
            500: "#816F98",
            600: "#64537A",
            700: "#483A5A",
            800: "#312540",
            900: "#221A31",
          },
          paper: {
            DEFAULT: "#F5F0E8",
            warm: "#EDE6DA",
            pure: "#FAF7F2",
            dark: "#E3DACB",
          },
          violet: {
            DEFAULT: "#6A2CFF",
            hover: "#5820DC",
            light: "#7F47FF",
            dark: "#4B1AB8",
          },
          lilac: {
            DEFAULT: "#CDB8FF",
            light: "#E3D7FF",
            dark: "#B496FF",
          },
          "spot-lime": {
            DEFAULT: "#D8FF3F",
            hover: "#C4ED2B",
            dark: "#B0D820",
          },
        },
        fontFamily: {
          sans: ["var(--font-instrument)", "system-ui", "-apple-system", "sans-serif"],
          display: ["var(--font-bricolage)", "sans-serif"],
          mono: ["var(--font-dm-mono)", "monospace"],
        },
        boxShadow: {
          stamp: "4px 4px 0px #15101F",
          "stamp-hover": "6px 6px 0px #15101F",
          "stamp-active": "2px 2px 0px #15101F",
          "stamp-sm": "2px 2px 0px #15101F",
          "stamp-lg": "8px 8px 0px #15101F",
          card: "3px 3px 0px rgba(21, 16, 31, 0.15)",
          "card-hover": "5px 5px 0px rgba(21, 16, 31, 0.2)",
        },
        transitionTimingFunction: {
          editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
        animation: {
          "counter-roll": "counterRoll 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          "underline-sweep": "underlineSweep 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          shimmer: "shimmer 1.8s infinite linear",
        },
        keyframes: {
          counterRoll: {
            "0%": { transform: "translateY(100%)", opacity: "0" },
            "100%": { transform: "translateY(0)", opacity: "1" },
          },
          shimmer: {
            "0%": { transform: "translateX(-100%)" },
            "100%": { transform: "translateX(100%)" },
          },
        },
      },
    },
    plugins: [],
};

export default config;
