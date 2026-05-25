import React, { useEffect, useRef } from "react";

type OverlayType = "matrix" | "glitch" | "zen" | "doom" | "none";

interface ThemeEffectsOverlayProps {
  type: OverlayType;
  isCritical: boolean;
  isOvertime: boolean;
  isGlobal?: boolean;
}

export const ThemeEffectsOverlay: React.FC<ThemeEffectsOverlayProps> = ({
  type,
  isCritical,
  isOvertime,
  isGlobal = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Matrix Rain Canvas Effect
  useEffect(() => {
    if (type !== "matrix") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = Math.min(window.innerWidth, 8192));
    let height = (canvas.height = Math.min(window.innerHeight, 8192));

    const handleResize = () => {
      if (!canvas) return;
      // Cap dimensions to a safe maximum to prevent "Canvas exceeds max size" errors
      const safeWidth = Math.min(window.innerWidth, 8192);
      const safeHeight = Math.min(window.innerHeight, 8192);
      width = canvas.width = safeWidth;
      height = canvas.height = safeHeight;
    };
    window.addEventListener("resize", handleResize);

    // Get color dynamically from CSS custom variables set on the root/modal
    const getThemeColors = () => {
      const computed = getComputedStyle(document.documentElement);
      const textCol = computed.getPropertyValue("--theme-color-panic").trim() || "#00ff00";
      const bgCol = computed.getPropertyValue("--theme-color-overlay-bg").trim() || "rgba(0, 5, 0, 0.9)";
      return { textCol, bgCol };
    };

    const fontSize = 14;
    const columns = Math.ceil(width / fontSize);
    const rainDrops: number[] = Array(columns).fill(1);

    // Matrix characters (Katankana + binary)
    const chars = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ10";

    const draw = () => {
      const colors = getThemeColors();
      
      // Draw faded background
      ctx.fillStyle = colors.bgCol.includes("rgba") ? colors.bgCol : "rgba(0, 5, 0, 0.08)";
      // Make sure we have some transparency to create trails
      if (!ctx.fillStyle.includes("0.")) {
        ctx.fillStyle = "rgba(0, 5, 0, 0.08)";
      }
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = colors.textCol;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < rainDrops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [type]);

  if (type === "none") return null;

  return (
    <div className={`theme-effects-container overlay-${type} ${isGlobal ? "global-effects" : ""}`}>
      {type === "matrix" && (
        <canvas
          ref={canvasRef}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -1,
            pointerEvents: "none"
          }}
        />
      )}

      {type === "glitch" && (
        <>
          <div className="crt-scanlines" />
          <div className="crt-glitch-bar" />
          <div className="crt-vignette" />
        </>
      )}

      {type === "zen" && (
        <div className="zen-blobs-wrapper">
          <div className="zen-blob blob-1" />
          <div className="zen-blob blob-2" />
          <div className="zen-blob blob-3" />
        </div>
      )}

      {type === "doom" && (
        <div 
          className={`doom-vignette-overlay ${isCritical ? "critical-strobe" : ""} ${isOvertime ? "overtime-strobe" : ""}`} 
        />
      )}
    </div>
  );
};
