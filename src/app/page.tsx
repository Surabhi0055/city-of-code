"use client";

import { useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import GradualBlur from "@/components/ui/GradualBlur";
import GradientText from "@/components/ui/GradientText";
import CyberCity from "@/components/three/CyberCity";
import CityBuildings from "@/components/three/CityBuildings";
import InfoPanel from "@/components/three/InfoPanel";
import { parseGitHubUrl, fetchRepoData } from "@/lib/github";
import { buildCityLayout, BuildingData, RoadData, DistrictData } from "@/lib/cityLayout";

function ScrollCamera({ scrollY, maxScroll, isHomepage }: { scrollY: number; maxScroll: number; isHomepage: boolean }) {
  useFrame((state) => {
    if (!isHomepage) return; // Only fly through on the homepage

    const mScroll = Math.max(maxScroll, 1);
    const progress = Math.min(scrollY / mScroll, 1.0);
    
    // Smoothly interpolate camera position deeper into the neon city
    // Starts at z=40, flies over the city to z=-20
    const targetZ = THREE.MathUtils.lerp(40, -10, progress);
    
    // Starts high (y=8), rises up slightly to look over buildings (y=15)
    const targetY = THREE.MathUtils.lerp(8, 20, progress);
    
    state.camera.position.lerp(new THREE.Vector3(0, targetY, targetZ), 0.05);
    
    // Keep the camera pointing far into the horizon towards the synthwave sun
    state.camera.lookAt(0, 5, -120);
  });
  return null;
}

const LegendCard = ({ color, title, subtitle, icon }: { color: string, title: string, subtitle: string, icon?: React.ReactNode }) => {
  return (
    <div className="liquid-glass" style={{
      padding: "20px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${color}40`,
      borderRadius: "16px",
      boxShadow: `0 4px 30px ${color}15`
    }}>
       <div style={{
         width: "60px", height: "60px", borderRadius: "12px", flexShrink: 0,
         background: `linear-gradient(135deg, ${color}, transparent)`,
         boxShadow: `0 0 20px ${color}50`,
         border: `1px solid ${color}80`,
         display: "flex", alignItems: "center", justifyContent: "center",
         color: "#fff", fontSize: "1.2rem", fontWeight: "bold", fontFamily: "monospace"
       }}>
         {icon}
       </div>
       <div>
         <h4 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "bold", marginBottom: "4px" }}>{title}</h4>
         <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", margin: 0 }}>{subtitle}</p>
       </div>
    </div>
  );
}

const IconCode = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>;
const IconLayout = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>;
const IconDatabase = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>;
const IconFileText = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconArrowUpDown = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 9 12 5 16 9"></polyline><polyline points="16 15 12 19 8 15"></polyline><line x1="12" y1="5" x2="12" y2="19"></line></svg>;
const IconGrid = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconGitHub = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>;
const IconLinkedIn = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;
const IconSun = (
  <svg width="36" height="36" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="sunGradApp" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffcc00" />
        <stop offset="50%" stopColor="#ff6600" />
        <stop offset="100%" stopColor="#ff0088" />
      </linearGradient>
      <mask id="stripeMaskApp">
        <rect width="100" height="100" fill="white" />
        {[...Array(10)].map((_, i) => (
          <rect key={i} x="0" y={50 + i * 10} width="100" height="4.5" fill="black" />
        ))}
      </mask>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#sunGradApp)" mask="url(#stripeMaskApp)" />
  </svg>
);

export default function Home() {
  const [url, setUrl] = useState("");
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [roads, setRoads] = useState<RoadData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Info panel state
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [explanation, setExplanation] = useState("");
  const [fileCode, setFileCode] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Store owner/repo for file fetching
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string } | null>(null);

  // Track scroll position for the homepage background parallax
  const [scrollY, setScrollY] = useState(0);
  const [maxScroll, setMaxScroll] = useState(1500);

  async function handleGenerate() {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setError("Invalid GitHub URL. Try: https://github.com/owner/repo");
      return;
    }

    setLoading(true);
    setError("");
    setBuildings([]);
    setRoads([]);
    setDistricts([]);
    setSelectedBuilding(null);
    setExplanation("");

    try {
      // Guarantee at least 3.5 seconds of loading time for the epic sun transition
      const [repoData] = await Promise.all([
        fetchRepoData(parsed.owner, parsed.repo),
        new Promise(resolve => setTimeout(resolve, 3500))
      ]);
      
      const cityData = buildCityLayout(repoData.files);
      setBuildings(cityData.buildings);
      setRoads(cityData.roads);
      setDistricts(cityData.districts);
      setRepoInfo({ owner: parsed.owner, repo: parsed.repo });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Called when a building is clicked in 3D
  const handleSelectBuilding = useCallback((data: BuildingData) => {
    setSelectedBuilding(data);
    setExplanation("");
    setFileCode("");
    setIsAnalyzing(false);
  }, []);

  // Called when "Analyze ->" is clicked on the info panel
  const handleBuildingClick = useCallback(
    async (data: BuildingData) => {
      if (!repoInfo) return;

      setExplanation("");
      setFileCode("");
      setIsAnalyzing(true);

      try {
        // 1. Fetch the actual file content from GitHub
        const content = await fetchFileContent(
          repoInfo.owner,
          repoInfo.repo,
          data.filePath
        );
        setFileCode(content);

        // 2. Stream Claude's explanation word by word
        await streamFileExplanation(
          data.fileName,
          content,
          (chunk) => {
            // Append each chunk to explanation as it streams
            setExplanation((prev) => prev + chunk);
          },
          () => {
            setIsAnalyzing(false);
          }
        );
      } catch (err) {
        console.error(err);
        setExplanation(
          `Error analyzing file: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        setIsAnalyzing(false);
      }
    },
    [repoInfo]
  );

  function handleClosePanel() {
    setSelectedBuilding(null);
    setExplanation("");
    setFileCode("");
    setIsAnalyzing(false);
  }

  return (
    <main style={{ 
      width: "100vw", 
      height: "100vh", 
      position: "relative", 
      display: "flex", 
      overflow: "hidden", 
      backgroundColor: "#06001a",
    }}>
      <LoadingOverlay loading={loading} />
      
      {/* Main Content Area */}
      <div style={{ flex: 1, position: "relative" }}>
        
          {!repoInfo && !loading && (
            <div 
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100vh",
                zIndex: 10,
                overflow: "hidden"
              }}
            >
              <div 
                onScroll={(e) => {
                  const target = e.currentTarget;
                  setScrollY(target.scrollTop);
                  setMaxScroll(target.scrollHeight - target.clientHeight);
                }}
                style={{ 
                  height: "100%", 
                  overflowY: "auto", 
                  position: "relative",
                  padding: "0"
                }}
              >
                {/* Spacer to push card down */}
                <div style={{ height: "75vh", display: "flex", justifyContent: "center", alignItems: "center" }}>

                </div>

                <div className="liquid-glass" style={{ 
                  margin: "0 auto",
                  width: "90%", 
                  maxWidth: "1000px", 
                  padding: "60px 40px 80px 40px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: "20vh"
                }}>
                  <div style={{ width: "100%", maxWidth: "800px", marginBottom: "40px", textAlign: "center" }}>
                    <div className="subheading-container" style={{
                      fontSize: "2rem",
                      margin: "0 0 16px 0",
                      fontWeight: "bold",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "rgba(255, 255, 255, 0.9)",
                      textShadow: "0 0 15px rgba(255, 255, 255, 0.6)"
                    }}>
                      Visualize Your Codebase
                    </div>
                    <h1 style={{
                      fontSize: "6rem",
                      margin: "0 0 16px 0",
                      paddingBottom: "10px",
                      fontWeight: 900,
                      lineHeight: "1.2",
                      letterSpacing: "0.5px",
                    }}>
                      <GradientText
                        colors={["#F5D76E", "#59ABE3", "#F1828D"]}
                        animationSpeed={4}
                        showBorder={false}
                        direction="horizontal"
                        style={{ maxWidth: "100%", display: "block" }}
                      >
                        <span style={{ display: "block" }}>Every file is a building.</span>
                        <span style={{ display: "block" }}>Every folder is a district.</span>
                      </GradientText>
                    </h1>
                    <p style={{
                      fontSize: "1.25rem",
                      color: "rgba(255, 255, 255, 0.8)",
                      maxWidth: "600px",
                      margin: "0 auto",
                      lineHeight: "1.6",
                      textShadow: "0 0 10px rgba(255, 255, 255, 0.4)"
                    }}>
                      Paste a GitHub repository link below to instantly generate a living 3D city representing its architecture.
                    </p>
                  </div>
                  <div style={{ width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} style={{ width: "100%" }}>
                      <div className="rainbow-border-wrap" style={{ display: "flex", alignItems: "center" }}>
                        <div className="border-spinner"></div>
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://github.com/username/repo"
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "1rem",
                            padding: url ? "12px 140px 12px 20px" : "12px 20px",
                            outline: "none",
                            letterSpacing: "1px",
                            transition: "all 0.3s ease",
                          }}
                          autoComplete="off"
                          spellCheck="false"
                          disabled={loading}
                          onFocus={(e) => { e.target.parentElement?.classList.add('focused'); }}
                          onBlur={(e) => { e.target.parentElement?.classList.remove('focused'); }}
                        />
                        <AnimatePresence>
                          {url && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.9, x: 10 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.9, x: 10 }}
                              transition={{ duration: 0.2 }}
                              type="submit"
                              disabled={loading}
                              className="liquid-glass-btn"
                              style={{
                                position: "absolute",
                                right: "6px",
                                border: "none",
                                borderRadius: "8px",
                                color: "#fff",
                                padding: "8px 16px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                opacity: loading ? 0.7 : 1,
                                transition: "all 0.2s ease",
                                zIndex: 10,
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                              }}
                              onMouseEnter={(e) => {
                                if (!loading) {
                                  e.currentTarget.style.transform = "scale(1.05)";
                                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(89, 82, 156, 0.6)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              {loading ? "PROCESSING..." : "GENERATE"}
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </form>
                    
                    {error && !repoInfo && (
                      <div
                        style={{
                          width: "100%",
                          color: "#E52F20",
                          fontSize: "14px",
                          background: "rgba(4, 8, 16, 0.9)",
                          padding: "12px 24px",
                          borderRadius: "8px",
                          border: "1px solid #E52F20",
                          boxShadow: "0 0 20px rgba(229, 47, 32, 0.2)",
                          marginTop: "-10px",
                        }}
                      >
                        {error}
                      </div>
                    )}
                  </div>
                </div>

                {/* How it Works Section */}
                <div style={{
                  margin: "0 auto",
                  width: "90%",
                  maxWidth: "1000px",
                  marginBottom: "20vh",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10vh",
                }}>
                  <h2 style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#fff",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    textShadow: "0 0 15px rgba(255, 255, 255, 0.4)",
                    textAlign: "center",
                    marginBottom: "20px",
                    position: "relative",
                    zIndex: 10
                  }}>
                    How it Works
                  </h2>
                  
                  {[
                    { title: "Fetch & Parse", desc: "Provide a GitHub link. We thoroughly analyze your repository's structure, rendering every single file and tracking its complex dependencies." },
                    { title: "City Planning", desc: "Folders organically grow into districts. Files reach towards the sky as buildings. The height of a building visualizes its complexity, while its vibrant color represents the programming language." },
                    { title: "AI Code Architect", desc: "Click on any building within the city to get an instant, AI-generated architectural breakdown explaining exactly how that specific file fits into your broader codebase." }
                  ].map((step, i) => {
                    const blobColors = [
                      "radial-gradient(circle at center, rgba(89,171,227,0.4) 0%, rgba(89,171,227,0.15) 40%, rgba(0,0,0,0) 70%)",
                      "radial-gradient(circle at center, rgba(245,215,110,0.3) 0%, rgba(245,215,110,0.1) 40%, rgba(0,0,0,0) 70%)",
                      "radial-gradient(circle at center, rgba(245,215,110,0.35) 0%, rgba(241,130,141,0.15) 40%, rgba(0,0,0,0) 70%)"
                    ];
                    return (
                      <div key={i} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexDirection: i % 2 === 0 ? "row" : "row-reverse",
                        textAlign: i % 2 === 0 ? "left" : "right",
                        position: "relative",
                        zIndex: 10,
                        gap: "40px"
                      }}>
                        {/* Text Card */}
                        <div className="liquid-glass" style={{
                          padding: "40px",
                          maxWidth: "600px",
                          flex: "1",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: i % 2 === 0 ? "flex-start" : "flex-end",
                          zIndex: 2
                        }}>
                          <h3 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "16px" }}>
                            <GradientText
                              colors={["#F5D76E", "#59ABE3", "#F1828D"]}
                              animationSpeed={4}
                              showBorder={false}
                              direction="horizontal"
                            >
                              {step.title}
                            </GradientText>
                          </h3>
                          <p style={{ color: "#fff", lineHeight: "1.8", fontSize: "1.1rem" }}>
                            {step.desc}
                          </p>
                        </div>
                        
                        {/* Blurred Color Orb Beside Card bleeding off the edge */}
                        <div style={{
                          flex: "1",
                          position: "relative"
                        }}>
                          <div style={{
                            position: "absolute",
                            top: "50%",
                            transform: "translateY(-50%)",
                            [i % 2 === 0 ? "right" : "left"]: "-20%",
                            width: "500px",
                            height: "500px",
                            borderRadius: "50%",
                            background: blobColors[i],
                            filter: "blur(70px)",
                            zIndex: -1,
                            pointerEvents: "none"
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* The City Legend (Visual Map Key) */}
                <div style={{
                  marginTop: "15vh",
                  marginBottom: "20vh",
                  padding: "0 2vw",
                  display: "flex",
                  flexDirection: "column",
                  gap: "80px",
                  position: "relative",
                  zIndex: 10
                }}>
                  
                  {/* Top Split: Title and Structural Cards */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "60px", alignItems: "center" }}>
                    
                    {/* Left side text */}
                    <div style={{ flex: "1 1 400px" }}>
                      <h2 style={{
                        fontSize: "2.5rem",
                        fontWeight: "bold",
                        marginBottom: "24px",
                        textTransform: "uppercase",
                        letterSpacing: "2px"
                      }}>
                        <GradientText
                          colors={["#F5D76E", "#59ABE3", "#F1828D"]}
                          animationSpeed={4}
                          showBorder={false}
                          direction="horizontal"
                        >
                          The City Legend
                        </GradientText>
                      </h2>
                      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.1rem", lineHeight: 1.8 }}>
                        Every element in the generated city represents a specific aspect of your codebase. 
                        The visual language helps you immediately grasp architecture and complexity at a glance.
                      </p>
                    </div>

                    {/* Right side: Structural Cards */}
                    <div style={{ 
                      flex: "1.5 1 500px", 
                      display: "flex", 
                      flexDirection: "column",
                      gap: "40px" 
                    }}>
                      {/* Building Shapes Row */}
                      <div>
                        <h3 style={{ color: "#fff", marginBottom: "16px", fontSize: "1.2rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.9 }}>Building Shapes (File Types)</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                          <LegendCard color="#F5D76E" icon={IconCode} title="Tall Towers" subtitle="Logic (.js, .ts, .py, .cpp...)" />
                          <LegendCard color="#59ABE3" icon={IconLayout} title="Wide Slabs" subtitle="Styling (.css, .html...)" />
                          <LegendCard color="#F1828D" icon={IconDatabase} title="Solid Blocks" subtitle="Configs (.json, .yml...)" />
                          <LegendCard color="#7bed9f" icon={IconFileText} title="Sharp Spires" subtitle="Docs (.md, .txt...)" />
                        </div>
                      </div>

                      {/* Metrics Row */}
                      <div>
                        <h3 style={{ color: "#fff", marginBottom: "16px", fontSize: "1.2rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.9 }}>Visual Metrics</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                          <LegendCard color="#ffffff" icon={IconArrowUpDown} title="Building Height" subtitle="File Size / Complexity" />
                          <LegendCard color="#a29bfe" icon={IconGrid} title="The City Grid" subtitle="Entire Repository" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Full Width: District Colors */}
                  <div className="liquid-glass" style={{
                    padding: "40px",
                    borderRadius: "24px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center"
                  }}>
                    <h3 style={{ marginBottom: "16px", fontSize: "1.8rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px" }}>
                      <GradientText
                        colors={["#F5D76E", "#59ABE3", "#F1828D"]}
                        animationSpeed={4}
                        showBorder={false}
                        direction="horizontal"
                      >
                        District Colors (Folders)
                      </GradientText>
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", marginBottom: "30px", lineHeight: 1.5, maxWidth: "800px" }}>
                      The largest folders in your repository are assigned distinct neon colors. Every building (file) within that folder shares its district's color, grouping related code visually.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px" }}>
                      {[
                        { c: "#00ffff", l: "src/" }, { c: "#2563eb", l: "components/" },
                        { c: "#d946ef", l: "lib/" }, { c: "#38bdf8", l: "api/" },
                        { c: "#f472b6", l: "public/" }, { c: "#4338ca", l: "styles/" },
                        { c: "#9333ea", l: "utils/" }, { c: "#e11d48", l: "assets/" }
                      ].map((swatch, idx) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                          <motion.div 
                            whileHover={{ scale: 1.3 }}
                            style={{ 
                              width: "50px", height: "50px", borderRadius: "12px", 
                              background: swatch.c, 
                              boxShadow: `0 0 20px ${swatch.c}80`, 
                              border: `1px solid ${swatch.c}`, cursor: "pointer" 
                            }} 
                          />
                          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", fontFamily: "monospace" }}>{swatch.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Call to Action */}
                <div style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: "15vh",
                  marginBottom: "5vh",
                  padding: "0 20px",
                  position: "relative",
                  zIndex: 20
                }}>
                  <h2 style={{
                    fontSize: "2.5rem",
                    fontWeight: "bold",
                    color: "rgba(255,255,255,0.9)",
                    marginBottom: "40px",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    textShadow: "0 0 15px rgba(255, 255, 255, 0.4)"
                  }}>
                    Paste your repo and build your city
                  </h2>
                  <div style={{ width: "100%", maxWidth: "600px" }}>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} style={{ width: "100%" }}>
                      <div className="rainbow-border-wrap" style={{ display: "flex", alignItems: "center" }}>
                        <div className="border-spinner"></div>
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://github.com/username/repo"
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "1rem",
                            padding: url ? "12px 140px 12px 20px" : "12px 20px",
                            outline: "none",
                            letterSpacing: "1px",
                            transition: "all 0.3s ease",
                          }}
                          autoComplete="off"
                          spellCheck="false"
                          disabled={loading}
                          onFocus={(e) => { e.target.parentElement?.classList.add('focused'); }}
                          onBlur={(e) => { e.target.parentElement?.classList.remove('focused'); }}
                        />
                        <AnimatePresence>
                          {url && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.9, x: 10 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.9, x: 10 }}
                              transition={{ duration: 0.2 }}
                              type="submit"
                              disabled={loading}
                              className="liquid-glass-btn"
                              style={{
                                position: "absolute",
                                right: "6px",
                                border: "none",
                                borderRadius: "8px",
                                color: "#fff",
                                padding: "8px 16px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                opacity: loading ? 0.7 : 1,
                                transition: "all 0.2s ease",
                                zIndex: 10,
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                              }}
                              onMouseEnter={(e) => {
                                if (!loading) {
                                  e.currentTarget.style.transform = "scale(1.05)";
                                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(89, 82, 156, 0.6)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              {loading ? "PROCESSING..." : "GENERATE"}
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Main Footer */}
                <footer className="liquid-glass" style={{
                  width: "100%",
                  marginTop: "10vh", 
                  padding: "80px 4vw 25vh 4vw", // Huge padding at the bottom for extra space
                  position: "relative",
                  zIndex: 20
                }}>
                  <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "40px", alignItems: "flex-start" }}>
                    
                    {/* Left Column: Logo & Socials */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      
                      {/* Clickable Logo Area */}
                      <a href="/" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none", cursor: "pointer" }}>
                        {/* Synthwave Sun Logo */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {IconSun}
                        </div>
                        <h2 style={{ fontSize: "2rem", fontWeight: "bold", letterSpacing: "3px", margin: 0 }}>
                          <GradientText colors={["#F5D76E", "#59ABE3", "#F1828D"]} animationSpeed={4} showBorder={false}>
                            CITY OF CODE
                          </GradientText>
                        </h2>
                      </a>
                      
                      {/* Social Icons */}
                      <div style={{ display: "flex", gap: "20px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                        <a href="https://github.com/Surabhi0055" target="_blank" rel="noopener noreferrer" style={{ transition: "color 0.3s ease", color: "inherit" }} onMouseOver={(e) => e.currentTarget.style.color = "#ff00cc"} onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>
                          {IconGitHub}
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" style={{ transition: "color 0.3s ease", color: "inherit" }} onMouseOver={(e) => e.currentTarget.style.color = "#38bdf8"} onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>
                          {IconLinkedIn}
                        </a>
                      </div>
                    </div>

                    {/* Right Column: Links */}
                    <div style={{ 
                      display: "flex", 
                      gap: "40px", 
                      color: "rgba(255,255,255,0.6)", 
                      fontSize: "0.95rem", 
                      letterSpacing: "2px", 
                      textTransform: "uppercase",
                      fontWeight: "bold",
                      alignItems: "center",
                      marginTop: "10px"
                    }}>
                      <a href="#" style={{ cursor: "pointer", transition: "color 0.3s ease", color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.color = "#00ffff"} onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>Home</a>
                      <a href="#" style={{ cursor: "pointer", transition: "color 0.3s ease", color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.color = "#F5D76E"} onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>About</a>
                      <a href="#" style={{ cursor: "pointer", transition: "color 0.3s ease", color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.color = "#ff00cc"} onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>Docs</a>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div style={{ maxWidth: "1200px", margin: "40px auto 20px", height: "1px", width: "100%", background: "linear-gradient(90deg, rgba(255,0,255,0.3), transparent)" }} />
                  
                  {/* Copyright */}
                  <div style={{ maxWidth: "1200px", margin: "0 auto", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", fontFamily: "monospace" }}>
                    © {new Date().getFullYear()} CITY OF CODE. BUILT WITH NEON AND REACT THREE FIBER.
                  </div>
                </footer>
              </div>

              <GradualBlur
                target="parent"
                position="bottom"
                height="8rem"
                strength={1.5}
                divCount={5}
                curve="bezier"
                exponential={true}
                opacity={1}
                zIndex={30}
              />
            </div>
          )}

      {/* The secondary input UI has been removed. Users can click the CITY_OF_CODE logo to return to the homepage to generate a new city. */}



        {/* Error message */}
        {error && repoInfo && (
          <div
            style={{
              position: "absolute",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              color: "#E52F20",
              fontSize: "14px",
              background: "rgba(4, 8, 16, 0.9)",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "1px solid #E52F20",
              boxShadow: "0 0 20px rgba(229, 47, 32, 0.2)",
            }}
          >
            {error}
          </div>
        )}

        {/* 3D Canvas */}
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          filter: !repoInfo ? "brightness(0.65)" : "none",
          transition: !repoInfo ? "none" : "filter 1s ease",
        }}>
          <Canvas
            camera={{ position: [0, 8, 40], fov: 50 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              powerPreference: "high-performance",
              stencil: true,
            }}
          >
            <ScrollCamera scrollY={scrollY} maxScroll={maxScroll} isHomepage={!repoInfo} />
            <ambientLight intensity={1.2} color="#1a0033" />
            <pointLight position={[0,  80, 0]}    color="#aa00ff" intensity={3}   distance={400} />
            <pointLight position={[80, 50, 80]}   color="#ff00cc" intensity={2}   distance={300} />
            <pointLight position={[-60,40,-60]}   color="#6600ff" intensity={1.5} distance={300} />

            {(() => {
              const displayBuildings = buildings;
              const displayRoads = roads;
              const displayDistricts = districts;
              
              if (!repoInfo) {
                // On Homepage, just render the ground, sun, and stars. No buildings.
                return <CyberCity gridSize={180} buildings={[]} roads={[]} districts={[]} isHomepage={true} loading={loading} />;
              }

              let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
              displayBuildings.forEach(b => {
                if (b.x - b.width / 2 < minX) minX = b.x - b.width / 2;
                if (b.x + b.width / 2 > maxX) maxX = b.x + b.width / 2;
                if (b.z - b.depth / 2 < minZ) minZ = b.z - b.depth / 2;
                if (b.z + b.depth / 2 > maxZ) maxZ = b.z + b.depth / 2;
              });
              let gridSize = Math.max(maxX - minX, maxZ - minZ) + 20;
              if (gridSize < 180) gridSize = 180; // Ensure camera is not engulfed by fog!
              
              return (
                <CyberCity gridSize={gridSize} buildings={displayBuildings} roads={displayRoads} districts={displayDistricts} isHomepage={false} loading={loading} />
              );
            })()}
            <CityBuildings
              buildings={buildings}
              onBuildingClick={handleSelectBuilding}
            />
          </Canvas>
          
          {/* Sunset edge glow and blur on the sides */}
          {!repoInfo && (
            <div style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: "linear-gradient(to right, rgba(120, 0, 200, 0.18) 0%, transparent 22%, transparent 78%, rgba(120, 0, 200, 0.18) 100%)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              maskImage: "linear-gradient(to right, black 0%, transparent 22%, transparent 78%, black 100%)",
              WebkitMaskImage: "linear-gradient(to right, black 0%, transparent 22%, transparent 78%, black 100%)",
              zIndex: 5,
              transform: `translateY(-${scrollY * 0.8}px)`
            }} />
          )}
        </div>
        
        {/* AI Info Panel */}
        {repoInfo && (
          <InfoPanel
            building={selectedBuilding}
            explanation={explanation}
            fileCode={fileCode}
            isLoading={isAnalyzing}
            onClose={handleClosePanel}
            onAnalyze={() => selectedBuilding && handleBuildingClick(selectedBuilding)}
          />
        )}
      </div>
    </main>
  );
}
