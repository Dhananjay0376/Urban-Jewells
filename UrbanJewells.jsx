import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import * as THREE from "three";
import { isSanityConfigured, loadCatalogFromSanity } from "./src/lib/sanityCatalog";
import { getSupabaseSession, isSupabaseConfigured, onSupabaseAuthChange, signInAdminWithPassword, signOutAdminSession } from "./src/lib/supabaseClient";
import { ORDER_STATUSES, buildDashboardMetrics, buildWhatsAppOrderMessage, createOrderRequest, deleteCancelledOrder, fetchAdminSnapshot, updateOrderAdminNotes, upsertInventoryRecord, updateOrderStatus } from "./src/lib/commerceAdmin";

// =================================================================
// GLOBAL STYLES - Dark Luxury Editorial
// =================================================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

    :root{
      --ink:#0A0D0A; --ink2:#0E1410; --ink3:#121A0F;
      --sg:#1E3A0F; --dg:#2D5016; --fg:#3D6B1E;
      --mint:#A8E6CF; --mint2:#7DCFAD; --ml:#D4F5E9;
      --gold:#C9A84C; --gold2:#E8C97A; --gold3:#F0DFA0;
      --cream:#FAFAF5; --ww:#F5F3EE;
      --ch:#1A1A1A; --mg:#4A4A4A; --lg:#8A8A8A;
      --br:#1E2E1A; --br2:#2A3E24;
      --glass:rgba(255,255,255,0.04);
      --glass-border:rgba(168,230,207,0.12);
      --glow-mint:0 0 40px rgba(168,230,207,0.25);
      --glow-gold:0 0 30px rgba(201,168,76,0.3);
    }

    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html { scroll-behavior:smooth; }
    body {
      background:var(--ink);
      color:var(--cream);
      font-family:'DM Sans',sans-serif;
      overflow-x:hidden;
      cursor:none;
    }
    body.light-mode { background:var(--cream); color:var(--ch); }

    /* Custom Cursor */
    #cursor-dot {
      position:fixed; width:8px; height:8px;
      background:var(--mint); border-radius:50%;
      pointer-events:none; z-index:9999;
      transform:translate(-50%,-50%);
      transition:transform 0.08s ease, width 0.2s, height 0.2s, background 0.2s;
      mix-blend-mode:screen;
    }
    #cursor-ring {
      position:fixed; width:36px; height:36px;
      border:1px solid rgba(168,230,207,0.5);
      border-radius:50%; pointer-events:none; z-index:9998;
      transform:translate(-50%,-50%);
      transition:transform 0.18s cubic-bezier(.16,1,.3,1), width 0.3s, height 0.3s, border-color 0.2s, opacity 0.2s;
    }
    body:hover #cursor-ring { opacity:1; }
    .cursor-hover #cursor-dot { width:14px; height:14px; background:var(--gold2); }
    .cursor-hover #cursor-ring { width:52px; height:52px; border-color:rgba(201,168,76,0.5); }

    /* Grain overlay */
    body::after {
      content:'';
      position:fixed; inset:0;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
      pointer-events:none; z-index:10000; opacity:0.55;
    }

    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:var(--ink); }
    ::-webkit-scrollbar-thumb { background:var(--br2); border-radius:2px; }
    ::-webkit-scrollbar-thumb:hover { background:var(--mint2); }
    select, option, optgroup {
      background-color: var(--ink2);
      color: var(--cream);
    }

    /* - Keyframes - */
    @keyframes fadeUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes slideRight { from{transform:translateX(105%)} to{transform:translateX(0)} }
    @keyframes toastIn { from{transform:translateX(140px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes spinR { to{transform:rotate(360deg)} }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-18px) rotate(3deg)} 66%{transform:translateY(-8px) rotate(-2deg)} }
    @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-24px)} }
    @keyframes pulseGlow { 0%,100%{opacity:0.4} 50%{opacity:1} }
    @keyframes drawCheck { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
    @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
    @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes rotateGem { to{transform:rotate(360deg)} }
    @keyframes borderSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
    @keyframes scaleIn { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }
    @keyframes glowPulse {
      0%,100%{box-shadow:0 0 20px rgba(168,230,207,.15),0 0 60px rgba(168,230,207,.05)}
      50%{box-shadow:0 0 40px rgba(168,230,207,.35),0 0 100px rgba(168,230,207,.12)}
    }
    @keyframes goldShimmer {
      0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
    }
    @keyframes particleDrift {
      0%{transform:translateY(0) translateX(0) scale(1); opacity:0}
      10%{opacity:1}
      90%{opacity:0.6}
      100%{transform:translateY(-120vh) translateX(var(--drift)) scale(0.5); opacity:0}
    }
    @keyframes lineGrow { from{width:0} to{width:100%} }
    @keyframes typeIn { from{clip-path:inset(0 100% 0 0)} to{clip-path:inset(0 0% 0 0)} }

    /* - Font Helpers - */
    .font-display { font-family:'Cormorant Garamond',Georgia,serif; }
    .font-mono { font-family:'DM Mono',monospace; }

    /* - Reveal animations - */
    .fade-up   { animation:fadeUp .75s cubic-bezier(.16,1,.3,1) both; }
    .fade-up-1 { animation:fadeUp .75s cubic-bezier(.16,1,.3,1) .08s both; }
    .fade-up-2 { animation:fadeUp .75s cubic-bezier(.16,1,.3,1) .18s both; }
    .fade-up-3 { animation:fadeUp .75s cubic-bezier(.16,1,.3,1) .28s both; }
    .fade-up-4 { animation:fadeUp .75s cubic-bezier(.16,1,.3,1) .38s both; }
    .fade-up-5 { animation:fadeUp .75s cubic-bezier(.16,1,.3,1) .50s both; }
    .fade-up-6 { animation:fadeUp .75s cubic-bezier(.16,1,.3,1) .64s both; }
    .scale-in  { animation:scaleIn .55s cubic-bezier(.16,1,.3,1) both; }

    /* - Glassmorphism cards - */
    .glass-card {
      background:rgba(10,13,10,0.6);
      backdrop-filter:blur(24px);
      -webkit-backdrop-filter:blur(24px);
      border:1px solid var(--glass-border);
      border-radius:16px;
      position:relative;
      overflow:hidden;
    }
    .glass-card::before {
      content:'';
      position:absolute; inset:0;
      background:linear-gradient(135deg,rgba(168,230,207,0.04) 0%,transparent 60%);
      pointer-events:none;
    }

    /* - Buttons - */
    .btn-luxury {
      display:inline-flex; align-items:center; gap:10px;
      background:linear-gradient(135deg,var(--sg),var(--dg));
      color:var(--cream); border:none;
      padding:15px 34px; border-radius:4px;
      font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500;
      letter-spacing:.06em; cursor:none;
      position:relative; overflow:hidden;
      transition:transform .2s, box-shadow .2s;
    }
    .btn-luxury::after {
      content:''; position:absolute; inset:0;
      background:linear-gradient(90deg,transparent,rgba(168,230,207,.15),transparent);
      transform:translateX(-100%);
      transition:transform .5s ease;
    }
    .btn-luxury:hover::after { transform:translateX(100%); }
    .btn-luxury:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(30,58,15,.6),var(--glow-mint); }

    .btn-ghost-luxury {
      display:inline-flex; align-items:center; gap:10px;
      background:transparent; color:var(--cream);
      border:1px solid rgba(168,230,207,.25);
      padding:14px 32px; border-radius:4px;
      font-family:'DM Sans',sans-serif; font-size:14px; letter-spacing:.06em;
      cursor:none; transition:border-color .2s, background .2s, box-shadow .2s;
    }
    .btn-ghost-luxury:hover {
      border-color:rgba(168,230,207,.7);
      background:rgba(168,230,207,.06);
      box-shadow:inset 0 0 20px rgba(168,230,207,.05), var(--glow-mint);
    }

    .btn-gold {
      display:inline-flex; align-items:center; gap:10px;
      background:linear-gradient(135deg,#8B6914,var(--gold),var(--gold2),var(--gold));
      background-size:200% 200%;
      animation:goldShimmer 4s ease infinite;
      color:#0A0D0A; border:none;
      padding:15px 34px; border-radius:4px;
      font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
      letter-spacing:.06em; cursor:none;
      transition:transform .2s, box-shadow .2s;
    }
    .btn-gold:hover { transform:translateY(-2px); box-shadow:var(--glow-gold); }

    /* - Product Card - */
    .pcard {
      background:rgba(14,20,16,0.85);
      border:1px solid var(--br);
      border-radius:12px;
      overflow:hidden;
      position:relative;
      transition:border-color .35s, box-shadow .35s, transform .35s cubic-bezier(.16,1,.3,1);
    }
    .pcard::before {
      content:''; position:absolute; inset:0; z-index:0;
      background:linear-gradient(180deg, transparent 50%, rgba(10,13,10,0.98) 100%);
      pointer-events:none;
    }
    .pcard:hover {
      border-color:rgba(168,230,207,.3);
      box-shadow:0 20px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(168,230,207,.1), var(--glow-mint);
      transform:translateY(-8px);
    }
    .pcard-img { transition:transform .6s cubic-bezier(.16,1,.3,1); }
    .pcard:hover .pcard-img { transform:scale(1.08); }
    .pcard-cta {
      position:absolute; bottom:0; left:0; right:0;
      transform:translateY(100%); opacity:0;
      transition:transform .3s cubic-bezier(.16,1,.3,1), opacity .25s;
      z-index:2;
    }
    .pcard:hover .pcard-cta { transform:translateY(0); opacity:1; }

    /* - Nav link - */
    .nav-lnk {
      font-family:'Cormorant Garamond',serif; font-size:16px;
      letter-spacing:.08em; color:rgba(250,250,245,.65);
      background:none; border:none; cursor:none;
      padding:4px 0; position:relative;
      transition:color .2s;
      text-decoration:none;
    }
    .nav-lnk::after {
      content:''; position:absolute;
      bottom:-2px; left:0; right:100%; height:1px;
      background:var(--mint);
      transition:right .25s cubic-bezier(.16,1,.3,1);
    }
    .nav-lnk:hover, .nav-lnk.active { color:var(--cream); }
    .nav-lnk:hover::after, .nav-lnk.active::after { right:0; }

    /* - Field - */
    .dark-field {
      width:100%; background:rgba(255,255,255,0.04);
      border:1px solid rgba(168,230,207,.15);
      border-radius:6px; padding:13px 16px;
      font-family:'DM Sans',sans-serif; font-size:14px;
      color:var(--cream); outline:none;
      transition:border-color .2s, box-shadow .2s;
    }
    .dark-field:focus {
      border-color:rgba(168,230,207,.55);
      box-shadow:0 0 0 3px rgba(168,230,207,.08), inset 0 0 20px rgba(168,230,207,.03);
    }
    .dark-field::placeholder { color:rgba(250,250,245,.25); }
    select.dark-field { 
      appearance:none; 
      background:rgba(255,255,245,.04) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1L6 6L11 1' stroke='rgba(168,230,207,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat;
      background-position:right 12px center;
      padding-right:36px;
      color:var(--cream); 
    }
    select.dark-field option { background:var(--ink); color:var(--cream); }

    /* - Misc - */
    .shimmer-line {
      height:1px;
      background:linear-gradient(90deg, transparent, var(--mint), transparent);
    }
    .skeleton-shimmer {
      background:linear-gradient(90deg,rgba(168,230,207,.04) 0%,rgba(250,250,245,.1) 50%,rgba(168,230,207,.04) 100%);
      background-size:800px 100%;
      animation:shimmer 1.8s linear infinite;
    }
    .glow-orb {
      position:absolute; border-radius:50%;
      background:radial-gradient(circle, rgba(168,230,207,.12) 0%, transparent 70%);
      pointer-events:none;
    }
    .label-tag {
      font-family:'DM Mono',monospace; font-size:10px;
      letter-spacing:.22em; text-transform:uppercase;
      color:var(--mint); opacity:.75;
    }
    .accordion-body {
      overflow:hidden; max-height:0; opacity:0;
      transition:max-height .35s ease, opacity .3s ease, padding .3s;
    }
    .accordion-body.open { max-height:500px; opacity:1; }
    .animate-spin { animation:spinR .9s linear infinite; }
    .marquee-track { animation:marquee 42s linear infinite; }
    .marquee-track:hover { animation-play-state:paused; }
    .float-slow { animation:floatB 7s ease-in-out infinite; }
    .glow-pulse { animation:glowPulse 3s ease-in-out infinite; }

    /* Tablet */
    @media(max-width:1024px){
      :root { --page-gutter:32px; }

      header { padding:0 var(--page-gutter) !important; }
      header nav { display:none !important; }
      header > div:last-child > button:last-child { display:inline-flex !important; }

      [style*="padding: 80px 48px"] { padding:72px var(--page-gutter) !important; }
      [style*="padding: 96px 48px"] { padding:84px var(--page-gutter) !important; }
      [style*="padding: 64px 48px"] { padding:58px var(--page-gutter) !important; }
      [style*="padding: 60px 48px"] { padding:54px var(--page-gutter) !important; }
      [style*="padding: 48px"] { padding:40px var(--page-gutter) !important; }
      [style*="padding: 44px 48px"] { padding:38px var(--page-gutter) !important; }
      [style*="padding: 40px 48px"] { padding:34px var(--page-gutter) !important; }
      [style*="padding: 36px 48px"] { padding:32px var(--page-gutter) !important; }
      [style*="padding: 120px 48px 64px"] { padding:108px var(--page-gutter) 56px !important; }
      [style*="padding: 120px 48px 56px"] { padding:108px var(--page-gutter) 50px !important; }
      [style*="padding: 100px 48px 60px"] { padding:96px var(--page-gutter) 54px !important; }
      [style*="padding: 60px 48px 80px"] { padding:52px var(--page-gutter) 70px !important; }

      [style*="grid-template-columns: 1.6fr 1fr 1fr 1fr"] { grid-template-columns:1fr 1fr !important; gap:32px !important; }
      [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns:1fr !important; gap:36px !important; }
      [style*="grid-template-columns: 1.15fr 1fr"] { grid-template-columns:1fr !important; gap:34px !important; }
      [style*="grid-template-columns: 1.2fr 1fr"] { grid-template-columns:1fr !important; gap:34px !important; }
    }

    /* Mobile */
    @media(max-width:768px){
      :root { --page-gutter:20px; }

      body { cursor:auto; }
      #cursor-dot, #cursor-ring { display:none; }

      header { height:64px !important; padding:0 var(--page-gutter) !important; }
      header > div:last-child { gap:14px !important; }

      .btn-luxury, .btn-ghost-luxury, .btn-gold { padding:12px 20px; font-size:12px; }
      .dark-field { padding:12px 14px; font-size:13px; }

      [style*="min-width: 300px"] { min-width:240px !important; }
      [style*="min-width: 270px"] { min-width:0 !important; width:100% !important; }
      [style*="height: 380px"] { height:300px !important; }
      [style*="height: 320px"] { height:260px !important; }
      [style*="height: 300px"] { height:240px !important; }

      [style*="padding: 80px 48px"] { padding:56px var(--page-gutter) !important; }
      [style*="padding: 96px 48px"] { padding:64px var(--page-gutter) !important; }
      [style*="padding: 64px 48px"] { padding:48px var(--page-gutter) !important; }
      [style*="padding: 60px 48px"] { padding:44px var(--page-gutter) !important; }
      [style*="padding: 48px"] { padding:32px var(--page-gutter) !important; }
      [style*="padding: 44px 48px"] { padding:28px var(--page-gutter) !important; }
      [style*="padding: 40px 48px"] { padding:28px var(--page-gutter) !important; }
      [style*="padding: 36px 48px"] { padding:24px var(--page-gutter) !important; }
      [style*="padding: 120px 48px 64px"] { padding:92px var(--page-gutter) 46px !important; }
      [style*="padding: 120px 48px 56px"] { padding:92px var(--page-gutter) 42px !important; }
      [style*="padding: 100px 48px 60px"] { padding:88px var(--page-gutter) 42px !important; }
      [style*="padding: 60px 48px 80px"] { padding:44px var(--page-gutter) 56px !important; }

      [style*="grid-template-columns: repeat(auto-fill,minmax(380px,1fr))"] { grid-template-columns:1fr !important; }
      [style*="grid-template-columns: repeat(auto-fill,minmax(270px,1fr))"] { grid-template-columns:1fr !important; }
      [style*="grid-template-columns: repeat(auto-fill,minmax(260px,1fr))"] { grid-template-columns:1fr !important; }
      [style*="grid-template-columns: repeat(auto-fill,minmax(250px,1fr))"] { grid-template-columns:1fr !important; }
      [style*="grid-template-columns: repeat(auto-fill,minmax(220px,1fr))"] { grid-template-columns:1fr !important; }
    }
    @media(prefers-reduced-motion:reduce){
      * { animation-duration:.01ms !important; transition-duration:.01ms !important; }
    }
  `}</style>
);

// =================================================================
//  CUSTOM CURSOR
// =================================================================
function Cursor() {
  const dot = useRef(null), ring = useRef(null);
  const pos = useRef({x:0,y:0}), target = useRef({x:0,y:0});
  useEffect(() => {
    const onMove = e => { target.current = {x:e.clientX, y:e.clientY}; };
    const onEnter = () => document.body.classList.add('cursor-hover');
    const onLeave = () => document.body.classList.remove('cursor-hover');
    document.addEventListener('mousemove', onMove);
    document.querySelectorAll('button,a,[data-hover]').forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      pos.current.x += (target.current.x - pos.current.x) * 0.22;
      pos.current.y += (target.current.y - pos.current.y) * 0.22;
      if (dot.current) dot.current.style.cssText = `left:${target.current.x}px;top:${target.current.y}px;`;
      if (ring.current) ring.current.style.cssText = `left:${pos.current.x}px;top:${pos.current.y}px;`;
    };
    tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('mousemove', onMove); };
  }, []);
  return (
    <>
      <div id="cursor-dot" ref={dot}/>
      <div id="cursor-ring" ref={ring}/>
    </>
  );
}

// =================================================================
//  PARTICLE BOKEH CANVAS
// =================================================================
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const particles = Array.from({length:55}, () => ({
      x: Math.random()*W, y: Math.random()*H + H*0.2,
      r: Math.random()*2.5 + 0.5,
      vx: (Math.random()-0.5)*0.22,
      vy: -(Math.random()*0.35 + 0.08),
      opacity: Math.random()*0.55 + 0.08,
      color: Math.random() > 0.5 ? [168,230,207] : [201,168,76],
    }));
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
        g.addColorStop(0, `rgba(${p.color.join(',')},${p.opacity})`);
        g.addColorStop(1, `rgba(${p.color.join(',')},0)`);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
      });
    };
    tick();
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={ref} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:1,opacity:0.6}}/>;
}

// =================================================================
// THREE.JS - HERO GEM
// =================================================================
function HeroGem({ size = 520 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    cam.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;

    // Main gem
    const geoMain = new THREE.IcosahedronGeometry(1.7, 3);
    const matMain = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#7ECFAD'),
      roughness: 0.0,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      transmission: 0.15,
      thickness: 2.0,
      envMapIntensity: 3.0,
      emissive: new THREE.Color('#051A08'),
      emissiveIntensity: 0.5,
      iridescence: 0.6,
      iridescenceIOR: 1.5,
    });
    const gem = new THREE.Mesh(geoMain, matMain);
    scene.add(gem);

    // Inner glow sphere
    const geoInner = new THREE.SphereGeometry(1.1, 32, 32);
    const matInner = new THREE.MeshBasicMaterial({ color:new THREE.Color('#A8E6CF'), transparent:true, opacity:0.05 });
    const innerGlow = new THREE.Mesh(geoInner, matInner);
    scene.add(innerGlow);

    // Orbital ring
    const ringGeo = new THREE.TorusGeometry(2.4, 0.012, 8, 120);
    const ringMat = new THREE.MeshBasicMaterial({ color:new THREE.Color('#A8E6CF'), transparent:true, opacity:0.2 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2.8;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.008, 8, 120), new THREE.MeshBasicMaterial({ color:new THREE.Color('#C9A84C'), transparent:true, opacity:0.12 }));
    ring2.rotation.x = Math.PI / 4;
    ring2.rotation.z = Math.PI / 5;
    scene.add(ring2);

    // Floating crystal shards
    const shards = [];
    for (let i=0; i<8; i++) {
      const sg = new THREE.OctahedronGeometry(0.08 + Math.random()*0.12, 0);
      const sm = new THREE.MeshPhysicalMaterial({
        color: i%2===0 ? new THREE.Color('#A8E6CF') : new THREE.Color('#C9A84C'),
        roughness: 0.0, metalness: 0.2, clearcoat:1.0,
        emissive: i%2===0 ? new THREE.Color('#052010') : new THREE.Color('#1A0E00'),
        emissiveIntensity: 0.4,
      });
      const s = new THREE.Mesh(sg, sm);
      const angle = (i / 8) * Math.PI * 2;
      const radius = 2.5 + Math.random()*0.5;
      s.position.set(Math.cos(angle)*radius, (Math.random()-0.5)*2, Math.sin(angle)*radius*0.4);
      s.userData = { angle, radius, speed: 0.006 + Math.random()*0.004, yOffset: s.position.y };
      scene.add(s);
      shards.push(s);
    }

    // Lights
    const amb = new THREE.AmbientLight('#1A2A1A', 0.6);
    scene.add(amb);
    const sun = new THREE.DirectionalLight('#FFFFFF', 2.0);
    sun.position.set(6, 10, 8);
    scene.add(sun);
    const mintLight = new THREE.PointLight('#A8E6CF', 8, 20);
    mintLight.position.set(3, 4, 5);
    scene.add(mintLight);
    const goldLight = new THREE.PointLight('#C9A84C', 4, 14);
    goldLight.position.set(-5, -2, 3);
    scene.add(goldLight);
    const backLight = new THREE.PointLight('#D4F5E9', 3, 12);
    backLight.position.set(-3, 5, -4);
    scene.add(backLight);

    // Mouse parallax
    let mx=0, my=0;
    const onMM = e => {
      mx = ((e.clientX / window.innerWidth) - 0.5) * 1.4;
      my = -((e.clientY / window.innerHeight) - 0.5) * 1.4;
    };
    window.addEventListener('mousemove', onMM);

    let t = 0, raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.012;
      gem.rotation.y += 0.004;
      gem.rotation.x += 0.001;
      gem.position.x += (mx * 0.5 - gem.position.x) * 0.04;
      gem.position.y += (my * 0.5 - gem.position.y) * 0.04;
      ring1.rotation.z += 0.003;
      ring2.rotation.y += 0.002;
      mintLight.intensity = 6 + Math.sin(t*2)*2;
      goldLight.intensity = 3 + Math.cos(t*1.5)*1.5;
      shards.forEach(s => {
        s.userData.angle += s.userData.speed;
        s.position.x = Math.cos(s.userData.angle) * s.userData.radius;
        s.position.z = Math.sin(s.userData.angle) * s.userData.radius * 0.4;
        s.position.y = s.userData.yOffset + Math.sin(t + s.userData.angle) * 0.3;
        s.rotation.x += 0.02; s.rotation.y += 0.015;
      });
      renderer.render(scene, cam);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMM);
      renderer.dispose();
    };
  }, [size]);
  return <canvas ref={ref} style={{ width:size, height:size, display:'block', filter:'drop-shadow(0 0 60px rgba(168,230,207,.45)) drop-shadow(0 0 120px rgba(168,230,207,.15))' }}/>;
}

// =================================================================
//  DATA
// =================================================================
const EMPTY_PRODUCTS = [];
const EMPTY_COLLECTIONS = [];
const EMPTY_CATEGORIES = [];

const TESTIMONIALS = [
  {id:1,name:"Priya Sharma",location:"Mumbai, India",rating:5,text:"Rivals pieces I've bought from European boutiques. The stone catches light in the most magical way - I receive compliments every single day.",product:"Celestial Solitaire Ring"},
  {id:2,name:"Amara Dlamini",location:"Johannesburg, SA",rating:5,text:"The Forest Dew Necklace arrived in the most beautiful packaging. Three chains, infinite combinations - I wear them to the boardroom and to bed.",product:"Forest Dew Necklace"},
  {id:3,name:"Kavitha Nair",location:"Chennai, India",rating:5,text:"My Radiant Cuff stops conversations in their tracks. The plating is thick, the finish is immaculate. This isn't fast jewellery - it's art.",product:"Radiant Cuff Bracelet"},
  {id:4,name:"Lindiwe Mokoena",location:"Pretoria, SA",rating:5,text:"The WhatsApp ordering experience is so human and warm. And the Midnight Crescent is exactly as described - understated, perfect, unforgettable.",product:"Midnight Crescent"},
  {id:5,name:"Ananya Singh",location:"Delhi, India",rating:5,text:"Gorgeous pieces, fast dispatch, and the most thoughtful unboxing I've experienced. Urban Jewells understands that the experience is the product.",product:"Garden Path Bracelet"},
  {id:6,name:"Thandi Mkhize",location:"Durban, SA",rating:5,text:"I gave the Solstice Hoops to myself for my 30th. I have zero regrets. They go with everything - three pairs, one price, endless possibilities.",product:"Solstice Hoop Set"},
  {id:7,name:"Deepika Reddy",location:"Hyderabad, India",rating:5,text:"The Sundew Anklet is the most delicate, radiant piece I own. Every step catches the light. It's like wearing a little piece of summer.",product:"Sundew Anklet"},
];

const FAQS = [
  {q:"How does the ordering process work?",a:"Browse, select, and checkout. We'll confirm your order via WhatsApp within a few hours, share payment details, and dispatch once confirmed. Simple, personal, scam-free."},
  {q:"What payment methods do you accept?",a:"We accept UPI, bank transfer, and various digital wallets - all shared securely via WhatsApp after your order is placed. No unsecured card portals."},
  {q:"How long does delivery take?",a:"Standard delivery across India: 5-8 business days. Express (select pincodes): 2-3 business days. International: 8-15 business days. All orders include a tracking number."},
  {q:"Are your materials ethically sourced?",a:"Absolutely. All gemstones are conflict-free. Our metal suppliers follow environmental best practices. We inspect every batch."},
  {q:"How do I care for my pieces?",a:"Store each piece individually in the provided pouch. Avoid perfume, chlorine, and lotions. Clean gently with a soft dry cloth. With proper care, your Urban Jewells piece will last years."},
  {q:"What is your returns policy?",a:"14-day returns on unworn items in original packaging. Reach us via WhatsApp or email - we guide you through every step and refund within 5 business days."},
  {q:"Can I request a custom piece?",a:"Yes. Send us a photo, description, or just a feeling via WhatsApp. Our designers will respond with a quote and timeline within 48 hours."},
  {q:"Do you offer gift wrapping?",a:"Every Urban Jewells order ships in signature packaging that's already gift-ready. If you'd like a personalised note or special ribbon, just mention it in your order notes."},
];

// currency code and formatting (Indian rupee)
const CURRENCY_CODE = 'INR';
const FREE_SHIPPING_THRESHOLD = 2000;
const STANDARD_SHIPPING_FEE = 99;
const SITE_NAME = 'Urban Jewells';
const DEFAULT_META_DESCRIPTION = 'Luxury jewellery with an editorial edge. Explore statement rings, necklaces, bracelets and gift-ready pieces from Urban Jewells.';
const DEFAULT_SOCIAL_IMAGE = 'https://res.cloudinary.com/dxw1yg7if/image/upload/v1774376772/Model_p0p9uk.jpg';
const formatPrice = n => `${CURRENCY_CODE} ${Number(n).toLocaleString('en-IN')}`;
const formatDiscount = (o,c) => Math.round(((o-c)/o)*100);
const genRef = () => `UJ-${Date.now().toString(36).toUpperCase()}`;
const getShippingAmount = subtotal => subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
const getShippingMessage = subtotal => subtotal >= FREE_SHIPPING_THRESHOLD
  ? `Free shipping applied on orders above ${formatPrice(FREE_SHIPPING_THRESHOLD)}`
  : `Add ${formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more to unlock free shipping`;
const getOptimizedImageUrl = (url, { width, height, quality = 80, mode = 'cover' } = {}) => {
  if (!url) return '';
  if (url.includes('cdn.sanity.io/images/')) {
    const next = new URL(url);
    next.searchParams.set('auto', 'format');
    if (width) next.searchParams.set('w', String(width));
    if (height && mode === 'cover') next.searchParams.set('h', String(height));
    next.searchParams.set('q', String(quality));
    next.searchParams.set('fit', mode === 'cover' ? 'crop' : 'max');
    return next.toString();
  }
  if (url.includes('/image/upload/')) {
    const transforms = ['f_auto', `q_${quality === 80 ? 'auto:good' : quality}`];
    if (width) transforms.push(`w_${width}`);
    if (height && mode === 'cover') transforms.push(`h_${height}`);
    transforms.push(mode === 'cover' ? 'c_fill' : 'c_limit');
    if (mode === 'cover') transforms.push('g_auto');
    return url.replace('/image/upload/', `/image/upload/${transforms.join(',')}/`);
  }
  return url;
};
const ensureMetaTag = (selector, attributes) => {
  if (typeof document === 'undefined') return null;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) tag.setAttribute(key, String(value));
  });
  return tag;
};
const ensureLinkTag = (selector, attributes) => {
  if (typeof document === 'undefined') return null;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('link');
    document.head.appendChild(tag);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) tag.setAttribute(key, String(value));
  });
  return tag;
};
const buildAbsoluteUrl = (hashPath = '#/') => {
  if (typeof window === 'undefined') return hashPath;
  return `${window.location.origin}/${String(hashPath).startsWith('#') ? hashPath : `#${hashPath}`}`;
};
const titleCaseLabel = value => (value || '')
  .split(/[-_\s]+/)
  .filter(Boolean)
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');
const truncateText = (text, max = 155) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}...`;
};
const buildMetaForRoute = ({ page, params = {}, products = [], collections = [], categories = [] }) => {
  const base = {
    title: SITE_NAME,
    description: DEFAULT_META_DESCRIPTION,
    image: DEFAULT_SOCIAL_IMAGE,
    url: buildAbsoluteUrl(routeToHash(page, params)),
    type: 'website',
    robots: 'index,follow',
  };

  switch (page) {
    case 'home':
      return {
        ...base,
        title: `${SITE_NAME} | Luxury Jewellery with an Editorial Edge`,
        description: 'Shop elevated rings, necklaces, bracelets and gift-ready jewellery designed to feel luxurious, modern and personal.',
      };
    case 'all-pieces':
      return {
        ...base,
        title: `All Pieces | ${SITE_NAME}`,
        description: 'Browse the full Urban Jewells catalogue with filters for category, collection, price, stock and new arrivals.',
      };
    case 'collections':
      return {
        ...base,
        title: `Collections | ${SITE_NAME}`,
        description: 'Explore signature Urban Jewells collections curated around mood, styling and statement layering.',
      };
    case 'collection-detail': {
      const collection = collections.find(item => item.slug === params.slug);
      if (!collection) return { ...base, title: `Collection | ${SITE_NAME}` };
      return {
        ...base,
        title: `${collection.name} Collection | ${SITE_NAME}`,
        description: truncateText(collection.description || collection.mood || `Discover pieces from the ${collection.name} collection at ${SITE_NAME}.`),
        image: collection.coverImage || base.image,
      };
    }
    case 'categories':
      return {
        ...base,
        title: `Categories | ${SITE_NAME}`,
        description: 'Shop Urban Jewells by category, from rings and necklaces to bracelets, anklets and curated gift sets.',
      };
    case 'category': {
      const category = categories.find(item => item.slug === params.slug);
      if (!category) return { ...base, title: `Category | ${SITE_NAME}` };
      return {
        ...base,
        title: `${category.name} | ${SITE_NAME}`,
        description: truncateText(category.tagline || `Explore ${category.name.toLowerCase()} from ${SITE_NAME}.`),
        image: category.coverImage || base.image,
      };
    }
    case 'product': {
      const product = products.find(item => item.slug === params.slug);
      if (!product) return { ...base, title: `Product | ${SITE_NAME}`, type: 'product' };
      const categoryLabel = categories.find(item => item.slug === product.category)?.name || titleCaseLabel(product.category);
      const collectionLabel = collections.find(item => item.slug === product.collection)?.name || titleCaseLabel(product.collection);
      const summary = [
        product.shortDescription,
        categoryLabel ? `${categoryLabel} by ${SITE_NAME}.` : null,
        collectionLabel ? `From the ${collectionLabel} collection.` : null,
      ].filter(Boolean).join(' ');
      return {
        ...base,
        title: `${product.name} | ${SITE_NAME}`,
        description: truncateText(summary || `Shop ${product.name} at ${SITE_NAME}.`),
        image: product.images?.[0] || base.image,
        type: 'product',
      };
    }
    case 'about':
      return {
        ...base,
        title: `About Us | ${SITE_NAME}`,
        description: 'Learn about the craft, sourcing values and design approach behind Urban Jewells.',
      };
    case 'contact':
      return {
        ...base,
        title: `Contact Us | ${SITE_NAME}`,
        description: 'Get in touch with Urban Jewells for orders, custom requests, gifting questions and support.',
      };
    case 'wishlist':
      return {
        ...base,
        title: `Wishlist | ${SITE_NAME}`,
        description: 'Review the Urban Jewells pieces you have saved for later.',
      };
    case 'cart':
      return {
        ...base,
        title: `Cart | ${SITE_NAME}`,
        description: 'Review your Urban Jewells cart, shipping and checkout details.',
      };
    case 'privacy-policy':
      return {
        ...base,
        title: `Privacy Policy | ${SITE_NAME}`,
        description: 'Read how Urban Jewells handles customer information, communication and privacy.',
      };
    case 'shipping':
      return {
        ...base,
        title: `Shipping Policy | ${SITE_NAME}`,
        description: 'Review Urban Jewells shipping timelines, thresholds and dispatch expectations.',
      };
    case 'returns':
      return {
        ...base,
        title: `Returns Policy | ${SITE_NAME}`,
        description: 'Understand Urban Jewells returns, exchanges and refund guidelines before ordering.',
      };
    case 'terms':
      return {
        ...base,
        title: `Terms & Conditions | ${SITE_NAME}`,
        description: 'Read the terms governing purchases, orders and use of the Urban Jewells website.',
      };
    case 'admin':
      return {
        ...base,
        title: `Admin Portal | ${SITE_NAME}`,
        description: 'Protected Urban Jewells admin portal.',
        robots: 'noindex,nofollow',
      };
    default:
      return base;
  }
};
const withCollectionCounts = (collections, products) => collections.map(collection => ({
  ...collection,
  productCount: collection.productCount || products.filter(product => product.collection === collection.slug).length,
}));
const getDefaultVariant = product => Array.isArray(product?.variants) && product.variants.length ? product.variants[0] : null;
const getDisplayImages = (product, variant = null) => {
  const variantImages = Array.isArray(variant?.images) ? variant.images.filter(Boolean) : [];
  if (variantImages.length) return variantImages;
  return Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
};
const getDisplayPrice = (product, variant = null) => typeof variant?.price === 'number' ? variant.price : product?.price;
const getDisplayOriginalPrice = (product, variant = null) => typeof variant?.originalPrice === 'number' ? variant.originalPrice : product?.originalPrice;
const getDisplayStock = (product, variant = null) => typeof variant?.inStock === 'boolean' ? variant.inStock : product?.inStock !== false;
const getWishlistKey = (product, variant = null) => {
  const activeVariant = variant || getDefaultVariant(product);
  return `${product.id}-${activeVariant?.id || 'base'}`;
};
const materializeProductSelection = (product, variant = null) => {
  const activeVariant = variant || getDefaultVariant(product);
  return {
    ...product,
    selectedVariantId: activeVariant?.id || null,
    selectedColorName: activeVariant?.colorName || null,
    selectedColorHex: activeVariant?.colorHex || null,
    images: getDisplayImages(product, activeVariant),
    price: getDisplayPrice(product, activeVariant),
    originalPrice: getDisplayOriginalPrice(product, activeVariant),
    inStock: getDisplayStock(product, activeVariant),
  };
};
const CART_STORAGE_KEY = 'urban-jewells-cart-v1';
const WISHLIST_STORAGE_KEY = 'urban-jewells-wishlist-v1';
const readStoredArray = (key) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const writeStoredArray = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// =================================================================
//  APP CONTEXT
// =================================================================
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

function AppProvider({ children }) {
  const [cart, setCart] = useState(() => readStoredArray(CART_STORAGE_KEY));
  const [wishlist, setWishlist] = useState(() => readStoredArray(WISHLIST_STORAGE_KEY));
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const cmsEnabled = isSanityConfigured();
  const [catalog, setCatalog] = useState(() => ({
    products: EMPTY_PRODUCTS,
    collections: EMPTY_COLLECTIONS,
    categories: EMPTY_CATEGORIES,
    loading: cmsEnabled,
    source: cmsEnabled ? 'loading' : 'unconfigured',
    error: cmsEnabled ? null : 'Sanity catalog is not configured',
  }));

  const refreshCatalog = useCallback(async () => {
    const remoteCatalog = await loadCatalogFromSanity();
    if (!remoteCatalog) return;

    const products = remoteCatalog.products;
    const collections = remoteCatalog.collections;
    const categories = remoteCatalog.categories;

    setCatalog({
      products,
      collections: withCollectionCounts(collections, products),
      categories,
      loading: false,
      source: 'sanity',
      error: null,
    });
  }, []);

  useEffect(() => {
    if (!cmsEnabled) return undefined;

    let cancelled = false;
    const safeRefresh = async () => {
      try {
        await refreshCatalog();
      } catch (error) {
        console.error('Failed to load catalog from Sanity:', error);
        if (cancelled) return;
        setCatalog(prev => ({ ...prev, loading: false, source: 'error', error: error.message || 'Failed to load catalog' }));
      }
    };

    safeRefresh();

    const onFocus = () => {
      safeRefresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [cmsEnabled, refreshCatalog]);

  useEffect(() => {
    writeStoredArray(CART_STORAGE_KEY, cart);
  }, [cart]);

  useEffect(() => {
    writeStoredArray(WISHLIST_STORAGE_KEY, wishlist);
  }, [wishlist]);

  const toast = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(t => [...t, {id, msg, type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const addToCart = useCallback((product, size=null, qty=1, variant=null) => {
    const selectedProduct = materializeProductSelection(product, variant);
    const key = `${selectedProduct.id}-${selectedProduct.selectedVariantId || 'base'}-${size || 'nosize'}`;
    setCart(prev => {
      const ex = prev.find(i => i.cartKey === key);
      if (ex) return prev.map(i => i.cartKey === key ? {...i, quantity: Math.min(i.quantity+qty,10)} : i);
      return [...prev, {...selectedProduct, size, quantity:qty, cartKey:key}];
    });
    setCartOpen(true);
    toast(`${selectedProduct.name}${selectedProduct.selectedColorName ? ` (${selectedProduct.selectedColorName})` : ''} added OK`);
  }, [toast]);

  const removeFromCart = useCallback(key => setCart(p => p.filter(i => i.cartKey !== key)), []);
  const updateQty = useCallback((key, qty) => {
    if (qty < 1) { removeFromCart(key); return; }
    setCart(p => p.map(i => i.cartKey === key ? {...i, quantity:Math.min(qty,10)} : i));
  }, [removeFromCart]);

  const toggleWishlist = useCallback((product, variant=null) => {
    const selectedProduct = materializeProductSelection(product, variant);
    const wishKey = getWishlistKey(product, variant);
    const has = wishlist.some(i => i.wishKey === wishKey);
    if (has) {
      setWishlist(p => p.filter(i => i.wishKey !== wishKey));
      toast("Removed from wishlist");
    } else {
      setWishlist(p => [...p, {...selectedProduct, wishKey}]);
      toast("Added to wishlist <3");
    }
  }, [wishlist, toast]);

  const cartTotal = cart.reduce((s,i) => s + i.price * i.quantity, 0);
  const cartShipping = getShippingAmount(cartTotal);
  const cartGrandTotal = cartTotal + cartShipping;
  const cartCount = cart.reduce((s,i) => s + i.quantity, 0);

  return (
    <Ctx.Provider value={{cart,setCart,cartOpen,setCartOpen,addToCart,removeFromCart,updateQty,cartTotal,cartShipping,cartGrandTotal,cartCount,wishlist,toggleWishlist,toasts,setToasts,toast,searchOpen,setSearchOpen,products:catalog.products,collections:catalog.collections,categories:catalog.categories,catalogLoading:catalog.loading,catalogSource:catalog.source,catalogError:catalog.error,cmsEnabled}}>
      {children}
    </Ctx.Provider>
  );
}

// =================================================================
//  SVG LOGO
// =================================================================
function Logo({ variant="dark", size="md", onClick }) {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const resolvedSize = size === "md" && isMobile ? "sm" : size;
  const tc = variant==="light" ? "#1E3A0F" : "#FAFAF5";
  const gc = variant==="light" ? "#2D5016" : "#A8E6CF";
  const dims = {
    sm:{wrap:144,badge:36,title:18,sub:5.2},
    md:{wrap:168,badge:44,title:20,sub:5.8},
    lg:{wrap:220,badge:56,title:26,sub:6.6}
  }[resolvedSize];
  return (
    <div
      onClick={onClick}
      role="img"
      aria-label="Urban Jewells"
      style={{cursor:"none",flexShrink:0,display:'flex',alignItems:'center',gap:'12px',width:dims.wrap}}
    >
      <div style={{position:'relative',width:dims.badge,height:dims.badge,minWidth:dims.badge,borderRadius:'50%',padding:'3px',background:'linear-gradient(145deg,rgba(201,168,76,.78),rgba(168,230,207,.55))',boxShadow:'0 10px 24px rgba(0,0,0,.28), 0 0 0 1px rgba(250,250,245,.08)',aspectRatio:'1/1',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{position:'absolute',inset:'-4px',borderRadius:'50%',border:'1px solid rgba(201,168,76,.22)',pointerEvents:'none'}}/>
        <div style={{width:'100%',height:'100%',borderRadius:'50%',overflow:'hidden',background:'rgba(8,10,8,.86)',border:'1px solid rgba(250,250,245,.08)'}}>
          <img
            src="https://res.cloudinary.com/dxw1yg7if/image/upload/v1774377099/urban_jewells_logo_k2yqe6.jpg"
            alt="Urban Jewells logo"
            style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',transform:'scale(1.4)',display:'block'}}
          />
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',minWidth:0}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:dims.title,color:tc,letterSpacing:'.08em',lineHeight:'1'}}>Urban Jewells</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontWeight:'400',fontSize:dims.sub,color:gc,letterSpacing:'.32em',opacity:.75,marginTop:'4px'}}>INDIA - EST. 2025</span>
      </div>
    </div>
  );
}

// =================================================================
//  HEADER
// =================================================================
function Header({ navigate, page }) {
  const {cartCount, setCartOpen, wishlist, setSearchOpen, categories} = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 900 : false;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 70);
    window.addEventListener('scroll', fn, {passive:true});
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const nav = ["home","categories","collections","about","contact"];

  return (
    <>
      <a href="#main" style={{position:'absolute',left:'-9999px'}} onFocus={e=>e.target.style.cssText='position:fixed;top:16px;left:16px;z-index:99999;background:var(--mint);color:var(--sg);padding:8px 16px;border-radius:4px;font-family:DM Sans,sans-serif;font-size:13px;'}>Skip to content</a>
      <header style={{
        position:'fixed',top:0,left:0,right:0,zIndex:1000,
        padding:isMobile?'0 16px':'0 40px',height:isMobile?'64px':'70px',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        background: scrolled ? 'rgba(10,13,10,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(168,230,207,0.08)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.5)' : 'none',
        transition: 'all .3s cubic-bezier(.16,1,.3,1)',
      }}>
        <Logo onClick={() => navigate('home')} />

        <nav style={{display:isMobile?'none':'flex',gap:'36px',alignItems:'center'}}>
          {nav.map(p => {
            if (p !== 'categories') return (
              <button key={p} className={`nav-lnk ${page===p?'active':''}`}
                style={{textTransform:'capitalize'}}
                onClick={() => navigate(p)}>{p}</button>
            );

            return (
              <div key={p} style={{position:'relative'}} onMouseEnter={()=>setCatOpen(true)} onMouseLeave={()=>setCatOpen(false)}>
                <button onClick={()=>navigate('categories')} className={`nav-lnk ${page===p?'active':''}`} style={{textTransform:'capitalize',cursor:'pointer'}}>Categories</button>
                {catOpen && (
                  <div style={{position:'absolute',top:'100%',left:0,marginTop:'6px',background:'rgba(5,8,5,0.98)',border:'1px solid rgba(168,230,207,.06)',padding:'6px',borderRadius:'6px',boxShadow:'0 8px 30px rgba(0,0,0,.5)'}}>
                    {categories.slice(0,6).map((c)=> (
                      <button key={c.slug} onClick={()=>navigate('category',{slug:c.slug})} style={{display:'block',background:'none',border:'none',color:'rgba(250,250,245,.8)',padding:'8px 12px',textAlign:'left',minWidth:'180px',cursor:'pointer',fontFamily:"'DM Mono',monospace",fontSize:'12px'}}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{display:'flex',alignItems:'center',gap:isMobile?'14px':'22px'}}>
          {[
            {icon:<SearchIcon/>, label:"Search", fn:()=>setSearchOpen(true)},
            {icon:<HeartIcon count={wishlist.length}/>, label:"Wishlist", fn:()=>navigate('wishlist')},
            {icon:<BagIcon count={cartCount}/>, label:"Cart", fn:()=>setCartOpen(true)},
          ].map(({icon,label,fn}) => (
            <button key={label} aria-label={label} onClick={fn}
              style={{background:'none',border:'none',cursor:'none',color:'rgba(250,250,245,.6)',position:'relative',transition:'color .2s',padding:isMobile?'8px 4px':'0'}}
              onMouseEnter={e=>e.currentTarget.style.color='var(--cream)'}
              onMouseLeave={e=>e.currentTarget.style.color='rgba(250,250,245,.6)'}>
              {icon}
            </button>
          ))}
          <button onClick={()=>setMobileOpen(true)} style={{background:'none',border:'none',cursor:'none',color:'rgba(250,250,245,.6)',display:isMobile?'inline-flex':'none',padding:'8px 2px'}}>
            <MenuIcon/>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(5,8,5,0.72)',backdropFilter:'blur(10px)',zIndex:9999,display:'flex',justifyContent:'flex-end'}}>
          <div style={{width:'min(86vw, 420px)',height:'100%',background:'linear-gradient(180deg,rgba(10,13,10,.98),rgba(14,20,16,.98))',borderLeft:'1px solid rgba(168,230,207,.08)',boxShadow:'-16px 0 60px rgba(0,0,0,.45)',display:'flex',flexDirection:'column',padding:'0 20px 24px',animation:'slideRight .32s cubic-bezier(.16,1,.3,1)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',height:'64px',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
            <Logo onClick={()=>{navigate('home');setMobileOpen(false);}}/>
            <button onClick={()=>setMobileOpen(false)} style={{background:'none',border:'none',cursor:'none',color:'var(--cream)'}}><XIcon/></button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px',marginTop:'22px'}}>
            {nav.map((p,i)=>{
              if (p !== 'categories') return (
                <button key={p} className="fade-up"
                  style={{animationDelay:`${i*.08}s`,background:'none',border:'none',cursor:'none',
                    fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(34px,9vw,52px)',fontWeight:'300',
                    color:'rgba(250,250,245,.8)',textAlign:'left',padding:'6px 0',
                    borderBottom:'1px solid rgba(168,230,207,.06)',transition:'color .15s',textTransform:'capitalize'}}
                  onClick={()=>{navigate(p);setMobileOpen(false);}}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--mint)'}
                  onMouseLeave={e=>e.currentTarget.style.color='rgba(250,250,245,.8)'}
                >{p}</button>
              );

              return (
                <div key={p} className="fade-up" style={{animationDelay:`${i*.08}s`}}>
                  <button onClick={()=>setMobileCatsOpen(!mobileCatsOpen)} style={{background:'none',border:'none',cursor:'none',fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(34px,9vw,52px)',fontWeight:'300',color:'rgba(250,250,245,.8)',textAlign:'left',padding:'6px 0',borderBottom:'1px solid rgba(168,230,207,.06)',textTransform:'capitalize'}}>
                    Categories
                  </button>
                  {mobileCatsOpen && (
                    <div style={{display:'flex',flexDirection:'column',gap:'6px',paddingLeft:'12px',marginTop:'8px'}}>
                      <button onClick={()=>{navigate('categories');setMobileOpen(false);}} style={{background:'none',border:'none',color:'var(--mint)',textAlign:'left',fontFamily:"'DM Mono',monospace",fontSize:'18px',padding:'6px 0',letterSpacing:'.08em'}}>All Categories</button>
                      {categories.slice(0,6).map(c=> (
                        <button key={c.slug} onClick={()=>{navigate('category',{slug:c.slug});setMobileOpen(false);}} style={{background:'none',border:'none',color:'rgba(250,250,245,.8)',textAlign:'left',fontFamily:"'DM Mono',monospace",fontSize:'18px',padding:'6px 0'}}>{c.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}
    </>
  );
}

// Icon helpers
const SearchIcon = () => <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>;
const HeartIcon = ({count}) => (
  <span style={{position:'relative',display:'inline-flex'}}>
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    {count>0&&<span style={{position:'absolute',top:'-7px',right:'-7px',background:'var(--gold)',color:'#0A0D0A',width:'16px',height:'16px',borderRadius:'50%',fontSize:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Mono',monospace",fontWeight:'500'}}>{count}</span>}
  </span>
);
const BagIcon = ({count}) => (
  <span style={{position:'relative',display:'inline-flex'}}>
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    {count>0&&<span style={{position:'absolute',top:'-8px',right:'-8px',background:'var(--mint)',color:'var(--sg)',width:'17px',height:'17px',borderRadius:'50%',fontSize:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Mono',monospace",fontWeight:'600'}}>{count}</span>}
  </span>
);
const MenuIcon = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const XIcon = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const StarIcon = ({filled}) => <svg width="13" height="13" viewBox="0 0 24 24" fill={filled?"#C9A84C":"none"} stroke="#C9A84C" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const ChevDownIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>;
const ArrowRightIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const PlusIcon = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const MinusIcon = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ChevUpIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>;
const TruckIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const ShieldIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const ReturnIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.44"/></svg>;
const MissionQualityIcon = () => <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M12 3l2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.8 6.6 19.61l1.03-6.01L3.27 9.35l6.03-.88L12 3z"/><path d="M9.6 12.2l1.65 1.65 3.2-3.45"/></svg>;
const MissionLeafIcon = () => <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M18.5 5.5C13 5 8.5 7.5 6.6 11.4c-1.55 3.2-.5 6.8 2.55 8.1 3.05 1.3 6.75-.1 8.3-3.3 1.2-2.45 1.35-6.15 1.05-10.7z"/><path d="M7 17c2.35-3.1 5.35-5.7 10-7.8"/></svg>;
const MissionCommunityIcon = () => <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="8" cy="8.2" r="2.7"/><circle cx="16.5" cy="9.2" r="2.3"/><path d="M3.8 18.5c.55-2.75 2.45-4.45 5.1-4.45 2.65 0 4.55 1.7 5.1 4.45"/><path d="M13.35 18.5c.35-1.95 1.8-3.15 3.9-3.15 1.7 0 2.95.85 3.55 2.35"/></svg>;
const MissionSustainabilityIcon = () => <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M7.2 7.3h4.7V2.8"/><path d="M16.8 16.7h-4.7v4.5"/><path d="M8.1 3.3A8.9 8.9 0 0 1 20 8.2"/><path d="M15.9 20.7A8.9 8.9 0 0 1 4 15.8"/><path d="M20.2 8.2v4.9h-4.9"/><path d="M3.8 15.8v-4.9h4.9"/></svg>;

// =================================================================
//  FOOTER
// =================================================================
function Footer({ navigate }) {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const cols = [
    {h:"SHOP", links:[{l:"All Collections",p:"collections"},{l:"Featured Pieces",p:"home"},{l:"New Arrivals",p:"home"},{l:"Gift Sets",p:"category",extra:{slug:"set"}}]},
    {h:"HELP", links:[{l:"Contact Us",p:"contact"},{l:"FAQ",p:"contact"},{l:"WhatsApp",href:"https://wa.me/917351257315"},{l:"Track Order",p:"contact"}]},
    {h:"LEGAL", links:[{l:"Privacy Policy",p:"privacy-policy"},{l:"Shipping",p:"shipping"},{l:"Returns",p:"returns"},{l:"Terms",p:"terms"}]},
  ];
  return (
    <footer style={{background:'var(--ink2)',borderTop:'1px solid rgba(168,230,207,.08)',paddingTop:'72px',paddingBottom:'40px',padding:isMobile?'52px 20px 28px':'64px 48px 36px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'-80px',left:'50%',transform:'translateX(-50%)',width:'600px',height:'200px',background:'radial-gradient(ellipse,rgba(168,230,207,.04) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.6fr 1fr 1fr 1fr',gap:isMobile?'30px':'56px',marginBottom:isMobile?'34px':'56px',alignItems:'start'}}>
          <div>
            <Logo onClick={()=>navigate('home')}/>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontStyle:'italic',color:'rgba(250,250,245,.4)',fontSize:'14px',lineHeight:'1.8',marginTop:'20px',maxWidth:'220px'}}>Crafted for the bold.<br/>Made for you.</p>
            <div style={{display:'flex',gap:isMobile?'10px':'14px',marginTop:'28px'}}>
              {['IG','FB','YT','PT'].map(s=>(
                <button key={s} aria-label={s} style={{width:isMobile?'34px':'38px',height:isMobile?'34px':'38px',borderRadius:'50%',background:'rgba(168,230,207,.06)',border:'1px solid rgba(168,230,207,.1)',cursor:'none',color:'rgba(168,230,207,.6)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Mono',monospace",fontSize:isMobile?'9px':'10px',transition:'all .2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(168,230,207,.15)';e.currentTarget.style.color='var(--mint)';e.currentTarget.style.borderColor='rgba(168,230,207,.3)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(168,230,207,.06)';e.currentTarget.style.color='rgba(168,230,207,.6)';e.currentTarget.style.borderColor='rgba(168,230,207,.1)';}}
                >{s}</button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(3,minmax(0,1fr))',gap:isMobile?'22px 18px':'56px',gridColumn:isMobile?'auto':'span 3'}}>
            {cols.map(col=>(
              <div key={col.h}>
                <p className="label-tag" style={{marginBottom:isMobile?'16px':'22px'}}>{col.h}</p>
                <div style={{display:'flex',flexDirection:'column',gap:isMobile?'9px':'11px'}}>
                  {col.links.map(lk=>(
                    <button key={lk.l} onClick={()=>lk.href?window.open(lk.href,'_blank'):navigate(lk.p,lk.extra)}
                      style={{background:'none',border:'none',cursor:'none',fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'13px':'14px',color:'rgba(250,250,245,.38)',textAlign:'left',transition:'color .15s',padding:'1px 0'}}
                      onMouseEnter={e=>e.currentTarget.style.color='rgba(250,250,245,.8)'}
                      onMouseLeave={e=>e.currentTarget.style.color='rgba(250,250,245,.38)'}
                    >{lk.l}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="shimmer-line" style={{marginBottom:'28px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(250,250,245,.2)'}}>(c) 2025 Urban Jewells - All rights reserved</p>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(250,250,245,.2)'}}>Made with love in India</p>
        </div>
      </div>
    </footer>
  );
}

// =================================================================
//  PRODUCT CARD
// =================================================================
function ProductCard({ product, navigate }) {
  const {addToCart, toggleWishlist, wishlist} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const inWish = wishlist.some(i => i.wishKey === getWishlistKey(product));
  return (
    <div className="pcard" style={{fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{position:'relative',aspectRatio:'1/1',overflow:'hidden',background:'var(--ink3)'}}>
        <img src={getOptimizedImageUrl(product.images[0], { width: 640, height: 640, mode: 'cover' })} alt={product.name} className="pcard-img"
          style={{width:'100%',height:'100%',objectFit:'cover',display:'block',cursor:'none'}}
          loading="lazy" decoding="async"
          onClick={()=>navigate('product',{slug:product.slug})}/>

        {/* Badges */}
        <div style={{position:'absolute',top:'12px',left:'12px',display:'flex',gap:'6px',zIndex:2}}>
          {product.isNew&&<span style={{background:'var(--mint)',color:'var(--sg)',fontFamily:"'DM Mono',monospace",fontSize:'9px',padding:'4px 9px',borderRadius:'2px',fontWeight:'600',letterSpacing:'.12em'}}>NEW</span>}
          {product.isSale&&<span style={{background:'var(--gold)',color:'#0A0D0A',fontFamily:"'DM Mono',monospace",fontSize:'9px',padding:'4px 9px',borderRadius:'2px',fontWeight:'600',letterSpacing:'.12em'}}>SALE</span>}
        </div>

        {/* Wishlist */}
        <button aria-label={inWish?"Remove from wishlist":"Add to wishlist"} onClick={()=>toggleWishlist(product)}
          style={{position:'absolute',top:'12px',right:'12px',width:'36px',height:'36px',borderRadius:'50%',
            background:'rgba(10,13,10,0.7)',backdropFilter:'blur(8px)',border:`1px solid ${inWish?'rgba(201,168,76,.4)':'rgba(168,230,207,.15)'}`,
            cursor:'none',display:'flex',alignItems:'center',justifyContent:'center',
            transition:'all .2s',zIndex:2,transform:inWish?'scale(1.1)':'scale(1)'}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={inWish?"#C9A84C":"none"} stroke={inWish?"#C9A84C":"rgba(250,250,245,.6)"} strokeWidth="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Add to cart CTA */}
        <div className="pcard-cta">
          <button className="btn-luxury" style={{width:'100%',borderRadius:'0',justifyContent:'center',padding:'14px',letterSpacing:'.1em',fontSize:'12px'}}
            onClick={e=>{e.stopPropagation();addToCart(product,null,1);}}>
            ADD TO CART
          </button>
        </div>
      </div>

      <div style={{padding:isMobile?'15px 14px 18px':'18px 18px 20px',position:'relative',zIndex:1,cursor:'none'}} onClick={()=>navigate('product',{slug:product.slug})}>
        <p className="label-tag" style={{marginBottom:'5px'}}>{product.category}</p>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?'18px':'20px',color:'rgba(250,250,245,.88)',lineHeight:'1.2',marginBottom:'10px',display:'-webkit-box',WebkitLineClamp:isMobile?2:3,WebkitBoxOrient:'vertical',overflow:'hidden',minHeight:isMobile?'43px':'72px'}}>{product.name}</h3>
        <div style={{display:'flex',alignItems:'center',gap:isMobile?'8px':'10px',marginBottom:'8px',flexWrap:'wrap'}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:isMobile?'13px':'14px',color:'var(--gold)',fontWeight:'500'}}>{formatPrice(product.price)}</span>
          {product.originalPrice&&<>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:isMobile?'11px':'12px',color:'rgba(250,250,245,.25)',textDecoration:'line-through'}}>{formatPrice(product.originalPrice)}</span>
            <span style={{background:'rgba(220,38,38,.15)',color:'#F87171',fontFamily:"'DM Mono',monospace",fontSize:'9px',padding:'3px 7px',borderRadius:'2px'}}>-{formatDiscount(product.originalPrice,product.price)}%</span>
          </>}
        </div>
        <div style={{display:'flex',gap:'2px'}}>
          {[1,2,3,4,5].map(s=><StarIcon key={s} filled={s<=Math.round(product.rating)}/>)}
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.25)',marginLeft:'6px'}}>({product.reviewCount})</span>
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  SIDE CART
// =================================================================
function SideCart({ navigate }) {
  const {cart, cartOpen, setCartOpen, removeFromCart, updateQty, cartTotal, cartShipping, cartGrandTotal} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  if (!cartOpen) return null;
  return (
    <>
      <div onClick={()=>setCartOpen(false)}
        style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:1100,animation:'fadeIn .2s ease',backdropFilter:'blur(4px)'}}/>
      <div className="glass-card" style={{
        position:'fixed',right:0,top:0,bottom:0,width:isMobile?'100vw':'420px',maxWidth:isMobile?'100vw':'95vw',
        zIndex:1101,display:'flex',flexDirection:'column',
        background:'rgba(10,13,10,0.96)',borderRadius:'0',borderRight:'none',
        borderTop:'none',borderBottom:'none',
        borderLeft:'1px solid rgba(168,230,207,.1)',
        animation:'slideRight .38s cubic-bezier(.16,1,.3,1)',
        boxShadow:'-8px 0 60px rgba(0,0,0,.8)',
      }}>
        <div style={{padding:isMobile?'18px 16px':'24px',borderBottom:'1px solid rgba(168,230,207,.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',color:'var(--cream)'}}>Your Cart</span>
            {cart.length>0&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',background:'rgba(168,230,207,.1)',padding:'3px 9px',borderRadius:'999px',border:'1px solid rgba(168,230,207,.2)'}}>{cart.reduce((s,i)=>s+i.quantity,0)}</span>}
          </div>
          <button aria-label="Close" onClick={()=>setCartOpen(false)} style={{background:'none',border:'none',cursor:'none',color:'rgba(250,250,245,.4)',transition:'color .15s'}} onMouseEnter={e=>e.target.style.color='var(--cream)'} onMouseLeave={e=>e.target.style.color='rgba(250,250,245,.4)'}><XIcon/></button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:isMobile?'16px':'20px 24px'}}>
          {cart.length===0 ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:'20px',textAlign:'center',padding:'40px 0'}}>
              <div style={{width:'72px',height:'72px',borderRadius:'50%',border:'1px solid rgba(168,230,207,.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <BagIcon count={0}/>
              </div>
              <div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'24px',color:'rgba(250,250,245,.7)',marginBottom:'8px'}}>Your cart is empty</p>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.3)'}}>Add something beautiful</p>
              </div>
              <button className="btn-luxury" style={{fontSize:'12px',padding:'12px 24px',letterSpacing:'.1em'}} onClick={()=>{setCartOpen(false);navigate('collections');}}>SHOP NOW</button>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
              {cart.map(item=>(
                <div key={item.cartKey} style={{display:'flex',gap:'14px',paddingBottom:'20px',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                  <div style={{width:'76px',height:'76px',borderRadius:'8px',overflow:'hidden',flexShrink:0,border:'1px solid rgba(168,230,207,.1)'}}>
                    <img src={getOptimizedImageUrl(item.images[0], { width: 180, height: 180, mode: 'cover' })} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" decoding="async"/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',fontWeight:'500',color:'rgba(250,250,245,.85)',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'180px'}}>{item.name}</p>
                      <button aria-label="Remove" onClick={()=>removeFromCart(item.cartKey)} style={{background:'none',border:'none',cursor:'none',color:'rgba(250,250,245,.2)',transition:'color .15s',flexShrink:0}} onMouseEnter={e=>e.target.style.color='rgba(250,250,245,.7)'} onMouseLeave={e=>e.target.style.color='rgba(250,250,245,.2)'}><XIcon/></button>
                    </div>
                    {(item.selectedColorName || item.size)&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',opacity:.6,marginBottom:'8px'}}>
                      {[item.selectedColorName ? `Color: ${item.selectedColorName}` : null, item.size ? `Size: ${item.size}` : null].filter(Boolean).join(' | ')}
                    </p>}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'8px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',border:'1px solid rgba(168,230,207,.12)',borderRadius:'4px'}}>
                        <button onClick={()=>updateQty(item.cartKey,item.quantity-1)} style={{width:'28px',height:'28px',background:'none',border:'none',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(250,250,245,.5)'}}><MinusIcon/></button>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:'13px',color:'var(--cream)',minWidth:'20px',textAlign:'center'}}>{item.quantity}</span>
                        <button onClick={()=>updateQty(item.cartKey,item.quantity+1)} style={{width:'28px',height:'28px',background:'none',border:'none',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(250,250,245,.5)'}}><PlusIcon/></button>
                      </div>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:'14px',color:'var(--gold)'}}>{formatPrice(item.price*item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length>0&&(
          <div style={{padding:isMobile?'16px':'20px 24px',borderTop:'1px solid rgba(168,230,207,.08)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.5)'}}>Subtotal</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'16px',color:'var(--gold)',fontWeight:'500'}}>{formatPrice(cartTotal)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.5)'}}>Shipping</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'14px',color:cartShipping===0?'var(--mint)':'rgba(250,250,245,.7)'}}>{cartShipping===0?'FREE':formatPrice(cartShipping)}</span>
            </div>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(212,245,233,.82)',marginBottom:'18px',letterSpacing:'.04em'}}>{getShippingMessage(cartTotal)}</p>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'18px',paddingTop:'12px',borderTop:'1px solid rgba(168,230,207,.08)'}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.75)',fontWeight:'500'}}>Total</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'17px',color:'var(--gold)',fontWeight:'500'}}>{formatPrice(cartGrandTotal)}</span>
            </div>
            <div style={{display:'flex',gap:'10px',flexDirection:isMobile?'column':'row'}}>
              <button className="btn-ghost-luxury" style={{flex:1,justifyContent:'center',padding:'12px',fontSize:'11px',letterSpacing:'.1em'}} onClick={()=>{setCartOpen(false);navigate('cart');}}>VIEW CART</button>
              <button className="btn-luxury" style={{flex:1,justifyContent:'center',padding:'12px',fontSize:'11px',letterSpacing:'.1em'}} onClick={()=>{setCartOpen(false);navigate('cart');}}>CHECKOUT</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// =================================================================
//  TOASTS
// =================================================================
function Toasts() {
  const {toasts, setToasts} = useApp();
  return (
    <div role="status" aria-live="polite" style={{position:'fixed',bottom:'24px',right:'24px',zIndex:2000,display:'flex',flexDirection:'column',gap:'8px'}}>
      {toasts.map(t=>(
        <div key={t.id} className="toast glass-card" style={{
          display:'flex',alignItems:'center',gap:'10px',
          padding:'13px 16px',minWidth:'270px',maxWidth:'340px',
          background:'rgba(14,20,16,0.95)',
          borderColor: t.type==='error' ? 'rgba(248,113,113,.3)' : 'rgba(168,230,207,.2)',
          boxShadow:'0 8px 32px rgba(0,0,0,.5)',animation:'toastIn .3s cubic-bezier(.16,1,.3,1)',
        }}>
          <span style={{fontSize:'15px'}}>{t.type==='error'?'!':'OK'}</span>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.8)',flex:1}}>{t.msg}</span>
          <button aria-label="Dismiss" onClick={()=>setToasts(p=>p.filter(x=>x.id!==t.id))} style={{background:'none',border:'none',cursor:'none',color:'rgba(250,250,245,.25)'}}><XIcon/></button>
        </div>
      ))}
    </div>
  );
}

// =================================================================
//  BACK TO TOP
// =================================================================
function BackToTop() {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const fn = () => setVis(window.scrollY > 500);
    window.addEventListener('scroll', fn, {passive:true});
    return () => window.removeEventListener('scroll', fn);
  }, []);
  if (!vis) return null;
  return (
    <button aria-label="Back to top" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
      style={{position:'fixed',bottom:'32px',right:'28px',zIndex:500,width:'46px',height:'46px',
        borderRadius:'50%',background:'rgba(14,20,16,0.9)',
        border:'1px solid rgba(168,230,207,.25)',
        cursor:'none',display:'flex',alignItems:'center',justifyContent:'center',
        animation:'fadeIn .25s ease',
        boxShadow:'0 4px 24px rgba(0,0,0,.5), var(--glow-mint)',
        color:'var(--mint)',transition:'transform .2s,box-shadow .2s'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.12)';e.currentTarget.style.boxShadow='0 6px 32px rgba(0,0,0,.6), 0 0 30px rgba(168,230,207,.3)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,.5), var(--glow-mint)';}}
    ><ChevUpIcon/></button>
  );
}

// =================================================================
//  SEARCH MODAL
// =================================================================
function SearchModal({ navigate }) {
  const {searchOpen, setSearchOpen, products, categories, collections} = useApp();
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  useEffect(() => { if (searchOpen) { setQ(''); setTimeout(()=>inputRef.current?.focus(),60); } }, [searchOpen]);
  useEffect(() => {
    const fn = e => { if (e.key==='Escape') setSearchOpen(false); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);
  const categoryLabelMap = useMemo(() => Object.fromEntries(categories.map(c => [c.slug, c.name])), [categories]);
  const collectionLabelMap = useMemo(() => Object.fromEntries(collections.map(c => [c.slug, c.name])), [collections]);
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    return products
      .map(product => {
        const categoryLabel = categoryLabelMap[product.category] || product.category || '';
        const collectionLabel = collectionLabelMap[product.collection] || product.collection || '';
        const variantColors = (product.variants || []).map(variant => variant.colorName).filter(Boolean);
        const searchable = [
          product.name,
          product.shortDescription,
          product.category,
          categoryLabel,
          product.collection,
          collectionLabel,
          ...(product.tags || []),
          ...variantColors,
        ].filter(Boolean).map(value => value.toLowerCase());

        if (!searchable.some(value => value.includes(lq))) return null;

        let score = 0;
        if (product.name?.toLowerCase().includes(lq)) score += 6;
        if (product.name?.toLowerCase().startsWith(lq)) score += 4;
        if (categoryLabel.toLowerCase().includes(lq)) score += 3;
        if (collectionLabel.toLowerCase().includes(lq)) score += 3;
        if (variantColors.some(color => color?.toLowerCase().includes(lq))) score += 2;
        if ((product.tags || []).some(tag => tag?.toLowerCase().includes(lq))) score += 2;
        if (product.shortDescription?.toLowerCase().includes(lq)) score += 1;

        return { product, score, categoryLabel, collectionLabel, variantColors };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || b.product.reviewCount - a.product.reviewCount)
      .slice(0, 8);
  }, [categoryLabelMap, collectionLabelMap, products, q]);
  if (!searchOpen) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(5,8,5,0.97)',zIndex:1200,display:'flex',flexDirection:'column',alignItems:'center',padding:isMobile?'84px 18px 28px':'100px 24px 40px',animation:'fadeIn .2s ease',backdropFilter:'blur(8px)'}} onClick={e=>{if(e.target===e.currentTarget)setSearchOpen(false);}}>
      <button aria-label="Close" onClick={()=>setSearchOpen(false)} style={{position:'absolute',top:isMobile?'18px':'24px',right:isMobile?'18px':'28px',background:'none',border:'none',cursor:'none',color:'rgba(250,250,245,.4)'}}><XIcon/></button>
      <div style={{width:'100%',maxWidth:'580px'}}>
        <p className="label-tag" style={{marginBottom:'20px',textAlign:'center',letterSpacing:'.3em'}}>SEARCH OUR COLLECTION</p>
        <div style={{position:'relative'}}>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search jewellery..."
            style={{width:'100%',background:'rgba(255,255,255,.04)',border:'none',borderBottom:'1px solid rgba(168,230,207,.3)',borderRadius:'0',padding:'16px 4px',fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?'22px':'28px',color:'var(--cream)',outline:'none',letterSpacing:'.04em'}}/>
          <div style={{position:'absolute',bottom:0,left:0,width:q?'100%':'0',height:'2px',background:'linear-gradient(90deg,var(--mint),var(--gold))',transition:'width .4s cubic-bezier(.16,1,.3,1)'}}/>
        </div>
        {!q.trim()&&(
          <div className="glass-card" style={{marginTop:'26px',padding:isMobile?'18px 16px':'20px 22px'}}>
            <p className="label-tag" style={{marginBottom:'10px'}}>TRY SEARCHING</p>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.46)',lineHeight:'1.8'}}>Search by product name, category, collection, tag, or color. Example: `rings`, `urban luxe`, `gold`, `green`.</p>
          </div>
        )}
        {results.length>0&&(
          <div style={{marginTop:'32px'}}>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.32)',letterSpacing:'.14em',marginBottom:'14px'}}>TOP MATCHES ({results.length})</p>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(3,1fr)',gap:'12px'}}>
            {results.map(({product, categoryLabel, collectionLabel, variantColors})=>(
              <div key={product.id} className="glass-card" style={{cursor:'none',transition:'border-color .2s,transform .2s'}}
                onClick={()=>{navigate('product',{slug:product.slug});setSearchOpen(false);}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(168,230,207,.25)';e.currentTarget.style.transform='translateY(-3px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--glass-border)';e.currentTarget.style.transform='translateY(0)';}}>
                <img src={getOptimizedImageUrl(product.images[0], { width: 280, height: 280, mode: 'cover' })} alt={product.name} style={{width:'100%',aspectRatio:'1/1',objectFit:'cover'}} loading="lazy" decoding="async"/>
                <div style={{padding:'10px 12px'}}>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'14px',color:'rgba(250,250,245,.8)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{product.name}</p>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.32)',letterSpacing:'.08em',marginTop:'4px'}}>{categoryLabel}{collectionLabel ? ` • ${collectionLabel}` : ''}</p>
                  {variantColors.length>0&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',opacity:.7,marginTop:'6px'}}>Colors: {variantColors.slice(0,2).join(', ')}{variantColors.length>2?'...':''}</p>}
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'var(--gold)',marginTop:'8px'}}>{formatPrice(product.price)}</p>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
        {q.trim()&&results.length===0&&(
          <div className="glass-card" style={{marginTop:'32px',padding:'22px 20px',textAlign:'center'}}>
            <p className="label-tag" style={{marginBottom:'12px'}}>NO RESULTS</p>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'rgba(250,250,245,.72)',marginBottom:'8px'}}>No results for "{q}"</p>
            <p style={{fontFamily:"'DM Sans',sans-serif",color:'rgba(250,250,245,.35)',lineHeight:'1.8'}}>Try searching by product name, category, collection, tag, or color instead.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =================================================================
// HOME PAGE - ALL SECTIONS
// =================================================================
function HeroSection({ navigate }) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const isMobile = w < 768;
  const isTablet = w < 900;
  const heroObjectPosition = w < 380 ? '41% 10%' : w < 520 ? '40% 10%' : w < 768 ? '39% 10%' : w < 1024 ? '37% 10%' : '39% 10%';
  return (
    <section id="main" style={{minHeight:isMobile?'auto':'100vh',background:'var(--ink)',display:'flex',alignItems:'center',position:'relative',overflow:'hidden',paddingTop:isMobile?'94px':'70px',paddingBottom:isMobile?'38px':'0'}}>
      {/* Radial glow backgrounds */}
      <div style={{position:'absolute',top:isMobile?'2%':'10%',right:isMobile?'-20%':'5%',width:isMobile?'340px':'600px',height:isMobile?'340px':'600px',background:'radial-gradient(circle,rgba(168,230,207,.06) 0%,transparent 65%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:isMobile?'8%':'20%',left:isMobile?'-10%':'10%',width:isMobile?'220px':'400px',height:isMobile?'220px':'400px',background:'radial-gradient(circle,rgba(201,168,76,.04) 0%,transparent 65%)',pointerEvents:'none'}}/>

      {/* Grid line texture */}
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(168,230,207,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(168,230,207,.025) 1px,transparent 1px)',backgroundSize:'80px 80px',pointerEvents:'none'}}/>

      <div style={{maxWidth:'1200px',margin:'0 auto',padding:isMobile?'0 20px':'0 48px',display:'grid',gridTemplateColumns:isTablet?'1fr':'1fr 1fr',gap:isMobile?'26px':'60px',alignItems:'center',width:'100%',zIndex:2,position:'relative'}}>
        {/* TEXT */}
        <div>
          <div className="fade-up-1" style={{display:'inline-flex',alignItems:'center',gap:'8px',marginBottom:isMobile?'22px':'32px',padding:isMobile?'6px 12px':'6px 14px',border:'1px solid rgba(168,230,207,.15)',borderRadius:'2px',background:'rgba(168,230,207,.04)',maxWidth:'100%'}}>
            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--mint)',boxShadow:'0 0 8px var(--mint)',display:'inline-block'}}/>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:isMobile?'9px':'10px',color:'var(--mint)',letterSpacing:isMobile?'.14em':'.22em'}}>PREMIUM HANDCRAFTED JEWELLERY - INDIA</span>
          </div>

          <div className="fade-up-2" style={{overflow:'hidden',marginBottom:'4px'}}>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:isMobile?'clamp(48px,16vw,64px)':'clamp(62px,8vw,110px)',lineHeight:isMobile?'.92':'.88',color:'var(--cream)',letterSpacing:'-.02em'}}>Crafted</h1>
          </div>
          <div className="fade-up-3" style={{overflow:'hidden',marginBottom:isMobile?'22px':'28px'}}>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontStyle:'italic',fontSize:isMobile?'clamp(48px,16vw,64px)':'clamp(62px,8vw,110px)',lineHeight:isMobile?'.92':'.88',color:'var(--mint)',letterSpacing:'-.02em'}}>for the Bold.</h1>
          </div>

          <div className="fade-up-4" style={{width:isMobile?'42px':'48px',height:'1px',background:'linear-gradient(90deg,var(--mint),transparent)',marginBottom:isMobile?'18px':'24px'}}/>

          <p className="fade-up-4" style={{fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'15px':'16px',color:'rgba(250,250,245,.5)',lineHeight:isMobile?'1.75':'1.85',maxWidth:isMobile?'100%':'420px',marginBottom:isMobile?'28px':'40px'}}>
            Every piece in our collection is handcrafted with intention - from the first sketch to the final polish. Wear jewellery that tells your story.
          </p>

          <div className="fade-up-5" style={{display:'flex',gap:isMobile?'10px':'14px',flexWrap:'wrap',flexDirection:isMobile?'column':'row'}}>
            <button className="btn-luxury" onClick={()=>navigate('all-pieces')} style={isMobile?{width:'100%',justifyContent:'center'}:undefined}>SHOP NOW <ArrowRightIcon/></button>
            <button className="btn-ghost-luxury" onClick={()=>navigate('collections')} style={isMobile?{width:'100%',justifyContent:'center'}:undefined}>EXPLORE COLLECTIONS</button>
          </div>

          <div className="fade-up-6" style={{display:'flex',gap:isMobile?'18px':'32px',marginTop:isMobile?'32px':'56px',paddingTop:isMobile?'20px':'32px',borderTop:'1px solid rgba(168,230,207,.06)',flexWrap:'wrap'}}>
            {[{n:'400+',l:'Unique Designs'},{n:'12K+',l:'Happy Customers'},{n:'5*',l:'Average Rating'}].map(({n,l})=>(
              <div key={l} style={isMobile?{minWidth:'92px'}:undefined}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?'24px':'28px',color:'var(--gold)',lineHeight:'1'}}>{n}</p>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',letterSpacing:'.1em',marginTop:'4px'}}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Editorial image frame */}
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',position:'relative',minHeight:isTablet?'auto':'720px',paddingTop:isMobile?'8px':'0'}}>
          <div style={{position:'absolute',width:isTablet?'82vw':'520px',height:isTablet?(isMobile?'94vw':'88vw'):'640px',maxWidth:isMobile?'360px':'560px',maxHeight:isMobile?'440px':'700px',background:'radial-gradient(circle,rgba(168,230,207,.12) 0%,rgba(201,168,76,.08) 35%,transparent 72%)',filter:'blur(8px)',pointerEvents:'none'}}/>
          <div className="fade-up-3" style={{position:'relative',zIndex:2,width:isMobile?'min(82vw, 340px)':'min(88vw, 520px)'}}>
            <div style={{position:'absolute',inset:isMobile?'-10px':'-18px',border:'1px solid rgba(201,168,76,.18)',borderRadius:isMobile?'22px':'28px',pointerEvents:'none'}}/>
            {!isMobile && <div style={{position:'absolute',inset:'-34px 28px auto auto',width:'120px',height:'120px',border:'1px solid rgba(168,230,207,.16)',borderRadius:'50%',pointerEvents:'none'}}/>}
            {!isMobile && <div style={{position:'absolute',left:'-24px',bottom:'82px',width:'90px',height:'90px',background:'linear-gradient(135deg,rgba(201,168,76,.14),rgba(168,230,207,.06))',border:'1px solid rgba(201,168,76,.12)',borderRadius:'20px',backdropFilter:'blur(8px)',pointerEvents:'none'}}/>}
            <div style={{position:'relative',padding:isMobile?'12px':'18px',borderRadius:isMobile?'22px':'28px',background:'linear-gradient(145deg,rgba(8,10,8,.9),rgba(18,26,15,.82))',border:'1px solid rgba(201,168,76,.24)',boxShadow:'0 28px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(168,230,207,.08)'}}>
              <div style={{position:'relative',borderRadius:'20px',overflow:'hidden',background:'var(--ink2)',aspectRatio:'4/5'}}>
                <img
                  src="https://res.cloudinary.com/dxw1yg7if/image/upload/v1774376772/Model_p0p9uk.jpg"
                  alt=""
                  aria-hidden="true"
                  style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',filter:'blur(18px)',transform:'scale(1.08)',opacity:.3,display:'block'}}
                />
                <img
                  src="https://res.cloudinary.com/dxw1yg7if/image/upload/v1774376772/Model_p0p9uk.jpg"
                  alt="Urban Jewells editorial model"
                  style={{position:'relative',zIndex:1,width:'100%',height:'100%',objectFit:'cover',objectPosition:heroObjectPosition,display:'block'}}
                />
                <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(8,10,8,.05) 0%,rgba(8,10,8,0) 30%,rgba(8,10,8,.28) 100%)'}}/>
                <div style={{position:'absolute',bottom:isMobile?'14px':'18px',left:isMobile?'14px':'18px',right:isMobile?'14px':'18px',display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:isMobile?'10px':'16px'}}>
                  <div style={{maxWidth:'220px'}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:isMobile?'8px':'9px',letterSpacing:isMobile?'.14em':'.18em',color:'var(--mint)',marginBottom:'7px'}}>URBAN JEWELLS</p>
                    <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?'22px':'clamp(24px,3.2vw,34px)',lineHeight:'1.02',color:'var(--cream)'}}>Modern heirlooms for the bold.</p>
                  </div>
                  <div style={{padding:isMobile?'8px 10px':'10px 12px',border:'1px solid rgba(201,168,76,.2)',background:'rgba(8,10,8,.46)',backdropFilter:'blur(12px)',borderRadius:isMobile?'12px':'16px',fontFamily:"'DM Mono',monospace",fontSize:isMobile?'8px':'9px',letterSpacing:'.14em',color:'rgba(250,250,245,.62)',textAlign:'right'}}>
                    <div>STERLING</div>
                    <div>GOLD</div>
                    <div>CRYSTAL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {!isMobile && <div style={{position:'absolute',top:'14%',right:'0',fontFamily:"'DM Mono',monospace",fontSize:'9px',color:'rgba(168,230,207,.32)',letterSpacing:'.18em',writingMode:'vertical-lr',pointerEvents:'none'}}>CURATED IN INDIA</div>}
        </div>
      </div>

      {/* Scroll hint */}
      {!isMobile && <div className="fade-up-6" style={{position:'absolute',bottom:'32px',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',zIndex:2}}>
        <div style={{width:'1px',height:'48px',background:'linear-gradient(to bottom,transparent,var(--mint))',animation:'pulseGlow 2s ease-in-out infinite'}}/>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:'9px',color:'rgba(168,230,207,.35)',letterSpacing:'.22em'}}>SCROLL</span>
      </div>}
    </section>
  );
}

function WelcomeBanner() {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  return (
    <section style={{padding:isMobile?'68px 20px':'96px 24px',background:'linear-gradient(to bottom,var(--ink),var(--ink2))',textAlign:'center',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(168,230,207,.02) 79px,rgba(168,230,207,.02) 80px)',pointerEvents:'none'}}/>
      <div style={{maxWidth:'640px',margin:'0 auto',position:'relative',zIndex:1}}>
        <p className="label-tag fade-up" style={{marginBottom:'20px',letterSpacing:'.3em'}}>WELCOME</p>
        <h2 className="fade-up-1" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?'clamp(32px,10vw,44px)':'clamp(36px,5vw,58px)',color:'var(--cream)',marginBottom:isMobile?'18px':'24px',lineHeight:'1.1'}}>Urban Jewells</h2>
        <div style={{width:'60px',height:'1px',background:'linear-gradient(90deg,transparent,var(--mint),transparent)',margin:'0 auto 28px'}}/>
        <p className="fade-up-2" style={{fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'15px':'16px',color:'rgba(250,250,245,.45)',lineHeight:isMobile?'1.8':'1.9'}}>
          We believe jewellery is never just decoration - it's a language. Every ring, necklace, and bracelet we create speaks of intention, of craft, of the woman who wears it.
        </p>
      </div>
    </section>
  );
}

function FeaturedProducts({ navigate }) {
  const {products, catalogLoading} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const featured = products.filter(p=>p.isFeatured).slice(0,6);
  if (catalogLoading && featured.length === 0) {
    return <CatalogSectionSkeleton label="HANDPICKED FOR YOU" title="Featured Pieces" actionWidth="112px" count={isMobile ? 4 : 4} card="product"/>;
  }
  return (
    <section style={{padding:'clamp(52px,7vw,80px) clamp(18px,4vw,48px)',background:'var(--ink2)'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'clamp(28px,5vw,48px)',gap:'14px',flexWrap:'wrap'}}>
          <div>
            <p className="label-tag" style={{marginBottom:'10px'}}>HANDPICKED FOR YOU</p>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(32px,4vw,52px)',color:'var(--cream)'}}>Featured Pieces</h2>
          </div>
          <button className="btn-ghost-luxury" style={{fontSize:'11px',letterSpacing:'.12em',padding:'11px 22px'}} onClick={()=>navigate('collections')}>VIEW ALL -&gt;</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(auto-fill,minmax(clamp(170px,42vw,270px),1fr))',gap:isMobile?'12px':'clamp(12px,2vw,20px)'}}>
          {featured.map((p,i)=>(
            <div key={p.id} className="fade-up" style={{animationDelay:`${i*.07}s`}}>
              <ProductCard product={p} navigate={navigate}/>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionsBand({ navigate }) {
  const {collections, catalogLoading} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  if (catalogLoading && collections.length === 0) {
    return <CatalogSectionSkeleton label="FIVE WORLDS" title="Our Collections" actionWidth="144px" columns="repeat(auto-fill,minmax(180px,1fr))" count={isMobile ? 4 : 5} card="editorial" cardRatio="2/3"/>;
  }
  return (
    <section style={{padding:'clamp(52px,7vw,80px) 0',overflow:'hidden',background:'var(--ink)',position:'relative'}}>
      {/* Section header */}
      <div style={{padding:'0 clamp(18px,4vw,48px)',marginBottom:'clamp(28px,5vw,48px)'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:'14px',flexWrap:'wrap'}}>
          <div>
            <p className="label-tag" style={{marginBottom:'10px'}}>FIVE WORLDS</p>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(32px,4vw,52px)',color:'var(--cream)'}}>Our Collections</h2>
          </div>
          <button className="btn-ghost-luxury" style={{fontSize:'11px',letterSpacing:'.12em',padding:'11px 22px'}} onClick={()=>navigate('collections')}>ALL COLLECTIONS -&gt;</button>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div style={{display:'flex',gap:isMobile?'10px':'clamp(8px,1.3vw,12px)',overflowX:'auto',padding:isMobile?'0 20px':'0 clamp(18px,4vw,48px)',scrollbarWidth:'none',msOverflowStyle:'none',scrollSnapType:isMobile?'x mandatory':'none'}}>
        {collections.map((col,i)=>(
          <div key={col.id} className="fade-up" style={{animationDelay:`${i*.08}s`,width:isMobile?'min(58vw, 212px)':'clamp(150px,22vw,205px)',maxWidth:isMobile?'212px':'205px',borderRadius:'12px',overflow:'hidden',position:'relative',aspectRatio:'2/3',cursor:'none',flex:'0 0 auto',border:'1px solid rgba(168,230,207,.06)',transition:'all .4s cubic-bezier(.16,1,.3,1)',scrollSnapAlign:isMobile?'start':'none'}}
            onClick={()=>navigate('collection-detail',{slug:col.slug})}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(168,230,207,.2)';e.currentTarget.style.transform='translateY(-8px)';e.currentTarget.style.boxShadow='0 24px 60px rgba(0,0,0,.7), var(--glow-mint)';e.currentTarget.querySelector('.col-reveal').style.opacity='1';e.currentTarget.querySelector('.col-reveal').style.transform='translateY(0)';e.currentTarget.querySelector('.col-img').style.transform='scale(1.07)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(168,230,207,.06)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';e.currentTarget.querySelector('.col-reveal').style.opacity='0';e.currentTarget.querySelector('.col-reveal').style.transform='translateY(12px)';e.currentTarget.querySelector('.col-img').style.transform='scale(1)';}}>
            <img className="col-img" src={getOptimizedImageUrl(col.coverImage, { width: 520, height: 780, mode: 'cover' })} alt={col.name} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .6s cubic-bezier(.16,1,.3,1)'}} loading="lazy" decoding="async"/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(5,8,5,.95) 0%,rgba(5,8,5,.3) 45%,transparent 70%)'}}/>
            <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'clamp(12px,2.2vw,18px)'}}>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'9px',color:'var(--mint)',letterSpacing:'.2em',marginBottom:'8px'}}>{col.mood}</p>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(18px,3vw,23px)',color:'var(--cream)',marginBottom:'3px',lineHeight:'1.1'}}>{col.name}</h3>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.35)'}}>{col.productCount} pieces</p>
              <div className="col-reveal" style={{opacity:isMobile?1:0,transform:isMobile?'translateY(0)':'translateY(12px)',transition:'opacity .3s,transform .3s',marginTop:'10px',display:'flex',alignItems:'center',gap:'6px',color:'var(--mint)'}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.14em'}}>EXPLORE</span>
                <ArrowRightIcon/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShopByCategory({ navigate }) {
  const {categories, catalogLoading} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  if (catalogLoading && categories.length === 0) {
    return <CatalogSectionSkeleton label="BROWSE BY TYPE" title="Shop by Category" actionWidth="0px" columns="repeat(auto-fill,minmax(220px,1fr))" count={isMobile ? 4 : 4} card="editorial" cardRatio="3/2"/>;
  }
  return (
    <section style={{padding:'clamp(52px,7vw,80px) clamp(18px,4vw,48px)',background:'var(--ink2)'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'clamp(28px,5vw,48px)'}}>
          <p className="label-tag" style={{marginBottom:'12px'}}>BROWSE BY TYPE</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(32px,4vw,52px)',color:'var(--cream)'}}>Shop by Category</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(auto-fill,minmax(clamp(165px,43vw,260px),1fr))',gap:isMobile?'12px':'clamp(10px,2vw,16px)'}}>
          {categories.map((cat,i)=>(
            <div key={cat.id} className="fade-up" style={{animationDelay:`${i*.06}s`,borderRadius:'10px',overflow:'hidden',aspectRatio:'3/2',cursor:'none',position:'relative',border:'1px solid rgba(168,230,207,.06)',transition:'all .35s cubic-bezier(.16,1,.3,1)'}}
              onClick={()=>navigate('category',{slug:cat.slug})}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(168,230,207,.2)';e.currentTarget.style.transform='scale(1.02)';e.currentTarget.style.boxShadow='0 16px 48px rgba(0,0,0,.6), var(--glow-mint)';e.currentTarget.querySelector('.cat-img').style.transform='scale(1.08)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(168,230,207,.06)';e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='none';e.currentTarget.querySelector('.cat-img').style.transform='scale(1)';}}>
              <img className="cat-img" src={getOptimizedImageUrl(cat.coverImage, { width: 520, height: 340, mode: 'cover' })} alt={cat.name} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .5s cubic-bezier(.16,1,.3,1)'}} loading="lazy" decoding="async"/>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(5,8,5,.75) 0%,rgba(5,8,5,.45) 100%)'}}/>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:'clamp(12px,3vw,20px)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  {cat.icon && <span style={{fontSize:'18px'}}>{cat.icon}</span>}
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(19px,5vw,24px)',color:'var(--cream)'}}>{cat.name}</h3>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'4px',color:'var(--mint)',opacity:.6}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:'10px'}}>Explore</span>
                  <ArrowRightIcon/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AllProductsGrid({ navigate, standalone=false, navigateBack, routeParams={}, onStandaloneFiltersChange }) {
  const {products, categories, collections, catalogLoading} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const [active, setActive] = useState(routeParams.category || 'all');
  const [sort, setSort] = useState(routeParams.sort || 'popular');
  const [collectionFilter, setCollectionFilter] = useState(routeParams.collection || 'all');
  const [priceBand, setPriceBand] = useState(routeParams.price || 'all');
  const [stockOnly, setStockOnly] = useState(routeParams.stock === '1');
  const [newOnly, setNewOnly] = useState(routeParams.new === '1');
  const [saleOnly, setSaleOnly] = useState(routeParams.sale === '1');
  const [vis, setVis] = useState(8);
  const lastRouteSyncRef = useRef('');
  const matchesPriceBand = useCallback((price) => {
    if (priceBand === 'all') return true;
    if (priceBand === 'under-1000') return price < 1000;
    if (priceBand === '1000-2000') return price >= 1000 && price <= 2000;
    if (priceBand === '2000-3500') return price > 2000 && price <= 3500;
    if (priceBand === '3500-plus') return price > 3500;
    return true;
  }, [priceBand]);
  const filtered = useMemo(() => {
    let arr = active==='all' ? products : products.filter(p=>p.category===active);
    if (standalone && collectionFilter !== 'all') arr = arr.filter(p => p.collection === collectionFilter);
    if (standalone && stockOnly) arr = arr.filter(p => p.inStock !== false);
    if (standalone && newOnly) arr = arr.filter(p => p.isNew);
    if (standalone && saleOnly) arr = arr.filter(p => p.isSale);
    if (standalone) arr = arr.filter(p => matchesPriceBand(p.price));
    if (sort==='price-low') arr = [...arr].sort((a,b)=>a.price-b.price);
    else if (sort==='price-high') arr = [...arr].sort((a,b)=>b.price-a.price);
    else arr = [...arr].sort((a,b)=>b.reviewCount-a.reviewCount);
    return arr;
  }, [active, collectionFilter, matchesPriceBand, newOnly, priceBand, products, saleOnly, sort, standalone, stockOnly]);
  const cats = ['all',...categories.map(c=>c.slug)];
  const collectionOptions = ['all', ...collections.map(c => c.slug)];
  const activeFilterCount = [collectionFilter !== 'all', priceBand !== 'all', stockOnly, newOnly, saleOnly].filter(Boolean).length;
  useEffect(() => {
    if (!standalone) return;
    const syncedParams = {
      category: routeParams.category || undefined,
      sort: routeParams.sort || undefined,
      collection: routeParams.collection || undefined,
      price: routeParams.price || undefined,
      stock: routeParams.stock || undefined,
      new: routeParams.new || undefined,
      sale: routeParams.sale || undefined,
    };
    lastRouteSyncRef.current = JSON.stringify(syncedParams);
    setActive(routeParams.category || 'all');
    setSort(routeParams.sort || 'popular');
    setCollectionFilter(routeParams.collection || 'all');
    setPriceBand(routeParams.price || 'all');
    setStockOnly(routeParams.stock === '1');
    setNewOnly(routeParams.new === '1');
    setSaleOnly(routeParams.sale === '1');
  }, [routeParams.category, routeParams.collection, routeParams.new, routeParams.price, routeParams.sale, routeParams.sort, routeParams.stock, standalone]);
  useEffect(() => {
    setVis(8);
  }, [active, sort, collectionFilter, priceBand, stockOnly, newOnly, saleOnly]);
  useEffect(() => {
    if (!standalone || !onStandaloneFiltersChange) return;
    const nextParams = {
      category: active !== 'all' ? active : undefined,
      sort: sort !== 'popular' ? sort : undefined,
      collection: collectionFilter !== 'all' ? collectionFilter : undefined,
      price: priceBand !== 'all' ? priceBand : undefined,
      stock: stockOnly ? '1' : undefined,
      new: newOnly ? '1' : undefined,
      sale: saleOnly ? '1' : undefined,
    };
    const signature = JSON.stringify(nextParams);
    if (signature === lastRouteSyncRef.current) return;
    lastRouteSyncRef.current = signature;
    onStandaloneFiltersChange(nextParams);
  }, [active, collectionFilter, newOnly, onStandaloneFiltersChange, priceBand, saleOnly, sort, standalone, stockOnly]);
  const resetFilters = () => {
    setActive('all');
    setSort('popular');
    setCollectionFilter('all');
    setPriceBand('all');
    setStockOnly(false);
    setNewOnly(false);
    setSaleOnly(false);
  };
  if (catalogLoading && products.length === 0) {
    return (
      <section id="all-pieces" style={{padding:standalone ? (isMobile?'28px 20px 48px':'44px 48px 64px') : 'clamp(52px,7vw,80px) clamp(18px,4vw,48px)',background:'var(--ink)'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:'clamp(28px,5vw,48px)'}}>
            <SkeletonBlock width="132px" height="10px" radius="999px" style={{margin:'0 auto 12px'}}/>
            <SkeletonBlock width={isMobile?'210px':'260px'} height={isMobile?'38px':'52px'} radius="12px" style={{margin:'0 auto'}}/>
          </div>
          <div style={{marginBottom:'28px',padding:isMobile?'14px':'18px 20px',background:'rgba(255,255,255,.025)',borderRadius:'10px',border:'1px solid rgba(168,230,207,.06)',backdropFilter:'blur(10px)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:isMobile?'stretch':'center',flexWrap:'wrap',gap:'14px',marginBottom:'14px'}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',width:isMobile?'100%':'auto'}}>
                {Array.from({ length: isMobile ? 4 : 6 }).map((_, index) => <SkeletonBlock key={index} width={isMobile?'78px':'92px'} height="30px" radius="3px"/>)}
              </div>
              <SkeletonBlock width={isMobile?'100%':'130px'} height="36px" radius="4px"/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(5,minmax(0,1fr))',gap:'10px'}}>
              {Array.from({ length: standalone ? (isMobile ? 3 : 5) : 1 }).map((_, index) => <SkeletonBlock key={index} height="42px" radius="4px"/>)}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(auto-fill,minmax(clamp(170px,42vw,270px),1fr))',gap:isMobile?'12px':'clamp(12px,2vw,20px)'}}>
            {Array.from({ length: isMobile ? 6 : 8 }).map((_, index) => <ProductCardSkeleton key={index}/>)}
          </div>
        </div>
      </section>
    );
  }
  const content = (
    <section id="all-pieces" style={{padding:standalone ? (isMobile?'28px 20px 48px':'44px 48px 64px') : 'clamp(52px,7vw,80px) clamp(18px,4vw,48px)',background:'var(--ink)'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'clamp(28px,5vw,48px)'}}>
          <p className="label-tag" style={{marginBottom:'12px'}}>{standalone ? 'SHOP EVERYTHING' : 'THE FULL COLLECTION'}</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(32px,4vw,52px)',color:'var(--cream)'}}>All Pieces</h2>
        </div>

        {/* Filter bar */}
        <div style={{marginBottom:'28px',padding:isMobile?'14px':'18px 20px',background:'rgba(255,255,255,.025)',borderRadius:'10px',border:'1px solid rgba(168,230,207,.06)',backdropFilter:'blur(10px)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:isMobile?'stretch':'center',flexWrap:'wrap',gap:'14px',marginBottom:'14px'}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',width:isMobile?'100%':'auto'}}>
              {cats.map(c=>(
                <button key={c} onClick={()=>setActive(c)}
                  style={{padding:'7px 15px',borderRadius:'3px',border:`1px solid ${active===c?'rgba(168,230,207,.5)':'rgba(168,230,207,.12)'}`,
                    background:active===c?'rgba(168,230,207,.1)':'transparent',
                    color:active===c?'var(--mint)':'rgba(250,250,245,.35)',
                    fontFamily:"'DM Mono',monospace",fontSize:'10px',cursor:'none',
                    textTransform:'capitalize',letterSpacing:'.08em',transition:'all .2s'}}>
                  {c==='all'?'ALL':c.toUpperCase()}
                </button>
              ))}
            </div>
            <select value={sort} onChange={e=>setSort(e.target.value)}
              style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'8px 12px',
                fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',
                background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.5)',outline:'none',cursor:'none',width:isMobile?'100%':'auto'}}>
              <option value="popular">MOST POPULAR</option>
              <option value="price-low">PRICE: LOW -&gt; HIGH</option>
              <option value="price-high">PRICE: HIGH -&gt; LOW</option>
            </select>
          </div>

          {standalone && (
            <>
              <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,minmax(0,1fr))',gap:'12px',marginBottom:'12px'}}>
                <select value={collectionFilter} onChange={e=>setCollectionFilter(e.target.value)}
                  style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'10px 12px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.6)',outline:'none',cursor:'none'}}>
                  <option value="all">ALL COLLECTIONS</option>
                  {collectionOptions.filter(option => option !== 'all').map(option => <option key={option} value={option}>{option.toUpperCase()}</option>)}
                </select>
                <select value={priceBand} onChange={e=>setPriceBand(e.target.value)}
                  style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'10px 12px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.6)',outline:'none',cursor:'none'}}>
                  <option value="all">ALL PRICES</option>
                  <option value="under-1000">UNDER INR 1000</option>
                  <option value="1000-2000">INR 1000 - 2000</option>
                  <option value="2000-3500">INR 2000 - 3500</option>
                  <option value="3500-plus">ABOVE INR 3500</option>
                </select>
                <button className="btn-ghost-luxury" style={{justifyContent:'center',padding:'10px 16px',fontSize:'10px',letterSpacing:'.12em'}} onClick={resetFilters}>
                  CLEAR FILTERS {activeFilterCount>0?`(${activeFilterCount})`:''}
                </button>
              </div>

              <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                {[
                  {label:'IN STOCK', active:stockOnly, set:setStockOnly},
                  {label:'NEW ARRIVALS', active:newOnly, set:setNewOnly},
                  {label:'ON SALE', active:saleOnly, set:setSaleOnly},
                ].map(({label, active:enabled, set})=>(
                  <button key={label} onClick={()=>set(v=>!v)}
                    style={{padding:'8px 14px',borderRadius:'999px',border:`1px solid ${enabled?'rgba(201,168,76,.45)':'rgba(168,230,207,.12)'}`,background:enabled?'rgba(201,168,76,.12)':'transparent',color:enabled?'var(--gold2)':'rgba(250,250,245,.42)',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',cursor:'none',transition:'all .2s'}}>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(250,250,245,.2)',marginBottom:'24px'}}>
          Showing {Math.min(vis,filtered.length)} of {filtered.length} pieces
        </p>

        {filtered.length === 0 ? (
          <div className="glass-card" style={{padding:isMobile?'28px 20px':'38px 32px',textAlign:'center'}}>
            <p className="label-tag" style={{marginBottom:'12px'}}>NO MATCHES</p>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(28px,4vw,38px)',color:'var(--cream)',marginBottom:'10px'}}>No pieces match these filters</h3>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.42)',lineHeight:'1.8',marginBottom:'20px'}}>Try clearing a few filters or broadening the price range.</p>
            <button className="btn-luxury" style={{fontSize:'11px',letterSpacing:'.12em'}} onClick={resetFilters}>RESET FILTERS</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(auto-fill,minmax(clamp(160px,42vw,250px),1fr))',gap:isMobile?'12px':'clamp(12px,2vw,18px)'}}>
            {filtered.slice(0,vis).map((p,i)=>(
              <div key={p.id} className="fade-up" style={{animationDelay:`${(i%4)*.05}s`}}>
                <ProductCard product={p} navigate={navigate}/>
              </div>
            ))}
          </div>
        )}

        {vis<filtered.length&&(
          <div style={{textAlign:'center',marginTop:'44px'}}>
            <button className="btn-ghost-luxury" style={{padding:'14px 40px',fontSize:'11px',letterSpacing:'.14em'}} onClick={()=>setVis(v=>v+8)}>
              LOAD MORE - {filtered.length-vis} REMAINING
            </button>
          </div>
        )}
      </div>
    </section>
  );
  if (!standalone) return content;
  return (
    <div style={{background:'var(--ink)'}}>
      <div style={{minHeight:isMobile?'40vh':'48vh',display:'flex',alignItems:'flex-end',padding:isMobile?'88px 20px 34px':'100px 48px 56px',background:'linear-gradient(to bottom,var(--ink),var(--ink2))',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(168,230,207,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(168,230,207,.02) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'18%',right:'8%',width:isMobile?'220px':'380px',height:isMobile?'220px':'380px',background:'radial-gradient(circle,rgba(168,230,207,.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1,maxWidth:'720px'}}>
          {navigateBack && <PageBackButton onClick={()=>navigateBack('home')} label="Back"/>}
          <p className="label-tag fade-up" style={{marginBottom:'14px',letterSpacing:isMobile?'.22em':'.3em'}}>THE FULL COLLECTION</p>
          <h1 className="fade-up-1" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:isMobile?'clamp(40px,12vw,54px)':'clamp(52px,8vw,96px)',color:'var(--cream)',lineHeight:'.9',marginBottom:isMobile?'12px':'18px'}}>All Pieces</h1>
          <p className="fade-up-2" style={{fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'14px':'16px',color:'rgba(250,250,245,.35)',lineHeight:isMobile?'1.75':'1.6'}}>Browse the full Urban Jewells catalog with filters, sorting, and every available piece in one place.</p>
        </div>
      </div>
      {content}
    </div>
  );
}

function TestimonialsSection() {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const doubled = [...TESTIMONIALS,...TESTIMONIALS];
  return (
    <section style={{padding:isMobile?'64px 0':'80px 0',background:'linear-gradient(to bottom,var(--ink2),var(--ink))',overflow:'hidden',position:'relative'}}>
      <div style={{position:'absolute',top:'50%',left:'0',right:'0',height:'1px',background:'radial-gradient(ellipse at center,rgba(168,230,207,.12),transparent)',transform:'translateY(-50%)',pointerEvents:'none'}}/>
      <div style={{textAlign:'center',marginBottom:isMobile?'36px':'56px',padding:isMobile?'0 20px':'0 48px',position:'relative',zIndex:1}}>
        <p className="label-tag" style={{marginBottom:'12px'}}>CUSTOMER VOICES</p>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(32px,4vw,52px)',color:'var(--cream)'}}>What They Say</h2>
      </div>
      <div className="marquee-track" style={{display:'flex',gap:isMobile?'14px':'20px',width:'max-content'}}>
        {doubled.map((t,i)=>(
          <div key={i} className="glass-card" style={{minWidth:isMobile?'82vw':'360px',maxWidth:isMobile?'82vw':'360px',padding:isMobile?'20px':'28px',flexShrink:0}}>
            <div style={{display:'flex',gap:'3px',marginBottom:'14px'}}>
              {[1,2,3,4,5].map(s=><StarIcon key={s} filled={s<=t.rating}/>)}
            </div>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:isMobile?'16px':'17px',color:'rgba(250,250,245,.7)',lineHeight:'1.75',marginBottom:'20px'}}>"{t.text}"</p>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'linear-gradient(135deg,var(--sg),var(--dg))',border:'1px solid rgba(168,230,207,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'13px',color:'var(--mint)',fontWeight:'500'}}>{t.name.split(' ').map(n=>n[0]).join('')}</span>
              </div>
              <div>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',fontWeight:'500',color:'rgba(250,250,245,.8)'}}>{t.name}</p>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)'}}>{t.location}</p>
              </div>
              {!isMobile && <span style={{marginLeft:'auto',fontFamily:"'DM Mono',monospace",fontSize:'9px',color:'var(--mint)',background:'rgba(168,230,207,.08)',padding:'3px 8px',borderRadius:'2px',border:'1px solid rgba(168,230,207,.15)',letterSpacing:'.1em'}}>OK VERIFIED</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactTeaser({ navigate }) {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  return (
    <section style={{padding:isMobile?'68px 20px':'96px 48px',background:'var(--ink)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(30,58,15,.4) 0%,transparent 65%)',pointerEvents:'none'}}/>
      <div style={{maxWidth:'700px',margin:'0 auto',textAlign:'center',position:'relative',zIndex:1}}>
        <p className="label-tag" style={{marginBottom:'16px',letterSpacing:'.28em'}}>REACH OUT</p>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(40px,5.5vw,68px)',color:'var(--cream)',lineHeight:'1',marginBottom:'20px'}}>
          Get in<br/><em style={{color:'var(--mint)'}}>Touch</em>
        </h2>
        <div className="shimmer-line" style={{width:'60px',margin:'0 auto 28px'}}/>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'15px':'16px',color:'rgba(250,250,245,.45)',lineHeight:isMobile?'1.8':'1.9',marginBottom:isMobile?'30px':'40px'}}>
          Have a question about a piece, want a custom design, or just want to say hello? Every message is answered personally.
        </p>
        <button className="btn-gold" onClick={()=>navigate('contact')} style={{padding:'17px 44px',fontSize:'13px',letterSpacing:'.1em',width:isMobile?'100%':'auto',justifyContent:'center'}}>CONTACT US</button>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fit,minmax(170px,1fr))',gap:'16px',marginTop:isMobile?'30px':'56px'}}>
          {[
            {
              l:'WhatsApp',
              v:'+91 73512 57315',
              href:'https://wa.me/917351257315',
              icon:(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z"/>
                </svg>
              )
            },
            {
              l:'Email',
              v:'hello@urbanjewells.in',
              href:'mailto:hello@urbanjewells.in',
              icon:(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2"/>
                  <path d="m3 7 9 6 9-6"/>
                </svg>
              )
            },
            {
              l:'Instagram',
              v:'@urbanjewells',
              href:'https://instagram.com/urbanjewells',
              icon:(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1"/>
                </svg>
              )
            }
          ].map(({icon,l,v,href})=>(
            <a
              key={l}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{display:'flex',alignItems:'center',gap:isMobile?'12px':'14px',padding:isMobile?'14px 15px':'16px 18px',textDecoration:'none',background:'linear-gradient(145deg,rgba(14,20,16,.78),rgba(8,10,8,.92))',border:'1px solid rgba(168,230,207,.1)',borderRadius:isMobile?'16px':'18px',boxShadow:'0 18px 44px rgba(0,0,0,.28)',transition:'transform .25s, border-color .25s, box-shadow .25s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor='rgba(201,168,76,.24)';e.currentTarget.style.boxShadow='0 22px 56px rgba(0,0,0,.38), var(--glow-mint)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='rgba(168,230,207,.1)';e.currentTarget.style.boxShadow='0 18px 44px rgba(0,0,0,.28)';}}
            >
              <div style={{width:isMobile?'38px':'42px',height:isMobile?'38px':'42px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold)',background:'linear-gradient(145deg,rgba(201,168,76,.14),rgba(168,230,207,.06))',border:'1px solid rgba(201,168,76,.18)',flexShrink:0}}>
                {icon}
              </div>
              <div style={{textAlign:'left'}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',letterSpacing:'.14em',marginBottom:'5px'}}>{l}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'13px':'14px',color:'rgba(250,250,245,.8)'}}>{v}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomePage({ navigate }) {
  return (
    <div>
      <HeroSection navigate={navigate}/>
      <WelcomeBanner/>
      <FeaturedProducts navigate={navigate}/>
      <CollectionsBand navigate={navigate}/>
      <ShopByCategory navigate={navigate}/>
      <AllProductsGrid navigate={navigate}/>
      <TestimonialsSection/>
      <ContactTeaser navigate={navigate}/>
    </div>
  );
}

function PageBackButton({ onClick, label='Back' }) {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  return (
    <button
      onClick={onClick}
      style={{
        display:'inline-flex',
        alignItems:'center',
        gap:'8px',
        marginBottom:isMobile?'16px':'20px',
        background:'rgba(255,255,255,.03)',
        border:'1px solid rgba(168,230,207,.12)',
        borderRadius:'999px',
        padding:isMobile?'8px 12px':'9px 14px',
        color:'rgba(250,250,245,.55)',
        fontFamily:"'DM Mono',monospace",
        fontSize:isMobile?'10px':'11px',
        letterSpacing:'.12em',
        cursor:'none',
        transition:'all .2s'
      }}
      onMouseEnter={e=>{e.currentTarget.style.color='var(--mint)';e.currentTarget.style.borderColor='rgba(168,230,207,.28)';e.currentTarget.style.background='rgba(168,230,207,.06)';}}
      onMouseLeave={e=>{e.currentTarget.style.color='rgba(250,250,245,.55)';e.currentTarget.style.borderColor='rgba(168,230,207,.12)';e.currentTarget.style.background='rgba(255,255,255,.03)';}}
    >
      <span style={{fontSize:isMobile?'11px':'12px'}}>&larr;</span>
      <span>{label.toUpperCase()}</span>
    </button>
  );
}

function SkeletonBlock({ width='100%', height='16px', radius='10px', style={} }) {
  return <div className="skeleton-shimmer" style={{width, height, borderRadius:radius, ...style}}/>;
}

function ProductCardSkeleton() {
  return (
    <div style={{border:'1px solid rgba(168,230,207,.06)',borderRadius:'10px',overflow:'hidden',background:'rgba(255,255,255,.02)'}}>
      <SkeletonBlock height="0" style={{paddingBottom:'100%',borderRadius:0}}/>
      <div style={{padding:'18px 18px 20px'}}>
        <SkeletonBlock width="38%" height="10px" radius="999px" style={{marginBottom:'14px'}}/>
        <SkeletonBlock width="82%" height="20px" radius="8px" style={{marginBottom:'10px'}}/>
        <SkeletonBlock width="56%" height="12px" radius="8px" style={{marginBottom:'20px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <SkeletonBlock width="34%" height="18px" radius="8px"/>
          <SkeletonBlock width="24%" height="12px" radius="8px"/>
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <SkeletonBlock width="44px" height="44px" radius="999px"/>
          <SkeletonBlock width="100%" height="44px" radius="4px"/>
        </div>
      </div>
    </div>
  );
}

function EditorialCardSkeleton({ ratio='2/3' }) {
  return (
    <div style={{position:'relative',aspectRatio:ratio,borderRadius:'12px',overflow:'hidden',border:'1px solid rgba(168,230,207,.06)',background:'rgba(255,255,255,.02)'}}>
      <SkeletonBlock width="100%" height="100%" radius="0"/>
      <div style={{position:'absolute',left:0,right:0,bottom:0,padding:'18px'}}>
        <SkeletonBlock width="36%" height="10px" radius="999px" style={{marginBottom:'10px'}}/>
        <SkeletonBlock width="68%" height="28px" radius="10px" style={{marginBottom:'10px'}}/>
        <SkeletonBlock width="40%" height="12px" radius="8px"/>
      </div>
    </div>
  );
}

function CatalogSectionSkeleton({ label, title, actionWidth='120px', columns='repeat(auto-fill,minmax(220px,1fr))', count=4, card='product', cardRatio='2/3' }) {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const gridColumns = isMobile ? 'repeat(2,minmax(0,1fr))' : columns;
  const showAction = actionWidth && actionWidth !== '0px';
  return (
    <section style={{padding:'clamp(52px,7vw,80px) clamp(18px,4vw,48px)',background:'var(--ink2)'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:'14px',flexWrap:'wrap',marginBottom:'clamp(28px,5vw,48px)'}}>
          <div style={{minWidth:isMobile?'100%':'auto'}}>
            <SkeletonBlock width="118px" height="10px" radius="999px" style={{marginBottom:'12px'}}/>
            <SkeletonBlock width={isMobile?'220px':'320px'} height={isMobile?'38px':'52px'} radius="12px"/>
          </div>
          {showAction && <SkeletonBlock width={actionWidth} height="40px" radius="4px"/>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:gridColumns,gap:isMobile?'12px':'18px'}}>
          {Array.from({ length: count }).map((_, index) => (
            <div key={`${label}-${title}-${index}`}>
              {card === 'product' ? <ProductCardSkeleton/> : <EditorialCardSkeleton ratio={cardRatio}/>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AllPiecesPage({ navigate, navigateBack, params }) {
  const handleFiltersChange = useCallback((nextParams) => {
    navigate('all-pieces', nextParams, { replace:false });
  }, [navigate]);
  return <AllProductsGrid navigate={navigate} standalone navigateBack={navigateBack} routeParams={params} onStandaloneFiltersChange={handleFiltersChange}/>;
}

function CategoriesPage({ navigate, navigateBack }) {
  const {categories, catalogLoading} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  if (catalogLoading && categories.length === 0) {
    return <CatalogSectionSkeleton label="URBAN JEWELLS" title="Categories" actionWidth="0px" columns="repeat(auto-fill,minmax(320px,1fr))" count={isMobile ? 4 : 4} card="editorial" cardRatio="4/3"/>;
  }
  return (
    <div style={{background:'var(--ink)'}}>
      <div style={{minHeight:isMobile?'42vh':'50vh',display:'flex',alignItems:'flex-end',padding:isMobile?'88px 20px 38px':'100px 48px 60px',background:'linear-gradient(to bottom,var(--ink),var(--ink2))',position:'relative',overflow:'hidden'}}>
        {categories[0]?.coverImage && <img src={getOptimizedImageUrl(categories[0].coverImage, { width: 1600, height: 700, mode: 'cover' })} alt="Categories hero" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.16}} decoding="async"/>}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(10,13,10,.45),rgba(10,13,10,.88))'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(168,230,207,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(168,230,207,.02) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'20%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle,rgba(168,230,207,.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <PageBackButton onClick={()=>navigateBack('home')} label="Back"/>
          <p className="label-tag fade-up" style={{marginBottom:'14px',letterSpacing:isMobile?'.22em':'.3em'}}>URBAN JEWELLS</p>
          <h1 className="fade-up-1" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:isMobile?'clamp(40px,12vw,54px)':'clamp(52px,8vw,96px)',color:'var(--cream)',lineHeight:'.9',marginBottom:isMobile?'12px':'18px'}}>Categories</h1>
          <p className="fade-up-2" style={{fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'14px':'16px',color:'rgba(250,250,245,.35)',lineHeight:isMobile?'1.75':'1.6'}}>Browse every form, silhouette, and signature piece by type.</p>
        </div>
      </div>
      <div style={{padding:isMobile?'36px 20px 56px':'60px 48px 80px',maxWidth:'1300px',margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fill,minmax(320px,1fr))',gap:isMobile?'16px':'22px'}}>
          {categories.map((cat,i) => (
            <div key={cat.slug} className="fade-up" style={{animationDelay:`${i*.08}s`,position:'relative',borderRadius:'12px',overflow:'hidden',aspectRatio:'4/3',cursor:'none',border:'1px solid rgba(168,230,207,.06)',transition:'all .4s cubic-bezier(.16,1,.3,1)'}}
              onClick={()=>navigate('category',{slug:cat.slug})}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(168,230,207,.22)';e.currentTarget.style.boxShadow='0 24px 60px rgba(0,0,0,.75), var(--glow-mint)';e.currentTarget.querySelector('.cat-page-link').style.opacity='1';e.currentTarget.querySelector('.cat-page-link').style.transform='translateY(0)';e.currentTarget.querySelector('.cat-page-img').style.transform='scale(1.06)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(168,230,207,.06)';e.currentTarget.style.boxShadow='none';e.currentTarget.querySelector('.cat-page-link').style.opacity='0';e.currentTarget.querySelector('.cat-page-link').style.transform='translateY(14px)';e.currentTarget.querySelector('.cat-page-img').style.transform='scale(1)';}}>
              <img className="cat-page-img" src={getOptimizedImageUrl(cat.coverImage, { width: 720, height: 540, mode: 'cover' })} alt={cat.name} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .6s cubic-bezier(.16,1,.3,1)'}} loading="lazy" decoding="async"/>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(5,8,5,.96) 0%,rgba(5,8,5,.18) 55%,transparent 78%)'}}/>
              <div style={{position:'absolute',bottom:0,left:0,right:0,padding:isMobile?'22px':'28px'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'9px',color:'var(--mint)',letterSpacing:'.2em',marginBottom:'10px'}}>SHOP BY TYPE</p>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(30px,4vw,40px)',color:'var(--cream)',marginBottom:'6px',lineHeight:'1.02'}}>{cat.name}</h2>
                <div className="cat-page-link" style={{opacity:isMobile?1:0,transform:isMobile?'translateY(0)':'translateY(14px)',transition:'opacity .3s .05s,transform .3s .05s',marginTop:'14px',display:'flex',alignItems:'center',gap:'8px',color:'var(--mint)'}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.16em'}}>VIEW CATEGORY</span>
                  <ArrowRightIcon/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  COLLECTIONS PAGE
// =================================================================
function CollectionsPage({ navigate, navigateBack }) {
  const {collections, catalogLoading} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  if (catalogLoading && collections.length === 0) {
    return <CatalogSectionSkeleton label="URBAN JEWELLS" title="Our Collections" actionWidth="0px" columns="repeat(auto-fill,minmax(320px,1fr))" count={isMobile ? 4 : 4} card="editorial" cardRatio={isMobile ? '5/7' : '3/4'}/>;
  }
  return (
    <div style={{background:'var(--ink)'}}>
      <div style={{minHeight:isMobile?'42vh':'50vh',display:'flex',alignItems:'flex-end',padding:isMobile?'88px 20px 38px':'100px 48px 60px',background:'linear-gradient(to bottom,var(--ink),var(--ink2))',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(168,230,207,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(168,230,207,.02) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'20%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle,rgba(168,230,207,.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <PageBackButton onClick={()=>navigateBack('home')} label="Back"/>
          <p className="label-tag fade-up" style={{marginBottom:'14px',letterSpacing:isMobile?'.22em':'.3em'}}>URBAN JEWELLS</p>
          <h1 className="fade-up-1" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:isMobile?'clamp(40px,12vw,54px)':'clamp(52px,8vw,96px)',color:'var(--cream)',lineHeight:'.9',marginBottom:isMobile?'12px':'18px'}}>Our Collections</h1>
          <p className="fade-up-2" style={{fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'14px':'16px',color:'rgba(250,250,245,.35)',lineHeight:isMobile?'1.75':'1.6'}}>Five worlds. One intention: jewellery that means something.</p>
        </div>
      </div>
      <div style={{padding:isMobile?'32px 16px 52px':'60px 48px 80px',maxWidth:'1300px',margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(auto-fill,minmax(380px,1fr))',gap:isMobile?'12px':'22px'}}>
          {collections.map((col,i)=>(
            <div key={col.id} className="fade-up" style={{animationDelay:`${i*.09}s`,position:'relative',borderRadius:isMobile?'10px':'12px',overflow:'hidden',aspectRatio:isMobile?'5/7':'3/4',cursor:'none',border:'1px solid rgba(168,230,207,.06)',transition:'all .4s cubic-bezier(.16,1,.3,1)'}}
              onClick={()=>navigate('collection-detail',{slug:col.slug})}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(168,230,207,.22)';e.currentTarget.style.boxShadow='0 28px 70px rgba(0,0,0,.8), var(--glow-mint)';e.currentTarget.querySelector('.clink').style.opacity='1';e.currentTarget.querySelector('.clink').style.transform='translateY(0)';e.currentTarget.querySelector('.cimg').style.transform='scale(1.06)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(168,230,207,.06)';e.currentTarget.style.boxShadow='none';e.currentTarget.querySelector('.clink').style.opacity='0';e.currentTarget.querySelector('.clink').style.transform='translateY(14px)';e.currentTarget.querySelector('.cimg').style.transform='scale(1)';}}>
              <img className="cimg" src={getOptimizedImageUrl(col.coverImage, { width: 760, height: 1000, mode: 'cover' })} alt={col.name} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .6s cubic-bezier(.16,1,.3,1)'}} loading="lazy" decoding="async"/>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(5,8,5,.97) 0%,rgba(5,8,5,.2) 50%,transparent 75%)'}}/>
              <div style={{position:'absolute',bottom:0,left:0,right:0,padding:isMobile?'22px':'32px'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'9px',color:'var(--mint)',letterSpacing:'.22em',marginBottom:'10px'}}>{col.mood}</p>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?'22px':'36px',color:'var(--cream)',marginBottom:isMobile?'4px':'6px',lineHeight:'1.05'}}>{col.name}</h2>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:isMobile?'9px':'10px',color:'rgba(250,250,245,.3)',marginBottom:'2px',lineHeight:isMobile?'1.45':'1.2'}}>{col.tagline}</p>
                <div className="clink" style={{opacity:isMobile?1:0,transform:isMobile?'translateY(0)':'translateY(14px)',transition:'opacity .3s .05s,transform .3s .05s',marginTop:isMobile?'10px':'16px',display:'flex',alignItems:'center',gap:'8px',color:'var(--mint)'}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:isMobile?'9px':'10px',letterSpacing:'.16em'}}>VIEW COLLECTION</span>
                  <ArrowRightIcon/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  COLLECTION DETAIL
// =================================================================
function CollectionDetail({ slug, navigate, navigateBack }) {
  const {collections, products, catalogLoading} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const col = collections.find(c=>c.slug===slug);
  const prods = products.filter(p=>p.collection===slug);
  const [sort, setSort] = useState('popular');
  if (catalogLoading) return <CatalogLoadingScreen label="Loading collection"/>;
  if (!col) return <NotFoundPage navigate={navigate}/>;
  const sorted = sort==='price-low'?[...prods].sort((a,b)=>a.price-b.price):sort==='price-high'?[...prods].sort((a,b)=>b.price-a.price):[...prods].sort((a,b)=>b.reviewCount-a.reviewCount);
  return (
    <div style={{background:'var(--ink)'}}>
      <div style={{height:isMobile?'300px':'380px',position:'relative',overflow:'hidden'}}>
        <img src={getOptimizedImageUrl(col.coverImage, { width: 1600, height: 800, mode: 'cover' })} alt={col.name} style={{width:'100%',height:'100%',objectFit:'cover'}} decoding="async"/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(5,8,5,1) 0%,rgba(5,8,5,.5) 50%,transparent 100%)'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:isMobile?'28px 20px':'44px 48px'}}>
          <button onClick={()=>navigateBack('collections')} style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',background:'none',border:'none',cursor:'none',letterSpacing:'.12em',marginBottom:'14px',display:'flex',alignItems:'center',gap:'6px',transition:'color .2s'}} onMouseEnter={e=>e.currentTarget.style.color='var(--mint)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(250,250,245,.3)'}>&lt;- COLLECTIONS</button>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',letterSpacing:'.2em',marginBottom:'8px'}}>{col.mood}</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(42px,6vw,72px)',color:'var(--cream)',lineHeight:'1'}}>{col.name}</h1>
        </div>
      </div>
      <div style={{padding:isMobile?'28px 20px 44px':'44px 48px',maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'32px',flexWrap:'wrap',gap:'12px'}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(250,250,245,.25)'}}>{prods.length} pieces</p>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'9px 12px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.5)',outline:'none',cursor:'none',width:isMobile?'100%':'auto'}}>
            <option value="popular">MOST POPULAR</option><option value="price-low">PRICE: LOW -&gt; HIGH</option><option value="price-high">PRICE: HIGH -&gt; LOW</option>
          </select>
        </div>
        {prods.length===0 ? (
          <div style={{textAlign:'center',padding:'80px 0'}}>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'rgba(250,250,245,.5)'}}>No pieces in this collection yet.</p>
            <button className="btn-ghost-luxury" style={{marginTop:'24px',fontSize:'11px',letterSpacing:'.12em'}} onClick={()=>navigate('collections')}>&lt;- BACK</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(auto-fill,minmax(250px,1fr))',gap:isMobile?'12px':'18px'}}>
            {sorted.map((p,i)=><div key={p.id} className="fade-up" style={{animationDelay:`${i*.05}s`}}><ProductCard product={p} navigate={navigate}/></div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// =================================================================
//  CATEGORY PAGE
// =================================================================
function CategoryPage({ slug, navigate, navigateBack }) {
  const {categories, products, catalogLoading} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const cat = categories.find(c=>c.slug===slug);
  const prods = products.filter(p=>p.category===slug);
  const [sort, setSort] = useState('popular');
  if (catalogLoading) return <CatalogLoadingScreen label="Loading category"/>;
  if (!cat) return <NotFoundPage navigate={navigate}/>;
  const sorted = sort==='price-low'?[...prods].sort((a,b)=>a.price-b.price):sort==='price-high'?[...prods].sort((a,b)=>b.price-a.price):[...prods].sort((a,b)=>b.reviewCount-a.reviewCount);
  return (
    <div style={{background:'var(--ink)'}}>
      <div style={{height:isMobile?'260px':'300px',position:'relative',overflow:'hidden'}}>
        <img src={getOptimizedImageUrl(cat.coverImage, { width: 1600, height: 700, mode: 'cover' })} alt={cat.name} style={{width:'100%',height:'100%',objectFit:'cover'}} decoding="async"/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(5,8,5,1) 0%,rgba(5,8,5,.4) 60%,transparent 100%)'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:isMobile?'24px 20px':'36px 48px'}}>
          <PageBackButton onClick={()=>navigateBack('categories')} label="Categories"/>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'6px'}}>
            {cat.icon && <span style={{fontSize:'28px'}}>{cat.icon}</span>}
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(40px,5.5vw,64px)',color:'var(--cream)'}}>{cat.name}</h1>
          </div>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',opacity:.6}}>{prods.length} pieces</p>
        </div>
      </div>
      <div style={{padding:isMobile?'28px 20px 44px':'40px 48px',maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'28px',flexWrap:'wrap',gap:'12px'}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(250,250,245,.25)'}}>{prods.length} {cat.name.toLowerCase()}</p>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'9px 12px',fontFamily:"'DM Mono',monospace",fontSize:'10px',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.5)',outline:'none',cursor:'none',width:isMobile?'100%':'auto'}}>
            <option value="popular">MOST POPULAR</option><option value="price-low">PRICE: LOW -&gt; HIGH</option><option value="price-high">PRICE: HIGH -&gt; LOW</option>
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(auto-fill,minmax(250px,1fr))',gap:isMobile?'12px':'18px'}}>
          {sorted.map((p,i)=><div key={p.id} className="fade-up" style={{animationDelay:`${i*.05}s`}}><ProductCard product={p} navigate={navigate}/></div>)}
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  PRODUCT PAGE
// =================================================================
function ProductPage({ slug, navigate, navigateBack }) {
  const {addToCart, toggleWishlist, wishlist, products, catalogLoading} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const product = products.find(p=>p.slug===slug);
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [acc, setAcc] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  useEffect(() => {
    setSelectedVariantId(getDefaultVariant(product)?.id || null);
    setImg(0);
    setSize(null);
  }, [product]);
  const selectedVariant = product?.variants?.find(variant => variant.id === selectedVariantId) || getDefaultVariant(product);
  const activeImages = getDisplayImages(product, selectedVariant);
  const activePrice = getDisplayPrice(product, selectedVariant);
  const activeOriginalPrice = getDisplayOriginalPrice(product, selectedVariant);
  const activeInStock = getDisplayStock(product, selectedVariant);
  const activeImage = activeImages[img] || activeImages[0] || product?.images?.[0];
  const related = useMemo(() => {
    if (!product) return [];
    const curated = Array.isArray(product.relatedProductSlugs) && product.relatedProductSlugs.length
      ? product.relatedProductSlugs
          .map(relatedSlug => products.find(item => item.slug === relatedSlug))
          .filter(item => item && item.slug !== slug)
      : [];
    if (curated.length) return curated.slice(0, 4);
    return products.filter(p=>p.category===product.category&&p.slug!==slug).slice(0,4);
  }, [product, products, slug]);
  const inWish = product ? wishlist.some(i=>i.wishKey===getWishlistKey(product, selectedVariant)) : false;
  if (catalogLoading) return <CatalogLoadingScreen label="Loading product"/>;
  if (!product) return <NotFoundPage navigate={navigate}/>;
  return (
    <div style={{background:'var(--ink)',paddingTop:'70px'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:isMobile?'24px 20px 40px':'40px 48px'}}>
        <PageBackButton onClick={()=>navigateBack('category',{slug:product.category})} label="Back"/>
        {/* Breadcrumb */}
        <div style={{display:isMobile?'none':'flex',gap:'8px',alignItems:'center',marginBottom:'40px'}}>
          {[{l:'Home',p:()=>navigate('home')},{l:product.category,p:()=>navigate('category',{slug:product.category})},{l:product.name,p:null}].map((item,i)=>(
            <span key={i} style={{display:'flex',alignItems:'center',gap:'8px'}}>
              {i>0&&<span style={{color:'rgba(250,250,245,.15)',fontSize:'12px'}}>&gt;</span>}
              {item.p ? (
                <button onClick={item.p} style={{background:'none',border:'none',cursor:'none',fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(250,250,245,.25)',letterSpacing:'.08em',textTransform:'capitalize',transition:'color .15s'}} onMouseEnter={e=>e.target.style.color='var(--mint)'} onMouseLeave={e=>e.target.style.color='rgba(250,250,245,.25)'}>{item.l}</button>
              ) : <span style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(250,250,245,.45)',letterSpacing:'.08em'}}>{item.l}</span>}
            </span>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:isMobile?'24px':'64px',alignItems:'start'}}>
          {/* Image gallery */}
          <div style={{width:'100%',maxWidth:isMobile?'320px':'500px',margin:isMobile?'0 auto':'0'}}>
            <div style={{padding:isMobile?'9px':'14px',borderRadius:isMobile?'16px':'18px',background:'linear-gradient(145deg,rgba(14,20,16,.96),rgba(8,10,8,.98))',border:'1px solid rgba(168,230,207,.12)',boxShadow:'0 24px 60px rgba(0,0,0,.42)',marginBottom:'12px'}}>
              <div style={{borderRadius:'14px',overflow:'hidden',aspectRatio:'1/1',background:'var(--ink2)',border:'1px solid rgba(168,230,207,.08)',position:'relative'}}>
                <img src={getOptimizedImageUrl(activeImage, { width: 1000, height: 1000, mode: 'cover' })} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover',transition:'opacity .3s'}} decoding="async"/>
                <div style={{position:'absolute',top:'16px',left:'16px',display:'flex',gap:'6px'}}>
                  {product.isNew&&<span style={{background:'var(--mint)',color:'var(--sg)',fontFamily:"'DM Mono',monospace",fontSize:'9px',padding:'4px 10px',borderRadius:'2px',fontWeight:'600',letterSpacing:'.1em'}}>NEW</span>}
                  {product.isSale&&<span style={{background:'var(--gold)',color:'#0A0D0A',fontFamily:"'DM Mono',monospace",fontSize:'9px',padding:'4px 10px',borderRadius:'2px',fontWeight:'600',letterSpacing:'.1em'}}>SALE</span>}
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:isMobile?'8px':'10px',overflowX:isMobile?'auto':'visible',paddingBottom:isMobile?'4px':'0',width:'100%',justifyContent:isMobile?'flex-start':'flex-start'}}>
              {activeImages.map((im,i)=>(
                <button key={i} onClick={()=>setImg(i)} style={{width:isMobile?'60px':'72px',height:isMobile?'60px':'72px',padding:isMobile?'3px':'4px',borderRadius:isMobile?'11px':'12px',overflow:'hidden',border:`1.5px solid ${i===img?'rgba(168,230,207,.55)':'rgba(168,230,207,.12)'}`,cursor:'none',background:i===img?'rgba(168,230,207,.06)':'rgba(255,255,255,.02)',transition:'all .2s',flexShrink:0,boxShadow:i===img?'0 0 0 1px rgba(168,230,207,.08), 0 10px 24px rgba(0,0,0,.28)':'none'}}>
                  <div style={{width:'100%',height:'100%',borderRadius:isMobile?'7px':'8px',overflow:'hidden',border:'1px solid rgba(168,230,207,.08)',background:'var(--ink2)'}}>
                    <img src={getOptimizedImageUrl(im, { width: 160, height: 160, mode: 'cover' })} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" decoding="async"/>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',background:'rgba(168,230,207,.08)',padding:'4px 10px',borderRadius:'2px',border:'1px solid rgba(168,230,207,.15)',letterSpacing:'.12em',textTransform:'uppercase'}}>{product.category}</span>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(32px,3.5vw,48px)',color:'var(--cream)',lineHeight:'1.05',margin:'14px 0 12px'}}>{product.name}</h1>
            <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'14px',flexWrap:'wrap'}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'22px',color:'var(--gold)',fontWeight:'500'}}>{formatPrice(activePrice)}</span>
              {activeOriginalPrice&&<>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'14px',color:'rgba(250,250,245,.25)',textDecoration:'line-through'}}>{formatPrice(activeOriginalPrice)}</span>
                <span style={{background:'rgba(220,38,38,.15)',color:'#F87171',fontFamily:"'DM Mono',monospace",fontSize:'10px',padding:'3px 8px',borderRadius:'2px',letterSpacing:'.08em'}}>{formatDiscount(activeOriginalPrice,activePrice)}% OFF</span>
              </>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'18px'}}>
              {[1,2,3,4,5].map(s=><StarIcon key={s} filled={s<=Math.round(product.rating)}/>)}
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(250,250,245,.25)',marginLeft:'6px'}}>({product.reviewCount} reviews)</span>
            </div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'15px',color:'rgba(250,250,245,.5)',lineHeight:'1.85',marginBottom:'24px'}}>{product.shortDescription}</p>
            <div style={{height:'1px',background:'rgba(168,230,207,.06)',marginBottom:'24px'}}/>

            {product.variants?.length > 0 && (
              <div style={{marginBottom:'22px'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.25)',letterSpacing:'.14em',marginBottom:'10px'}}>SELECT COLOR</p>
                <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                  {product.variants.map(variant => {
                    const active = variant.id === selectedVariant?.id;
                    return (
                      <button
                        key={variant.id}
                        onClick={()=>{setSelectedVariantId(variant.id);setImg(0);}}
                        title={variant.colorName}
                        style={{width:'34px',height:'34px',borderRadius:'50%',border:`1.5px solid ${active?'rgba(201,168,76,.7)':'rgba(168,230,207,.14)'}`,background:'transparent',padding:'4px',cursor:'none',boxShadow:active?'0 0 0 1px rgba(201,168,76,.18), 0 10px 20px rgba(0,0,0,.24)':'none',transition:'all .2s'}}
                      >
                        <span style={{display:'block',width:'100%',height:'100%',borderRadius:'50%',background:variant.colorHex}}/>
                      </button>
                    );
                  })}
                </div>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.42)',marginTop:'10px'}}>
                  Selected: <span style={{color:'rgba(250,250,245,.82)'}}>{selectedVariant?.colorName || 'Default'}</span>
                </p>
              </div>
            )}

            {/* Materials */}
            <div style={{marginBottom:'22px'}}>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.25)',letterSpacing:'.14em',marginBottom:'10px'}}>MATERIALS</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                {product.materials.map(m=><span key={m} style={{border:'1px solid rgba(168,230,207,.12)',borderRadius:'2px',padding:'5px 12px',fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(250,250,245,.45)'}}>{m}</span>)}
              </div>
            </div>

            {/* Size */}
            {product.sizes.length>1&&(
              <div style={{marginBottom:'22px'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.25)',letterSpacing:'.14em',marginBottom:'10px'}}>SELECT SIZE</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                  {product.sizes.map(s=>(
                    <button key={s} onClick={()=>setSize(s)}
                      style={{padding:'9px 18px',borderRadius:'3px',
                        border:`1.5px solid ${size===s?'var(--mint)':'rgba(168,230,207,.12)'}`,
                        background:size===s?'rgba(168,230,207,.12)':'transparent',
                        color:size===s?'var(--mint)':'rgba(250,250,245,.4)',
                        fontFamily:"'DM Mono',monospace",fontSize:'11px',cursor:'none',transition:'all .2s',letterSpacing:'.08em'}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty */}
            <div style={{display:'flex',alignItems:isMobile?'stretch':'center',gap:'16px',marginBottom:'24px',flexDirection:isMobile?'column':'row'}}>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.25)',letterSpacing:'.14em'}}>QTY</p>
              <div style={{display:'flex',alignItems:'center',border:'1px solid rgba(168,230,207,.14)',borderRadius:'4px',overflow:'hidden'}}>
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:'40px',height:'40px',background:'none',border:'none',cursor:'none',color:'rgba(250,250,245,.4)',display:'flex',alignItems:'center',justifyContent:'center',transition:'color .15s'}} onMouseEnter={e=>e.target.style.color='var(--cream)'} onMouseLeave={e=>e.target.style.color='rgba(250,250,245,.4)'}><MinusIcon/></button>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'14px',color:'var(--cream)',minWidth:'40px',textAlign:'center'}}>{qty}</span>
                <button onClick={()=>setQty(q=>Math.min(10,q+1))} style={{width:'40px',height:'40px',background:'none',border:'none',cursor:'none',color:'rgba(250,250,245,.4)',display:'flex',alignItems:'center',justifyContent:'center',transition:'color .15s'}} onMouseEnter={e=>e.target.style.color='var(--cream)'} onMouseLeave={e=>e.target.style.color='rgba(250,250,245,.4)'}><PlusIcon/></button>
              </div>
            </div>

            {/* CTAs */}
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'24px'}}>
              <button className="btn-luxury" style={{width:'100%',justifyContent:'center',padding:'17px',fontSize:'13px',letterSpacing:'.1em',opacity:activeInStock?1:.55,cursor:activeInStock?'none':'not-allowed'}} onClick={()=>activeInStock&&addToCart(product,size,qty,selectedVariant)}>
                {activeInStock?'ADD TO CART':'OUT OF STOCK'}
              </button>
              <button className="btn-ghost-luxury" style={{width:'100%',justifyContent:'center',padding:'14px',fontSize:'12px',letterSpacing:'.1em'}} onClick={()=>toggleWishlist(product,selectedVariant)}>
                {inWish?'OK IN WISHLIST':'<3 ADD TO WISHLIST'}
              </button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,minmax(0,1fr))',gap:'10px',marginBottom:'22px'}}>
              {[
                {title:'Dispatch Window', text:'Order confirmation on WhatsApp within a few hours. Dispatch usually follows in 1-2 working days.'},
                {title:'Shipping', text:`Shipping is free above ${formatPrice(FREE_SHIPPING_THRESHOLD)} and ${formatPrice(STANDARD_SHIPPING_FEE)} below that threshold, with tracked delivery across India.`},
                {title:'Care', text:'Store in the provided pouch and keep away from perfume, chlorine, and lotion for longer-lasting finish.'},
              ].map(item => (
                <div key={item.title} style={{padding:'14px 14px 15px',borderRadius:'8px',background:'rgba(255,255,255,.02)',border:'1px solid rgba(168,230,207,.08)'}}>
                  <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>{item.title}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.46)',lineHeight:'1.65'}}>{item.text}</p>
                </div>
              ))}
            </div>

            {/* Trust */}
            <div style={{display:'flex',justifyContent:'space-around',padding:'14px',background:'rgba(168,230,207,.03)',border:'1px solid rgba(168,230,207,.06)',borderRadius:'6px',marginBottom:'24px',gap:isMobile?'10px':'0',flexDirection:isMobile?'column':'row'}}>
              {[{I:TruckIcon,t:'Tracked Delivery'},{I:ShieldIcon,t:'WhatsApp Order Confirmation'},{I:ReturnIcon,t:'Defect Support Within 48 Hours'}].map(({I,t})=>(
                <div key={t} style={{display:'flex',alignItems:'center',gap:'7px'}}>
                  <I/><span style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.38)',letterSpacing:'.06em'}}>{t}</span>
                </div>
              ))}
            </div>

            {/* Accordion */}
            {[{t:'Full Description',c:'This piece is finished to exacting standards, ensuring lasting beauty with everyday wear. Each Urban Jewells piece arrives in signature packaging, ready to gift or treasure.'},
              {t:'Materials & Care',c:`Materials: ${product.materials.join(', ')}. Store in the provided pouch. Avoid perfume, chlorine, and lotions. Clean gently with a soft dry cloth after wearing.`},
              {t:'Shipping & Returns',c:`Tracked shipping across India. Shipping is free above ${formatPrice(FREE_SHIPPING_THRESHOLD)} and ${formatPrice(STANDARD_SHIPPING_FEE)} below that threshold. Defects or transit damage should be reported within 48 hours via WhatsApp with parcel-opening evidence.`}
            ].map(({t,c})=>(
              <div key={t} style={{borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                <button onClick={()=>setAcc(acc===t?null:t)}
                  style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'15px 0',background:'none',border:'none',cursor:'none',fontFamily:"'DM Sans',sans-serif",fontSize:'14px',fontWeight:'400',color:'rgba(250,250,245,.6)',transition:'color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--cream)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(250,250,245,.6)'}>
                  {t}
                  <span style={{transform:acc===t?'rotate(180deg)':'rotate(0)',transition:'transform .25s',color:'rgba(250,250,245,.3)'}}><ChevDownIcon/></span>
                </button>
                <div className={`accordion-body${acc===t?' open':''}`} style={{paddingBottom:acc===t?'14px':'0'}}>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)',lineHeight:'1.85'}}>{c}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        {related.length>0&&(
          <div style={{marginTop:'72px'}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(28px,3.5vw,40px)',color:'var(--cream)',marginBottom:'28px'}}>You Might Also Like</h3>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(auto-fill,minmax(220px,1fr))',gap:isMobile?'12px':'16px'}}>
              {related.map(p=><ProductCard key={p.id} product={p} navigate={navigate}/>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =================================================================
// FORM FIELD - must live OUTSIDE CartPage so React never remounts
//  inputs on re-render (which would kill focus after every keystroke)
// =================================================================
function FormField({ label, name, placeholder, type='text', span=1, req=true, ta=false, form, setForm, errors, onFieldBlur }) {
  return (
    <div style={{ gridColumn:`span ${span}` }}>
      <label htmlFor={name} style={{display:'block',fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.35)',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:'8px'}}>
        {label}{req && ' *'}
      </label>
      {ta ? (
        <textarea
          id={name}
          rows={3}
          placeholder={placeholder}
          value={form[name]}
          onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
          className="dark-field"
          style={{ resize:'vertical' }}
        />
      ) : (
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          value={form[name]}
          onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
          onBlur={() => onFieldBlur(name)}
          className="dark-field"
        />
      )}
      {errors[name] && (
        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'#F87171',marginTop:'5px'}}>{errors[name]}</p>
      )}
    </div>
  );
}

// =================================================================
//  CART PAGE
// =================================================================
function CartPage({ navigate }) {
  const {cart, removeFromCart, updateQty, cartTotal, cartShipping, cartGrandTotal, setCart, toast} = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const [form, setForm] = useState({fullName:'',email:'',whatsapp:'',address1:'',address2:'',city:'',province:'',postalCode:'',country:'India',notes:''});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

// validate reads form via closure - stable reference via useCallback
  const validate = useCallback(() => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = 'Full name required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required.';
    if (!form.whatsapp.trim()) e.whatsapp = 'WhatsApp number required.';
    if (!form.address1.trim() || form.address1.trim().length < 5) e.address1 = 'Delivery address required.';
    if (!form.city.trim()) e.city = 'City required.';
    if (!form.province.trim()) e.province = 'Province/State required.';
    if (!form.postalCode.trim()) e.postalCode = 'Postal code required.';
    return e;
  }, [form]);

  // Called from FormField onBlur to validate a single field
  const handleFieldBlur = useCallback((name) => {
    const v = validate();
    setErrors(prev => ({ ...prev, [name]: v[name] || null }));
  }, [validate]);

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    const orderRef = genRef();
    try {
      if (isSupabaseConfigured()) {
        await createOrderRequest({
          orderRef,
          customer: form,
          cart,
          subtotal: cartTotal,
          shipping: cartShipping,
          total: cartGrandTotal,
        });
      }

      const msg = buildWhatsAppOrderMessage({
        orderRef,
        customer: form,
        cart,
        subtotal: cartTotal,
        shipping: cartShipping,
        total: cartGrandTotal,
        formatPrice,
      });
      window.open(`https://wa.me/917351257315?text=${encodeURIComponent(msg)}`, '_blank');

      setDone({ ref: orderRef, email: form.email });
      setCart([]);
      toast(isSupabaseConfigured() ? 'Order captured and sent to WhatsApp.' : 'Order sent to WhatsApp.');
    } catch (error) {
      console.error('Order submission failed:', error);
      toast(error?.message || 'Could not place the order right now.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <ThankYouPage orderRef={done.ref} email={done.email} navigate={navigate}/>;

  if (cart.length === 0) return (
    <div style={{minHeight:'100vh',background:'var(--ink)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px',textAlign:'center'}}>
      <div style={{width:'80px',height:'80px',borderRadius:'50%',border:'1px solid rgba(168,230,207,.15)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'28px'}}><BagIcon count={0}/></div>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'40px',color:'rgba(250,250,245,.7)',marginBottom:'12px'}}>Your cart is empty</h2>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.3)',marginBottom:'32px'}}>Add something beautiful from our collection.</p>
      <button className="btn-luxury" style={{fontSize:'12px',letterSpacing:'.12em'}} onClick={()=>navigate('collections')}>SHOP NOW</button>
    </div>
  );

  // Shared props passed down to every FormField
  const fieldProps = { form, setForm, errors, onFieldBlur: handleFieldBlur };

  return (
    <div style={{background:'var(--ink)',minHeight:'100vh',paddingTop:'70px'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:isMobile?'24px 20px 36px':'48px'}}>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?'38px':'48px',color:'var(--cream)',marginBottom:isMobile?'28px':'40px'}}>Your Order</h1>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.15fr 1fr',gap:isMobile?'32px':'48px',alignItems:'start'}}>
          {/* Cart items */}
          <div>
            {cart.map(item=>(
              <div key={item.cartKey} style={{display:'flex',gap:isMobile?'12px':'16px',padding:'20px 0',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                <div style={{width:isMobile?'72px':'84px',height:isMobile?'72px':'84px',borderRadius:'8px',overflow:'hidden',flexShrink:0,border:'1px solid rgba(168,230,207,.08)'}}>
                  <img src={getOptimizedImageUrl(item.images[0], { width: 180, height: 180, mode: 'cover' })} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" decoding="async"/>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div>
                      <p style={{fontFamily:"'DM Sans',sans-serif",fontWeight:'500',fontSize:'15px',color:'rgba(250,250,245,.8)'}}>{item.name}</p>
                      {(item.selectedColorName || item.size)&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',opacity:.6,marginTop:'2px'}}>
                        {[item.selectedColorName ? `Color: ${item.selectedColorName}` : null, item.size ? `Size: ${item.size}` : null].filter(Boolean).join(' | ')}
                      </p>}
                    </div>
                    <button onClick={()=>removeFromCart(item.cartKey)} style={{background:'none',border:'none',cursor:'none',color:'rgba(250,250,245,.2)',transition:'color .15s'}} onMouseEnter={e=>e.target.style.color='rgba(250,250,245,.7)'} onMouseLeave={e=>e.target.style.color='rgba(250,250,245,.2)'}><XIcon/></button>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'12px'}}>
                    <div style={{display:'flex',alignItems:'center',border:'1px solid rgba(168,230,207,.1)',borderRadius:'4px'}}>
                      <button onClick={()=>updateQty(item.cartKey,item.quantity-1)} style={{width:'32px',height:'32px',background:'none',border:'none',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(250,250,245,.4)'}}><MinusIcon/></button>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:'13px',color:'var(--cream)',minWidth:'32px',textAlign:'center'}}>{item.quantity}</span>
                      <button onClick={()=>updateQty(item.cartKey,item.quantity+1)} style={{width:'32px',height:'32px',background:'none',border:'none',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(250,250,245,.4)'}}><PlusIcon/></button>
                    </div>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:'15px',color:'var(--gold)',fontWeight:'500'}}>{formatPrice(item.price*item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary + form */}
          <div>
            <div className="glass-card" style={{padding:'28px',marginBottom:'28px'}}>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'24px',color:'var(--cream)',marginBottom:'20px'}}>Order Summary</h3>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>Subtotal ({cart.reduce((s,i)=>s+i.quantity,0)} items)</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'14px',color:'var(--gold)'}}>{formatPrice(cartTotal)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'18px'}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>Shipping</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'13px',color:cartShipping===0?'var(--mint)':'rgba(250,250,245,.72)',opacity:.85}}>{cartShipping===0?'FREE':formatPrice(cartShipping)}</span>
              </div>
              <div style={{borderTop:'1px solid rgba(168,230,207,.08)',paddingTop:'18px',display:'flex',justifyContent:'space-between'}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:'500',color:'rgba(250,250,245,.7)'}}>Total</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'20px',color:'var(--gold)',fontWeight:'500'}}>{formatPrice(cartGrandTotal)}</span>
              </div>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(212,245,233,.82)',marginTop:'14px',letterSpacing:'.04em'}}>{getShippingMessage(cartTotal)}</p>
            </div>

            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'24px',color:'var(--cream)',marginBottom:'20px'}}>Delivery Details</h3>
            <div>
              <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
                <FormField label="Full Name"              name="fullName"  placeholder="Priya Sharma"                  {...fieldProps}/>
                <FormField label="Email"                  name="email"     placeholder="priya@email.com" type="email"  {...fieldProps}/>
                <FormField label="WhatsApp Number"        name="whatsapp"  placeholder="+91 98765 43210" span={2}       {...fieldProps}/>
                <FormField label="Address Line 1"         name="address1"  placeholder="Flat 4B, Green View Apartments" span={2} {...fieldProps}/>
                <FormField label="Address Line 2 (opt.)"  name="address2"  placeholder="Near Station Road" span={2} req={false} {...fieldProps}/>
                <FormField label="City"                   name="city"      placeholder="Mumbai"                        {...fieldProps}/>
                <FormField label="Province / State"       name="province"  placeholder="Maharashtra" req={true}       {...fieldProps}/>
                <FormField label="Postal Code"            name="postalCode" placeholder="400001"                       {...fieldProps}/>
                <FormField label="Country"                name="country"   placeholder="India"                         {...fieldProps}/>
                <FormField label="Order Notes (opt.)"     name="notes"     placeholder="Any special instructions..." span={2} req={false} ta {...fieldProps}/>
              </div>
              <button className="btn-luxury" disabled={submitting}
                onClick={handleSubmit}
                style={{width:'100%',justifyContent:'center',padding:'17px',fontSize:'13px',letterSpacing:'.1em',marginTop:'6px',opacity:submitting ? 0.6 : 1,cursor:submitting ? 'not-allowed' : 'none'}}>
                {submitting ? (
                  <><span className="animate-spin" style={{display:'inline-block',width:'16px',height:'16px',border:'2px solid rgba(250,250,245,.25)',borderTop:'2px solid var(--cream)',borderRadius:'50%'}}/>  PROCESSING...</>
                ) : 'PLACE ORDER ->'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  THANK YOU PAGE
// =================================================================
function ThankYouPage({ orderRef, email, navigate }) {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  return (
    <div style={{minHeight:'100vh',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',padding:isMobile?'56px 20px':'80px 24px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(30,58,15,.4) 0%,transparent 60%)',pointerEvents:'none'}}/>
      <div style={{maxWidth:'540px',width:'100%',textAlign:'center',position:'relative',zIndex:1}}>
        <svg width={isMobile ? "76" : "88"} height={isMobile ? "76" : "88"} viewBox="0 0 88 88" style={{marginBottom:isMobile?'22px':'28px'}}>
          <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(168,230,207,.15)" strokeWidth="1"/>
          <circle cx="44" cy="44" r="36" fill="none" stroke="var(--mint)" strokeWidth="2" strokeDasharray="226" strokeDashoffset="226" style={{animation:'drawCheck .7s ease-out .3s forwards'}}/>
          <polyline points="27,45 39,57 62,33" fill="none" stroke="var(--mint)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="52" strokeDashoffset="52" style={{animation:'drawCheck .45s ease-out .85s forwards'}}/>
        </svg>
        <p className="label-tag" style={{marginBottom:'14px',letterSpacing:isMobile?'.18em':'.28em'}}>ORDER RECEIVED</p>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?'clamp(38px,12vw,50px)':'clamp(44px,7vw,64px)',color:'var(--cream)',marginBottom:'8px',lineHeight:'1'}}>Thank You</h1>
        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'12px',color:'rgba(250,250,245,.25)',marginBottom:'22px',letterSpacing:'.08em'}}>Order #{orderRef}</p>
        <div className="shimmer-line" style={{width:'48px',margin:'0 auto 24px'}}/>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'14px':'15px',color:'rgba(250,250,245,.45)',lineHeight:isMobile?'1.8':'1.9',marginBottom:isMobile?'24px':'32px'}}>
          We've received your order and will reach out on WhatsApp within a few hours to confirm payment and dispatch. Keep your WhatsApp available.
        </p>
        <a href={`https://wa.me/917351257315?text=Hi%20Urban%20Jewells!%20I%20placed%20Order%20%23${orderRef}%20and%20I'm%20ready%20to%20confirm.`}
          target="_blank" rel="noopener noreferrer"
          style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'10px',background:'#25D366',color:'#fff',padding:isMobile?'15px 22px':'16px 36px',borderRadius:'4px',fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'13px':'14px',fontWeight:'600',textDecoration:'none',letterSpacing:'.06em',boxShadow:'0 8px 32px rgba(37,211,102,.3)',transition:'transform .2s,box-shadow .2s',marginBottom:'22px',width:isMobile?'100%':'auto'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(37,211,102,.45)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 8px 32px rgba(37,211,102,.3)';}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          CONFIRM ON WHATSAPP
        </a>
        <div style={{display:'flex',flexDirection:'column',gap:'8px',alignItems:'center'}}>
          <button onClick={()=>navigate('home')} style={{background:'none',border:'none',cursor:'none',fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(168,230,207,.4)',letterSpacing:'.12em',transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='var(--mint)'} onMouseLeave={e=>e.target.style.color='rgba(168,230,207,.4)'}>CONTINUE SHOPPING -&gt;</button>
          {email&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.15)'}}>Confirmation sent to {email}</p>}
        </div>
      </div>
    </div>
  );
}

function AdminMetricCard({ label, value }) {
  const isMoney = /Revenue|Value/.test(label);
  return (
    <div className="glass-card" style={{padding:'20px 18px'}}>
      <p className="label-tag" style={{marginBottom:'10px',fontSize:'9px'}}>{label}</p>
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'34px',color:'var(--cream)',lineHeight:'1'}}>
        {isMoney ? formatPrice(value) : value}
      </p>
    </div>
  );
}

const getCustomerLookupKey = (entry = {}) => {
  const phone = String(entry.phone || '').trim();
  if (phone) return `phone:${phone}`;
  const email = String(entry.email || '').trim().toLowerCase();
  if (email) return `email:${email}`;
  return `id:${entry.id || ''}`;
};

function AdminPortalPage({ navigate }) {
  const { products, toast } = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 900 : false;
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authForm, setAuthForm] = useState({ email:'', password:'' });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [snapshot, setSnapshot] = useState({ orders:[], inventory:[], customers:[], orderItems:[], orderStatusHistory:[] });
  const [loadingData, setLoadingData] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [inventoryDrafts, setInventoryDrafts] = useState({});
  const [orderFilter, setOrderFilter] = useState('active');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [adminNoteDraft, setAdminNoteDraft] = useState('');
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) {
      setAuthReady(true);
      return undefined;
    }
    let alive = true;
    getSupabaseSession()
      .then(currentSession => {
        if (alive) {
          setSession(currentSession);
          setAuthReady(true);
        }
      })
      .catch(error => {
        console.error('Failed to read admin session:', error);
        if (alive) setAuthReady(true);
      });
    const unsubscribe = onSupabaseAuthChange(nextSession => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [supabaseReady]);

  const loadSnapshot = useCallback(async () => {
    if (!session || !supabaseReady) return;
    setLoadingData(true);
    try {
      const nextSnapshot = await fetchAdminSnapshot();
      setSnapshot(nextSnapshot);
    } catch (error) {
      console.error('Failed to load admin snapshot:', error);
      toast(error?.message || 'Could not load admin data.', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [session, supabaseReady, toast]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const metrics = useMemo(() => buildDashboardMetrics(snapshot), [snapshot]);
  const customerRows = metrics.summary.customers || [];
  const visibleCustomers = useMemo(() => {
    const q = customerSearchTerm.trim().toLowerCase();
    if (!q) return customerRows;
    return customerRows.filter(customer => [customer.name, customer.phone, customer.email].some(value => String(value || '').toLowerCase().includes(q)));
  }, [customerRows, customerSearchTerm]);
  const orderItemsByOrderId = useMemo(() => snapshot.orderItems?.reduce((map, item) => {
    if (!map.has(item.order_id)) map.set(item.order_id, []);
    map.get(item.order_id).push(item);
    return map;
  }, new Map()) || new Map(), [snapshot.orderItems]);
  const orderHistoryByOrderId = useMemo(() => snapshot.orderStatusHistory?.reduce((map, item) => {
    if (!map.has(item.order_id)) map.set(item.order_id, []);
    map.get(item.order_id).push(item);
    return map;
  }, new Map()) || new Map(), [snapshot.orderStatusHistory]);
  const selectedOrder = useMemo(() => snapshot.orders.find(order => order.id === selectedOrderId) || null, [selectedOrderId, snapshot.orders]);
  const customerOrdersByKey = useMemo(() => snapshot.orders.reduce((map, order) => {
    const key = getCustomerLookupKey(order);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(order);
    return map;
  }, new Map()), [snapshot.orders]);
  const selectedCustomer = useMemo(() => visibleCustomers.find(customer => customer.id === selectedCustomerId) || customerRows.find(customer => customer.id === selectedCustomerId) || null, [customerRows, selectedCustomerId, visibleCustomers]);
  const visibleOrders = useMemo(() => {
    let orders = snapshot.orders;
    if (orderFilter === 'cancelled') orders = orders.filter(order => order.status === 'cancelled');
    else if (orderFilter === 'active') orders = orders.filter(order => order.status !== 'cancelled');
    if (statusFilter !== 'all') orders = orders.filter(order => order.status === statusFilter);
    if (dateFilter !== 'all') {
      const now = new Date();
      const start = new Date(now);
      if (dateFilter === 'today') start.setHours(0, 0, 0, 0);
      if (dateFilter === 'week') start.setDate(now.getDate() - 7);
      if (dateFilter === 'month') start.setMonth(now.getMonth() - 1);
      orders = orders.filter(order => new Date(order.created_at) >= start);
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      orders = orders.filter(order => [order.order_ref, order.customer_name, order.phone, order.email, order.city, order.state].some(value => String(value || '').toLowerCase().includes(q)));
    }
    return orders;
  }, [dateFilter, orderFilter, searchTerm, snapshot.orders, statusFilter]);
  useEffect(() => {
    if (!selectedOrderId && visibleOrders.length) {
      setSelectedOrderId(visibleOrders[0].id);
      return;
    }
    if (selectedOrderId && !visibleOrders.some(order => order.id === selectedOrderId)) {
      setSelectedOrderId(visibleOrders[0]?.id || null);
    }
  }, [selectedOrderId, visibleOrders]);
  useEffect(() => {
    setAdminNoteDraft(selectedOrder?.admin_notes || '');
  }, [selectedOrder]);
  useEffect(() => {
    if (!selectedCustomerId && visibleCustomers.length) {
      setSelectedCustomerId(visibleCustomers[0].id);
      return;
    }
    if (selectedCustomerId && !visibleCustomers.some(customer => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(visibleCustomers[0]?.id || null);
    }
  }, [selectedCustomerId, visibleCustomers]);

  const inventoryRows = useMemo(() => {
    const inventoryMap = new Map(snapshot.inventory.map(item => [`${item.product_id}::${item.variant_id || 'base'}`, item]));
    const rows = [];
    products.forEach(product => {
      if (Array.isArray(product.variants) && product.variants.length) {
        product.variants.forEach(variant => {
          const key = `${product.id}::${variant.id}`;
          const record = inventoryMap.get(key);
          rows.push({
            key,
            product_id: product.id,
            variant_id: variant.id,
            productName: product.name,
            variantLabel: variant.colorName,
            stock_quantity: record?.stock_quantity ?? '',
            low_stock_threshold: record?.low_stock_threshold ?? 2,
          });
        });
      } else {
        const key = `${product.id}::base`;
        const record = inventoryMap.get(key);
        rows.push({
          key,
          product_id: product.id,
          variant_id: 'base',
          productName: product.name,
          variantLabel: 'Base Product',
          stock_quantity: record?.stock_quantity ?? '',
          low_stock_threshold: record?.low_stock_threshold ?? 2,
        });
      }
    });
    return rows;
  }, [products, snapshot.inventory]);

  const handleLogin = async () => {
    setAuthSubmitting(true);
    setAuthError('');
    try {
      await signInAdminWithPassword(authForm.email.trim(), authForm.password);
      toast('Admin session started.');
    } catch (error) {
      setAuthError(error?.message || 'Could not sign in.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutAdminSession();
      toast('Signed out of admin.');
    } catch (error) {
      toast(error?.message || 'Could not sign out.', 'error');
    }
  };

  const handleOrderStatusChange = async (orderId, status) => {
    setSavingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      await loadSnapshot();
      toast('Order status updated.');
    } catch (error) {
      toast(error?.message || 'Could not update order status.', 'error');
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleDeleteCancelledOrder = async (orderId) => {
    const shouldDelete = typeof window === 'undefined' ? true : window.confirm('Delete this cancelled order permanently?');
    if (!shouldDelete) return;
    setSavingOrderId(orderId);
    try {
      await deleteCancelledOrder(orderId);
      setSnapshot(prev => ({
        ...prev,
        orders: prev.orders.filter(order => order.id !== orderId),
      }));
      toast('Cancelled order deleted.');
    } catch (error) {
      toast(error?.message || 'Could not delete the order.', 'error');
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleAdminNotesSave = async () => {
    if (!selectedOrder) return;
    setSavingOrderId(selectedOrder.id);
    try {
      await updateOrderAdminNotes(selectedOrder.id, adminNoteDraft);
      setSnapshot(prev => ({
        ...prev,
        orders: prev.orders.map(order => order.id === selectedOrder.id ? { ...order, admin_notes: adminNoteDraft.trim() || null } : order),
      }));
      toast('Admin notes saved.');
    } catch (error) {
      toast(error?.message || 'Could not save admin notes.', 'error');
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleInventoryChange = (key, field, value) => {
    setInventoryDrafts(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const handleInventorySave = async (row) => {
    const draft = inventoryDrafts[row.key] || {};
    const nextRecord = {
      product_id: row.product_id,
      variant_id: row.variant_id,
      stock_quantity: draft.stock_quantity ?? row.stock_quantity ?? 0,
      low_stock_threshold: draft.low_stock_threshold ?? row.low_stock_threshold ?? 2,
    };
    setSavingOrderId(row.key);
    try {
      await upsertInventoryRecord(nextRecord);
      toast('Inventory updated.');
      setInventoryDrafts(prev => {
        const copy = { ...prev };
        delete copy[row.key];
        return copy;
      });
      await loadSnapshot();
    } catch (error) {
      toast(error?.message || 'Could not update inventory.', 'error');
    } finally {
      setSavingOrderId(null);
    }
  };

  if (!supabaseReady) {
    return (
      <div style={{background:'var(--ink)',minHeight:'100vh',paddingTop:'70px'}}>
        <div style={{maxWidth:'960px',margin:'0 auto',padding:isMobile?'28px 20px 44px':'48px'}}>
          <PageBackButton onClick={()=>navigate('home')} label="Back"/>
          <div className="glass-card" style={{padding:isMobile?'28px 20px':'36px 32px'}}>
            <p className="label-tag" style={{marginBottom:'12px'}}>ADMIN PORTAL</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(34px,5vw,56px)',color:'var(--cream)',marginBottom:'14px'}}>Supabase setup required</h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'15px',color:'rgba(250,250,245,.46)',lineHeight:'1.85',marginBottom:'18px'}}>
              The admin portal is built, but it needs Supabase credentials and tables before it can capture orders or show metrics.
            </p>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'var(--mint)',lineHeight:'1.8'}}>
              1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env` and Vercel.
              <br/>2. Run the SQL in `supabase/schema.sql`.
              <br/>3. Create an admin user in Supabase Auth.
              <br/>4. Reopen `#/admin`.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!authReady) return <CatalogLoadingScreen label="Loading admin portal"/>;

  if (!session) {
    return (
      <div style={{background:'var(--ink)',minHeight:'100vh',paddingTop:'70px'}}>
        <div style={{maxWidth:'540px',margin:'0 auto',padding:isMobile?'28px 20px 44px':'56px 24px'}}>
          <PageBackButton onClick={()=>navigate('home')} label="Back"/>
          <div className="glass-card" style={{padding:isMobile?'28px 20px':'36px 32px'}}>
            <p className="label-tag" style={{marginBottom:'12px'}}>ADMIN ACCESS</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(34px,5vw,52px)',color:'var(--cream)',marginBottom:'12px'}}>Sign in</h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.42)',lineHeight:'1.8',marginBottom:'24px'}}>
              Use your admin email and password from Supabase Auth to open the operations dashboard.
            </p>
            <div style={{display:'grid',gap:'14px'}}>
              <div>
                <label style={{display:'block',fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.35)',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:'8px'}}>Email</label>
                <input value={authForm.email} onChange={e=>setAuthForm(prev => ({ ...prev, email:e.target.value }))} className="dark-field" placeholder="admin@urbanjewells.in" />
              </div>
              <div>
                <label style={{display:'block',fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.35)',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:'8px'}}>Password</label>
                <input type="password" value={authForm.password} onChange={e=>setAuthForm(prev => ({ ...prev, password:e.target.value }))} className="dark-field" placeholder="••••••••" />
              </div>
              {authError && <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'#F87171'}}>{authError}</p>}
              <button className="btn-luxury" onClick={handleLogin} disabled={authSubmitting} style={{justifyContent:'center',opacity:authSubmitting?0.65:1,cursor:authSubmitting?'not-allowed':'none'}}>
                {authSubmitting ? 'SIGNING IN...' : 'OPEN ADMIN PORTAL'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{background:'var(--ink)',minHeight:'100vh',paddingTop:'70px'}}>
      <div style={{maxWidth:'1320px',margin:'0 auto',padding:isMobile?'28px 20px 44px':'40px 48px 56px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:isMobile?'flex-start':'center',gap:'16px',flexDirection:isMobile?'column':'row',marginBottom:'28px'}}>
          <div>
            <p className="label-tag" style={{marginBottom:'10px'}}>ADMIN PORTAL</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(34px,5vw,56px)',color:'var(--cream)',lineHeight:'1'}}>Store Operations</h1>
          </div>
          <div style={{display:'flex',gap:'10px',width:isMobile?'100%':'auto',flexWrap:'wrap'}}>
            <button className="btn-ghost-luxury" onClick={loadSnapshot} style={{justifyContent:'center',width:isMobile?'100%':'auto'}}>{loadingData ? 'REFRESHING...' : 'REFRESH DATA'}</button>
            <button className="btn-luxury" onClick={handleLogout} style={{justifyContent:'center',width:isMobile?'100%':'auto'}}>SIGN OUT</button>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(3,minmax(0,1fr))',gap:'14px',marginBottom:'28px'}}>
          {metrics.cards.map(card => <AdminMetricCard key={card.label} {...card} />)}
        </div>

        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.2fr .8fr',gap:'18px',marginBottom:'18px'}}>
          <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',gap:'12px',flexWrap:'wrap'}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)'}}>Recent Orders</h2>
              <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.32)',letterSpacing:'.12em'}}>AUTO-CAPTURED FROM CHECKOUT</p>
                <input
                  className="dark-field"
                  value={searchTerm}
                  onChange={e=>setSearchTerm(e.target.value)}
                  placeholder="Search order, customer, phone"
                  style={{minWidth:isMobile?'100%':'220px'}}
                />
                <select
                  value={orderFilter}
                  onChange={e=>setOrderFilter(e.target.value)}
                  style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'8px 10px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.72)',outline:'none',cursor:'none'}}
                >
                  <option value="active">ACTIVE ONLY</option>
                  <option value="all">ALL ORDERS</option>
                  <option value="cancelled">CANCELLED ONLY</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={e=>setStatusFilter(e.target.value)}
                  style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'8px 10px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.72)',outline:'none',cursor:'none'}}
                >
                  <option value="all">ANY STATUS</option>
                  {ORDER_STATUSES.map(status => <option key={status} value={status}>{status.toUpperCase()}</option>)}
                </select>
                <select
                  value={dateFilter}
                  onChange={e=>setDateFilter(e.target.value)}
                  style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'8px 10px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.72)',outline:'none',cursor:'none'}}
                >
                  <option value="all">ALL DATES</option>
                  <option value="today">TODAY</option>
                  <option value="week">LAST 7 DAYS</option>
                  <option value="month">LAST 30 DAYS</option>
                </select>
              </div>
            </div>
            <div style={{display:'grid',gap:'12px'}}>
              {visibleOrders.slice(0, 12).map(order => (
                <div key={order.id} onClick={()=>setSelectedOrderId(order.id)} style={{padding:'14px',border:`1px solid ${selectedOrderId===order.id?'rgba(201,168,76,.28)':'rgba(168,230,207,.08)'}`,borderRadius:'10px',background:selectedOrderId===order.id?'rgba(201,168,76,.05)':'rgba(255,255,255,.02)',cursor:'none'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px',flexWrap:'wrap',marginBottom:'10px'}}>
                    <div>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'var(--mint)',letterSpacing:'.08em'}}>{order.order_ref}</p>
                      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'15px',color:'rgba(250,250,245,.86)',marginTop:'4px'}}>{order.customer_name}</p>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.32)',marginTop:'4px'}}>{order.phone}</p>
                    </div>
                    <div style={{textAlign:isMobile?'left':'right'}}>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:'13px',color:'var(--gold)'}}>{formatPrice(order.total)}</p>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',marginTop:'4px'}}>{new Date(order.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'12px',color:'rgba(250,250,245,.42)'}}>
                      {order.city}, {order.state} • {order.pincode}
                    </p>
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                      <select
                        value={order.status}
                        onChange={e=>handleOrderStatusChange(order.id, e.target.value)}
                        disabled={savingOrderId === order.id}
                        style={{border:'1px solid rgba(168,230,207,.15)',borderRadius:'4px',padding:'8px 10px',fontFamily:"'DM Mono',monospace",fontSize:'10px',letterSpacing:'.08em',background:'rgba(255,255,255,.04)',color:'rgba(250,250,245,.72)',outline:'none',cursor:'none'}}
                      >
                        {ORDER_STATUSES.map(status => <option key={status} value={status}>{status.toUpperCase()}</option>)}
                      </select>
                      {order.status === 'cancelled' && (
                        <button
                          className="btn-ghost-luxury"
                          onClick={()=>handleDeleteCancelledOrder(order.id)}
                          disabled={savingOrderId === order.id}
                          style={{padding:'8px 12px',fontSize:'10px',letterSpacing:'.1em',color:'#FCA5A5',borderColor:'rgba(248,113,113,.28)'}}
                        >
                          {savingOrderId === order.id ? 'DELETING...' : 'DELETE'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!visibleOrders.length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>No orders in this view yet.</p>}
            </div>
          </div>

          <div style={{display:'grid',gap:'18px'}}>
            <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)',marginBottom:'12px'}}>Order Detail</h2>
              {selectedOrder ? (
                <div style={{display:'grid',gap:'14px'}}>
                  <div style={{paddingBottom:'10px',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'var(--mint)'}}>{selectedOrder.order_ref}</p>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'16px',color:'rgba(250,250,245,.84)',marginTop:'6px'}}>{selectedOrder.customer_name}</p>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',marginTop:'6px'}}>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Customer</p>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.72)',lineHeight:'1.8'}}>{selectedOrder.phone}</p>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.72)',lineHeight:'1.8'}}>{selectedOrder.email || 'No email'}</p>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.52)',lineHeight:'1.8',marginTop:'4px'}}>
                      {[selectedOrder.address_line_1, selectedOrder.address_line_2, `${selectedOrder.city}, ${selectedOrder.state} ${selectedOrder.pincode}`].filter(Boolean).join(', ')}
                    </p>
                    {selectedOrder.notes && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.52)',lineHeight:'1.8',marginTop:'8px'}}>Note: {selectedOrder.notes}</p>}
                  </div>
                  <div>
                    <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Items</p>
                    <div style={{display:'grid',gap:'10px'}}>
                      {(orderItemsByOrderId.get(selectedOrder.id) || []).map(item => (
                        <div key={item.id} style={{padding:'10px 0',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.82)'}}>{item.product_name}</p>
                          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',marginTop:'4px'}}>
                            {[item.variant_color_name ? `Color: ${item.variant_color_name}` : null, item.size ? `Size: ${item.size}` : null, `Qty: ${item.quantity}`].filter(Boolean).join(' • ')}
                          </p>
                          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'var(--gold)',marginTop:'6px'}}>{formatPrice(item.line_total)}</p>
                        </div>
                      ))}
                      {!(orderItemsByOrderId.get(selectedOrder.id) || []).length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.45)'}}>No items found for this order.</p>}
                    </div>
                  </div>
                  <div>
                    <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Status History</p>
                    <div style={{display:'grid',gap:'10px'}}>
                      {(orderHistoryByOrderId.get(selectedOrder.id) || []).slice(0, 8).map(entry => (
                        <div key={entry.id} style={{display:'flex',justifyContent:'space-between',gap:'10px',padding:'10px 0',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.78)'}}>{entry.previous_status ? `${entry.previous_status} -> ${entry.next_status}` : entry.next_status}</p>
                          <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)'}}>{new Date(entry.changed_at).toLocaleString('en-IN')}</p>
                        </div>
                      ))}
                      {!(orderHistoryByOrderId.get(selectedOrder.id) || []).length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.45)'}}>No status history yet.</p>}
                    </div>
                  </div>
                  <div>
                    <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Admin Notes</p>
                    <textarea
                      className="dark-field"
                      value={adminNoteDraft}
                      onChange={e=>setAdminNoteDraft(e.target.value)}
                      placeholder="Internal notes for payment, dispatch, customer requests..."
                      rows={4}
                      style={{resize:'vertical',minHeight:'110px'}}
                    />
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'10px',marginTop:'10px',flexWrap:'wrap'}}>
                      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'12px',color:'rgba(250,250,245,.42)'}}>
                        Internal only. Customers do not see these notes.
                      </p>
                      <button
                        className="btn-ghost-luxury"
                        onClick={handleAdminNotesSave}
                        disabled={savingOrderId === selectedOrder.id}
                        style={{padding:'10px 14px',fontSize:'10px'}}
                      >
                        {savingOrderId === selectedOrder.id ? 'SAVING...' : 'SAVE NOTES'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.45)'}}>Select an order to inspect full details.</p>}
            </div>
            <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)',marginBottom:'12px'}}>Operations</h2>
              <div style={{display:'grid',gap:'10px'}}>
                {[
                  { label:'Orders This Week', value: metrics.summary.weekOrders.length },
                  { label:'Orders This Year', value: metrics.summary.yearOrders.length },
                  { label:'Low Stock SKUs', value: metrics.summary.lowStock.length },
                  { label:'Out of Stock SKUs', value: metrics.summary.outOfStock.length },
                  { label:'Repeat Customers', value: metrics.summary.repeatCustomers.length },
                ].map(item => (
                  <div key={item.label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.45)'}}>{item.label}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:'13px',color:'var(--mint)'}}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px',flexWrap:'wrap',marginBottom:'12px'}}>
                <div>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)'}}>Customers</h2>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',marginTop:'6px'}}>
                    {visibleCustomers.length} shown • {customerRows.length} total
                  </p>
                </div>
                <input
                  className="dark-field"
                  value={customerSearchTerm}
                  onChange={e=>setCustomerSearchTerm(e.target.value)}
                  placeholder="Search name, phone, email"
                  style={{minWidth:isMobile?'100%':'220px'}}
                />
              </div>
              {customerRows.length ? (
                <div style={{display:'grid',gap:'14px'}}>
                  <div style={{display:'grid',gap:'10px',maxHeight:isMobile?'none':'420px',overflowY:isMobile?'visible':'auto',paddingRight:isMobile?0:'4px'}}>
                    {visibleCustomers.map(customer => (
                      <button
                        key={customer.id}
                        onClick={()=>setSelectedCustomerId(customer.id)}
                        style={{
                          textAlign:'left',
                          padding:'12px',
                          border:`1px solid ${selectedCustomerId===customer.id?'rgba(201,168,76,.28)':'rgba(168,230,207,.08)'}`,
                          borderRadius:'10px',
                          background:selectedCustomerId===customer.id?'rgba(201,168,76,.05)':'rgba(255,255,255,.02)',
                          cursor:'none'
                        }}
                      >
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.82)'}}>{customer.name}</p>
                        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',marginTop:'4px'}}>{customer.phone || customer.email || 'No contact'}</p>
                        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',marginTop:'6px'}}>
                          {customer.order_count} orders • {formatPrice(customer.total_spend || 0)}
                        </p>
                      </button>
                    ))}
                  </div>
                  {selectedCustomer && (
                    <div style={{paddingTop:'6px',borderTop:'1px solid rgba(168,230,207,.06)',display:'grid',gap:'10px'}}>
                      <div>
                        <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Customer Detail</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'15px',color:'rgba(250,250,245,.86)'}}>{selectedCustomer.name}</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.62)',marginTop:'4px'}}>{selectedCustomer.phone || 'No phone'}</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.52)',marginTop:'2px'}}>{selectedCustomer.email || 'No email'}</p>
                        <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',marginTop:'8px'}}>
                          Last order: {selectedCustomer.last_order_at ? new Date(selectedCustomer.last_order_at).toLocaleString('en-IN') : 'No orders yet'}
                        </p>
                      </div>
                      <div>
                        <p className="label-tag" style={{marginBottom:'8px',fontSize:'9px'}}>Recent Orders</p>
                        <div style={{display:'grid',gap:'10px'}}>
                          {(customerOrdersByKey.get(selectedCustomer.id) || []).slice(0, 5).map(order => (
                            <button
                              key={order.id}
                              onClick={()=>setSelectedOrderId(order.id)}
                              style={{textAlign:'left',padding:'10px 0',borderBottom:'1px solid rgba(168,230,207,.06)',background:'transparent',cursor:'none'}}
                            >
                              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)'}}>{order.order_ref}</p>
                              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.72)',marginTop:'4px'}}>
                                {formatPrice(order.total)} • {order.status}
                              </p>
                            </button>
                          ))}
                          {!(customerOrdersByKey.get(selectedCustomer.id) || []).length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.45)'}}>No orders tied to this customer yet.</p>}
                        </div>
                      </div>
                    </div>
                  )}
                  {!visibleCustomers.length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>No customers match this search yet.</p>}
                </div>
              ) : <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>Customer profiles will appear once orders are captured.</p>}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{padding:isMobile?'22px 18px':'24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',gap:'12px',flexWrap:'wrap'}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'30px',color:'var(--cream)'}}>Inventory</h2>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',letterSpacing:'.1em'}}>MANUAL STOCK CONTROL</p>
          </div>
          <div style={{display:'grid',gap:'12px'}}>
            {inventoryRows.slice(0, 24).map(row => {
              const draft = inventoryDrafts[row.key] || {};
              return (
                <div key={row.key} style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.4fr .8fr .8fr auto',gap:'10px',alignItems:'center',padding:'12px',border:'1px solid rgba(168,230,207,.08)',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}>
                  <div>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.84)'}}>{row.productName}</p>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.28)',marginTop:'4px'}}>{row.variantLabel}</p>
                  </div>
                  <input
                    className="dark-field"
                    value={draft.stock_quantity ?? row.stock_quantity}
                    onChange={e=>handleInventoryChange(row.key, 'stock_quantity', e.target.value)}
                    placeholder="Stock"
                  />
                  <input
                    className="dark-field"
                    value={draft.low_stock_threshold ?? row.low_stock_threshold}
                    onChange={e=>handleInventoryChange(row.key, 'low_stock_threshold', e.target.value)}
                    placeholder="Low stock"
                  />
                  <button className="btn-ghost-luxury" onClick={()=>handleInventorySave(row)} style={{justifyContent:'center',padding:'12px 18px'}} disabled={savingOrderId === row.key}>
                    {savingOrderId === row.key ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              );
            })}
            {!inventoryRows.length && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.4)'}}>Inventory rows will appear once product data is available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  ABOUT PAGE
// =================================================================
function AboutPage({ navigate, navigateBack }) {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const team = [
    {name:"Sudhir Krishan Narula",role:"Founder",bio:"With a passion for design and detail, Sudhir founded Urban Jewells to redefine artificial jewellery - merging refined aesthetics with bold, contemporary expression.",init:"SK", img:"https://res.cloudinary.com/dxw1yg7if/image/upload/v1772515066/IMG_9975_cypxxi.jpg"},
    {name:"Meera Narula",role:"CEO",bio:"With a background in business and a passion for craftsmanship, Meera steers the brand's vision and ensures every piece reflects luxury with integrity.",init:"MN", img:"https://res.cloudinary.com/dxw1yg7if/image/upload/v1772521076/Maa_xrolun.jpg"},
    {name:"Paarth Narula",role:"Chief Executive",bio:"Overseas operations and customer experience - Paarth makes sure every order is handled with care from the studio to your doorstep.",init:"PN", img:"https://res.cloudinary.com/dxw1yg7if/image/upload/v1772521653/Paarth_Bhaiya_hwc1qa.jpg"},
    {name:"Dhananjay Narula",role:"Developer",bio:"Full-stack developer and tech enthusiast who built this website and keeps our digital shop running smoothly.",init:"DN", img:"https://res.cloudinary.com/dxw1yg7if/image/upload/v1772521159/photo_6116175361453264265_y_ka8fie.jpg"},
  ];
  return (
    <div style={{background:'var(--ink)'}}>
      {/* Hero */}
      <div style={{minHeight:isMobile?'42vh':'55vh',display:'flex',alignItems:'flex-end',padding:isMobile?'92px 20px 38px':'120px 48px 64px',position:'relative',overflow:'hidden',background:'var(--ink)'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(168,230,207,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(168,230,207,.025) 1px,transparent 1px)',backgroundSize:'80px 80px',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'20%',right:'8%',width:'500px',height:'500px',background:'radial-gradient(circle,rgba(168,230,207,.05) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <PageBackButton onClick={()=>navigateBack('home')} label="Back"/>
          <p className="label-tag fade-up" style={{marginBottom:'16px',letterSpacing:'.3em'}}>OUR STORY</p>
          <h1 className="fade-up-1" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:isMobile?'clamp(42px,12vw,58px)':'clamp(56px,9vw,110px)',color:'var(--cream)',lineHeight:isMobile?'.94':'.88',letterSpacing:'-.02em'}}>Crafted.<br/><em style={{color:'var(--mint)'}}>With intention.</em></h1>
          <p className="fade-up-2" style={{fontFamily:"'DM Sans',sans-serif",fontStyle:'italic',fontSize:isMobile?'14px':'16px',color:'rgba(250,250,245,.3)',marginTop:isMobile?'18px':'24px'}}>Every piece has a story. This is ours.</p>
        </div>
      </div>

      {/* Story */}
      <section style={{padding:isMobile?'48px 20px':'80px 48px',maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:isMobile?'34px':'72px',alignItems:'center'}}>
          <div style={{position:'relative'}}>
                <img src={getOptimizedImageUrl("https://res.cloudinary.com/dxw1yg7if/image/upload/v1772515066/IMG_9975_cypxxi.jpg", { width: 900, height: 700, mode: 'cover' })} alt="Our studio" style={{borderRadius:'12px',width:'100%',objectFit:'cover',border:'1px solid rgba(168,230,207,.08)'}} decoding="async"/>
            <div style={{position:'absolute',bottom:isMobile?'12px':'-20px',right:isMobile?'12px':'-20px',padding:isMobile?'14px 16px':'20px 24px',background:'rgba(14,20,16,.95)',backdropFilter:'blur(16px)',border:'1px solid rgba(168,230,207,.12)',borderRadius:'8px'}}>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'28px',color:'var(--gold)',fontWeight:'500',lineHeight:'1'}}>2025</p>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',letterSpacing:'.12em',marginTop:'4px'}}>FOUNDED</p>
            </div>
          </div>
          <div>
            <p className="label-tag" style={{marginBottom:'16px'}}>SINCE 2025 - INDIA</p>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(32px,4vw,48px)',color:'var(--cream)',marginBottom:'28px',lineHeight:'1.1'}}>Where Craft Meets Intention</h2>
            {["Urban Jewells was born from the vision of Sudhir Krishan Narula, who believed jewellery should be more than ornamentation - it should be identity, intention, and quiet power.",
              "What began as a passion for refined craftsmanship soon evolved into a brand rooted in purpose. Inspired by timeless artistry and modern sophistication, Sudhir set out to create pieces that feel personal, powerful, and enduring - jewellery designed not just to be worn, but to be experienced.",
              "Every Urban Jewells creation reflects that philosophy: uncompromising quality, meaningful design, and a buying experience built on trust, not transactions.",
              "We believe jewellery is a language worn closest to the skin. When you wear Urban Jewells, you wear a piece of that belief."].map((t,i)=>(
              <p key={i} style={{fontFamily:"'DM Sans',sans-serif",fontSize:'15px',color:'rgba(250,250,245,.42)',lineHeight:'1.9',marginBottom:'18px'}}>{t}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{padding:isMobile?'48px 20px':'64px 48px',background:'var(--ink2)',borderTop:'1px solid rgba(168,230,207,.05)',borderBottom:'1px solid rgba(168,230,207,.05)'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:'48px'}}>
            <p className="label-tag" style={{marginBottom:'12px'}}>WHAT WE STAND FOR</p>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(32px,4vw,50px)',color:'var(--cream)'}}>Our Mission</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(4,minmax(0,1fr))':'repeat(auto-fill,minmax(280px,1fr))',gap:isMobile?'10px':'18px',paddingBottom:isMobile?'0':'0'}}>
            {[{icon:<MissionQualityIcon/>,t:'Quality First',d:'Every component - from clasp to stone - is selected for longevity. Our pieces outlast trends.'},
              {icon:<MissionLeafIcon/>,t:'Ethically Sourced',d:"All gemstones are conflict-free. We work only with suppliers who respect the land and the people who work it."},
              {icon:<MissionCommunityIcon/>,t:'Community Driven',d:"Urban Jewells grew from the women who wore it. Every WhatsApp message is read and replied to personally."},
              {icon:<MissionSustainabilityIcon/>,t:'Sustainable Practices',d:'We minimise waste, favour eco-conscious materials, and continuously improve our production footprint.'}
            ].map(({icon,t,d})=>(
              <div key={t} className="glass-card" style={{padding:isMobile?'18px 12px':'32px',textAlign:'center',minWidth:'auto'}}>
                <div style={{width:isMobile?'48px':'62px',height:isMobile?'48px':'62px',margin:'0 auto 18px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(145deg,rgba(201,168,76,.12),rgba(168,230,207,.08))',border:'1px solid rgba(201,168,76,.18)',color:'var(--gold)'}}>
                  {icon}
                </div>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?'12px':'24px',color:'var(--cream)',marginBottom:isMobile?'8px':'12px',lineHeight:isMobile?'1.02':'1.05'}}>{t}</h3>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?'11px':'14px',color:'rgba(250,250,245,.38)',lineHeight:isMobile?'1.5':'1.8'}}>
                  {isMobile
                    ? (t === 'Quality First'
                        ? ''
                        : t === 'Ethically Sourced'
                          ? ''
                          : t === 'Community Driven'
                            ? ''
                            : '')
                    : d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{padding:isMobile?'48px 20px 56px':'80px 48px',maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'52px'}}>
          <p className="label-tag" style={{marginBottom:'12px'}}>THE PEOPLE BEHIND THE PIECES</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(32px,4vw,50px)',color:'var(--cream)'}}>Our Team</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'20px'}}>
          {team.map((m,i)=>(
            <div key={m.name} className="glass-card fade-up" style={{padding:'32px 24px',textAlign:'center',animationDelay:`${i*.07}s`}}>
              <div style={{width:'68px',height:'68px',borderRadius:'50%',overflow:'hidden',background:'linear-gradient(135deg,var(--sg),var(--dg))',border:'1px solid rgba(168,230,207,.18)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                {m.img ? (
                  <img src={getOptimizedImageUrl(m.img, { width: 220, height: 220, mode: 'cover' })} alt={m.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" decoding="async"/>
                ) : (
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:'18px',color:'var(--mint)',fontWeight:'500'}}>{(m.name.match(/\b\w/g)||[]).slice(0,2).join('')}</span>
                )}
              </div>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',color:'var(--cream)',marginBottom:'5px'}}>{m.name}</h3>
              <p className="label-tag" style={{marginBottom:'14px',letterSpacing:'.14em'}}>{m.role}</p>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'13px',color:'rgba(250,250,245,.35)',lineHeight:'1.8'}}>{m.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// =================================================================
//  CONTACT PAGE
// =================================================================
const SUBJECT_OPTIONS = [
  'General Enquiry',
  'Order Question',
  'Shipping',
  'Returns',
  'Custom Piece',
  'Wholesale',
  'Feedback',
  'Press',
  'Other'
];

function ContactPage({ navigateBack }) {
  const [form, setForm] = useState({name:'',email:'',subject:'General Enquiry',message:''});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [sub, setSub] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const handleSubmit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name='Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email='Valid email required';
    if (!form.message.trim()) errs.message='Required';
    if (Object.keys(errs).length>0) { setErrors(errs); return; }

    // open WhatsApp chat with pre-filled message
    const text = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\n${form.message}`
    );
    window.open(`https://wa.me/917351257315?text=${text}`, '_blank');

    setStatus('success');
    setForm({name:'',email:'',subject:'General Enquiry',message:''});
    setTimeout(()=>setStatus(null),5000);
  };
  return (
    <div style={{background:'var(--ink)'}}>
      <div style={{minHeight:isMobile?'34vh':'40vh',display:'flex',alignItems:'flex-end',padding:isMobile?'92px 20px 34px':'120px 48px 56px',background:'var(--ink)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'20%',right:'8%',width:'400px',height:'400px',background:'radial-gradient(circle,rgba(168,230,207,.05) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <PageBackButton onClick={()=>navigateBack('home')} label="Back"/>
          <p className="label-tag fade-up" style={{marginBottom:'14px',letterSpacing:'.3em'}}>REACH OUT</p>
          <h1 className="fade-up-1" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:isMobile?'clamp(40px,12vw,54px)':'clamp(52px,8vw,96px)',color:'var(--cream)',lineHeight:'.9'}}>Get in Touch</h1>
        </div>
      </div>

      <div style={{maxWidth:'1100px',margin:'0 auto',padding:isMobile?'36px 20px 52px':'60px 48px'}}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.2fr 1fr',gap:isMobile?'28px':'56px',alignItems:'start'}}>
          {/* Form */}
          <div>
            {status==='success'&&(
              <div style={{background:'rgba(168,230,207,.08)',border:'1px solid rgba(168,230,207,.2)',borderRadius:'6px',padding:'14px 18px',marginBottom:'24px',display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{color:'var(--mint)'}}>OK</span>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.6)'}}>Message sent! We'll reply within 24 hours.</span>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'14px'}}>
                {[{l:'Name',n:'name',p:'Priya Sharma'},{l:'Email',n:'email',p:'priya@email.com',t:'email'}].map(({l,n,p,t='text'})=>(
                  <div key={n}>
                    <label htmlFor={n} style={{display:'block',fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:'8px'}}>{l} *</label>
                    <input id={n} type={t} placeholder={p} value={form[n]} onChange={e=>setForm(p=>({...p,[n]:e.target.value}))} className="dark-field"/>
                    {errors[n]&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'#F87171',marginTop:'4px'}}>{errors[n]}</p>}
                  </div>
                ))}
              </div>
              <div>
                <label htmlFor="subject" style={{display:'block',fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:'8px'}}>Subject</label>
                <select id="subject" value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} className="dark-field" style={{cursor:'none'}}>
                  {SUBJECT_OPTIONS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="message" style={{display:'block',fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.3)',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:'8px'}}>Message *</label>
                <textarea id="message" rows={5} placeholder="Tell us what's on your mind..." value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} className="dark-field" style={{resize:'vertical'}}/>
                {errors.message&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'#F87171',marginTop:'4px'}}>{errors.message}</p>}
              </div>
              <button className="btn-luxury" disabled={sub} style={{alignSelf:'flex-start',padding:'14px 32px',fontSize:'12px',letterSpacing:'.12em',opacity:sub ? 0.65 : 1,width:isMobile?'100%':'auto',justifyContent:'center'}}
                onClick={handleSubmit}>
                {sub?<><span className="animate-spin" style={{display:'inline-block',width:'14px',height:'14px',border:'2px solid rgba(250,250,245,.25)',borderTop:'2px solid var(--cream)',borderRadius:'50%'}}/>  SENDING</>:'SEND MESSAGE ->'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="glass-card" style={{padding:isMobile?'24px':'32px',marginBottom:'20px'}}>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'24px',color:'var(--cream)',marginBottom:'22px'}}>Contact Info</h3>
              {[{t:'WhatsApp',v:'+91 73512 57315',a:'https://wa.me/917351257315',e:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z"/></svg>},{t:'Email',v:'hello@urbanjewells.in',a:'mailto:hello@urbanjewells.in',e:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>},{t:'Instagram',v:'@urbanjewells',a:'https://instagram.com/urbanjewells',e:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>}].map(({e,t,v,a})=>(
                <a key={t} href={a} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:'14px',padding:'14px 0',borderBottom:'1px solid rgba(168,230,207,.06)',textDecoration:'none',transition:'opacity .15s'}} onMouseEnter={el=>el.currentTarget.style.opacity='.8'} onMouseLeave={el=>el.currentTarget.style.opacity='1'}>
                  <span style={{width:'38px',height:'38px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold)',background:'linear-gradient(145deg,rgba(201,168,76,.14),rgba(168,230,207,.06))',border:'1px solid rgba(201,168,76,.18)',flexShrink:0}}>{e}</span>
                  <div>
                    <p className="label-tag" style={{marginBottom:'3px',fontSize:'9px'}}>{t}</p>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.7)'}}>{v}</p>
                  </div>
                </a>
              ))}
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(250,250,245,.2)',marginTop:'16px',letterSpacing:'.06em'}}>Mon-Sat, 9am-6pm IST - 2-4hr WhatsApp reply</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{marginTop:isMobile?'46px':'72px'}}>
          <div style={{textAlign:'center',marginBottom:isMobile?'28px':'40px'}}>
            <p className="label-tag" style={{marginBottom:'12px'}}>ANSWERS</p>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(32px,4vw,50px)',color:'var(--cream)'}}>Frequently Asked Questions</h2>
          </div>
          <div style={{maxWidth:'720px',margin:'0 auto'}}>
            {FAQS.map((faq,i)=>(
              <div key={i} style={{borderBottom:'1px solid rgba(168,230,207,.06)'}}>
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)}
                  style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:isMobile?'15px 0':'18px 0',background:'none',border:'none',cursor:'none',textAlign:'left',gap:'12px',transition:'color .15s',color:'rgba(250,250,245,.55)'}}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--cream)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(250,250,245,.55)'}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:'400',fontSize:'15px',color:'inherit'}}>{faq.q}</span>
                  <span style={{flexShrink:0,transform:openFaq===i?'rotate(180deg)':'rotate(0)',transition:'transform .28s',color:'rgba(250,250,245,.2)'}}><ChevDownIcon/></span>
                </button>
                <div className={`accordion-body${openFaq===i?' open':''}`} style={{paddingBottom:openFaq===i?'18px':'0'}}>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.38)',lineHeight:'1.9'}}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  WISHLIST PAGE
// =================================================================
function WishlistPage({ navigate }) {
  const { wishlist, toggleWishlist, addToCart } = useApp();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  return (
    <div style={{ background:'var(--ink)', minHeight:'100vh', paddingTop:'70px' }}>
      {/* Header */}
      <div style={{ background:'var(--ink2)', borderBottom:'1px solid rgba(168,230,207,.06)', padding:isMobile?'28px 20px 24px':'48px 48px 40px' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
          <p className="label-tag" style={{ marginBottom:'12px', letterSpacing:'.3em' }}>YOUR COLLECTION</p>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:'300', fontSize:isMobile?'clamp(38px,11vw,50px)':'clamp(40px,6vw,72px)', color:'var(--cream)', lineHeight:'1' }}>
              Wishlist
            </h1>
            {wishlist.length > 0 && (
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'12px', color:'rgba(250,250,245,.3)', letterSpacing:'.1em' }}>
                {wishlist.length} {wishlist.length === 1 ? 'piece' : 'pieces'} saved
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:isMobile?'24px 20px 40px':'48px' }}>
        {wishlist.length === 0 ? (
          /* Empty state */
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', textAlign:'center', gap:'20px' }}>
            <div style={{ width:'88px', height:'88px', borderRadius:'50%', border:'1px solid rgba(168,230,207,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(168,230,207,.35)" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'32px', color:'rgba(250,250,245,.55)', marginBottom:'10px' }}>Your wishlist is empty</h2>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'14px', color:'rgba(250,250,245,.28)', marginBottom:'28px' }}>
                Save pieces you love by tapping the heart icon on any product.
              </p>
              <button className="btn-luxury" style={{ fontSize:'12px', letterSpacing:'.12em' }} onClick={() => navigate('collections')}>
                BROWSE COLLECTIONS
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Product grid */}
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,minmax(0,1fr))':'repeat(auto-fill,minmax(260px,1fr))', gap:isMobile?'12px':'20px', marginBottom:'40px' }}>
              {wishlist.map((product, i) => (
                <div key={product.wishKey || product.id} className="pcard fade-up" style={{ animationDelay:`${i*.06}s`, fontFamily:"'DM Sans',sans-serif" }}>
                  {/* Image */}
                  <div style={{ position:'relative', aspectRatio:'1/1', overflow:'hidden', background:'var(--ink3)' }}>
                    <img
                      src={getOptimizedImageUrl(product.images[0], { width: 520, height: 520, mode: 'cover' })} alt={product.name}
                      className="pcard-img"
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', cursor:'none' }}
                      loading="lazy" decoding="async"
                      onClick={() => navigate('product', { slug: product.slug })}
                    />
                    {/* Remove from wishlist */}
                    <button
                      aria-label="Remove from wishlist"
                      onClick={() => toggleWishlist(product, product.selectedVariantId ? { id: product.selectedVariantId, colorName: product.selectedColorName, colorHex: product.selectedColorHex, images: product.images, price: product.price, originalPrice: product.originalPrice, inStock: product.inStock } : null)}
                      title="Remove from wishlist"
                      style={{ position:'absolute', top:'12px', right:'12px', width:'36px', height:'36px', borderRadius:'50%',
                        background:'rgba(10,13,10,0.75)', backdropFilter:'blur(8px)',
                        border:'1px solid rgba(201,168,76,.4)', cursor:'none',
                        display:'flex', alignItems:'center', justifyContent:'center', zIndex:2,
                        transition:'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(201,168,76,.15)'; e.currentTarget.style.transform='scale(1.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(10,13,10,0.75)'; e.currentTarget.style.transform='scale(1)'; }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#C9A84C" stroke="#C9A84C" strokeWidth="1.8">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                    {/* Add to cart overlay */}
                    <div className="pcard-cta">
                      <button
                        className="btn-luxury"
                        style={{ width:'100%', borderRadius:'0', justifyContent:'center', padding:'14px', letterSpacing:'.1em', fontSize:'12px' }}
                        onClick={e => { e.stopPropagation(); addToCart(product, null, 1, product.selectedVariantId ? { id: product.selectedVariantId, colorName: product.selectedColorName, colorHex: product.selectedColorHex, images: product.images, price: product.price, originalPrice: product.originalPrice, inStock: product.inStock } : null); }}
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ padding:'18px 18px 20px', position:'relative', zIndex:1, cursor:'none' }}
                    onClick={() => navigate('product', { slug: product.slug })}>
                    <p className="label-tag" style={{ marginBottom:'5px' }}>{product.category}</p>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'20px', color:'rgba(250,250,245,.88)', lineHeight:'1.2', marginBottom:'10px' }}>{product.name}</h3>
                    {product.selectedColorName && <p style={{fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'var(--mint)',opacity:.7,marginBottom:'8px'}}>Color: {product.selectedColorName}</p>}
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'14px', color:'var(--gold)', fontWeight:'500' }}>{formatPrice(product.price)}</span>
                      {product.originalPrice && (
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'12px', color:'rgba(250,250,245,.25)', textDecoration:'line-through' }}>{formatPrice(product.originalPrice)}</span>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:'2px' }}>
                      {[1,2,3,4,5].map(s => <StarIcon key={s} filled={s <= Math.round(product.rating)}/>)}
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'10px', color:'rgba(250,250,245,.25)', marginLeft:'6px' }}>({product.reviewCount})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom actions */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'24px', borderTop:'1px solid rgba(168,230,207,.06)', flexWrap:'wrap', gap:'16px', flexDirection:isMobile?'column':'row' }}>
              <button className="btn-ghost-luxury" style={{ fontSize:'11px', letterSpacing:'.12em', padding:'12px 24px', width:isMobile?'100%':'auto', justifyContent:'center' }} onClick={() => navigate('collections')}>
                &lt;- CONTINUE SHOPPING
              </button>
              <button className="btn-luxury" style={{ fontSize:'11px', letterSpacing:'.12em', padding:'12px 28px', width:isMobile?'100%':'auto', justifyContent:'center' }}
                onClick={() => { wishlist.forEach(p => addToCart(p, null, 1, p.selectedVariantId ? { id: p.selectedVariantId, colorName: p.selectedColorName, colorHex: p.selectedColorHex, images: p.images, price: p.price, originalPrice: p.originalPrice, inStock: p.inStock } : null)); navigate('cart'); }}>
                ADD ALL TO CART
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =================================================================
//  404
// =================================================================
function NotFoundPage({ navigate }) {
  return (
    <div style={{minHeight:'100vh',background:'var(--ink)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px',textAlign:'center',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(30,58,15,.2) 0%,transparent 60%)',pointerEvents:'none'}}/>
      <div className="float-slow" style={{marginBottom:'24px',position:'relative'}}>
        <div style={{width:'100px',height:'100px',borderRadius:'50%',border:'1px solid rgba(168,230,207,.12)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:'60px',height:'60px',background:'radial-gradient(circle,var(--mint),var(--dg))',borderRadius:'50%',opacity:.7,boxShadow:'var(--glow-mint)'}}/>
        </div>
      </div>
      <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(100px,18vw,200px)',color:'rgba(250,250,245,.04)',lineHeight:'1',letterSpacing:'-.04em',position:'absolute',userSelect:'none'}}>404</h1>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(28px,4vw,42px)',color:'rgba(250,250,245,.65)',marginBottom:'12px',position:'relative',zIndex:1}}>Page Not Found</h2>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'15px',color:'rgba(250,250,245,.3)',marginBottom:'36px',position:'relative',zIndex:1}}>This jewel seems to have gone missing from our collection.</p>
      <div style={{display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center',position:'relative',zIndex:1}}>
        <button className="btn-luxury" style={{fontSize:'12px',letterSpacing:'.12em'}} onClick={()=>navigate('home')}>&lt;- HOME</button>
        <button className="btn-ghost-luxury" style={{fontSize:'12px',letterSpacing:'.12em'}} onClick={()=>navigate('collections')}>COLLECTIONS</button>
        <button className="btn-ghost-luxury" style={{fontSize:'12px',letterSpacing:'.12em'}} onClick={()=>navigate('contact')}>CONTACT</button>
      </div>
    </div>
  );
}

function CatalogLoadingScreen({ label = 'Loading catalog' }) {
  return (
    <div style={{minHeight:'100vh',background:'var(--ink)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px',textAlign:'center'}}>
      <div className="glow-pulse" style={{width:'72px',height:'72px',borderRadius:'50%',background:'radial-gradient(circle,rgba(168,230,207,.22) 0%,rgba(168,230,207,.04) 60%,transparent 75%)',marginBottom:'20px'}}/>
      <p className="label-tag" style={{marginBottom:'12px'}}>SANITY CMS</p>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(28px,4vw,40px)',color:'var(--cream)',marginBottom:'10px'}}>{label}</h2>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:'14px',color:'rgba(250,250,245,.35)'}}>Fetching the latest published catalog data.</p>
    </div>
  );
}

// =================================================================
//  PRIVACY POLICY PAGE
// =================================================================
function PrivacyPolicy({ navigate }) {
  return (
    <div style={{background:'var(--ink)'}}>
      {/* Hero */}
      <div style={{minHeight:'40vh',display:'flex',alignItems:'flex-end',padding:'120px 48px 56px',background:'var(--ink)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'20%',right:'8%',width:'400px',height:'400px',background:'radial-gradient(circle,rgba(168,230,207,.05) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <p className="label-tag fade-up" style={{marginBottom:'14px',letterSpacing:'.3em'}}>YOUR PRIVACY</p>
          <h1 className="fade-up-1" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:'clamp(52px,8vw,96px)',color:'var(--cream)',lineHeight:'.9'}}>Privacy Policy</h1>
        </div>
      </div>

      <div style={{maxWidth:'960px',margin:'0 auto',padding:'60px 48px'}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",color:'rgba(250,250,245,.6)',lineHeight:'1.9',fontSize:'15px'}}>
          <p style={{marginBottom:'32px',color:'rgba(250,250,245,.45)',fontSize:'16px'}}>
            <em>Last Updated: March 2026</em>
          </p>

          {/* Section 1 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>1. Introduction</h2>
          <p style={{marginBottom:'16px'}}>
            Urban Jewells ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at urbanjewells.in and use our services.
          </p>
          <p style={{marginBottom:'24px'}}>
            Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our site.
          </p>

          {/* Section 2 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>2. Information We Collect</h2>
          <p style={{marginBottom:'12px',fontWeight:'500'}}>Personal Information:</p>
          <p style={{marginBottom:'16px'}}>We collect information you voluntarily provide, including:
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li>Full name</li>
              <li>Email address</li>
              <li>WhatsApp phone number</li>
              <li>Delivery address</li>
              <li>Order history and preferences</li>
            </ul>
          </p>
          <p style={{marginBottom:'12px',fontWeight:'500',marginTop:'18px'}}>Automatic Information:</p>
          <p style={{marginBottom:'24px'}}>When you visit our site, we may collect:
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>Referral source</li>
            </ul>
          </p>

          {/* Section 3 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>3. How We Use Your Information</h2>
          <p style={{marginBottom:'16px'}}>We use the information we collect to:
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li>Process and fulfill your orders</li>
              <li>Communicate with you via WhatsApp and email</li>
              <li>Improve our products and services</li>
              <li>Personalize your shopping experience</li>
              <li>Send order updates and confirmations</li>
              <li>Respond to your inquiries</li>
              <li>Comply with legal obligations</li>
            </ul>
          </p>

          {/* Section 4 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>4. Data Security</h2>
          <p style={{marginBottom:'24px'}}>
            Urban Jewells takes your data security seriously. We implement industry-standard security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
          </p>

          {/* Section 5 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>5. WhatsApp Communications</h2>
          <p style={{marginBottom:'24px'}}>
            By providing your WhatsApp number, you consent to receive order confirmations, payment details, shipping updates, and customer service communications via WhatsApp. We respect your privacy and will not share your number with third parties without consent.
          </p>

          {/* Section 6 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>6. Third-Party Links</h2>
          <p style={{marginBottom:'24px'}}>
            Our website may contain links to third-party websites. This Privacy Policy does not apply to external sites. We encourage you to review the privacy policies of any linked sites before providing your information.
          </p>

          {/* Section 7 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>7. Your Rights</h2>
          <p style={{marginBottom:'16px'}}>You have the right to:
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of certain communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </p>
          <p style={{marginBottom:'24px',marginTop:'16px'}}>
            To exercise these rights, please contact us at hello@urbanjewells.in or via WhatsApp at +91 73512 57315.
          </p>

          {/* Section 8 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>8. Cookies</h2>
          <p style={{marginBottom:'24px'}}>
            Our website may use cookies to enhance your browsing experience. A cookie is a small data file stored on your device. You can control cookie settings through your browser preferences. Disabling cookies may affect some features of our site.
          </p>

          {/* Section 9 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>9. Data Retention</h2>
          <p style={{marginBottom:'24px'}}>
            We retain your personal information for as long as necessary to:
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li>Fulfill the purposes for which we collected it</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
          </p>
          <p style={{marginTop:'16px',marginBottom:'24px'}}>
            After this period, we will securely delete or anonymize your information.
          </p>

          {/* Section 10 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>10. Changes to This Policy</h2>
          <p style={{marginBottom:'24px'}}>
            Urban Jewells reserves the right to modify this Privacy Policy at any time. Changes will be effective immediately upon posting to the website. We encourage you to review this policy periodically to stay informed about how we protect your information.
          </p>

          {/* Section 11 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>11. Contact Us</h2>
          <p style={{marginBottom:'24px'}}>
            If you have questions about this Privacy Policy, your information, or our privacy practices, please contact us:
          </p>
          <div style={{background:'rgba(168,230,207,.04)',border:'1px solid rgba(168,230,207,.1)',borderRadius:'8px',padding:'24px',marginBottom:'24px'}}>
            <p style={{marginBottom:'12px'}}><strong>Email:</strong> hello@urbanjewells.in</p>
            <p style={{marginBottom:'12px'}}><strong>WhatsApp:</strong> +91 73512 57315</p>
            <p style={{marginBottom:'0'}}><strong>Hours:</strong> Monday-Saturday, 9am-6pm IST</p>
          </div>

          {/* Section 12 */}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>12. Compliance</h2>
          <p style={{marginBottom:'24px'}}>
            Urban Jewells complies with applicable data protection regulations including the Information Technology Act, 2000 and other relevant privacy laws. We are committed to maintaining ethical standards in data handling and transparency with our customers.
          </p>

          {/* Footer section */}
          <div style={{marginTop:'56px',paddingTop:'28px',borderTop:'1px solid rgba(168,230,207,.06)',textAlign:'center'}}>
            <p style={{fontSize:'13px',color:'rgba(250,250,245,.25)',marginBottom:'20px'}}>
              (c) 2026 Urban Jewells. All rights reserved.
            </p>
            <button onClick={()=>navigate('home')} style={{background:'none',border:'none',cursor:'none',fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(168,230,207,.4)',letterSpacing:'.12em',transition:'color .2s',textDecoration:'none'}} onMouseEnter={e=>e.target.style.color='var(--mint)'} onMouseLeave={e=>e.target.style.color='rgba(168,230,207,.4)'}>
              &lt;- BACK HOME
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  SHIPPING PAGE
// =================================================================
function ShippingPage({ navigate }) {
  return (
    <div style={{background:'var(--ink)'}}>
      <div style={{minHeight:'40vh',display:'flex',alignItems:'flex-end',padding:'120px 48px 56px',background:'var(--ink)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'20%',right:'8%',width:'400px',height:'400px',background:'radial-gradient(circle,rgba(168,230,207,.05) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <p className="label-tag fade-up" style={{marginBottom:'14px',letterSpacing:'.3em'}}>GETTING YOUR ORDER</p>
          <h1 className="fade-up-1" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:'clamp(52px,8vw,96px)',color:'var(--cream)',lineHeight:'.9'}}>Shipping Information</h1>
        </div>
      </div>

      <div style={{maxWidth:'960px',margin:'0 auto',padding:'60px 48px'}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",color:'rgba(250,250,245,.6)',lineHeight:'1.9',fontSize:'15px'}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'0',marginBottom:'18px'}}>Shipping Methods & Timelines</h2>
          <p style={{marginBottom:'24px'}}>We ship to customers across India and internationally. All our orders are carefully packaged to ensure your jewellery arrives in perfect condition.</p>

          <div style={{background:'rgba(168,230,207,.04)',border:'1px solid rgba(168,230,207,.1)',borderRadius:'8px',padding:'24px',marginBottom:'32px'}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',color:'var(--mint)',marginBottom:'16px'}}>Standard Shipping (India)</h3>
            <p style={{marginBottom:'12px'}}><strong>Delivery Time:</strong> 5-8 business days</p>
            <p style={{marginBottom:'0'}}><strong>Cost:</strong> FREE on orders over INR 2000 | INR 99 for orders under INR 2000</p>
          </div>

          <div style={{background:'rgba(168,230,207,.04)',border:'1px solid rgba(168,230,207,.1)',borderRadius:'8px',padding:'24px',marginBottom:'32px'}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',color:'var(--mint)',marginBottom:'16px'}}>Express Shipping (Select Metros)</h3>
            <p style={{marginBottom:'12px'}}><strong>Delivery Time:</strong> 2-3 business days</p>
            <p style={{marginBottom:'0'}}><strong>Cost:</strong> INR 249 (available for select pincodes)</p>
          </div>

          <div style={{background:'rgba(168,230,207,.04)',border:'1px solid rgba(168,230,207,.1)',borderRadius:'8px',padding:'24px',marginBottom:'32px'}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'22px',color:'var(--mint)',marginBottom:'16px'}}>International Shipping</h3>
            <p style={{marginBottom:'12px'}}><strong>Delivery Time:</strong> 8-15 business days</p>
            <p style={{marginBottom:'0'}}><strong>Cost:</strong> Calculated at checkout based on destination</p>
          </div>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--cream)',marginTop:'48px',marginBottom:'18px'}}>Order Processing</h2>
          <p style={{marginBottom:'16px'}}>Once you place an order:
            <ol style={{marginTop:'8px',marginLeft:'24px',marginBottom:'24px'}}>
              <li style={{marginBottom:'8px'}}>We'll confirm your order via WhatsApp within 2-4 hours</li>
              <li style={{marginBottom:'8px'}}>We'll share payment details securely</li>
              <li style={{marginBottom:'8px'}}>Once payment is received, we prepare your order for dispatch</li>
              <li style={{marginBottom:'8px'}}>You'll receive a tracking number via WhatsApp</li>
              <li>We'll keep you updated throughout the delivery process</li>
            </ol>
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--cream)',marginTop:'48px',marginBottom:'18px'}}>Tracking Your Order</h2>
          <p style={{marginBottom:'24px'}}>All orders include a tracking number. You can use this to track your shipment in real-time through our courier partner's portal. We'll also send you tracking updates via WhatsApp.</p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--cream)',marginTop:'48px',marginBottom:'18px'}}>Packaging</h2>
          <p style={{marginBottom:'24px'}}>Every Urban Jewells piece arrives in our signature packaging - thoughtfully designed and gift-ready. Your order includes:
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li>Premium gift box with branded wrapping</li>
              <li>Care instruction card</li>
              <li>Jewellery care pouch</li>
              <li>Personalized thank-you note (optional)</li>
            </ul>
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--cream)',marginTop:'48px',marginBottom:'18px'}}>Damaged or Lost Items</h2>
          <p style={{marginBottom:'16px'}}>If your order arrives damaged or is lost in transit:
            <ul style={{marginTop:'8px',marginLeft:'24px',marginBottom:'24px'}}>
              <li>Contact us within 48 hours of delivery with photos</li>
              <li>We'll file a claim with the courier immediately</li>
              <li>A replacement or refund will be issued once the claim is settled</li>
            </ul>
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--cream)',marginTop:'48px',marginBottom:'18px'}}>Contact Us for Shipping Questions</h2>
          <div style={{background:'rgba(168,230,207,.04)',border:'1px solid rgba(168,230,207,.1)',borderRadius:'8px',padding:'24px',marginBottom:'48px'}}>
            <p style={{marginBottom:'12px'}}><strong>WhatsApp:</strong> +91 73512 57315 (fastest response)</p>
            <p style={{marginBottom:'0'}}><strong>Email:</strong> hello@urbanjewells.in</p>
          </div>

          <div style={{marginTop:'56px',paddingTop:'28px',borderTop:'1px solid rgba(168,230,207,.06)',textAlign:'center'}}>
            <button onClick={()=>navigate('home')} style={{background:'none',border:'none',cursor:'none',fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(168,230,207,.4)',letterSpacing:'.12em',transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='var(--mint)'} onMouseLeave={e=>e.target.style.color='rgba(168,230,207,.4)'}>
              &lt;- BACK HOME
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  RETURNS PAGE
// =================================================================
function ReturnsPage({ navigate }) {
  return (
    <div style={{background:'var(--ink)'}}>
      <div style={{minHeight:'40vh',display:'flex',alignItems:'flex-end',padding:'120px 48px 56px',background:'var(--ink)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'20%',right:'8%',width:'400px',height:'400px',background:'radial-gradient(circle,rgba(168,230,207,.05) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <p className="label-tag fade-up" style={{marginBottom:'14px',letterSpacing:'.3em'}}>FINAL SALE</p>
          <h1 className="fade-up-1" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:'clamp(52px,8vw,96px)',color:'var(--cream)',lineHeight:'.9'}}>Returns & Exchanges</h1>
        </div>
      </div>

      <div style={{maxWidth:'960px',margin:'0 auto',padding:'60px 48px'}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",color:'rgba(250,250,245,.6)',lineHeight:'1.9',fontSize:'15px'}}>
          <div style={{background:'rgba(220,38,38,.12)',border:'2px solid rgba(220,38,38,.4)',borderRadius:'8px',padding:'32px',marginBottom:'48px'}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'#F87171',marginTop:'0',marginBottom:'16px'}}>No Returns or Exchanges</h2>
            <p style={{fontSize:'16px',color:'rgba(250,250,245,.7)',marginBottom:'0'}}>
              <strong>All sales are final. No returns or exchanges are accepted under any circumstances.</strong>
            </p>
          </div>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'0',marginBottom:'18px'}}>Our Policy</h2>
          <p style={{marginBottom:'24px'}}>
            Urban Jewells operates on a strict <strong>no returns, no exchanges</strong> policy. Once an order is placed and confirmed, it is considered final and cannot be returned, exchanged, or refunded under any circumstances.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--mint)',marginTop:'40px',marginBottom:'18px'}}>What This Means</h2>
          <p style={{marginBottom:'24px'}}>
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li style={{marginBottom:'10px'}}>Once you submit your order via WhatsApp, you cannot cancel or change it</li>
              <li style={{marginBottom:'10px'}}>No refunds are provided, regardless of reason</li>
              <li style={{marginBottom:'10px'}}>No exchanges for different sizes, colors, or products</li>
              <li style={{marginBottom:'10px'}}>No store credit or account credits</li>
              <li style={{marginBottom:'10px'}}>No exceptions for change of mind, personal preference, or style choices</li>
            </ul>
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--mint)',marginTop:'40px',marginBottom:'18px'}}>Exceptions: Defective or Damaged Items Only</h2>
          <p style={{marginBottom:'24px'}}>
            The <strong>only</strong> circumstance under which we will provide a replacement is if your item arrives:
          </p>
          <p style={{marginBottom:'24px'}}>
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li style={{marginBottom:'10px'}}>Visibly damaged or broken due to shipping</li>
              <li style={{marginBottom:'10px'}}>Defective with manufacturing faults</li>
              <li style={{marginBottom:'10px'}}>Significantly different from the product images or description</li>
            </ul>
          </p>
          <p style={{marginBottom:'24px'}}>
            <strong>Important:</strong> You must report defects <strong>within 48 hours of delivery</strong> with clear video evidence of parcel opening and photo evidence. Normal wear after receipt, discoloration, or personal dissatisfaction do not qualify as defects.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--mint)',marginTop:'40px',marginBottom:'18px'}}>Why We Have This Policy</h2>
          <p style={{marginBottom:'24px'}}>
            Urban Jewells pieces are handcrafted, customized orders. Each item is made specifically for you with care and attention to detail. Once an order is confirmed and production begins, the item cannot be resold or restocked. This policy allows us to maintain:
          </p>
          <p style={{marginBottom:'24px'}}>
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li style={{marginBottom:'8px'}}>Ethical practices with artisans</li>
              <li style={{marginBottom:'8px'}}>Fair pricing for handcrafted luxury</li>
              <li style={{marginBottom:'8px'}}>Sustainable production</li>
              <li style={{marginBottom:'8px'}}>Quality assurance throughout the creation process</li>
            </ul>
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--mint)',marginTop:'40px',marginBottom:'18px'}}>Before You Order</h2>
          <p style={{marginBottom:'24px'}}>
            We strongly recommend you:
          </p>
          <p style={{marginBottom:'24px'}}>
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li style={{marginBottom:'10px'}}><strong>Review product images carefully</strong> from multiple angles</li>
              <li style={{marginBottom:'10px'}}><strong>Read descriptions thoroughly</strong> including materials, dimensions, and finishes</li>
              <li style={{marginBottom:'10px'}}><strong>Check sizing guides</strong> if applicable (especially for rings and bracelets)</li>
              <li style={{marginBottom:'10px'}}><strong>Ask questions via WhatsApp</strong> before ordering if you have any doubts</li>
              <li style={{marginBottom:'10px'}}><strong>Confirm all details</strong> when we reach out for order confirmation</li>
              <li style={{marginBottom:'10px'}}><strong>Request custom specifications</strong> if needed before payment</li>
            </ul>
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--mint)',marginTop:'40px',marginBottom:'18px'}}>Our Commitment to Quality</h2>
          <p style={{marginBottom:'24px'}}>
            While we do not accept returns, we are committed to ensuring every piece meets our exacting standards before it ships. Each item undergoes rigorous quality checks. If there is any defect or concern, we will catch it before dispatch. Your satisfaction with the craftsmanship and quality of your Urban Jewells piece is guaranteed - but only if it arrives as intended.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--mint)',marginTop:'40px',marginBottom:'18px'}}>Defect Reporting Process</h2>
          <p style={{marginBottom:'24px'}}>
            If your item arrives damaged or defective:
          </p>
          <p style={{marginBottom:'24px'}}>
            <ol style={{marginTop:'8px',marginLeft:'24px',marginBottom:'0'}}>
              <li style={{marginBottom:'10px'}}>Contact us <strong>within 48 hours of delivery</strong> via WhatsApp or email</li>
              <li style={{marginBottom:'10px'}}>Provide video of opening the parcel and the defects item inside it</li>
              <li style={{marginBottom:'10px'}}>Provide 3-4 clear, detailed photos showing the defect</li>
              <li style={{marginBottom:'10px'}}>We will assess the damage and verify it's a manufacturing defect</li>
              <li style={{marginBottom:'10px'}}>If approved, we will send a replacement at no cost</li>
              <li>A prepaid return label will be provided for the damaged item</li>
            </ol>
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--mint)',marginTop:'40px',marginBottom:'18px'}}>Lost or Missing Packages</h2>
          <p style={{marginBottom:'24px'}}>
            If a package is lost in transit or does not arrive:
          </p>
          <p style={{marginBottom:'24px'}}>
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li style={{marginBottom:'10px'}}>Report the issue immediately with your order number and tracking ID</li>
              <li style={{marginBottom:'10px'}}>We will file a claim with the courier on your behalf</li>
              <li style={{marginBottom:'10px'}}>Once the carrier settles the claim, we will provide a replacement or full refund</li>
              <li>This process can take 30-60 days depending on the courier</li>
            </ul>
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--mint)',marginTop:'40px',marginBottom:'18px'}}>Cancellations</h2>
          <p style={{marginBottom:'24px'}}>
            <strong>Orders cannot be cancelled after confirmation.</strong>
          </p>
          <p style={{marginBottom:'24px'}}>
            Once you place an order and we confirm it via WhatsApp, production begins immediately and the order cannot be cancelled. If you change your mind before we send the confirmation message, contact us immediately via WhatsApp, but cancellations after confirmation are not possible.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'48px',marginBottom:'18px'}}>Contact Us</h2>
          <div style={{background:'rgba(168,230,207,.04)',border:'1px solid rgba(168,230,207,.1)',borderRadius:'8px',padding:'24px',marginBottom:'48px'}}>
            <p style={{marginBottom:'12px'}}>
              If you have any questions about our no returns policy before placing your order, please reach out:
            </p>
            <p style={{marginBottom:'12px'}}><strong>WhatsApp:</strong> +91 73512 57315 (fastest response)</p>
            <p style={{marginBottom:'0'}}><strong>Email:</strong> hello@urbanjewells.in</p>
          </div>

          <div style={{background:'rgba(30,58,15,.15)',border:'1px solid rgba(168,230,207,.12)',borderRadius:'8px',padding:'28px',marginBottom:'48px'}}>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'18px',color:'var(--mint)',marginTop:'0',marginBottom:'10px'}}>
              OK We're Here to Help
            </p>
            <p style={{marginBottom:'0'}}>
              If you're unsure about any aspect of a product before ordering, our team is happy to help. We offer detailed consultations via WhatsApp to ensure you're 100% confident in your purchase before you commit.
            </p>
          </div>

          <div style={{marginTop:'56px',paddingTop:'28px',borderTop:'1px solid rgba(168,230,207,.06)',textAlign:'center'}}>
            <button onClick={()=>navigate('home')} style={{background:'none',border:'none',cursor:'none',fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(168,230,207,.4)',letterSpacing:'.12em',transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='var(--mint)'} onMouseLeave={e=>e.target.style.color='rgba(168,230,207,.4)'}>
              &lt;- BACK HOME
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  TERMS OF SERVICE PAGE
// =================================================================
function TermsPage({ navigate }) {
  return (
    <div style={{background:'var(--ink)'}}>
      <div style={{minHeight:'40vh',display:'flex',alignItems:'flex-end',padding:'120px 48px 56px',background:'var(--ink)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'20%',right:'8%',width:'400px',height:'400px',background:'radial-gradient(circle,rgba(168,230,207,.05) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1}}>
          <p className="label-tag fade-up" style={{marginBottom:'14px',letterSpacing:'.3em'}}>THE FINE PRINT</p>
          <h1 className="fade-up-1" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:'300',fontSize:'clamp(52px,8vw,96px)',color:'var(--cream)',lineHeight:'.9'}}>Terms of Service</h1>
        </div>
      </div>

      <div style={{maxWidth:'960px',margin:'0 auto',padding:'60px 48px'}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",color:'rgba(250,250,245,.6)',lineHeight:'1.9',fontSize:'15px'}}>
          <p style={{marginBottom:'32px',color:'rgba(250,250,245,.45)',fontSize:'16px'}}>
            <em>Last Updated: March 2026</em>
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'0',marginBottom:'18px'}}>1. Acceptance of Terms</h2>
          <p style={{marginBottom:'24px'}}>
            By accessing and using the Urban Jewells website and purchasing our products, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>2. Use License</h2>
          <p style={{marginBottom:'24px'}}>
            Permission is granted to temporarily download one copy of the materials (information or software) on Urban Jewells' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            <ul style={{marginTop:'8px',marginLeft:'24px'}}>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer, disassemble, or hack any cryptographic features</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>3. Disclaimer</h2>
          <p style={{marginBottom:'24px'}}>
            The materials on Urban Jewells' website are provided on an 'as is' basis. Urban Jewells makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>4. Limitations</h2>
          <p style={{marginBottom:'24px'}}>
            In no event shall Urban Jewells or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Urban Jewells' website, even if Urban Jewells or an authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>5. Product Information</h2>
          <p style={{marginBottom:'24px'}}>
            We strive to provide accurate descriptions and images of our products. However, we do not warrant that product descriptions, pricing, or other content on our website is accurate, complete, reliable, current, or error-free. If a product offered by Urban Jewells is not as described, your sole remedy is to return it unused in original packaging for a refund.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>6. Pricing and Availability</h2>
          <p style={{marginBottom:'24px'}}>
            All prices are subject to change without notice and are valid only at the time of order. Urban Jewells reserves the right to refuse any order and to limit quantities available for purchase. Products are advertised as available unless otherwise stated.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>7. Orders and Payment</h2>
          <p style={{marginBottom:'24px'}}>
            By placing an order, you represent that you are at least 18 years of age and possess the legal right to enter into binding contracts. Urban Jewells reserves the right to refuse or cancel any order at any time. Payment must be received before orders are dispatched. We accept payments via UPI, bank transfer, and digital wallets as confirmed via WhatsApp.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>8. Intellectual Property Rights</h2>
          <p style={{marginBottom:'24px'}}>
            The materials on Urban Jewells' website, including but not limited to text, graphics, logos, images, product designs, and software, are the property of Urban Jewells or its content suppliers and are protected by international copyright laws. You are granted a limited license to view and print the materials for personal, non-commercial use only.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>9. Links to Third-Party Websites</h2>
          <p style={{marginBottom:'24px'}}>
            Urban Jewells has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Urban Jewells of the site. Use of any such linked website is at the user's own risk.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>10. Modifications</h2>
          <p style={{marginBottom:'24px'}}>
            Urban Jewells may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>11. Governing Laws</h2>
          <p style={{marginBottom:'24px'}}>
            These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in India.
          </p>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',color:'var(--cream)',marginTop:'40px',marginBottom:'18px'}}>12. Contact Information</h2>
          <div style={{background:'rgba(168,230,207,.04)',border:'1px solid rgba(168,230,207,.1)',borderRadius:'8px',padding:'24px',marginBottom:'48px'}}>
            <p style={{marginBottom:'12px'}}>If you have any questions about these Terms of Service, please contact us:</p>
            <p style={{marginBottom:'12px'}}><strong>Email:</strong> hello@urbanjewells.in</p>
            <p style={{marginBottom:'0'}}><strong>WhatsApp:</strong> +91 73512 57315</p>
          </div>

          <div style={{marginTop:'56px',paddingTop:'28px',borderTop:'1px solid rgba(168,230,207,.06)',textAlign:'center'}}>
            <button onClick={()=>navigate('home')} style={{background:'none',border:'none',cursor:'none',fontFamily:"'DM Mono',monospace",fontSize:'11px',color:'rgba(168,230,207,.4)',letterSpacing:'.12em',transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='var(--mint)'} onMouseLeave={e=>e.target.style.color='rgba(168,230,207,.4)'}>
              &lt;- BACK HOME
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
//  APP
// =================================================================
function routeToHash(page, params={}) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const queryString = query.toString();
  switch (page) {
    case 'home': return '#/';
    case 'all-pieces': return `#/all-pieces${queryString ? `?${queryString}` : ''}`;
    case 'categories': return '#/categories';
    case 'collections': return '#/collections';
    case 'collection-detail': return `#/collections/${encodeURIComponent(params.slug || '')}`;
    case 'category': return `#/categories/${encodeURIComponent(params.slug || '')}`;
    case 'product': return `#/product/${encodeURIComponent(params.slug || '')}`;
    case 'cart': return '#/cart';
    case 'about': return '#/about';
    case 'contact': return '#/contact';
    case 'wishlist': return '#/wishlist';
    case 'admin': return '#/admin';
    case 'privacy-policy': return '#/privacy-policy';
    case 'shipping': return '#/shipping';
    case 'returns': return '#/returns';
    case 'terms': return '#/terms';
    default: return '#/';
  }
}

function routeFromHash(hash) {
  const cleaned = (hash || '#/').replace(/^#/, '').replace(/^\/+/, '');
  const [pathPart, queryPart=''] = cleaned.split('?');
  const parts = pathPart ? pathPart.split('/').filter(Boolean) : [];
  const query = new URLSearchParams(queryPart);
  const safeDecode = value => {
    try { return decodeURIComponent(value || ''); } catch { return value || ''; }
  };

  if (parts.length === 0) return { page:'home', params:{} };

  if (parts[0] === 'all-pieces') return {
    page:'all-pieces',
    params:{
      category: query.get('category') || undefined,
      sort: query.get('sort') || undefined,
      collection: query.get('collection') || undefined,
      price: query.get('price') || undefined,
      stock: query.get('stock') || undefined,
      new: query.get('new') || undefined,
      sale: query.get('sale') || undefined,
    }
  };
  if (parts[0] === 'categories' && parts[1]) return { page:'category', params:{ slug:safeDecode(parts[1]) } };
  if (parts[0] === 'categories') return { page:'categories', params:{} };
  if (parts[0] === 'collections' && parts[1]) return { page:'collection-detail', params:{ slug:safeDecode(parts[1]) } };
  if (parts[0] === 'collections') return { page:'collections', params:{} };
  if (parts[0] === 'product' && parts[1]) return { page:'product', params:{ slug:safeDecode(parts[1]) } };
  if (parts[0] === 'cart') return { page:'cart', params:{} };
  if (parts[0] === 'about') return { page:'about', params:{} };
  if (parts[0] === 'contact') return { page:'contact', params:{} };
  if (parts[0] === 'wishlist') return { page:'wishlist', params:{} };
  if (parts[0] === 'admin') return { page:'admin', params:{} };
  if (parts[0] === 'privacy-policy') return { page:'privacy-policy', params:{} };
  if (parts[0] === 'shipping') return { page:'shipping', params:{} };
  if (parts[0] === 'returns') return { page:'returns', params:{} };
  if (parts[0] === 'terms') return { page:'terms', params:{} };

  return { page:'home', params:{} };
}

function RouteMetaManager({ page, params }) {
  const { products, collections, categories } = useApp();
  const meta = useMemo(
    () => buildMetaForRoute({ page, params, products, collections, categories }),
    [page, params, products, collections, categories]
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = meta.title;
    ensureMetaTag('meta[name="description"]', { name:'description', content:meta.description });
    ensureMetaTag('meta[name="robots"]', { name:'robots', content:meta.robots || 'index,follow' });
    ensureMetaTag('meta[property="og:title"]', { property:'og:title', content:meta.title });
    ensureMetaTag('meta[property="og:description"]', { property:'og:description', content:meta.description });
    ensureMetaTag('meta[property="og:type"]', { property:'og:type', content:meta.type });
    ensureMetaTag('meta[property="og:url"]', { property:'og:url', content:meta.url });
    ensureMetaTag('meta[property="og:image"]', {
      property:'og:image',
      content:getOptimizedImageUrl(meta.image, { width: 1200, height: 630, mode: 'cover', quality: 80 }),
    });
    ensureMetaTag('meta[name="twitter:card"]', { name:'twitter:card', content:'summary_large_image' });
    ensureMetaTag('meta[name="twitter:title"]', { name:'twitter:title', content:meta.title });
    ensureMetaTag('meta[name="twitter:description"]', { name:'twitter:description', content:meta.description });
    ensureMetaTag('meta[name="twitter:image"]', {
      name:'twitter:image',
      content:getOptimizedImageUrl(meta.image, { width: 1200, height: 630, mode: 'cover', quality: 80 }),
    });
    ensureLinkTag('link[rel="canonical"]', { rel:'canonical', href:meta.url });
  }, [meta]);

  return null;
}

export default function App() {
  const initialRoute = useMemo(() => (
    typeof window !== 'undefined' ? routeFromHash(window.location.hash) : { page:'home', params:{} }
  ), []);
  const [page, setPage] = useState(initialRoute.page);
  const [params, setParams] = useState(initialRoute.params);

  const navigate = useCallback((p, extra={}, options={}) => {
    const nextParams = extra || {};
    setPage(p);
    setParams(nextParams);
    if (typeof window !== 'undefined') {
      const currentIndex = window.history.state?.__urbanJewells ? (window.history.state.idx || 0) : 0;
      const nextIndex = options.replace ? currentIndex : currentIndex + 1;
      const nextState = { __urbanJewells:true, page:p, params:nextParams, idx:nextIndex };
      const nextHash = routeToHash(p, nextParams);
      if (options.replace) window.history.replaceState(nextState, '', nextHash);
      else window.history.pushState(nextState, '', nextHash);
      window.scrollTo({top:0,behavior:'smooth'});
    }
  }, []);

  const navigateBack = useCallback((fallbackPage='home', fallbackParams={}) => {
    if (typeof window === 'undefined') return;
    if (window.history.state?.__urbanJewells && (window.history.state.idx || 0) > 0) {
      window.history.back();
      return;
    }
    navigate(fallbackPage, fallbackParams, { replace:true });
  }, [navigate]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const currentRoute = routeFromHash(window.location.hash);
    setPage(currentRoute.page);
    setParams(currentRoute.params);
    window.history.replaceState(
      { __urbanJewells:true, page:currentRoute.page, params:currentRoute.params, idx:window.history.state?.__urbanJewells ? (window.history.state.idx || 0) : 0 },
      '',
      routeToHash(currentRoute.page, currentRoute.params)
    );

    const handlePopState = event => {
      const nextRoute = event.state?.__urbanJewells
        ? { page:event.state.page || 'home', params:event.state.params || {} }
        : routeFromHash(window.location.hash);
      setPage(nextRoute.page);
      setParams(nextRoute.params || {});
      window.scrollTo({ top:0, behavior:'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderPage = () => {
    switch(page) {
      case 'home': return <HomePage navigate={navigate}/>;
      case 'all-pieces': return <AllPiecesPage navigate={navigate} navigateBack={navigateBack} params={params}/>;
      case 'categories': return <CategoriesPage navigate={navigate} navigateBack={navigateBack}/>;
      case 'collections': return <CollectionsPage navigate={navigate} navigateBack={navigateBack}/>;
      case 'collection-detail': return <CollectionDetail slug={params.slug} navigate={navigate} navigateBack={navigateBack}/>;
      case 'category': return <CategoryPage slug={params.slug} navigate={navigate} navigateBack={navigateBack}/>;
      case 'product': return <ProductPage slug={params.slug} navigate={navigate} navigateBack={navigateBack}/>;
      case 'cart': return <CartPage navigate={navigate}/>;
      case 'about': return <AboutPage navigate={navigate} navigateBack={navigateBack}/>;
      case 'contact': return <ContactPage navigateBack={navigateBack}/>;
      case 'wishlist': return <WishlistPage navigate={navigate}/>;
      case 'admin': return <AdminPortalPage navigate={navigate}/>;
      case 'privacy-policy': return <PrivacyPolicy navigate={navigate}/>;
      case 'shipping': return <ShippingPage navigate={navigate}/>;
      case 'returns': return <ReturnsPage navigate={navigate}/>;
      case 'terms': return <TermsPage navigate={navigate}/>;
      default: return <NotFoundPage navigate={navigate}/>;
    }
  };

  return (
    <AppProvider>
      <RouteMetaManager page={page} params={params}/>
      <GlobalStyles/>
      <Cursor/>
      <ParticleCanvas/>
      <Header navigate={navigate} page={page}/>
      <main id="main" style={{position:'relative',zIndex:2}}>
        {renderPage()}
      </main>
      <Footer navigate={navigate}/>
      <SideCart navigate={navigate}/>
      <SearchModal navigate={navigate}/>
      <Toasts/>
      <BackToTop/>
    </AppProvider>
  );
}

