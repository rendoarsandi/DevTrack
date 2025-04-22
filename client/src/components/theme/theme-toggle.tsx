import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme/theme-provider"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Hanya render setelah mounting untuk mencegah perbedaan SSR/client
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Fungsi untuk menerapkan tema secara manual (digunakan jika proses normal tidak berfungsi)
  const applyThemeManually = (newTheme: string) => {
    // Tetapkan tema via context
    setTheme(newTheme as "light" | "dark" | "system")
    
    // Tetapkan juga class langsung ke elemen HTML
    const root = document.documentElement;
    
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem("vite-ui-theme", "dark");
    } 
    else if (newTheme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
      localStorage.setItem("vite-ui-theme", "light");
    }
    else if (newTheme === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
      localStorage.setItem("vite-ui-theme", "system");
    }
  }
  
  // Jika belum dimounting, tampilkan placeholder
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <span className="h-[1.2rem] w-[1.2rem]"></span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => applyThemeManually("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyThemeManually("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyThemeManually("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}