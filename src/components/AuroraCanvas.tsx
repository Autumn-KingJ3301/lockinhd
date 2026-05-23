import React, { useEffect, useRef } from "react";
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
    // Sync energy rating to ref to avoid resetting the animation loops
    useEffect(() => {
        energyRatingRef.current = energyRating;
    }, [energyRating]);
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
            // Stars canvas: full resolution
            starsCanvas.width = window.innerWidth;
            starsCanvas.height = window.innerHeight;
            // Aurora canvas: downscaled for high-performance rendering & blending
            auroraCanvas.width = Math.ceil(window.innerWidth / resolutionScale);
            auroraCanvas.height = Math.ceil((window.innerHeight * 0.38) / resolutionScale);
        };
        window.addEventListener("resize", resizeCanvases);
        resizeCanvases();
        // 1. Twinkling Stars Setup
        const stars: Array<{ x: number; y: number; size: number; phase: number; speed: number }> = [];
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random(),
                y: Math.random() * starMaxY,
                size: 0.5 + Math.random() * 1.3,
                phase: Math.random() * Math.PI * 2,
                speed: 0.008 + Math.random() * 0.016
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
            shootingStars.push({
                x: Math.random() * starsCanvas.width * 0.8,
                y: Math.random() * starsCanvas.height * 0.15,
                dx: 4 + Math.random() * 4,
                dy: 2 + Math.random() * 2,
                length: 70 + Math.random() * 80,
                speed: 1.6 + Math.random() * 1.4,
                opacity: 0.75 + Math.random() * 0.25,
                life: 1.0,
                decay: 0.012 + Math.random() * 0.015,
                color: Math.random() > 0.4 ? "rgba(255, 255, 255, " : "rgba(164, 244, 255, "
            });
        };
        // 3. RGB Color Configuration for Aurora
        // 3. RGB Color Configuration for Aurora (Spectrum Palettes)
        interface RGB { r: number; g: number; b: number }

        // Each curtain has a palette of 5 colors to generate a rich spectrum
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
            curt1: [
                { r: 138, g: 43, b: 226 },  // Purple
                { r: 0, g: 191, b: 255 },   // DeepSkyBlue
                { r: 0, g: 255, b: 255 },   // Cyan
                { r: 0, g: 255, b: 128 },   // SpringGreen
                { r: 75, g: 0, b: 130 }     // Indigo
            ],
            curt2: [
                { r: 0, g: 0, b: 255 },     // Pure Blue
                { r: 100, g: 149, b: 237 }, // CornflowerBlue
                { r: 224, g: 176, b: 255 }, // Mauve
                { r: 255, g: 0, b: 255 },   // Magenta
                { r: 0, g: 206, b: 209 }    // DarkTurquoise
            ],
            curt3: [
                { r: 147, g: 112, b: 219 }, // MediumPurple
                { r: 218, g: 112, b: 214 }, // Orchid
                { r: 255, g: 20, b: 147 },  // DeepPink
                { r: 139, g: 0, b: 139 },   // DarkMagenta
                { r: 72, g: 61, b: 139 }    // DarkSlateBlue
            ]
        };
        const NEUTRAL_PALETTES = {
            curt1: [
                { r: 0, g: 255, b: 128 },   // Emerald Green
                { r: 0, g: 255, b: 255 },   // Electric Cyan
                { r: 173, g: 255, b: 47 },  // GreenYellow
                { r: 255, g: 215, b: 0 },   // Gold
                { r: 0, g: 200, b: 80 }     // Bright Green
            ],
            curt2: [
                { r: 0, g: 198, b: 255 },   // Light Blue
                { r: 0, g: 255, b: 196 },   // Turquoise
                { r: 50, g: 205, b: 50 },   // Lime Green
                { r: 255, g: 255, b: 0 },   // Yellow
                { r: 0, g: 128, b: 128 }    // Teal
            ],
            curt3: [
                { r: 255, g: 233, b: 59 },  // Bright Yellow
                { r: 96, g: 239, b: 255 },  // Pastel Cyan
                { r: 0, g: 255, b: 0 },     // Pure Green
                { r: 127, g: 255, b: 212 }, // Aquamarine
                { r: 30, g: 144, b: 255 }   // DodgerBlue
            ]
        };
        const WARM_PALETTES = {
            curt1: [
                { r: 255, g: 8, b: 68 },    // Crimson Red
                { r: 255, g: 69, b: 0 },    // OrangeRed
                { r: 255, g: 215, b: 0 },   // Gold
                { r: 255, g: 20, b: 147 },  // DeepPink
                { r: 255, g: 105, b: 180 }  // HotPink
            ],
            curt2: [
                { r: 255, g: 140, b: 0 },   // DarkOrange
                { r: 255, g: 192, b: 203 }, // Pink
                { r: 220, g: 20, b: 60 },   // Crimson
                { r: 255, g: 51, b: 0 },    // Red Orange
                { r: 139, g: 0, b: 0 }      // DarkRed
            ],
            curt3: [
                { r: 255, g: 226, b: 89 },  // Light Gold
                { r: 255, g: 0, b: 255 },   // Magenta
                { r: 255, g: 100, b: 0 },   // Sun Orange
                { r: 219, g: 112, b: 147 }, // PaleVioletRed
                { r: 186, g: 85, b: 211 }   // MediumOrchid
            ]
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
        // -------------------------------------------------------------------
        // Pre-seeded ray configs — computed ONCE at setup, not per-frame.
        // Each curtain gets its own array of N rays with fixed random offsets.
        // -------------------------------------------------------------------
        interface RayConfig {
            phaseX: number;       // horizontal drift phase
            heightScale: number;  // static height multiplier (0.3–1.6)
            widthScale: number;   // static width multiplier  (0.6–1.4)
            curlPhase: number;    // curl animation phase offset
            brightPhase: number;  // brightness pulse phase offset
        }
        const seedRays = (n: number): RayConfig[] =>
            Array.from({ length: n }, () => ({
                phaseX: Math.random() * Math.PI * 2,
                heightScale: 0.3 + Math.random() * 1.3,   // wide variance → jagged tops
                widthScale: 0.6 + Math.random() * 0.8,
                curlPhase: Math.random() * Math.PI * 2,
                brightPhase: Math.random() * Math.PI * 2,
            }));
        const rayConfigs = [
            seedRays(8),  // curtain 1
            seedRays(7),  // curtain 2
            seedRays(6),  // curtain 3
        ];
        // isDark is stable between renders — recompute only when needed
        let isDark = document.documentElement.classList.contains("dark") ||
            (!document.documentElement.classList.contains("light") &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);
        const darkObserver = new MutationObserver(() => {
            isDark = document.documentElement.classList.contains("dark") ||
                (!document.documentElement.classList.contains("light") &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches);
        });
        darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        let frameCount = 0; // for frame-skip optimizations
        /**
         * drawCurtain — renders discrete slanted ribbon rays using pre-seeded ray configs.
         *
         * Each ray is a filled bezier-curve parallelogram. Per-ray height/width/curl are
         * seeded at init time (no per-frame randomness). A fast high-frequency sine adds
         * non-smooth jagged Y-scale variation on top of the seeded static offset.
         */
        const drawCurtain = (
            curtainIdx: number,     // 0,1,2 — picks from rayConfigs[]
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
            const wsMul = waveSpeedMultiplier;  // local alias to avoid property lookup in loop
            const rsMul = raySpeedMultiplier;
            const slantPx = ribbonH * slantFraction;
            const yOff = yOffset / resolutionScale;
            const alphaMul = isDark ? 1.0 : 0.55;
            for (let ri = 0; ri < numRays; ri++) {
                const cfg = configs[ri];
                // Horizontal center of this ray — evenly spread + slow drift
                const baseXCenter = (((ri / numRays) + Math.sin(time * 0.06 * wsMul + timeOffset + cfg.phaseX) * 0.015 + 1) % 1) * width;
                // Vertical anchor wave (two sines, pre-scaled)
                const wave = Math.sin(baseXCenter * waveFreq + time * waveSpeed * wsMul) * (10 / resolutionScale)
                    + Math.sin(baseXCenter * waveFreq * 0.43 - time * waveSpeed * 0.6 * wsMul) * (4 / resolutionScale);
                // Per-ray height: seeded static scale + fast jagged high-freq variation
                const jaggedH = cfg.heightScale
                    * (1.0 + 0.55 * Math.sin(time * 2.8 * rsMul + cfg.phaseX))
                    * ribbonH * heightMultiplier;
                const yBot = baseY + wave + yOff;
                const yTop = yBot - jaggedH;
                const midY = (yTop + yBot) * 0.5;
                // Curl — seeded phase, two harmonics
                const curl = (Math.sin(time * 0.38 * rsMul + cfg.curlPhase) * 0.7
                    + Math.sin(time * 0.19 * rsMul + cfg.curlPhase * 1.6) * 0.3) * curlAmt * cfg.widthScale;
                // Brightness pulse — seeded phase
                const brightness = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time * 1.3 * rsMul + cfg.brightPhase));
                const alpha = opacity * brightness * alphaMul;
                // Edge positions
                const rw = rayWidth * cfg.widthScale;
                const lxTop = baseXCenter - rw;
                const rxTop = baseXCenter + rw;
                const lxBot = baseXCenter + slantPx - rw * 0.6;
                const rxBot = baseXCenter + slantPx + rw * 0.6;
                const lcx = (lxTop + lxBot) * 0.5 + curl;
                const rcx = (rxTop + rxBot) * 0.5 - curl;
                // Path
                auroraCtx.beginPath();
                auroraCtx.moveTo(lxTop, yTop);
                auroraCtx.quadraticCurveTo(lcx, midY, lxBot, yBot);
                auroraCtx.lineTo(rxBot, yBot);
                auroraCtx.quadraticCurveTo(rcx, midY, rxTop, yTop);
                auroraCtx.closePath();
                // Spectrum gradient — 4 color samples along the ribbon length
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
        // 4. Main Animation Loop
        let lastTimestamp = 0;
        const animate = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const dt = (timestamp - lastTimestamp) * 0.001;
            lastTimestamp = timestamp;
            time += dt;
            // Clear both canvases
            starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
            auroraCtx.clearRect(0, 0, auroraCanvas.width, auroraCanvas.height);
            const activeRating = energyRatingRef.current;
            frameCount++;
            // Determine active target palettes
            let targetSet = NEUTRAL_PALETTES;
            if (activeRating === 1 || activeRating === 2) {
                targetSet = COOL_PALETTES;
            } else if (activeRating === 4 || activeRating === 5) {
                targetSet = WARM_PALETTES;
            }
            // Lerp palette colors every other frame — transitions are slow, imperceptible at 2x skip
            if (frameCount % 2 === 0) {
                const colorLerpSpeed = 0.04;
                for (let i = 0; i < 5; i++) {
                    lerpColor(currentPalettes.curt1[i], targetSet.curt1[i], colorLerpSpeed);
                    lerpColor(currentPalettes.curt2[i], targetSet.curt2[i], colorLerpSpeed);
                    lerpColor(currentPalettes.curt3[i], targetSet.curt3[i], colorLerpSpeed);
                }
            }
            // Lerp active opacity
            const targetOpacity = activeRating !== null ? baseOpacity : 0.0;
            currentOpacity += (targetOpacity - currentOpacity) * 0.03;
            // Draw Twinkling Stars on crisp canvas
            for (const star of stars) {
                star.phase += star.speed;
                const alpha = 0.15 + 0.6 * (0.5 + 0.5 * Math.sin(star.phase));
                starsCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                starsCtx.fillRect(star.x * starsCanvas.width, star.y * starsCanvas.height, star.size, star.size);
            }
            // Spawn and Draw Shooting Stars on crisp canvas
            if (Math.random() < 0.004 && shootingStars.length < 3) {
                spawnShootingStar();
            }
            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const ss = shootingStars[i];
                ss.x += ss.dx * ss.speed;
                ss.y += ss.dy * ss.speed;
                ss.life -= ss.decay;
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
                starsCtx.lineWidth = 1.0 + ss.life * 1.2;
                starsCtx.beginPath();
                starsCtx.moveTo(ss.x, ss.y);
                starsCtx.lineTo(tailX, tailY);
                starsCtx.stroke();
            }
            // Draw Wavy Aurora Curtains on low-res canvas (if visible)
            if (currentOpacity > 0.01) {
                // Curtain 0 — leans left, wide ribbons
                drawCurtain(
                    0,                            // curtainIdx
                    auroraCanvas.height * 0.75,
                    auroraCanvas.height * 0.65,
                    0.006,
                    0.28,
                    auroraCanvas.width * 0.055,
                    -0.40,
                    auroraCanvas.width * 0.018,
                    currentPalettes.curt1,
                    currentOpacity,
                    0.0
                );
                // Curtain 1 — near-vertical, layered
                drawCurtain(
                    1,
                    auroraCanvas.height * 0.80,
                    auroraCanvas.height * 0.60,
                    0.009,
                    0.38,
                    auroraCanvas.width * 0.045,
                    -0.10,
                    auroraCanvas.width * 0.012,
                    currentPalettes.curt2,
                    currentOpacity * 0.80,
                    0.3
                );
                // Curtain 2 — leans right, thinner, sits higher
                drawCurtain(
                    2,
                    auroraCanvas.height * 0.70,
                    auroraCanvas.height * 0.55,
                    0.007,
                    0.22,
                    auroraCanvas.width * 0.038,
                    0.35,
                    auroraCanvas.width * 0.014,
                    currentPalettes.curt3,
                    currentOpacity * 0.70,
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
    }, [baseOpacity, yOffset, heightMultiplier, waveSpeedMultiplier, raySpeedMultiplier, numStars, starMaxY]);
    return (
        <>
            <canvas ref={starsCanvasRef} className="stars-canvas" />
            <canvas
                ref={auroraCanvasRef}
                className="aurora-canvas"
                style={{
                    filter: `blur(${blurAmount}px) saturate(2.4)`,
                    transform: "translateZ(0)" // Force GPU compositing layer for smooth rendering
                }}
            />
        </>
    );
};