"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import GradientText from "@/components/ui/GradientText";
import Link from "next/link";
import { SunLogo } from "@/components/layout/Navbar";

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  joinedAt: string | null;
  lastCityUrl: string | null;
  providers: string[];
}

/* ── tiny helpers ─────────────────────────────────────────────────── */
function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div
      className="liquid-glass"
      style={{
        padding: "24px 20px",
        borderRadius: "20px",
        textAlign: "center",
        flex: 1,
        minWidth: "120px",
        background: `linear-gradient(135deg, ${color}18 0%, rgba(15,20,50,0.7) 100%)`,
        border: `1px solid ${color}30`,
        boxShadow: `0 0 30px ${color}15`,
      }}
    >
      <div style={{ fontSize: "2rem", fontWeight: "bold", color, letterSpacing: "1px", marginBottom: "6px" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", letterSpacing: "2px", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, accent = "#00ffff" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "16px 20px",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      transition: "background 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
    >
      <div style={{ color: accent, flexShrink: 0, width: "20px", display: "flex", alignItems: "center" }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
        <div style={{ fontSize: "0.95rem", color: "#fff", fontWeight: 500, wordBreak: "break-all" }}>{value}</div>
      </div>
    </div>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const isGitHub = provider === "github";
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      borderRadius: "999px",
      background: isGitHub ? "rgba(255,255,255,0.06)" : "rgba(66,133,244,0.12)",
      border: isGitHub ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(66,133,244,0.3)",
      fontSize: "0.82rem",
      color: "#fff",
      fontWeight: 600,
    }}>
      {isGitHub ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
      )}
      {provider.charAt(0).toUpperCase() + provider.slice(1)}
    </div>
  );
}

/* ── SVG icon helpers ──────────────────────────────────────────────── */
const IconUser = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconMail = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconGlobe = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>;
const IconCalendar = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const IconCity = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M9 21V7l6-4v18M14 21V11l5-3v13"/></svg>;
const IconLogout = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

const IconLightning = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconEye = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconTrendingUp = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconLayers = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>;
const IconGhost = <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>;

/* ── Main page ─────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", email: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signup");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then(r => r.json())
        .then(d => { setProfile(d); setEditData({ name: d.name || "", email: d.email || "" }); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(prev => prev ? { ...prev, ...updated } : null);
        setIsEditing(false);
      }
    } catch (e) {
      console.error("Failed to save", e);
    }
    setIsSaving(false);
  };

  const githubUsername = profile?.lastCityUrl
    ? profile.lastCityUrl.match(/github\.com\/([^/]+)/)?.[1]
    : null;

  const repoName = profile?.lastCityUrl
    ? profile.lastCityUrl.match(/github\.com\/[^/]+\/([^/?#]+)/)?.[1]
    : null;

  const joinDate = profile?.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  /* ── Particle background ──────────────────────────────────────────── */
  const [particles, setParticles] = useState<any[]>([]);
  useEffect(() => {
    setParticles(Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      dur: 4 + Math.random() * 6,
      delay: Math.random() * 4,
      color: ["#00ffff", "#d946ef", "#2563eb", "#f472b6", "#9333ea"][Math.floor(Math.random() * 5)],
    })));
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#06001a",
      overflowY: "auto",
      overflowX: "hidden",
      position: "relative",
      fontFamily: "Geist, sans-serif",
      paddingTop: "120px",
      paddingBottom: "60px",
    }}>

      {/* Ambient glow orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,255,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(217,70,239,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "40%", right: "25%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
        {/* Floating particles */}
        {particles.map(p => (
          <motion.div key={p.id}
            style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: "50%", background: p.color, boxShadow: `0 0 ${p.size * 3}px ${p.color}` }}
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", margin: "10vh auto 0" }}>
            <div style={{ width: "48px", height: "48px", border: "2px solid rgba(0,255,255,0.2)", borderTop: "2px solid #00ffff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "3px", fontSize: "0.85rem" }}>LOADING PROFILE</p>
          </motion.div>
        ) : (
          <div key="content-wrapper" style={{ width: "100%", maxWidth: "1000px", margin: "0 auto", zIndex: 1 }}>
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }} style={{ marginBottom: "32px", textAlign: "center" }}>
              <h1 style={{ fontSize: "2.4rem", fontWeight: "bold", letterSpacing: "2px", marginBottom: "4px" }}>
                <GradientText colors={["#F5D76E", "#59ABE3", "#F1828D", "#00ffff"]} animationSpeed={4} showBorder={false}>
                  MY PROFILE
                </GradientText>
              </h1>
            </motion.div>

            <motion.div key="content"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                display: "grid",
                gridTemplateColumns: "340px 1fr",
                gap: "24px",
                width: "100%",
              }}
            >
              {/* ── LEFT: Identity Card ───────────────────────────────── */}
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.6 }} style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>
                <div className="liquid-glass" style={{ padding: "24px", borderRadius: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", flex: 1 }}>

                {/* Avatar */}
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", inset: "-4px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #00ffff, #d946ef, #2563eb)",
                    animation: "spin 4s linear infinite",
                    padding: "2px",
                  }} />
                  {profile?.image ? (
                    <img src={profile.image} alt="avatar" style={{ width: "100px", height: "100px", borderRadius: "50%", position: "relative", zIndex: 1, border: "3px solid #06001a" }} />
                  ) : (
                    <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #00ffff, #d946ef)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: "bold", color: "#fff", position: "relative", zIndex: 1, border: "3px solid #06001a" }}>
                      {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div style={{ textAlign: "center" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff", marginBottom: "6px", letterSpacing: "1px" }}>
                    {profile?.name || "Anonymous Builder"}
                  </h2>
                </div>

                {/* Divider */}
                <div style={{ width: "100%", height: "1px", background: "linear-gradient(to right, transparent, rgba(0,255,255,0.3), transparent)" }} />

                {/* Quick stats */}
                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <StatCard value={repoName ? "1" : "0"} label="Projects" color="#00ffff" />
                </div>

                {/* Logout button */}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="liquid-glass-btn"
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,50,50,0.2)",
                    color: "#ff6b6b",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    transition: "all 0.3s ease",
                    background: "rgba(255,50,50,0.05)",
                    marginTop: "auto",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,50,50,0.15)"; e.currentTarget.style.color = "#ff4444"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,50,50,0.05)"; e.currentTarget.style.color = "#ff6b6b"; }}
                >
                  {IconLogout}
                  SIGN OUT
                </button>
              </div>
            </motion.div>

            {/* ── RIGHT: Detail panels ───────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>

              {/* Account info card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                <div className="liquid-glass" style={{ padding: "24px", borderRadius: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <p style={{ fontSize: "0.72rem", letterSpacing: "3px", color: "rgba(0,255,255,0.7)", fontWeight: "bold", margin: 0 }}>ACCOUNT DETAILS</p>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,255,0.3)", borderRadius: "8px", color: "#00ffff", fontSize: "0.75rem", padding: "4px 12px", cursor: "pointer", letterSpacing: "1px", transition: "all 0.2s ease" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,255,255,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}>EDIT</button>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => { setIsEditing(false); setEditData({ name: profile?.name || "", email: profile?.email || "" }); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", padding: "4px 12px", cursor: "pointer", letterSpacing: "1px", transition: "all 0.2s ease" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>CANCEL</button>
                        <button onClick={handleSave} disabled={isSaving} style={{ background: "rgba(0,255,255,0.1)", border: "1px solid rgba(0,255,255,0.5)", borderRadius: "8px", color: "#00ffff", fontSize: "0.75rem", padding: "4px 12px", cursor: "pointer", letterSpacing: "1px", opacity: isSaving ? 0.5 : 1 }}>{isSaving ? "SAVING..." : "SAVE"}</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {!isEditing ? (
                      <>
                        <InfoRow icon={IconUser} label="Display Name" value={profile?.name || "—"} accent="#00ffff" />
                        <InfoRow icon={IconMail} label="Email Address" value={profile?.email || "—"} accent="#d946ef" />
                      </>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,255,0.3)" }}>
                          <div style={{ color: "#00ffff", flexShrink: 0, width: "20px", display: "flex", alignItems: "center" }}>{IconUser}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>Display Name</div>
                            <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "0.95rem", padding: "4px 0", outline: "none" }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(217,70,239,0.3)" }}>
                          <div style={{ color: "#d946ef", flexShrink: 0, width: "20px", display: "flex", alignItems: "center" }}>{IconMail}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>Email Address</div>
                            <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "0.95rem", padding: "4px 0", outline: "none" }} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Saved city card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="liquid-glass" style={{ padding: "24px", borderRadius: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <p style={{ fontSize: "0.72rem", letterSpacing: "3px", color: "rgba(217,70,239,0.8)", marginBottom: "16px", fontWeight: "bold" }}>RECENT PROJECT</p>
                  {profile?.lastCityUrl ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {githubUsername && (
                        <InfoRow icon={IconUser} label="GitHub User" value={githubUsername} accent="#f472b6" />
                      )}
                      {repoName && (
                        <InfoRow icon={IconLayers} label="Repository" value={repoName} accent="#d946ef" />
                      )}
                      <InfoRow icon={IconGlobe} label="Project URL" value={profile.lastCityUrl} accent="#9333ea" />
                      {/* Open project button */}
                      <Link href="/" style={{ textDecoration: "none", marginTop: "4px" }}>
                        <button
                          className="liquid-glass-btn"
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "12px",
                            border: "1px solid rgba(217,70,239,0.3)",
                            color: "#d946ef",
                            fontSize: "0.85rem",
                            fontWeight: "bold",
                            letterSpacing: "2px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            background: "rgba(217,70,239,0.07)",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(217,70,239,0.18)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(217,70,239,0.25)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(217,70,239,0.07)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                          {IconLayers}
                          OPEN PROJECT
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      borderRadius: "14px",
                      border: "1px dashed rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.35)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                    }}>
                      <div style={{ marginBottom: "16px", color: "rgba(255,255,255,0.2)" }}>
                        {IconGhost}
                      </div>
                      <p style={{ fontSize: "0.85rem", letterSpacing: "1px", marginBottom: "14px" }}>No project saved yet</p>
                      <Link href="/" style={{ textDecoration: "none" }}>
                        <span style={{
                          display: "inline-block", padding: "8px 20px", borderRadius: "999px",
                          border: "1px solid rgba(0,255,255,0.3)", color: "#00ffff", fontSize: "0.8rem",
                          letterSpacing: "2px", cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}>
                          CREATE PROJECT →
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>

            </div>

          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </div>
  );
}
