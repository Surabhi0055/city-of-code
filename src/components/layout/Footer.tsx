"use client";

export default function Footer() {
  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        padding: "12px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 50,
        background: "linear-gradient(to top, rgba(4, 8, 16, 0.95) 0%, rgba(4, 8, 16, 0) 100%)",
        borderTop: "1px solid rgba(255, 0, 170, 0.2)",
        fontFamily: "monospace",
        color: "#008b8b",
        fontSize: "0.85rem",
      }}
    >
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <span>SYS.VER 1.0</span>
      </div>

      <div>
        © {new Date().getFullYear()} CITY OF CODE. ALL RIGHTS RESERVED.
      </div>

      <div style={{ display: "flex", gap: "16px" }}>
        <a 
          href="https://github.com/Surabhi0055"
          target="_blank"
          rel="noopener noreferrer"
          style={{ cursor: "pointer", transition: "color 0.2s", color: "#008b8b", textDecoration: "none" }} 
          onMouseEnter={(e) => e.currentTarget.style.color = "#ff00aa"} 
          onMouseLeave={(e) => e.currentTarget.style.color = "#008b8b"}
        >
          [GITHUB]
        </a>
        <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ff00aa"} onMouseLeave={(e) => e.currentTarget.style.color = "#008b8b"}>[TWITTER]</span>
      </div>
    </footer>
  );
}
