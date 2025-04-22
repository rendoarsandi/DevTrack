import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  // Setelah komponen dimount, baru kita akses localStorage
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  
  // Fungsi untuk menerapkan tema ke DOM
  const applyTheme = (selectedTheme: Theme) => {
    try {
      const root = window.document.documentElement;
      let activeTheme = selectedTheme;
      
      // Hapus kelas tema yang ada
      root.classList.remove("light", "dark");
      
      // Jika tema 'system', gunakan preferensi sistem pengguna
      if (selectedTheme === "system") {
        const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        activeTheme = isDarkMode ? "dark" : "light";
      }
      
      // Tambahkan kelas tema yang sesuai
      root.classList.add(activeTheme);
      
      // Tambahkan data-theme attribute untuk komponen yang menggunakannya
      root.setAttribute("data-theme", activeTheme);
      
      // Log untuk debugging
      console.log(`Theme applied: ${activeTheme} (selected: ${selectedTheme})`);
    } catch (error) {
      console.error("Error applying theme:", error);
    }
  };
  
  // Inisialisasi tema dari localStorage ketika komponen dimount
  useEffect(() => {
    const root = window.document.documentElement;
    setMounted(true);
    
    try {
      // Coba untuk mengambil tema dari localStorage
      const savedTheme = localStorage.getItem(storageKey);
      console.log("Saved theme from localStorage:", savedTheme);
      
      // Jika ada tema tersimpan dan valid, gunakan tema tersebut
      if (savedTheme && ["dark", "light", "system"].includes(savedTheme)) {
        setTheme(savedTheme as Theme);
        applyTheme(savedTheme as Theme);
      } else {
        // Gunakan default theme
        setTheme(defaultTheme);
        applyTheme(defaultTheme);
      }
    } catch (error) {
      console.error("Error initializing theme:", error);
      // Fallback ke defaultTheme jika ada error
      setTheme(defaultTheme);
      applyTheme(defaultTheme);
    }
  }, []);
  
  // Efek untuk mengatur kelas tema pada elemen root setiap kali theme berubah
  useEffect(() => {
    if (!mounted) return;
    
    try {
      // Terapkan tema baru
      applyTheme(theme);
      
      // Simpan ke localStorage
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.error("Error updating theme:", error);
    }
  }, [theme, mounted, storageKey])
  
  // Mendengarkan perubahan preferensi sistem jika tema 'system'
  useEffect(() => {
    if (!mounted || theme !== "system") return;
    
    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = () => {
        applyTheme("system");
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } catch (error) {
      console.error("Error setting up media query listener:", error);
    }
  }, [theme, mounted]);
  
  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme);
      }
      setTheme(newTheme);
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}