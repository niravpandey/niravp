"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative"
    >
      {/* Sun icon (visible in light mode) */}
      <Sun className="
        h-[1.2rem] w-[1.2rem]
        transition-all
        scale-100 rotate-0
        dark:scale-0 dark:-rotate-90
      " />

      {/* Moon icon (visible in dark mode) */}
      <Moon className="
        absolute h-[1.2rem] w-[1.2rem]
        transition-all
        scale-0 rotate-90
        dark:scale-100 dark:rotate-0
      " />

      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
