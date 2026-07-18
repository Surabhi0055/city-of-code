"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

interface CitySidebarProps {
  currentUrl: string;
}

const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

const IconProjects = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);

const IconProfile = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const IconStar = ({ filled }: { filled: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export default function CitySidebar({ currentUrl }: CitySidebarProps) {
  const { data: session, status } = useSession();
  const [cityId, setCityId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && currentUrl) {
      // Find if this city exists in our history/saved list
      fetch("/api/user/cities")
        .then(r => r.json())
        .then(d => {
          const cities = d.cities || [];
          const found = cities.find((c: any) => c.url === currentUrl);
          if (found) {
            setCityId(found.id);
            setIsSaved(found.isSaved);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [status, currentUrl]);

  const handleToggleSave = async () => {
    const newStatus = !isSaved;
    
    // Optimistic update
    setIsSaved(newStatus);
    
    try {
      const payload: any = { isSaved: newStatus, url: currentUrl };
      if (cityId) payload.id = cityId;

      const res = await fetch("/api/user/cities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        setIsSaved(!newStatus); // Revert on failure
      } else {
        const data = await res.json();
        if (data.city && data.city.id && !cityId) {
          setCityId(data.city.id);
        }
      }
    } catch (err) {
      console.error("Failed to toggle save status", err);
      setIsSaved(!newStatus);
    }
  };

  const navItems = [
    { href: "/", icon: <IconHome />, label: "Home" },
    { href: "/projects", icon: <IconProjects />, label: "Projects" },
  ];

  return (
    <motion.div 
      initial={{ x: -100, y: "-50%", opacity: 0, width: "70px" }}
      animate={{ x: 0, y: "-50%", opacity: 1, width: isHovered ? "180px" : "70px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="liquid-glass"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        position: "fixed",
        top: "50%",
        left: "20px",
        display: "flex",
        flexDirection: "column",
        minHeight: "400px",
        padding: "40px 0",
        borderRadius: "32px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
        zIndex: 50,
        overflow: "hidden"
      }}
    >
      {/* Navigation Links and Save */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", alignItems: "flex-start", width: "100%" }}>
        {navItems.map((item, i) => (
          <a key={i} href={item.href} style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
            <motion.div
              whileHover={{ color: "#00ffff", scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
                transition: "color 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "0 22px",
                width: "100%"
              }}
              title={item.label}
            >
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.icon}
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, width: 0, x: -10 }}
                    animate={{ opacity: 1, width: "auto", x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{ whiteSpace: "nowrap", fontWeight: "bold", fontSize: "0.95rem", letterSpacing: "1px", color: "#fff" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </a>
        ))}

        {/* Save Toggle Button */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", padding: "0 22px" }}>
          {loading ? (
             <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #F5D76E", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          ) : (
            <motion.div
              whileHover={{ color: "#F5D76E", scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleSave}
              style={{
                color: isSaved ? "#F5D76E" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                transition: "color 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                width: "100%"
              }}
              title={isSaved ? "Unsave Project" : "Save Project"}
            >
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconStar filled={isSaved} />
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, width: 0, x: -10 }}
                    animate={{ opacity: 1, width: "auto", x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{ whiteSpace: "nowrap", fontWeight: "bold", fontSize: "0.95rem", letterSpacing: "1px", color: isSaved ? "#F5D76E" : "#fff" }}
                  >
                    {isSaved ? "Saved" : "Save"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Bottom section with divider and Profile */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "32px", marginTop: "auto" }}>
        {/* Divider */}
        <div style={{ width: "calc(100% - 40px)", margin: "0 auto", height: "1px", background: "rgba(255,255,255,0.1)" }} />
        
        {/* Profile Link */}
        <a href="/profile" style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
          <motion.div
            whileHover={{ color: "#00ffff", scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              transition: "color 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "0 22px",
              width: "100%"
            }}
            title={session?.user?.name || "Profile"}
          >
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <IconProfile />
              )}
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, width: 0, x: -10 }}
                  animate={{ opacity: 1, width: "auto", x: 0 }}
                  exit={{ opacity: 0, width: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ whiteSpace: "nowrap", fontWeight: "bold", fontSize: "0.95rem", letterSpacing: "1px", color: "#fff" }}
                >
                  {session?.user?.name || "Profile"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </a>
      </div>

    </motion.div>
  );
}
