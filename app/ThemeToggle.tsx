'use client'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // au montage, lire le thème déjà appliqué sur <html>
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    if (current === 'light' || current === 'dark') setTheme(current)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  return (
    <button className="theme-toggle glass" onClick={toggle} aria-label="Changer de thème">
      <span className="knob" />
    </button>
  )
}