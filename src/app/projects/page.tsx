"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import GradientText from "@/components/ui/GradientText";
import Link from "next/link";

interface SavedCity {
  id: string;
  url: string;
  createdAt: string;
  isSaved: boolean;
}

const IconStar = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cities, setCities] = useState<SavedCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signup");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/user/cities")
        .then(r => r.json())
        .then(d => { setCities(d.cities || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const toggleSave = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // Optimistic update
      setCities(prev => prev.map(c => c.id === id ? { ...c, isSaved: !currentStatus } : c));
      
      const res = await fetch("/api/user/cities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isSaved: !currentStatus })
      });
      if (!res.ok) {
        // Revert on failure
        setCities(prev => prev.map(c => c.id === id ? { ...c, isSaved: currentStatus } : c));
      }
    } catch (err) {
      console.error("Failed to toggle save status", err);
      // Revert on failure
      setCities(prev => prev.map(c => c.id === id ? { ...c, isSaved: currentStatus } : c));
    }
  };

  const getOwner = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)/);
    return match ? match[1] : "";
  };
  
  const getRepo = (url: string) => {
    const match = url.match(/github\.com\/[^/]+\/([^/?#]+)/);
    return match ? match[1] : url;
  };

  const savedProjects = cities.filter(c => c.isSaved);
  const history = cities;

  const renderCityCard = (city: SavedCity, index: number) => (
    <motion.div
      key={city.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 + 0.1, duration: 0.4 }}
    >
      <Link href={`/?url=${encodeURIComponent(city.url)}`} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
        <div className="liquid-glass" style={{
          padding: "24px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s ease",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.borderColor = "rgba(0,255,255,0.4)";
          e.currentTarget.style.transform = "translateY(-4px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.transform = "none";
        }}>
          {/* Save Button Overlay */}
          <div 
            onClick={(e) => toggleSave(city.id, city.isSaved, e)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              color: city.isSaved ? "#F5D76E" : "rgba(255,255,255,0.3)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              zIndex: 10
            }}
            onMouseEnter={e => e.currentTarget.style.color = city.isSaved ? "#F5D76E" : "rgba(255,255,255,0.8)"}
            onMouseLeave={e => e.currentTarget.style.color = city.isSaved ? "#F5D76E" : "rgba(255,255,255,0.3)"}
          >
            <IconStar filled={city.isSaved} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ color: "#d946ef" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
            </div>
            <div style={{ paddingRight: "30px" }}>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>{getOwner(city.url)}</p>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getRepo(city.url)}</h3>
            </div>
          </div>
          
          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
              {new Date(city.createdAt).toLocaleDateString()}
            </span>
            <span style={{ color: "#00ffff", fontSize: "0.85rem", letterSpacing: "1px", fontWeight: "bold" }}>
              OPEN →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#06001a",
      overflowY: "auto",
      overflowX: "hidden",
      position: "relative",
      fontFamily: "Geist, sans-serif",
      paddingTop: "160px",
      paddingBottom: "60px",
    }}>
      {/* Ambient glow orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,255,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(217,70,239,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", margin: "10vh auto 0" }}>
            <div style={{ width: "48px", height: "48px", border: "2px solid rgba(0,255,255,0.2)", borderTop: "2px solid #00ffff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "3px", fontSize: "0.85rem" }}>LOADING PROJECTS</p>
          </motion.div>
        ) : (
          <div key="content" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "0 24px", zIndex: 1, position: "relative" }}>
            
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: "60px", textAlign: "center" }}>
              <h1 style={{ 
                fontSize: "6rem", 
                margin: "0 0 16px 0",
                paddingBottom: "10px",
                fontWeight: 300,
                lineHeight: "1.2",
                letterSpacing: "0.5px"
              }}>
                <GradientText colors={["#F5D76E", "#59ABE3", "#F1828D", "#00ffff"]} animationSpeed={4} showBorder={false}>
                  SAVED CITIES
                </GradientText>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.25rem", textShadow: "0 0 10px rgba(255, 255, 255, 0.4)" }}>
                Select a repository to rebuild its codebase city.
              </p>
            </motion.div>

            {cities.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ textAlign: "center", marginTop: "10vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ marginBottom: "20px", color: "rgba(255,255,255,0.2)", display: "flex", justifyContent: "center" }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem", marginBottom: "20px" }}>No projects saved yet.</p>
                <motion.button 
                  onClick={() => router.push("/")}
                  className="liquid-glass-btn" 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: "inline-block", padding: "12px 24px", borderRadius: "12px",
                    border: "1px solid rgba(0,255,255,0.3)", color: "#00ffff", fontSize: "0.9rem",
                    letterSpacing: "2px", cursor: "pointer", background: "rgba(0,255,255,0.05)"
                  }}>
                  CREATE A CITY →
                </motion.button>
              </motion.div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
                
                {/* Saved Projects Section */}
                {savedProjects.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "24px"
                  }}>
                    {savedProjects.map((city, i) => renderCityCard(city, i))}
                  </div>
                )}

                {/* History Section */}
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgba(255,255,255,0.5)", marginBottom: "24px", letterSpacing: "2px", marginTop: savedProjects.length > 0 ? "20px" : "0" }}>RECENT HISTORY</h2>
                  {history.length > 0 ? (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                      gap: "24px"
                    }}>
                      {history.map((city, i) => renderCityCard(city, i))}
                    </div>
                  ) : (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.95rem", fontStyle: "italic" }}>
                      No recent history.
                    </p>
                  )}
                </div>
                
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
