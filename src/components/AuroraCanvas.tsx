import React, { useEffect, useRef } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { presets } from "../themes/presets";

interface AuroraCanvasProps {
    energyRating: number | null;
    blurAmount?: number;            // CSS Blur radius in pixels (default: 32)
    baseOpacity?: number;           // Max opacity multiplier (default: 0.45)
    yOffset?: number;               // Pixel offset to shift curtains vertically (default: -90)
    heightMultiplier?: number;      // Multiplier for curtain height
    waveSpeedMultiplier?: number;   // Multiplier for bottom wave speed
    raySpeedMultiplier?: number;    // Multiplier for ray drift speed
    numStars?: number;              // Number of stars in background
    starMaxY?: number;              // Max Y ratio for star placement (e.g. 0.45)
}

export const AuroraCanvas: React.FC<AuroraCanvasProps> = ({
    energyRating,
    blurAmount = 32,
    baseOpacity = 0.45,
    yOffset = -90,
    heightMultiplier = 1.0,
    waveSpeedMultiplier = 1.0,
    raySpeedMultiplier = 1.0,
    numStars = 70,
    starMaxY = 0.45
}) => {
    const starsCanvasRef = useRef<HTMLCanvasElement>(null);
    const auroraCanvasRef = useRef<HTMLCanvasElement>(null);

    const energyRatingRef = useRef<number | null>(energyRating);
    useEffect(() => {
        energyRatingRef.current = energyRating;
    }, [energyRating]);

    // Retrieve active theme sky configurations
    const activeThemeId = useThemeStore((state) => state.activeThemeId);
    const activeTheme = useThemeStore((state) => {
        const id = state.activeThemeId;
        if (id === "default") return null;
        return state.customThemes.find((t) => t.id === id) || presets.find((t) => t.id === id) || null;
    });
    const skyType = activeTheme?.styles.effects.skyType || "aurora";

    useEffect(() => {
        const starsCanvas = starsCanvasRef.current;
        const auroraCanvas = auroraCanvasRef.current;
        if (!starsCanvas || !auroraCanvas) return;
        const starsCtx = starsCanvas.getContext("2d");
        const auroraCtx = auroraCanvas.getContext("2d");
        if (!starsCtx || !auroraCtx) return;

        let animationFrameId: number;
        let time = 0;
        const resolutionScale = 4; // Downscale factor for aurora canvas to boost performance

        // Handle resizing
        const resizeCanvases = () => {
            if (!starsCanvas || !auroraCanvas) return;
            // Cap dimensions to a safe maximum to prevent "Canvas exceeds max size" errors
            const safeWidth = Math.min(window.innerWidth, 8192);
            const safeHeight = Math.min(window.innerHeight, 8192);
            
            starsCanvas.width = safeWidth;
            starsCanvas.height = safeHeight;
            auroraCanvas.width = Math.ceil(safeWidth / resolutionScale);
            auroraCanvas.height = Math.ceil(safeHeight / resolutionScale);
        };
        window.addEventListener("resize", resizeCanvases);
        resizeCanvases();

        // 1. Twinkling Stars Setup
        const starsCount = skyType === "sunny" ? 0 : (skyType === "starry" ? numStars * 2.5 : numStars);
        const stars: Array<{ x: number; y: number; size: number; phase: number; speed: number }> = [];
        for (let i = 0; i < starsCount; i++) {
            stars.push({
                x: Math.random(),
                y: Math.random() * (skyType === "starry" ? 1.0 : starMaxY),
                size: 0.4 + Math.random() * 1.2,
                phase: Math.random() * Math.PI * 2,
                speed: 0.005 + Math.random() * 0.012
            });
        }

        // 2. Shooting Stars Setup
        interface ShootingStar {
            x: number;
            y: number;
            dx: number;
            dy: number;
            length: number;
            speed: number;
            opacity: number;
            life: number;
            decay: number;
            color: string;
        }
        let shootingStars: ShootingStar[] = [];
        const spawnShootingStar = () => {
            if (skyType === "sunny") return;
            shootingStars.push({
                x: Math.random() * starsCanvas.width * 0.8,
                y: Math.random() * starsCanvas.height * 0.2,
                dx: 3 + Math.random() * 4,
                dy: 1.5 + Math.random() * 2,
                length: 60 + Math.random() * 70,
                speed: 1.4 + Math.random() * 1.2,
                opacity: 0.7 + Math.random() * 0.3,
                life: 1.0,
                decay: 0.01 + Math.random() * 0.015,
                color: Math.random() > 0.4 ? "rgba(255, 255, 255, " : "rgba(164, 244, 255, "
            });
        };

        // 3. Clouds Setup (for Moonlight and Sunny)
        interface Cloud {
            x: number;
            y: number;
            scale: number;
            speed: number;
            opacity: number;
        }
        const clouds: Cloud[] = [];
        if (skyType === "moonlight" || skyType === "sunny") {
            const numClouds = skyType === "sunny" ? 5 : 3;
            for (let i = 0; i < numClouds; i++) {
                clouds.push({
                    x: Math.random() * window.innerWidth,
                    y: window.innerHeight * (0.04 + Math.random() * 0.16),
                    scale: 0.5 + Math.random() * 0.8,
                    speed: 0.03 + Math.random() * 0.04,
                    opacity: skyType === "sunny" ? 0.4 + Math.random() * 0.25 : 0.15 + Math.random() * 0.2
                });
            }
        }

        // 4. RGB Color Configuration for Aurora
        interface RGB { r: number; g: number; b: number }
        const currentPalettes = {
            curt1: [
                { r: 0, g: 255, b: 128 },
                { r: 0, g: 255, b: 255 },
                { r: 173, g: 255, b: 47 },
                { r: 255, g: 215, b: 0 },
                { r: 0, g: 200, b: 80 }
            ],
            curt2: [
                { r: 0, g: 198, b: 255 },
                { r: 0, g: 255, b: 196 },
                { r: 50, g: 205, b: 50 },
                { r: 255, g: 255, b: 0 },
                { r: 0, g: 128, b: 128 }
            ],
            curt3: [
                { r: 255, g: 233, b: 59 },
                { r: 96, g: 239, b: 255 },
                { r: 0, g: 255, b: 0 },
                { r: 127, g: 255, b: 212 },
                { r: 30, g: 144, b: 255 }
            ]
        };
        const COOL_PALETTES = {
            curt1: [{ r: 138, g: 43, b: 226 }, { r: 0, g: 191, b: 255 }, { r: 0, g: 255, b: 255 }, { r: 0, g: 255, b: 128 }, { r: 75, g: 0, b: 130 }],
            curt2: [{ r: 0, g: 0, b: 255 }, { r: 100, g: 149, b: 237 }, { r: 224, g: 176, b: 255 }, { r: 255, g: 0, b: 255 }, { r: 0, g: 206, b: 209 }],
            curt3: [{ r: 147, g: 112, b: 219 }, { r: 218, g: 112, b: 214 }, { r: 255, g: 20, b: 147 }, { r: 139, g: 0, b: 139 }, { r: 72, g: 61, b: 139 }]
        };
        const NEUTRAL_PALETTES = {
            curt1: [{ r: 0, g: 255, b: 128 }, { r: 0, g: 255, b: 255 }, { r: 173, g: 255, b: 47 }, { r: 255, g: 215, b: 0 }, { r: 0, g: 200, b: 80 }],
            curt2: [{ r: 0, g: 198, b: 255 }, { r: 0, g: 255, b: 196 }, { r: 50, g: 205, b: 50 }, { r: 255, g: 255, b: 0 }, { r: 0, g: 128, b: 128 }],
            curt3: [{ r: 255, g: 233, b: 59 }, { r: 96, g: 239, b: 255 }, { r: 0, g: 255, b: 0 }, { r: 127, g: 255, b: 212 }, { r: 30, g: 144, b: 255 }]
        };
        const WARM_PALETTES = {
            curt1: [{ r: 255, g: 8, b: 68 }, { r: 255, g: 69, b: 0 }, { r: 255, g: 215, b: 0 }, { r: 255, g: 20, b: 147 }, { r: 255, g: 105, b: 180 }],
            curt2: [{ r: 255, g: 140, b: 0 }, { r: 255, g: 192, b: 203 }, { r: 220, g: 20, b: 60 }, { r: 255, g: 51, b: 0 }, { r: 139, g: 0, b: 0 }],
            curt3: [{ r: 255, g: 226, b: 89 }, { r: 255, g: 0, b: 255 }, { r: 255, g: 100, b: 0 }, { r: 219, g: 112, b: 147 }, { r: 186, g: 85, b: 211 }]
        };

        // Per-theme fluid curtain palettes — extends aurora system to all themes
        const THEME_CURTAIN_PALETTES: { [key: string]: { curt1: RGB[], curt2: RGB[], curt3: RGB[] } } = {
            cyberpunk: {
                curt1: [{ r: 255, g: 0, b: 127 }, { r: 0, g: 240, b: 255 }, { r: 160, g: 0, b: 255 }, { r: 255, g: 0, b: 200 }, { r: 0, g: 180, b: 255 }],
                curt2: [{ r: 0, g: 200, b: 255 }, { r: 255, g: 0, b: 160 }, { r: 100, g: 0, b: 255 }, { r: 0, g: 160, b: 220 }, { r: 200, g: 0, b: 255 }],
                curt3: [{ r: 140, g: 0, b: 255 }, { r: 0, g: 255, b: 180 }, { r: 255, g: 0, b: 100 }, { r: 80, g: 0, b: 200 }, { r: 0, g: 220, b: 200 }]
            },
            matrix: {
                curt1: [{ r: 0, g: 255, b: 0 }, { r: 50, g: 255, b: 80 }, { r: 0, g: 200, b: 40 }, { r: 80, g: 255, b: 60 }, { r: 0, g: 180, b: 20 }],
                curt2: [{ r: 0, g: 220, b: 30 }, { r: 30, g: 255, b: 50 }, { r: 0, g: 200, b: 60 }, { r: 0, g: 180, b: 40 }, { r: 60, g: 255, b: 30 }],
                curt3: [{ r: 40, g: 255, b: 20 }, { r: 0, g: 200, b: 80 }, { r: 0, g: 240, b: 40 }, { r: 0, g: 160, b: 30 }, { r: 70, g: 220, b: 50 }]
            },
            zen: {
                curt1: [{ r: 120, g: 157, b: 171 }, { r: 156, g: 180, b: 190 }, { r: 200, g: 215, b: 220 }, { r: 140, g: 170, b: 180 }, { r: 180, g: 195, b: 200 }],
                curt2: [{ r: 140, g: 175, b: 185 }, { r: 175, g: 200, b: 210 }, { r: 120, g: 160, b: 175 }, { r: 160, g: 185, b: 195 }, { r: 195, g: 210, b: 215 }],
                curt3: [{ r: 160, g: 185, b: 195 }, { r: 130, g: 165, b: 180 }, { r: 185, g: 205, b: 210 }, { r: 145, g: 175, b: 185 }, { r: 170, g: 192, b: 200 }]
            },
            doom: {
                curt1: [{ r: 255, g: 51, b: 0 }, { r: 200, g: 20, b: 0 }, { r: 255, g: 80, b: 10 }, { r: 180, g: 10, b: 0 }, { r: 220, g: 40, b: 0 }],
                curt2: [{ r: 220, g: 30, b: 0 }, { r: 255, g: 60, b: 10 }, { r: 190, g: 15, b: 0 }, { r: 240, g: 45, b: 0 }, { r: 200, g: 25, b: 0 }],
                curt3: [{ r: 240, g: 50, b: 5 }, { r: 200, g: 20, b: 0 }, { r: 255, g: 70, b: 15 }, { r: 160, g: 10, b: 0 }, { r: 230, g: 35, b: 0 }]
            },
            vaporwave: {
                curt1: [{ r: 255, g: 110, b: 199 }, { r: 0, g: 229, b: 255 }, { r: 199, g: 116, b: 232 }, { r: 255, g: 80, b: 180 }, { r: 80, g: 200, b: 255 }],
                curt2: [{ r: 180, g: 60, b: 220 }, { r: 255, g: 140, b: 210 }, { r: 0, g: 210, b: 255 }, { r: 220, g: 80, b: 255 }, { r: 255, g: 100, b: 200 }],
                curt3: [{ r: 255, g: 60, b: 160 }, { r: 140, g: 80, b: 255 }, { r: 255, g: 160, b: 220 }, { r: 0, g: 180, b: 240 }, { r: 200, g: 50, b: 240 }]
            },
            arctic: {
                curt1: [{ r: 0, g: 229, b: 176 }, { r: 0, g: 200, b: 255 }, { r: 100, g: 255, b: 200 }, { r: 0, g: 180, b: 140 }, { r: 80, g: 240, b: 210 }],
                curt2: [{ r: 124, g: 77, b: 255 }, { r: 0, g: 188, b: 212 }, { r: 150, g: 100, b: 255 }, { r: 0, g: 229, b: 176 }, { r: 100, g: 120, b: 255 }],
                curt3: [{ r: 0, g: 210, b: 160 }, { r: 180, g: 130, b: 255 }, { r: 0, g: 255, b: 200 }, { r: 120, g: 80, b: 240 }, { r: 50, g: 220, b: 180 }]
            },
            deepspace: {
                curt1: [{ r: 199, g: 146, b: 234 }, { r: 130, g: 170, b: 255 }, { r: 255, g: 203, b: 107 }, { r: 160, g: 110, b: 240 }, { r: 100, g: 140, b: 255 }],
                curt2: [{ r: 140, g: 100, b: 220 }, { r: 80, g: 130, b: 255 }, { r: 220, g: 170, b: 255 }, { r: 255, g: 180, b: 80 }, { r: 160, g: 120, b: 255 }],
                curt3: [{ r: 180, g: 130, b: 250 }, { r: 100, g: 160, b: 255 }, { r: 255, g: 220, b: 130 }, { r: 200, g: 150, b: 255 }, { r: 120, g: 180, b: 255 }]
            }
        };

        const lerpColor = (cur: RGB, tgt: RGB, speed: number) => {
            cur.r += (tgt.r - cur.r) * speed;
            cur.g += (tgt.g - cur.g) * speed;
            cur.b += (tgt.b - cur.b) * speed;
        };

        const getSpectrumColor = (t: number, palette: RGB[]): RGB => {
            const count = palette.length;
            const wrapped = ((t % 1) + 1) % 1;
            const scaled = wrapped * (count - 1);
            const idx = Math.floor(scaled);
            const nextIdx = (idx + 1) % count;
            const frac = scaled - idx;
            const c1 = palette[idx];
            const c2 = palette[nextIdx];
            return {
                r: c1.r + (c2.r - c1.r) * frac,
                g: c1.g + (c2.g - c1.g) * frac,
                b: c1.b + (c2.b - c1.b) * frac
            };
        };

        let currentOpacity = 0;

        interface RayConfig {
            phaseX: number;
            heightScale: number;
            widthScale: number;
            curlPhase: number;
            brightPhase: number;
        }
        const seedRays = (n: number): RayConfig[] =>
            Array.from({ length: n }, () => ({
                phaseX: Math.random() * Math.PI * 2,
                heightScale: 0.3 + Math.random() * 1.3,
                widthScale: 0.6 + Math.random() * 0.8,
                curlPhase: Math.random() * Math.PI * 2,
                brightPhase: Math.random() * Math.PI * 2,
            }));
        const rayConfigs = [
            seedRays(8),
            seedRays(7),
            seedRays(6),
        ];

        let isDark = document.documentElement.classList.contains("dark") ||
            (!document.documentElement.classList.contains("light") &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        const darkObserver = new MutationObserver(() => {
            isDark = document.documentElement.classList.contains("dark") ||
                (!document.documentElement.classList.contains("light") &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches);
        });
        darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        let frameCount = 0;

        const drawCurtain = (
            curtainIdx: number,
            baseY: number,
            ribbonH: number,
            waveFreq: number,
            waveSpeed: number,
            rayWidth: number,
            slantFraction: number,
            curlAmt: number,
            palette: RGB[],
            opacity: number,
            timeOffset: number
        ) => {
            if (opacity <= 0.01) return;
            auroraCtx.globalCompositeOperation = isDark ? "screen" : "source-over";
            const configs = rayConfigs[curtainIdx];
            const numRays = configs.length;
            const width = auroraCanvas.width;
            const energy = energyRatingRef.current !== null ? energyRatingRef.current : 3;
            const energySpeed = energy === 1 ? 0.4 : energy === 2 ? 0.7 : energy === 3 ? 1.0 : energy === 4 ? 1.5 : 2.2;
            const energyScale = energy === 1 ? 0.5 : energy === 2 ? 0.8 : energy === 3 ? 1.0 : energy === 4 ? 1.3 : 1.6;

            const wsMul = waveSpeedMultiplier * energySpeed;
            const rsMul = raySpeedMultiplier * energySpeed;
            const slantPx = ribbonH * slantFraction;
            const yOff = yOffset / resolutionScale;
            const alphaMul = isDark ? 1.0 : 0.55;

            for (let ri = 0; ri < numRays; ri++) {
                const cfg = configs[ri];
                const baseXCenter = (((ri / numRays) + Math.sin(time * 0.06 * wsMul + timeOffset + cfg.phaseX) * 0.015 + 1) % 1) * width;
                const wave = Math.sin(baseXCenter * waveFreq + time * waveSpeed * wsMul) * (10 / resolutionScale)
                    + Math.sin(baseXCenter * waveFreq * 0.43 - time * waveSpeed * 0.6 * wsMul) * (4 / resolutionScale);
                const jaggedH = cfg.heightScale
                    * (1.0 + 0.55 * Math.sin(time * 2.8 * rsMul + cfg.phaseX))
                    * ribbonH * heightMultiplier * energyScale;
                const yBot = baseY + wave + yOff;
                const yTop = yBot - jaggedH;
                const midY = (yTop + yBot) * 0.5;

                const curl = (Math.sin(time * 0.38 * rsMul + cfg.curlPhase) * 0.7
                    + Math.sin(time * 0.19 * rsMul + cfg.curlPhase * 1.6) * 0.3) * curlAmt * cfg.widthScale;
                const brightness = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time * 1.3 * rsMul + cfg.brightPhase));
                const alpha = opacity * brightness * alphaMul;

                const rw = rayWidth * cfg.widthScale;
                const lxTop = baseXCenter - rw;
                const rxTop = baseXCenter + rw;
                const lxBot = baseXCenter + slantPx - rw * 0.6;
                const rxBot = baseXCenter + slantPx + rw * 0.6;
                const lcx = (lxTop + lxBot) * 0.5 + curl;
                const rcx = (rxTop + rxBot) * 0.5 - curl;

                auroraCtx.beginPath();
                auroraCtx.moveTo(lxTop, yTop);
                auroraCtx.quadraticCurveTo(lcx, midY, lxBot, yBot);
                auroraCtx.lineTo(rxBot, yBot);
                auroraCtx.quadraticCurveTo(rcx, midY, rxTop, yTop);
                auroraCtx.closePath();

                const tBase = (ri / numRays) * 1.4 + time * 0.04 + timeOffset;
                const cT = getSpectrumColor(tBase, palette);
                const cMA = getSpectrumColor(tBase + 0.15, palette);
                const cMB = getSpectrumColor(tBase + 0.30, palette);
                const cB = getSpectrumColor(tBase + 0.45, palette);

                const grad = auroraCtx.createLinearGradient(baseXCenter, yTop, baseXCenter + slantPx, yBot);
                grad.addColorStop(0, `rgba(${cT.r | 0},${cT.g | 0},${cT.b | 0},0)`);
                grad.addColorStop(0.15, `rgba(${cT.r | 0},${cT.g | 0},${cT.b | 0},${alpha * 0.8})`);
                grad.addColorStop(0.42, `rgba(${cMA.r | 0},${cMA.g | 0},${cMA.b | 0},${alpha})`);
                grad.addColorStop(0.68, `rgba(${cMB.r | 0},${cMB.g | 0},${cMB.b | 0},${alpha * 0.9})`);
                grad.addColorStop(0.88, `rgba(${cB.r | 0},${cB.g | 0},${cB.b | 0},${alpha * 0.5})`);
                grad.addColorStop(1, `rgba(${cB.r | 0},${cB.g | 0},${cB.b | 0},0)`);

                auroraCtx.fillStyle = grad;
                auroraCtx.fill();
            }
        };

        // Draw sky background gradient direct to stars canvas
        const drawSkyBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            if (skyType === "sunset") {
                const colors = activeTheme?.styles.effects.skyColors || ["#0f081d", "#ff007f", "#ff5e00"];
                colors.forEach((col, idx) => {
                    grad.addColorStop(idx / (colors.length - 1), col);
                });
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            } else if (skyType === "moonlight") {
                const colors = activeTheme?.styles.effects.skyColors || ["#050b14", "#0c1726", "#182a3c"];
                colors.forEach((col, idx) => {
                    grad.addColorStop(idx / (colors.length - 1), col);
                });
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            } else if (skyType === "sunny") {
                const colors = activeTheme?.styles.effects.skyColors || ["#48a3e6", "#80c5f0", "#bfe3f7"];
                colors.forEach((col, idx) => {
                    grad.addColorStop(idx / (colors.length - 1), col);
                });
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            } else if (skyType === "starry") {
                const colors = activeTheme?.styles.effects.skyColors || ["#000000", "#002200", "#000000"];
                colors.forEach((col, idx) => {
                    grad.addColorStop(idx / (colors.length - 1), col);
                });
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            } else if (skyType === "aurora") {
                const colors = activeTheme?.styles.effects.skyColors || ["#020c1b", "#041828", "#062338"];
                colors.forEach((col, idx) => {
                    grad.addColorStop(idx / (colors.length - 1), col);
                });
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }
        };

        // Draw celestial bodies (Sun, Moonlight Moon, Synthwave Sunset Sun)
        const drawCelestial = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            const energy = energyRatingRef.current !== null ? energyRatingRef.current : 3;
            const speedFactor = energy === 1 ? 0.4 : energy === 2 ? 0.7 : energy === 3 ? 1.0 : energy === 4 ? 1.5 : 2.2;
            const scaleFactor = energy === 1 ? 0.5 : energy === 2 ? 0.8 : energy === 3 ? 1.0 : energy === 4 ? 1.3 : 1.6;

            if (skyType === "moonlight") {
                const cx = w * 0.8;
                const cy = h * 0.2;
                const r = 40;

                // Moon glow breathes based on energy speed
                const pulseSpeed = 0.6 * speedFactor;
                const glowMultiplier = 1.0 + 0.15 * Math.sin(time * pulseSpeed) * scaleFactor;

                const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.5 * glowMultiplier);
                glow.addColorStop(0, "rgba(252, 253, 254, 0.28)");
                glow.addColorStop(0.4, "rgba(252, 253, 254, 0.08)");
                glow.addColorStop(1, "rgba(252, 253, 254, 0)");
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(cx, cy, r * 2.5 * glowMultiplier, 0, Math.PI * 2);
                ctx.fill();

                // Moon crescent body
                ctx.fillStyle = "#fcfdfe";
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();

                // Draw crescent shadow cut
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = "rgba(0,0,0,1)";
                ctx.beginPath();
                ctx.arc(cx - r * 0.4, cy - r * 0.2, r * 0.95, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalCompositeOperation = "source-over";
            } else if (skyType === "sunset" && activeThemeId !== "doom") {
                const cx = w * 0.5;
                const cy = h * 0.45;
                const r = 65;

                const sunAccent = activeTheme?.styles.colors["--theme-color-panic"] || "#ff007f";
                const sunMuted = activeTheme?.styles.colors["--theme-color-muted"] || "#ff5e00";

                // Sun glow size scales with energy
                const glowRadius = r * (1.8 + 0.25 * energy); // 1 -> 2.05r, 5 -> 3.05r
                const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, glowRadius);
                glow.addColorStop(0, sunAccent + "73"); // ~0.45 opacity
                glow.addColorStop(0.5, sunMuted + "2e"); // ~0.18 opacity
                glow.addColorStop(1, sunAccent + "00");
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
                ctx.fill();

                // Sun gradient body size scales slightly with energy
                const sunRadius = r * (0.9 + 0.04 * energy);
                const sunGrad = ctx.createLinearGradient(cx, cy - sunRadius, cx, cy + sunRadius);
                sunGrad.addColorStop(0, sunAccent);
                sunGrad.addColorStop(0.5, sunMuted);
                sunGrad.addColorStop(1, "#ffff00");
                ctx.fillStyle = sunGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, sunRadius, 0, Math.PI * 2);
                ctx.fill();

                // Horizontal scanline cuts
                const computed = getComputedStyle(document.documentElement);
                ctx.fillStyle = computed.getPropertyValue("--theme-color-container-bg").trim() || "#0f081d";

                const numStripes = 9;
                const stripeSpacing = 14;
                for (let i = 0; i < numStripes; i++) {
                    const yOffset = ((time * 16 + i * stripeSpacing) % (r * 2)) - r;
                    const stripeHeight = Math.max(1.5, (yOffset + r) / (r * 2) * 8);
                    if (yOffset > -r + 10) {
                        ctx.fillRect(cx - r - 10, cy + yOffset, r * 2 + 20, stripeHeight);
                    }
                }
            } else if (skyType === "sunset" && activeThemeId === "doom") {
                const cx = w * 0.5;
                const cy = h * 0.40;
                const r = 70;

                // Coronal glow of the Eclipse Sun breathing with energy speed
                const pulseSpeed = 1.2 * speedFactor;
                const glowMultiplier = 1.0 + 0.15 * Math.sin(time * pulseSpeed) * scaleFactor;
                const glowRadius = r * (2.0 + 0.3 * energy) * glowMultiplier;

                const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, glowRadius);
                glow.addColorStop(0, "rgba(255, 10, 0, 0.45)");
                glow.addColorStop(0.5, "rgba(150, 0, 0, 0.2)");
                glow.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
                ctx.fill();

                // Core of the eclipse: pure black circle with a thin burning red border
                ctx.fillStyle = "#050000";
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = "rgba(255, 30, 0, 0.85)";
                ctx.lineWidth = 3 + 1.5 * scaleFactor;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
            } else if (skyType === "sunny") {
                const cx = w * 0.25;
                const cy = h * 0.2;
                const r = 32;

                const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 4);
                glow.addColorStop(0, "rgba(255, 255, 220, 0.55)");
                glow.addColorStop(0.3, "rgba(255, 230, 160, 0.22)");
                glow.addColorStop(1, "rgba(255, 255, 255, 0)");
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(cx, cy, r * 4, 0, Math.PI * 2);
                ctx.fill();

                // Draw rotating and pulsing sun rays
                ctx.strokeStyle = "rgba(255, 255, 220, 0.45)";
                ctx.lineWidth = 1.5;
                const numRays = 8;
                const angleOffset = time * 0.12 * speedFactor;
                for (let i = 0; i < numRays; i++) {
                    const angle = (i * Math.PI * 2) / numRays + angleOffset;
                    const innerDist = r * 1.15;
                    const outerDist = r * (1.4 + 0.25 * Math.sin(time * 2.0 * speedFactor + i) * scaleFactor);
                    const x1 = cx + Math.cos(angle) * innerDist;
                    const y1 = cy + Math.sin(angle) * innerDist;
                    const x2 = cx + Math.cos(angle) * outerDist;
                    const y2 = cy + Math.sin(angle) * outerDist;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        // Draw cloud element
        const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, opacity: number) => {
            const cloudColor = skyType === "sunny" ? "rgba(255, 255, 255, " : "rgba(120, 157, 171, ";
            ctx.fillStyle = cloudColor + `${opacity})`;
            ctx.beginPath();
            const r = 25 * scale;
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.arc(x - r * 0.7, y + r * 0.2, r * 0.7, 0, Math.PI * 2);
            ctx.arc(x + r * 0.7, y + r * 0.2, r * 0.7, 0, Math.PI * 2);
            ctx.rect(x - r * 1.2, y + r * 0.1, r * 2.4, r * 0.8);
            ctx.closePath();
            ctx.fill();
        };

        // 5. Animation Loop
        let lastTimestamp = 0;
        const animate = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const dt = (timestamp - lastTimestamp) * 0.001;
            lastTimestamp = timestamp;

            const activeRating = energyRatingRef.current;
            const energy = activeRating !== null ? activeRating : 3;
            const speedFactor = energy === 1 ? 0.4 : energy === 2 ? 0.7 : energy === 3 ? 1.0 : energy === 4 ? 1.5 : 2.2;
            const scaleFactor = energy === 1 ? 0.5 : energy === 2 ? 0.8 : energy === 3 ? 1.0 : energy === 4 ? 1.3 : 1.6;

            time += dt * speedFactor;

            // Clear canvases
            starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
            auroraCtx.clearRect(0, 0, auroraCanvas.width, auroraCanvas.height);

            frameCount++;

            // Draw Sky Background Gradient
            drawSkyBackground(starsCtx, starsCanvas.width, starsCanvas.height);

            // Draw Celestial body (sun/moon)
            drawCelestial(starsCtx, starsCanvas.width, starsCanvas.height);

            // Draw Twinkling Stars
            if (skyType !== "sunny") {
                const starColor = activeTheme?.styles.colors["--theme-color-panic"] || "rgba(255, 255, 255, ";
                const isThemedColor = starColor.startsWith("#") || starColor.startsWith("rgb");

                for (const star of stars) {
                    star.phase += star.speed * speedFactor;
                    const alpha = (0.15 + 0.6 * (0.5 + 0.5 * Math.sin(star.phase))) * (0.5 + 0.16 * energy);
                    starsCtx.fillStyle = isThemedColor 
                        ? starColor 
                        : `rgba(255, 255, 255, ${Math.min(1.0, alpha)})`;
                    
                    if (isThemedColor) {
                        starsCtx.globalAlpha = Math.min(1.0, alpha);
                    }
                    starsCtx.fillRect(star.x * starsCanvas.width, star.y * starsCanvas.height, star.size, star.size);
                    starsCtx.globalAlpha = 1.0; // reset
                }
            }

            // Draw and drift clouds
            if (skyType === "moonlight" || skyType === "sunny") {
                for (const cloud of clouds) {
                    cloud.x += cloud.speed * speedFactor;
                    if (cloud.x - 100 > starsCanvas.width) {
                        cloud.x = -100;
                    }
                    drawCloud(starsCtx, cloud.x, cloud.y, cloud.scale, cloud.opacity);
                }
            }

            // Spawn and Draw Shooting Stars (spawns faster at high energy)
            const spawnChance = 0.003 * speedFactor;
            const maxShootingStars = Math.floor(3 * scaleFactor);
            if (skyType !== "sunny" && Math.random() < spawnChance && shootingStars.length < maxShootingStars) {
                spawnShootingStar();
            }
            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const ss = shootingStars[i];
                ss.x += ss.dx * ss.speed * speedFactor;
                ss.y += ss.dy * ss.speed * speedFactor;
                ss.life -= ss.decay * speedFactor;
                if (ss.life <= 0) {
                    shootingStars.splice(i, 1);
                    continue;
                }
                const tailX = ss.x - ss.dx * (ss.length * ss.life * 0.12);
                const tailY = ss.y - ss.dy * (ss.length * ss.life * 0.12);
                const ssGrad = starsCtx.createLinearGradient(ss.x, ss.y, tailX, tailY);
                ssGrad.addColorStop(0, ss.color + `${ss.opacity * ss.life})`);
                ssGrad.addColorStop(1, ss.color + "0)");
                starsCtx.strokeStyle = ssGrad;
                starsCtx.lineWidth = (0.8 + ss.life * 1.2) * scaleFactor;
                starsCtx.beginPath();
                starsCtx.moveTo(ss.x, ss.y);
                starsCtx.lineTo(tailX, tailY);
                starsCtx.stroke();
            }

            // Draw Wavy Fluid Curtains (all themes get fluid background effects)
            const themePals = THEME_CURTAIN_PALETTES[activeThemeId || ""];
            let targetSet = themePals || NEUTRAL_PALETTES;
            if (!themePals) {
                if (activeRating === 1 || activeRating === 2) {
                    targetSet = COOL_PALETTES;
                } else if (activeRating === 4 || activeRating === 5) {
                    targetSet = WARM_PALETTES;
                }
            }

            if (frameCount % 2 === 0) {
                const colorLerpSpeed = 0.04;
                for (let i = 0; i < 5; i++) {
                    lerpColor(currentPalettes.curt1[i], targetSet.curt1[i], colorLerpSpeed);
                    lerpColor(currentPalettes.curt2[i], targetSet.curt2[i], colorLerpSpeed);
                    lerpColor(currentPalettes.curt3[i], targetSet.curt3[i], colorLerpSpeed);
                }
            }

            const targetOpacity = activeRating !== null ? baseOpacity : 0.0;
            currentOpacity += (targetOpacity - currentOpacity) * 0.03;

            if (currentOpacity > 0.01) {
                const canvasH = auroraCanvas.height;
                const canvasW = auroraCanvas.width;
                const isDefaultAurora = !activeThemeId || activeThemeId === "default";
                const opacityFactor = isDefaultAurora ? 1.0 : 0.55;

                drawCurtain(
                    0,
                    isDefaultAurora ? canvasH * 0.285 : canvasH * 0.50,
                    isDefaultAurora ? canvasH * 0.247 : canvasH * 0.38,
                    0.006,
                    0.28,
                    canvasW * 0.055,
                    -0.40,
                    canvasW * 0.018,
                    currentPalettes.curt1,
                    currentOpacity * opacityFactor,
                    0.0
                );
                drawCurtain(
                    1,
                    isDefaultAurora ? canvasH * 0.304 : canvasH * 0.55,
                    isDefaultAurora ? canvasH * 0.228 : canvasH * 0.34,
                    0.009,
                    0.38,
                    canvasW * 0.045,
                    -0.10,
                    canvasW * 0.012,
                    currentPalettes.curt2,
                    currentOpacity * 0.80 * opacityFactor,
                    0.3
                );
                drawCurtain(
                    2,
                    isDefaultAurora ? canvasH * 0.266 : canvasH * 0.45,
                    isDefaultAurora ? canvasH * 0.209 : canvasH * 0.30,
                    0.007,
                    0.22,
                    canvasW * 0.038,
                    0.35,
                    canvasW * 0.014,
                    currentPalettes.curt3,
                    currentOpacity * 0.70 * opacityFactor,
                    0.6
                );
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resizeCanvases);
            cancelAnimationFrame(animationFrameId);
            darkObserver.disconnect();
        };
    }, [activeThemeId, activeTheme, skyType, baseOpacity, yOffset, heightMultiplier, waveSpeedMultiplier, raySpeedMultiplier, numStars, starMaxY]);

    return (
        <>
            <canvas ref={starsCanvasRef} className="stars-canvas" />
            <canvas
                ref={auroraCanvasRef}
                className="aurora-canvas"
                style={{
                    filter: `blur(${blurAmount}px) saturate(2.4)`,
                    transform: "translateZ(0)"
                }}
            />
        </>
    );
};