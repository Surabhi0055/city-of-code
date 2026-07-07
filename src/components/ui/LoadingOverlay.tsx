import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingOverlay({ loading }: { loading: boolean }) {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowSpinner(true);
      }, 1200); // Wait 1.2s for the 3D sun to zoom in before showing UI
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [loading]);

  return (
    <AnimatePresence>
      {showSpinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#040810",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}
          >
            <SunSpinner />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{
                fontFamily: "monospace",
                color: "#ff00aa",
                fontSize: "1.2rem",
                letterSpacing: "4px",
                textTransform: "uppercase",
              }}
            >
              [ GENERATING CITYSCAPE... ]
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SunSpinner() {
  return (
    <svg width="120" height="120" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffcc00" />
          <stop offset="50%" stopColor="#ff6600" />
          <stop offset="100%" stopColor="#ff0088" />
        </linearGradient>
        
        <mask id="stripeMask">
          {/* Base white (fully visible) */}
          <rect width="100" height="100" fill="white" />
          
          {/* Moving black stripes (transparent gaps) */}
          <motion.g
            animate={{ y: [0, -10] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          >
            {[...Array(10)].map((_, i) => (
              <rect key={i} x="0" y={50 + i * 10} width="100" height="4.5" fill="black" />
            ))}
          </motion.g>

          {/* Solid white top half to prevent stripes from crossing the horizon line */}
          <rect x="0" y="0" width="100" height="50" fill="white" />
        </mask>
      </defs>
      
      <circle cx="50" cy="50" r="50" fill="url(#sunGrad)" mask="url(#stripeMask)" />
    </svg>
  );
}
