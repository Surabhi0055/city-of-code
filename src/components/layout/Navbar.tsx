"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [hovered, setHovered] = useState<string | null>(null);

  const navLinks = [
    { name: "[HOME]", path: "/" },
    { name: "[ABOUT]", path: "/about" },
    { name: "[DOCS]", path: "/docs" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 50,
        background: "linear-gradient(to bottom, rgba(4, 8, 16, 0.9) 0%, rgba(4, 8, 16, 0) 100%)",
        borderBottom: "1px solid rgba(0, 139, 139, 0.3)",
        fontFamily: "monospace",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "#00aaff",
          textDecoration: "none",
          letterSpacing: "2px",
          textShadow: "0 0 10px rgba(0, 170, 255, 0.5)",
        }}
      >
        CITY_OF_CODE<span style={{ color: "#ff00aa" }}>.exe</span>
      </Link>

      {/* Links */}
      <div style={{ display: "flex", gap: "32px" }}>
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            onMouseEnter={() => setHovered(link.name)}
            onMouseLeave={() => setHovered(null)}
            style={{
              color: hovered === link.name ? "#ff00aa" : "#008b8b",
              textDecoration: "none",
              fontSize: "1.1rem",
              transition: "all 0.2s ease",
              textShadow: hovered === link.name ? "0 0 8px rgba(255, 0, 170, 0.6)" : "none",
            }}
          >
            {link.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
