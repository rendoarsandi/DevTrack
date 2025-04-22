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
  // Coba untuk mengambil tema dari localStorage
  const storedTheme = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
  
  const [theme, setTheme] = useState<Theme>(
    () => (storedTheme as Theme) || defaultTheme
  )
  
  // Efek untuk mengatur kelas tema pada elemen root
  useEffect(() => {
    const root = window.document.documentElement
    
    // Hapus kelas tema yang ada
    root.classList.remove("light", "dark")
    
    let activeTheme = theme
    
    // Jika tema 'system', gunakan preferensi sistem pengguna
    if (theme === "system") {
      activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    
    // Tambahkan kelas tema yang sesuai
    root.classList.add(activeTheme)
    
    // Tambahkan data-theme attribute untuk komponen yang menggunakannya
    root.setAttribute("data-theme", activeTheme)
    
    // Juga pastikan mode pada localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, theme)
    }
  }, [theme, storageKey])
  
  // Mendengarkan perubahan preferensi sistem jika tema 'system'
  useEffect(() => {
    if (theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
      root.setAttribute("data-theme", systemTheme);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);
  
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