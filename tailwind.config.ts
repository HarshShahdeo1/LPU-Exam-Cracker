import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        abyss: "#050608",
        crimson: "#A50000",
        ember: "#FF6B57",
        mist: "rgba(255, 255, 255, 0.08)"
      },
      boxShadow: {
        glass: "0 25px 80px rgba(0, 0, 0, 0.45)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 0 80px rgba(165,0,0,0.2)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(165, 0, 0, 0.45), transparent 36%), radial-gradient(circle at bottom right, rgba(255, 107, 87, 0.18), transparent 30%), linear-gradient(135deg, #040405 0%, #070A10 52%, #020202 100%)"
      }
    }
  },
  plugins: []
};

export default config;

