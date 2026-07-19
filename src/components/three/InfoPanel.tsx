"use client";

import { useEffect, useRef, useState } from "react";
import { BuildingData } from "@/lib/cityLayout";

interface InfoPanelProps {
  building: BuildingData | null;
  explanation: string;
  fileCode?: string;
  isLoading: boolean;
  onClose: () => void;
  onAnalyze: () => void;
}

function formatText(text: string, color: string, isLoading: boolean) {
  const lines = text.split("\n");
  const textColor = "#00e5ff"; // High-visibility cyan for text accents

  return lines.map((line, lineIndex) => {
    const isLastLine = lineIndex === lines.length - 1;
    // Skip empty lines to avoid massive gaps, unless it's the last line being typed
    if (!line.trim() && !isLastLine) return <div key={lineIndex} style={{ height: "8px" }} />;

    const isBullet = /^[\*\-]\s+/.test(line);
    const cleanLine = line.replace(/^[\*\-]\s+/, "");

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const formattedParts = parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} style={{ color: textColor, fontWeight: 700, textShadow: `0 0 8px ${textColor}66` }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });

    return (
      <div key={lineIndex} style={{ display: "flex", gap: "14px", marginBottom: "8px", alignItems: "flex-start" }}>
        {isBullet && (
          <div style={{ marginTop: "7px", flexShrink: 0 }}>
            {/* Cyberpunk double chevron icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
              <polyline points="14 18 20 12 14 6" opacity="0.4" />
            </svg>
          </div>
        )}
        <div style={{ flex: 1 }}>
          {formattedParts}
          {isLastLine && isLoading && (
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "18px",
                background: textColor,
                marginLeft: "6px",
                verticalAlign: "text-bottom",
                animation: "blink 0.7s infinite",
                boxShadow: `0 0 8px ${textColor}`,
              }}
            />
          )}
        </div>
      </div>
    );
  });
}

export default function InfoPanel({
  building,
  explanation,
  fileCode,
  isLoading,
  onClose,
  onAnalyze,
}: InfoPanelProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "code">("overview");

  // Auto scroll as text streams
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [explanation]);

  if (!building) return null;

  const color = building.emissiveColor;
  const isAnalyzable = !building.fileName.match(
    /\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|mp3|woff|woff2|ttf|eot|pdf)$/i
  );

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .big-analyze-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid ${color}55;
          color: ${color};
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.05em;
        }
        .big-analyze-btn:hover {
          background: ${color}22;
          box-shadow: 0 0 20px ${color}44;
          transform: translateY(-2px);
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          width: "450px",
          maxWidth: "100vw",
          background: "rgba(6, 8, 16, 0.35)", // Much more transparent glass
          borderLeft: `1px solid ${color}44`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: `-10px 0 40px rgba(0,0,0,0.3), inset 2px 0 20px ${color}11`,
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "32px 24px",
            borderBottom: `1px solid ${color}33`,
            borderLeft: `4px solid ${color}`,
            background: `linear-gradient(90deg, ${color}15, transparent)`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "12px",
                color: "#00e5ff",
                textShadow: `0 0 8px #00e5ff66`,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                margin: "0 0 6px",
              }}
            >
              {building.folderName}/
            </p>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#ffffff",
                margin: "0 0 8px",
                textShadow: `0 0 10px ${color}66`,
              }}
            >
              {building.fileName}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 16px", color: "#ffffff88", fontSize: "12px", marginTop: "12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#00e5ff", textShadow: "0 0 8px #00e5ff66" }}>[SIZE]</span> {(building.fileSize / 1024).toFixed(1)} KB
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#00e5ff", textShadow: "0 0 8px #00e5ff66" }}>[TYPE]</span> <span style={{ textTransform: "uppercase" }}>{building.buildingType}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#00e5ff", textShadow: "0 0 8px #00e5ff66" }}>[LOC]</span> {Math.round(building.height * 10)} lines
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#00e5ff", textShadow: "0 0 8px #00e5ff66" }}>[LOC_XYZ]</span> {Math.round(building.x)}, {Math.round(building.z)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#00e5ff", textShadow: "0 0 8px #00e5ff66" }}>[HEX]</span> {building.emissiveColor}
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: "rgba(0,0,0,0.2)",
              border: `1px solid ${color}44`,
              borderRadius: "8px",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "16px",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = `${color}44`)}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.2)")}
          >
            ✕
          </button>
        </div>

        {/* Body content */}
        <div
          ref={textRef}
          style={{
            flex: 1,
            padding: "32px",
            overflowY: "auto",
            scrollbarWidth: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Tabs */}
          {fileCode && (
            <div style={{ display: "flex", gap: "8px", borderBottom: `1px solid ${color}44`, paddingBottom: "12px", marginBottom: "16px" }}>
              <button
                onClick={() => setActiveTab("overview")}
                style={{
                  background: activeTab === "overview" ? `${color}33` : "transparent",
                  color: activeTab === "overview" ? "#fff" : "#a8b2d1",
                  border: `1px solid ${activeTab === "overview" ? color : "transparent"}`,
                  padding: "6px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  transition: "all 0.2s"
                }}
              >
                OVERVIEW
              </button>
              <button
                onClick={() => setActiveTab("code")}
                style={{
                  background: activeTab === "code" ? `${color}33` : "transparent",
                  color: activeTab === "code" ? "#fff" : "#a8b2d1",
                  border: `1px solid ${activeTab === "code" ? color : "transparent"}`,
                  padding: "6px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  transition: "all 0.2s"
                }}
              >
                CODE
              </button>
            </div>
          )}

          {activeTab === "code" && fileCode ? (
            <div style={{
              background: "rgba(0,0,0,0.4)",
              border: `1px solid ${color}44`,
              borderRadius: "8px",
              padding: "16px",
              flex: 1,
              overflowY: "auto",
              fontSize: "13px",
              color: "#a8b2d1",
              scrollbarWidth: "thin",
              scrollbarColor: `${color}44 transparent`
            }}>
              <pre style={{ margin: 0, fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                <code>{fileCode}</code>
              </pre>
            </div>
          ) : (
            <>
              {/* State 1: Ready to Analyze */}
              {!isLoading && !explanation && (
                <div style={{ margin: "auto", textAlign: "center", width: "100%" }}>
                  {isAnalyzable ? (
                    <>
                      <div style={{ marginBottom: "24px", color: "#ffffff88", fontSize: "16px" }}>
                        Ready to scan source code for architectural insights.
                      </div>
                      <button className="big-analyze-btn" onClick={onAnalyze}>
                        Scan & Analyze File
                      </button>
                    </>
                  ) : (
                    <div style={{ color: "#ffffff55", fontSize: "16px", padding: "20px", border: "1px dashed #ffffff22", borderRadius: "8px" }}>
                      File is a binary asset and cannot be analyzed.
                    </div>
                  )}
                </div>
              )}

              {/* State 2: Loading (Scanning) */}
              {isLoading && !explanation && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      color: `${color}`,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    {/* Cyberpunk rotating crosshair */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      style={{ animation: "spin 2s linear infinite", flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                      <circle cx="12" cy="12" r="3" fill={color} />
                    </svg>
                    Scanning Architecture...
                  </div>
                  {[95, 80, 88, 70].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        height: "14px",
                        width: `${w}%`,
                        background: `${color}22`,
                        borderRadius: "6px",
                        animation: "pulse 1.5s infinite",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* State 3: Streamed Explanation */}
              {explanation && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div
                    style={{
                      fontSize: "16px", 
                      color: "#e2e8f0",
                      lineHeight: "2.0",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {formatText(explanation, color, isLoading)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {(!isLoading && explanation) && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: `1px solid ${color}22`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
              color: "#ffffff55",
            }}
          >
            <span>AI SCAN COMPLETE</span>
          </div>
        )}
      </div>
    </>
  );
}
