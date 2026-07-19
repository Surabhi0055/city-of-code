"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export function SunLogo({ isHovered }: { isHovered: boolean }) {
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cityViewActive, setCityViewActive] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleCityView = (e: Event) => {
      setCityViewActive((e as CustomEvent).detail.active);
    };
    window.addEventListener("city-view-toggle", handleCityView);
    return () => window.removeEventListener("city-view-toggle", handleCityView);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    { name: "PROJECTS", path: "/projects" },
  ];

  // Hide the Navbar completely on the signup page
  if (pathname === "/signup") return null;

  return (
    <AnimatePresence>
      {(!hidden && !cityViewActive) && (
        <motion.div
          id="main-navbar"
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
      <div className="liquid-glass" style={{ overflow: "visible" }}>
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
          {session ? (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="Avatar" style={{ width: "36px", height: "36px", borderRadius: "50%", border: dropdownOpen ? "2px solid #ff00aa" : "2px solid rgba(255,255,255,0.3)", transition: "all 0.2s ease" }} />
                ) : (
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(90deg, #F5D76E, #F1828D)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", border: dropdownOpen ? "2px solid #ff00aa" : "2px solid transparent", transition: "all 0.2s ease" }}>
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: "absolute",
                      top: "65px",
                      right: 0,
                      width: "180px",
                      background: "rgba(10, 5, 25, 0.4)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      padding: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,255,0.05)",
                    }}
                  >
                    {/* User name hint */}
                    <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "4px" }}>
                      <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", letterSpacing: "1px", marginBottom: "2px" }}>SIGNED IN AS</p>
                      <p style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {session?.user?.name || session?.user?.email || "User"}
                      </p>
                    </div>

                    {/* Profile link */}
                    <button
                      onClick={() => { setDropdownOpen(false); router.push("/profile"); }}
                      onMouseEnter={() => setHovered("PROFILE")}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        background: hovered === "PROFILE" ? "rgba(0,255,255,0.08)" : "transparent",
                        border: "none",
                        color: hovered === "PROFILE" ? "#00ffff" : "rgba(255,255,255,0.8)",
                        cursor: "pointer",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        fontSize: "0.88rem",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: 500,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      VIEW PROFILE
                    </button>

                    {/* Logout */}
                    <button
                      onClick={() => signOut()}
                      onMouseEnter={() => setHovered("LOGOUT")}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        background: hovered === "LOGOUT" ? "rgba(255, 60, 60, 0.1)" : "transparent",
                        border: "none",
                        color: hovered === "LOGOUT" ? "#ff6b6b" : "rgba(255,255,255,0.5)",
                        cursor: "pointer",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        fontSize: "0.88rem",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      SIGN OUT
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
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
                  padding: "6px 16px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255, 102, 170, 0.5)",
                  background: hovered === "SIGNUP" ? "rgba(255, 102, 170, 0.15)" : "transparent",
                  color: hovered === "SIGNUP" ? "#fff" : "#ff66aa",
                  textShadow: hovered === "SIGNUP" ? "0 0 10px rgba(255, 102, 170, 0.8)" : "none",
                  boxShadow: hovered === "SIGNUP" ? "0 0 15px rgba(255, 102, 170, 0.4) inset" : "none",
                }}
              >
                START BUILDING
              </Link>
            </>
          )}
        </div>
      </div>
        </nav>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
