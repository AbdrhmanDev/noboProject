const GlobalStyle = () => (
  <style>{`
    :root {
      --color-bg: #000;
      --color-surface: #0d1728;
      --color-surface-elevated: #111827;
      --color-primary: #2b8cff;
      --color-primary-light: #60a5fa;
      --color-primary-deep: #4f6bff;
      --color-danger: #ff3d6b;
      --color-success: #17d9c4;
      --color-warning: #f5b800;
      --color-border: rgba(255,255,255,.08);
      --radius-panel: 1rem;
      --shadow-panel: 0 10px 30px rgba(0,0,0,.45), 0 0 25px rgba(43,140,255,.08);
    }

    .nobo-root { font-family: 'Cairo', 'Tajawal', sans-serif; }
    .nobo-root, .nobo-root * { box-sizing: border-box; }

    .font-tajawal { font-family: 'Tajawal', 'Cairo', sans-serif; }
    .font-kufi { font-family: 'Noto Kufi Arabic', 'Cairo', sans-serif; }

    .bg-space{
          position:relative;
          overflow-x:hidden;
          background:var(--color-bg);
          }
    .bg-stars{
            position:absolute;
            inset:0;
            opacity:1;
            background-image:
            radial-gradient(#fff 1.2px,transparent 1.2px),
            radial-gradient(#fff 1px,transparent 1px),
            radial-gradient(#bcd6ff 1.4px,transparent 1.4px),
            radial-gradient(#fff .8px,transparent .8px);
            background-size:
            120px 120px,
            200px 200px,
            280px 280px,
            360px 360px;
            background-position:
            0 0,
            40px 60px,
            130px 270px,
            70px 100px;
            animation:starTwinkle 3s ease-in-out infinite, starsMove 120s linear infinite;
            }
        .bg-stars::before{
              content:"";
              position:absolute;
              inset:0;
              background-image:
              radial-gradient(#ffd9a0 1.6px,transparent 1.6px),
              radial-gradient(#9fd8ff 1.1px,transparent 1.1px);
              background-size:
              500px 500px,
              700px 700px;
              animation:starTwinkle 4s ease-in-out infinite reverse;
              }
        @keyframes starsMove{
            from{
            transform:translateY(0);
            }
            to{
            transform:translateY(-500px);
            }
            }
        @keyframes starTwinkle{
            0%,100%{ opacity:.35; }
            50%{ opacity:1; }
            }
    .panel{
        background:
        linear-gradient(
        180deg,
        rgba(17,22,38,.90),
        rgba(8,11,20,.92)
        );
        backdrop-filter:blur(20px);
        border:1px solid var(--color-border);
        box-shadow:var(--shadow-panel);
        transition:.35s;
        }
    .panel:hover{
        transform:translateY(-4px);
        border-color:#2b8cff55;
        box-shadow:
        0 15px 45px rgba(0,0,0,.5),
        0 0 35px rgba(43,140,255,.18);
        }
        .glow-badge {
          background: rgba(15,20,38,0.7);
          border: 1px solid rgba(120,140,200,0.18);
          backdrop-filter: blur(6px);
        }
    .login-card{
          position:relative;
          overflow:hidden;
          background:var(--color-bg);
          border:2px solid var(--color-primary);
          border-radius:28px;
          box-shadow:
          0 0 20px rgba(43,140,255,.45),
          0 0 60px rgba(43,140,255,.25),
          0 0 60px rgba(255,61,107,.20);
          transition:.4s;
          }
          .login-card:hover{
          transform:translateY(-4px);
          border-color:var(--color-danger);
          box-shadow:
          0 0 25px rgba(43,140,255,.55),
          0 0 80px rgba(255,61,107,.35);
          }
        .login-card > .bg-stars { z-index:0; }
        .login-card > * { position:relative; z-index:1; }
        @keyframes borderGlow{
          0%{ background-position:0%; }
          100%{ background-position:400%; }
          }
        .input-dark{
            background:
            linear-gradient(
            180deg,
            rgba(255,255,255,.05),
            rgba(255,255,255,.02)
            );
            border:1px solid var(--color-border);
            box-shadow:
            inset 0 2px 8px rgba(0,0,0,.45);
            transition:.3s;
            }
        .input-dark:hover{
            border-color:#2b8cff66;
            }
        .input-dark:focus-within{
            border-color:var(--color-primary);
            box-shadow:
            0 0 20px rgba(43,140,255,.35);
            }
        .globe-ball {
          background:
            radial-gradient(circle at 38% 32%, rgba(120,180,255,0.35), transparent 45%),
            radial-gradient(circle at 60% 65%, rgba(30,60,120,0.5), transparent 55%),
            radial-gradient(circle at 50% 50%, #0c1638 0%, #060a1a 70%);
          border: 1px solid rgba(90,150,255,0.35);
          box-shadow: 0 0 90px rgba(43,140,255,0.35), inset 0 0 60px rgba(0,0,0,0.6);
        }
        .globe-ring {
          border: 1px solid rgba(120,160,255,0.18);
          border-radius: 999px;
        }
        @keyframes spin-slow { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes spin-slow-rev { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
        @keyframes pulse-dot { 0%,100% { opacity: .4; transform: scale(1);} 50% { opacity: 1; transform: scale(1.5);} }
        @keyframes float-y { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-6px);} }
        .spin-slow { animation: spin-slow 40s linear infinite; }
        .spin-slow-rev { animation: spin-slow-rev 60s linear infinite; }
        .pulse-dot { animation: pulse-dot 2.2s ease-in-out infinite; }
        .float-y { animation: float-y 5s ease-in-out infinite; }
        .brand-text {
          font-family: 'Tajawal', 'Cairo', sans-serif;
          font-weight: 900;
          background: linear-gradient(90deg,var(--color-danger),var(--color-warning),var(--color-primary));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .toggle-track { background: linear-gradient(90deg,var(--color-primary),#8b5cf6); }
        .toggle-thumb { transition: transform .2s ease; }
        .stat-card{
          background:
          linear-gradient(
          160deg,
          rgba(18,24,40,.95),
          rgba(9,12,22,.92)
          );
          border:1px solid var(--color-border);
          box-shadow:
          0 8px 25px rgba(0,0,0,.35);
          transition:.35s;
          }
          .stat-card:hover{
          transform:translateY(-5px);
          box-shadow:
          0 0 35px rgba(43,140,255,.15);
          }
        .side-nav-item:hover { background: rgba(43,140,255,0.08); }
        @keyframes float{
          0%,100%{ transform:translateY(0); }
          50%{ transform:translateY(-8px); }
          }
          .float{
          animation:float 6s ease-in-out infinite;
          }
          @keyframes pulseGlow{
          0%,100%{ box-shadow:0 0 20px rgba(43,140,255,.2); }
          50%{ box-shadow:0 0 45px rgba(43,140,255,.5); }
          }
          .pulse-glow{
          animation:pulseGlow 3s infinite;
          }
        .primary-btn{
          background:
          linear-gradient(
          90deg,
          var(--color-primary),
          var(--color-primary-deep)
          );
          box-shadow:
          0 0 25px rgba(43,140,255,.45);
          transition:.35s;
          }
        .primary-btn:hover{
          transform:translateY(-2px);
          box-shadow:
          0 0 45px rgba(43,140,255,.65);
          }
        .pos-product-card{
          border-color: rgba(148,163,184,.16);
          background: rgba(15,23,42,.92);
          color: #e2e8f0;
        }
        .pos-product-card .pos-sku-badge{
          background: rgba(15,23,42,.85);
          color: #cbd5e1;
        }
        .pos-card-box{
          border-color: rgba(255,255,255,.08);
          background: rgba(15,23,42,.65);
        }
        [data-theme="light"] .pos-product-card{
          border-color: rgba(148,163,184,.2);
          background: rgba(255,255,255,.95);
          color: #0f172a;
        }
        [data-theme="light"] .pos-product-card .pos-sku-badge{
          background: rgba(241,245,249,.95);
          color: #475569;
        }
        [data-theme="light"] .pos-card-box{
          border-color: rgba(15,23,42,.1);
          background: rgba(255,255,255,.95);
        }
    [data-theme="light"] .nobo-root { background: #f5f7ff; color: #111827; }
    [data-theme="light"] .bg-space { background: #eff2ff; }
    [data-theme="light"] .bg-stars { opacity: 0.15; }
    [data-theme="light"] .nobo-root aside { background: #f8fafc; border-color: rgba(15,23,42,.12); }
    [data-theme="light"] .nobo-root aside { background: #f8fafc !important; color: #111827; }
    [data-theme="light"] .nobo-root aside.text-white,
    [data-theme="light"] .nobo-root aside .text-white { color: #111827 !important; }
    [data-theme="light"] .nobo-root aside .text-gray-500 { color: #64748b !important; }
    [data-theme="light"] .nobo-root aside.bg-black,
    [data-theme="light"] .nobo-root aside .bg-black { background: #e2e8f0 !important; }
    [data-theme="light"] .nobo-root aside .bg-white\/5 { background: rgba(255,255,255,.9) !important; }
    [data-theme="light"] .nobo-root aside .border-white\/10 { border-color: rgba(15,23,42,.12) !important; }
    [data-theme="light"] .nobo-root aside .hover\:bg-blue-500\/10:hover { background: rgba(59,130,246,.08) !important; }
    [data-theme="light"] .nobo-root aside .hover\:border-white\/20:hover { border-color: rgba(15,23,42,.12) !important; }
    [data-theme="light"] .nobo-root aside .group:hover { background: rgba(59,130,246,.08); }
    [data-theme="light"] .nobo-root aside .text-gray-300 { color: #64748b !important; }
    [data-theme="light"] .nobo-root aside .bg-stars { opacity: 0.08; }
    [data-theme="light"] .panel,
    [data-theme="light"] .stat-card { background: rgba(255,255,255,.95); border-color: rgba(15,23,42,.08); box-shadow: 0 10px 25px rgba(15,23,42,.08); }
    [data-theme="light"] .input-dark { background: rgba(15,23,42,.05); border-color: rgba(15,23,42,.12); box-shadow: inset 0 2px 8px rgba(15,23,42,.04); }
    [data-theme="light"] .text-gray-400,
    [data-theme="light"] .text-gray-500,
    [data-theme="light"] .text-slate-400,
    [data-theme="light"] .text-slate-500,
    [data-theme="light"] .text-slate-300,
    [data-theme="light"] .text-slate-200 { color: #4b5563; }
    [data-theme="light"] .text-white { color: #111827; }
    [data-theme="light"] .border-white\/10 { border-color: rgba(15,23,42,.1); }
    [data-theme="light"] .border-white\/15 { border-color: rgba(15,23,42,.12); }
    [data-theme="light"] .border-white\/8 { border-color: rgba(15,23,42,.08); }
    [data-theme="light"] .bg-white\/5 { background: rgba(255,255,255,.85); }
    [data-theme="light"] .bg-white\/10 { background: rgba(255,255,255,.9); }
    [data-theme="light"] .bg-white\/25 { background: rgba(255,255,255,.92); }
    [data-theme="light"] .bg-white\/30 { background: rgba(255,255,255,.95); }
    [data-theme="light"] .bg-white\/\[0\.025\] { background: rgba(255,255,255,.95); }
    [data-theme="light"] .bg-white\/\[0\.035\] { background: rgba(255,255,255,.96); }
    [data-theme="light"] .bg-black { background: #f8fafc; }
    [data-theme="light"] .bg-black\/20 { background: rgba(15,23,42,.05); }
    [data-theme="light"] .bg-black\/50 { background: rgba(15,23,42,.1); }
    [data-theme="light"] .bg-\[\#0d1728\] { background: #f8fafc; }
    [data-theme="light"] .bg-\[\#0d1728\]\/95 { background: rgba(248,250,252,.95); }
    [data-theme="light"] .bg-\[\#0d1728\]\/80 { background: rgba(248,250,252,.9); }
    [data-theme="light"] .bg-\[\#111f36\] { background: #e5e7eb; }
    [data-theme="light"] .bg-\[\#0c1627\] { background: #eef2ff !important; }
    [data-theme="light"] .bg-\[\#0c1424\]\/85 { background: rgba(248,250,252,.85) !important; }
    [data-theme="light"] .bg-\[\#10182a\] { background: #e2e8f0 !important; }
    [data-theme="light"] .bg-\[\#10182a\]\/80 { background: rgba(226,232,240,.8) !important; }
    [data-theme="light"] .bg-\[\#010713\]\/75 { background: rgba(255,255,255,.9) !important; }
    [data-theme="light"] .bg-\[\#030713\]\/75 { background: rgba(255,255,255,.9) !important; }
    [data-theme="light"] .bg-\[\#0d1224\]\/95 { background: rgba(248,250,252,.95) !important; }
    [data-theme="light"] .bg-\[\#0d1224\]\/70 { background: rgba(248,250,252,.7) !important; }
    [data-theme="light"] .bg-\[\#111f36\] { background: #e5e7eb !important; }
    [data-theme="light"] .bg-\[\#0d1728\]\/95 { background: rgba(248,250,252,.95) !important; }
    [data-theme="light"] .bg-\[\#0d1728\]\/80 { background: rgba(248,250,252,.9) !important; }
    [data-theme="light"] .bg-\[\#0d1728\]\/10 { background: rgba(248,250,252,.9) !important; }
    [data-theme="light"] .border-black\/10 { border-color: rgba(15,23,42,.1) !important; }
    [data-theme="light"] .shadow-black\/20 { box-shadow: 0 10px 30px rgba(15,23,42,.12); }
    [data-theme="light"] .shadow-black\/15 { box-shadow: 0 10px 20px rgba(15,23,42,.08); }
    [data-theme="light"] .hover\:bg-white\/10:hover { background: rgba(15,23,42,.08) !important; }
    [data-theme="light"] .hover\:bg-white\/5:hover { background: rgba(15,23,42,.05) !important; }
    [data-theme="light"] .bg-white\/5:hover { background: rgba(255,255,255,.85) !important; }
    [data-theme="light"] .bg-white\/10:hover { background: rgba(255,255,255,.9) !important; }
    [data-theme="light"] .text-slate-100 { color: #0f172a !important; }
    [data-theme="light"] .text-slate-200 { color: #334155 !important; }
    [data-theme="light"] .text-blue-100 { color: #1d4ed8 !important; }
    [data-theme="light"] .text-pink-100 { color: #be185d !important; }
    [data-theme="light"] .text-amber-100 { color: #b45309 !important; }
    [data-theme="light"] button, [data-theme="light"] input, [data-theme="light"] select, [data-theme="light"] textarea { color: #111827; }
    @media (max-width: 639px) {
          .nobo-root .panel,
          .nobo-root .stat-card { min-width: 0; }
          .nobo-root .panel:has(> table) { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .nobo-root .panel > table { min-width: 560px; }
          .nobo-root .panel > .flex.items-center.gap-2.mb-3,
          .nobo-root .panel > .flex.items-center.gap-2.mb-4 { flex-wrap: wrap; }
          .nobo-root .panel > .flex.items-center.gap-2.mb-3 .input-dark,
          .nobo-root .panel > .flex.items-center.gap-2.mb-4 .input-dark { width: 100%; }
          .nobo-root input,
          .nobo-root select,
          .nobo-root textarea { max-width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nobo-root *, .nobo-root *::before, .nobo-root *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
  `}</style>
);

export default GlobalStyle;

