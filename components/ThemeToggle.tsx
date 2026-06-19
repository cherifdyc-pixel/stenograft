"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : true;
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    document.body.style.background = next ? "#000000" : "#f5f5f5";
    document.body.style.color = next ? "#ffffff" : "#000000";
  };

  return (
    <button
      onClick={toggle}
      title={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: "18px", padding: "4px 8px", color: "#666",
        transition: "color 0.2s", lineHeight: 1,
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
