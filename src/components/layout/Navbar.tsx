"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

function SunLogo({ isHovered }: { isHovered: boolean }) {
  return (
    <svg width="40" height="40" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="sunGradNav" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffcc00" />
          <stop offset="50%" stopColor="#ff6600" />
          <stop offset="100%" stopColor="#ff0088" />
        </linearGradient>
        
        <mask id="stripeMaskNav">
          <rect width="100" height="100" fill="white" />
          <motion.g
            animate={isHovered ? { y: [0, -10] } : { y: 0 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          >
            {[...Array(10)].map((_, i) => (
              <rect key={i} x="0" y={50 + i * 10} width="100" height="4.5" fill="black" />
            ))}
          </motion.g>
          <rect x="0" y="0" width="100" height="50" fill="white" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#sunGradNav)" mask="url(#stripeMaskNav)" />
    </svg>
  );
}

export default function Navbar() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [logoHovered, setLogoHovered] = useState(false);

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "ABOUT", path: "/about" },
    { name: "DOCS", path: "/docs" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 64px)",
        maxWidth: "1200px",
        zIndex: 50,
      }}
    >
      <div className="rainbow-border-wrap" style={{ background: "transparent" }}>
        <div className="border-spinner"></div>
        <nav
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 32px",
            background: "rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            borderRadius: "12px",
            boxShadow: "inset 0 0 10px rgba(255, 255, 255, 0.05)",
          }}
        >
      {/* Logo */}
      <a
        href="/"
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
        }}
      >
        <SunLogo isHovered={logoHovered} />
        <span
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            letterSpacing: "2px",
            background: "linear-gradient(to bottom, #ffcc00, #ff6600, #ff0088)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: logoHovered ? "brightness(1.5) drop-shadow(0 0 10px rgba(255, 0, 136, 0.8))" : "none",
            transition: "all 0.3s ease",
          }}
        >
          CITY_OF_CODE
        </span>
      </a>

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
      </div>
    </div>
  );
}
