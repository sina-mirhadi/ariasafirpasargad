import { useEffect, useRef } from "react";

// پس‌زمینه‌ی سه‌بعدی: عمق تونل و ستاره‌ها فقط تابعی از موقعیت اسکرول است؛
// پس اسکرول به پایین = حرکت رو به جلو و اسکرول به بالا = حرکت به عقب (مثل جلو/عقب‌بردن ویدیو).
const RINGS = 14;
const RING_GAP = 340;
const FAR = RINGS * RING_GAP;
const STARS = 240;
const BLUE = "90,150,255";
const MANGO = "255,179,0";

export default function ScrollScene() {
  const sceneRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stars = Array.from({ length: STARS }, () => ({
      x: (Math.random() - 0.5) * 2600,
      y: (Math.random() - 0.5) * 1800,
      z: Math.random() * FAR,
      gold: Math.random() < 0.22
    }));

    let w = 0, h = 0, maxScroll = 1;
    let depth = 0, lastDepth = 0;
    let px = 0, py = 0, tx = 0, ty = 0;
    let raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      maxScroll = Math.max(1, document.documentElement.scrollHeight - h);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const f = Math.min(w, h) * 0.9;
      const cx = w / 2 + tx * 46;
      const cy = h / 2 + ty * 32;
      const dz = depth - lastDepth;

      // حلقه‌های شش‌ضلعی تونل
      for (let i = 0; i < RINGS; i++) {
        const z = ((((i * RING_GAP - depth) % FAR) + FAR) % FAR) + 40;
        const near = 1 - z / FAR;
        const alpha = Math.min(1, near * 1.5) * Math.min(1, z / 220) * 0.55;
        if (alpha < 0.01) continue;
        const r = (720 * f) / z;
        const rot = i * 0.4 + depth * 0.0005;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = rot + (k * Math.PI) / 3;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${i % 4 === 0 ? MANGO : BLUE},${alpha})`;
        ctx.lineWidth = 0.8 + near * 2.4;
        ctx.stroke();
      }

      // ستاره‌ها با رد نوری هنگام اسکرول
      for (const s of stars) {
        const z = ((((s.z - depth * 1.6) % FAR) + FAR) % FAR) + 20;
        const sx = cx + (s.x * f) / z;
        const sy = cy + (s.y * f) / z;
        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) continue;
        const near = 1 - z / FAR;
        ctx.strokeStyle = `rgba(${s.gold ? MANGO : "210,225,255"},${0.15 + near * 0.85})`;
        ctx.fillStyle = ctx.strokeStyle;
        const zPrev = z + dz * 1.6;
        if (Math.abs(dz) > 1 && zPrev > 5) {
          ctx.lineWidth = 0.6 + near * 1.4;
          ctx.beginPath();
          ctx.moveTo(cx + (s.x * f) / zPrev, cy + (s.y * f) / zPrev);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, 0.4 + near * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function tick() {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      const y = window.scrollY;
      const target = y * 1.1;
      lastDepth = depth;
      depth += (target - depth) * 0.09;
      tx += (px - tx) * 0.06;
      ty += (py - ty) * 0.06;
      scene.style.setProperty("--p", Math.min(1, Math.max(0, y / maxScroll)).toFixed(4));
      draw();
    }

    function onPointer(e) {
      px = (e.clientX / w - 0.5) * 2;
      py = (e.clientY / h - 0.5) * 2;
    }

    resize();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(document.body);

    if (reduce) {
      draw();
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="scene" ref={sceneRef} aria-hidden="true">
      <div className="scene-base" />
      <div className="scene-glow" />
      <canvas ref={canvasRef} />
    </div>
  );
}
