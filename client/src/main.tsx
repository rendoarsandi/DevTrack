import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./components/theme/theme-provider";
import App from "./App";
import "./index.css";

// Coba ambil tema tersimpan atau gunakan default "system"
const savedTheme = localStorage.getItem("vite-ui-theme");
const defaultTheme = savedTheme || "system";

// Set class langsung pada html element sesuai tema
const htmlElement = document.documentElement;
if (defaultTheme === "dark" || 
   (defaultTheme === "system" && 
    window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  htmlElement.classList.add("dark");
} else {
  htmlElement.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme={defaultTheme as "dark" | "light" | "system"}>
    <App />
  </ThemeProvider>
);
