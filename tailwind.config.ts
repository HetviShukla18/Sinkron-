import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sinkron: {
          teal: "#70C8BC",
          deep: "#176D69",
          ink: "#111719",
          mist: "#EAF4F2",
          grey: "#707A7C",
          border: "#D9E0DE",
          off: "#F7F8F6"
        }
      },
      borderRadius: {
        sinkron: "18px",
        panel: "24px"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(17, 23, 25, 0.07)"
      }
    }
  },
  plugins: []
};

export default config;
