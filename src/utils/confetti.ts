export function triggerConfetti() {
  if (typeof document === "undefined") return;

  const colors = [
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#ec4899", // Pink
    "#8b5cf6", // Purple
    "#ef4444", // Red
  ];

  const particleCount = 40;
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.pointerEvents = "none";
  container.style.zIndex = "99999";
  document.body.appendChild(container);

  // Burst from the center of the viewport
  const startX = window.innerWidth / 2;
  const startY = window.innerHeight * 0.45;

  for (let i = 0; i < particleCount; i++) {
    const el = document.createElement("div");
    el.className = "confetti-particle";

    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.floor(Math.random() * 8) + 6; // 6px to 14px
    
    // Spread in all directions
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.floor(Math.random() * 150) + 50; // 50px to 200px
    const xDest = Math.cos(angle) * distance;
    const yDest = Math.sin(angle) * distance + 80; // gravity pulling it down

    const rotation = Math.floor(Math.random() * 360) + 180; // degrees rotation

    el.style.position = "absolute";
    el.style.left = `${startX}px`;
    el.style.top = `${startY}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.backgroundColor = color;
    el.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    
    el.style.setProperty("--x", `${xDest}px`);
    el.style.setProperty("--y", `${yDest}px`);
    el.style.setProperty("--r", `${rotation}deg`);

    // Animation: custom keyframes defined in CSS
    el.style.animation = `confettiFall ${Math.random() * 0.5 + 0.8}s cubic-bezier(0.1, 1, 0.1, 1) forwards`;

    container.appendChild(el);
  }

  // Cleanup container
  setTimeout(() => {
    container.remove();
  }, 1500);
}
