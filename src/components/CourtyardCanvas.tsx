import React, { useEffect, useRef } from 'react';

interface SakuraPetalParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  tumblePhase: number;
  tumbleSpeed: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  spriteIndex: number;
  opacity: number;
  depth: number; // 0 = far background, 1 = foreground
}

const PETAL_SPRITE_PATHS = [
  '/petals/petal_0.png',
  '/petals/petal_1.png',
  '/petals/petal_2.png',
  '/petals/petal_3.png',
  '/petals/petal_4.png',
  '/petals/petal_5.png'
];

export const CourtyardCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Preload Blender-rendered 3D Sakura Petal PNG sprites
    const petalImages: HTMLImageElement[] = PETAL_SPRITE_PATHS.map((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      return img;
    });

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let gustBoost = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const handleBreezeGust = () => {
      gustBoost = 2.6;
    };
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('shrine-breeze', handleBreezeGust);

    // Only pink Sakura petals falling gently in the background
    const count = Math.min(42, Math.max(20, Math.floor((width * height) / 34000)));
    const petals: SakuraPetalParticle[] = Array.from({ length: count }, (_, i) => {
      const depth = (i % 5) / 4; // Stratified depth layers for natural parallax
      const size = 14 + depth * 14 + Math.random() * 6;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0.18 + depth * 0.22 + (Math.random() - 0.4) * 0.2,
        vy: 0.45 + depth * 0.45 + Math.random() * 0.3,
        size,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.014,
        tumblePhase: Math.random() * Math.PI * 2,
        tumbleSpeed: 0.016 + Math.random() * 0.018,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.012 + Math.random() * 0.01,
        swayAmp: 0.35 + depth * 0.45,
        spriteIndex: i % petalImages.length,
        opacity: 0.42 + depth * 0.38,
        depth
      };
    });

    // Fallback vector sakura petal (used only during the first millisecond before PNGs finish decoding)
    const drawFallbackSakuraPetal = (s: number) => {
      const r = s * 0.5;
      ctx.fillStyle = '#f48fb1';
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(r * 0.95, r * 0.4, r * 0.95, -r * 0.65, r * 0.22, -r);
      ctx.lineTo(0, -r * 0.68);
      ctx.lineTo(-r * 0.22, -r);
      ctx.bezierCurveTo(-r * 0.95, -r * 0.65, -r * 0.95, r * 0.4, 0, r);
      ctx.closePath();
      ctx.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      if (gustBoost > 0.01) {
        gustBoost *= 0.982;
      } else {
        gustBoost = 0;
      }

      for (const p of petals) {
        p.swayPhase += p.swaySpeed * (1 + gustBoost * 0.65);
        p.tumblePhase += p.tumbleSpeed * (1 + gustBoost * 0.8);

        const horizontalFlutter = Math.sin(p.swayPhase) * p.swayAmp;
        const verticalGlide = Math.cos(p.swayPhase * 2) * 0.12;

        p.x += p.vx + horizontalFlutter + gustBoost * (0.9 + p.depth * 1.1);
        p.y += p.vy + verticalGlide - gustBoost * 0.08;
        p.rotation += p.rotSpeed + Math.cos(p.swayPhase) * 0.005 + gustBoost * 0.012;

        // Seamless wrap around viewport edges
        const margin = p.size + 12;
        if (p.y > height + margin) {
          p.y = -margin;
          p.x = Math.random() * width;
        }
        if (p.x > width + margin) {
          p.x = -margin;
        } else if (p.x < -margin) {
          p.x = width + margin;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // 3D aerodynamic petal tumble foreshortening
        const scaleX = 0.55 + 0.45 * Math.sin(p.tumblePhase);
        const scaleY = 0.68 + 0.32 * Math.cos(p.tumblePhase * 0.8);
        ctx.scale(scaleX, scaleY);
        ctx.globalAlpha = p.opacity;

        const sprite = petalImages[p.spriteIndex];
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
          ctx.drawImage(sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          drawFallbackSakuraPetal(p.size);
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('shrine-breeze', handleBreezeGust);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 block pointer-events-none z-0"
    />
  );
};
