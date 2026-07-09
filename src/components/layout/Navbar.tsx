"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Listen for scroll on any scrollable container inside the page
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.scrollTop !== undefined) {
        setHidden(target.scrollTop > 100);
      }
    };

    // Use capture phase to catch scroll events from any nested scrollable div
    document.addEventListener("scroll", handleScroll, true);
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, []);

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "ABOUT", path: "/about" },
    { name: "DOCS", path: "/docs" },
  ];

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            position: "fixed",
            top: "24px",
            left: 0,
            right: 0,
            width: "calc(100% - 64px)",
            maxWidth: "1200px",
            margin: "0 auto",
            zIndex: 50,
          }}
        >
      <div className="liquid-glass">
        <nav
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 32px",
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
            background: "linear-gradient(to right, #F5D76E, #59ABE3, #F1828D)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: logoHovered ? "brightness(1.5) drop-shadow(0 0 10px rgba(255, 0, 136, 0.8))" : "none",
            transition: "all 0.3s ease",
          }}
        >
          CITY_OF_CODE
        </span>
      </a>

      {/* Right Side Links & Auth */}
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        {/* Main Links */}
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

        {/* Auth Links */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center", borderLeft: "1px solid rgba(255, 255, 255, 0.1)", paddingLeft: "32px" }}>
          <Link
            href="/login"
            onMouseEnter={() => setHovered("LOGIN")}
            onMouseLeave={() => setHovered(null)}
            style={{
              color: hovered === "LOGIN" ? "#fff" : "#ffcc00",
              textDecoration: "none",
              fontSize: "1.05rem",
              fontWeight: "bold",
              transition: "all 0.2s ease",
              textShadow: hovered === "LOGIN" ? "0 0 8px rgba(255, 204, 0, 0.8)" : "none",
            }}
          >
            LOGIN
          </Link>
          <Link
            href="/signup"
            onMouseEnter={() => setHovered("SIGNUP")}
            onMouseLeave={() => setHovered(null)}
            style={{
              textDecoration: "none",
              fontSize: "1.05rem",
              fontWeight: "bold",
              transition: "all 0.2s ease",
              display: "inline-block",
              background: "linear-gradient(90deg, #F5D76E, #59ABE3, #F1828D)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: hovered === "SIGNUP" ? "brightness(1.2) drop-shadow(0 0 8px rgba(241, 130, 141, 0.6))" : "none",
              transform: hovered === "SIGNUP" ? "scale(1.1)" : "scale(1)",
            }}
          >
            SIGN UP
          </Link>
        </div>
      </div>
        </nav>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
