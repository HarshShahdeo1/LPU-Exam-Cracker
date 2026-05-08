"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "rect" | "circle" | "dash";
};

const COLORS = [
  "#ef4335", "#dfff57", "#3d90ec", "#ab95fb",
  "#2fd400", "#ff7417", "#22000f", "#ffd166",
  "#06d6a0", "#e63946", "#4361ee", "#f72585",
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function ConfettiCanvas() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const particles  = useRef<Particle[]>([]);
  const rafRef     = useRef<number>(0);
  const fadingOut  = useRef(false);   // set to true after 5 s
  const opacity    = useRef(1);       // master opacity for fade

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Spawn particles from center
    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < 180; i++) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(0.4, 3.2);
      particles.current.push({
        x:             cx + randomBetween(-60, 60),
        y:             cy + randomBetween(-60, 60),
        vx:            Math.cos(angle) * speed,
        vy:            Math.sin(angle) * speed - randomBetween(0, 1.5),
        size:          randomBetween(3, 8),
        color:         COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation:      randomBetween(0, Math.PI * 2),
        rotationSpeed: randomBetween(-0.06, 0.06),
        opacity:       randomBetween(0.6, 1),
        shape:         (["rect", "circle", "dash"] as const)[Math.floor(Math.random() * 3)],
      });
    }

    // After 5 s → begin fade-out (stops respawning, dims master opacity)
    const stopTimer = window.setTimeout(() => { fadingOut.current = true; }, 5000);

    const draw = () => {
      // Once fully faded, stop loop
      if (fadingOut.current) {
        opacity.current = Math.max(0, opacity.current - 0.018);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles.current) {
        ctx.save();
        ctx.globalAlpha = p.opacity * opacity.current;
        ctx.fillStyle   = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "dash") {
          ctx.fillRect(-p.size * 1.6, -p.size * 0.28, p.size * 3.2, p.size * 0.55);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
        }

        ctx.restore();

        // Physics
        p.vy       += 0.025;
        p.x        += p.vx;
        p.y        += p.vy;
        p.rotation += p.rotationSpeed;
        p.vx       *= 0.995;

        // Per-particle fade after spreading
        const dist = Math.hypot(p.x - cx, p.y - cy);
        if (dist > 200) p.opacity -= 0.0015;
        if (p.opacity < 0) p.opacity = 0;

        // Only respawn while not fading out
        if (!fadingOut.current && (p.opacity <= 0 || p.y > canvas.height + 40)) {
          const angle2 = randomBetween(0, Math.PI * 2);
          const speed2 = randomBetween(0.4, 3.2);
          p.x       = cx + randomBetween(-40, 40);
          p.y       = cy + randomBetween(-40, 40);
          p.vx      = Math.cos(angle2) * speed2;
          p.vy      = Math.sin(angle2) * speed2 - randomBetween(0, 1.5);
          p.opacity = randomBetween(0.7, 1);
          p.color   = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
      }

      // Stop loop once fully invisible
      if (opacity.current <= 0) return;

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(stopTimer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
}
