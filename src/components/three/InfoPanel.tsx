"use client";

import { useEffect, useRef } from "react";
import { BuildingData } from "@/lib/cityLayout";

interface InfoPanelProps {
  building: BuildingData | null;
  explanation: string;
  isLoading: boolean;
  onClose: () => void;
}

export default function InfoPanel({
  building,
  explanation,
  isLoading,
  onClose,
}: InfoPanelProps) {
  const textRef = useRef<HTMLDivElement>(null);

  // Auto scroll as text streams in
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [explanation]);

  if (!building) return null;

  // Parse bold **text** into styled spans
  function formatText(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} style={{ color: building?.emissiveColor || "#00ffff" }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        right: "24px",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 100,
        width: "320px",
        background: "rgba(4, 4, 16, 0.92)",
        border: `1px solid ${building.emissiveColor}44`,
        borderRadius: "16px",
        padding: "0",
        backdropFilter: "blur(20px)",
        boxShadow: `0 0 40px ${building.emissiveColor}22, inset 0 0 20px rgba(0,0,0,0.5)`,
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        overflow: "hidden",
        animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-50%) translateX(20px); opacity: 0; }
          to   { transform: translateY(-50%) translateX(0);    opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1;   }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${building.emissiveColor}22`,
          background: `linear-gradient(135deg, ${building.emissiveColor}11, transparent)`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Folder path */}
            <p
              style={{
                fontSize: "10px",
                color: `${building.emissiveColor}88`,
                margin: "0 0 4px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {building.folderName}/
            </p>
            {/* File name */}
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: building.emissiveColor,
                margin: "0 0 6px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {building.fileName}
            </p>
            {/* Meta row */}
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ fontSize: "11px", color: "#ffffff66" }}>
                {(building.fileSize / 1024).toFixed(1)} KB
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: building.emissiveColor + "99",
                  textTransform: "uppercase",
                }}
              >
                {building.buildingType}
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${building.emissiveColor}44`,
              borderRadius: "6px",
              color: building.emissiveColor,
              cursor: "pointer",
              fontSize: "12px",
              padding: "4px 8px",
              marginLeft: "8px",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* AI explanation body */}
      <div style={{ padding: "16px 20px" }}>
        <div
          style={{
            fontSize: "10px",
            color: building.emissiveColor + "66",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: building.emissiveColor,
              animation: isLoading ? "pulse 1s infinite" : "none",
            }}
          />
          {isLoading && !explanation ? "Analyzing file..." : "AI Analysis"}
        </div>

        {/* Streaming text area */}
        <div
          ref={textRef}
          style={{
            fontSize: "12px",
            color: "#cccccc",
            lineHeight: "1.8",
            maxHeight: "280px",
            overflowY: "auto",
            scrollbarWidth: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {isLoading && !explanation ? (
            // Loading skeleton
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {[80, 95, 70].map((w, i) => (
                <div
                  key={i}
                  style={{
                    height: "10px",
                    width: `${w}%`,
                    background: building.emissiveColor + "22",
                    borderRadius: "4px",
                    animation: "pulse 1.5s infinite",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              {formatText(explanation)}
              {/* Blinking cursor while streaming */}
              {isLoading && (
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "14px",
                    background: building.emissiveColor,
                    marginLeft: "2px",
                    verticalAlign: "text-bottom",
                    animation: "blink 0.8s infinite",
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && explanation && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: `1px solid ${building.emissiveColor}22`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "10px", color: "#ffffff33" }}>
              powered by Claude
            </span>
            <span
              style={{
                fontSize: "10px",
                color: building.emissiveColor + "66",
              }}
            >
              ✓ complete
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
