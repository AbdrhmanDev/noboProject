const GlobalStyle = () => (
  <style>{`
    .nobo-root { font-family: 'Cairo', 'Tajawal', sans-serif; }
    .nobo-root, .nobo-root * { box-sizing: border-box; }

    .font-tajawal { font-family: 'Tajawal', 'Cairo', sans-serif; }
    .font-kufi { font-family: 'Noto Kufi Arabic', 'Cairo', sans-serif; }

    .bg-space{
          position:relative;
          overflow:hidden;
          background:#000;
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
        border:1px solid rgba(255,255,255,.08);
        box-shadow:
        0 10px 30px rgba(0,0,0,.45),
        0 0 25px rgba(43,140,255,.08);
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
          background:#000;
          border:2px solid #2b8cff;
          border-radius:28px;
          box-shadow:
          0 0 20px rgba(43,140,255,.45),
          0 0 60px rgba(43,140,255,.25),
          0 0 60px rgba(255,61,107,.20);
          transition:.4s;
          }
          .login-card:hover{
          transform:translateY(-4px);
          border-color:#ff3d6b;
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
            border:1px solid rgba(255,255,255,.08);
            box-shadow:
            inset 0 2px 8px rgba(0,0,0,.45);
            transition:.3s;
            }
        .input-dark:hover{
            border-color:#2b8cff66;
            }
        .input-dark:focus-within{
            border-color:#2b8cff;
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
          background: linear-gradient(90deg,#ff3d6b,#f5b800,#2b8cff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .toggle-track { background: linear-gradient(90deg,#2b8cff,#8b5cf6); }
        .toggle-thumb { transition: transform .2s ease; }
        .stat-card{
          background:
          linear-gradient(
          160deg,
          rgba(18,24,40,.95),
          rgba(9,12,22,.92)
          );
          border:1px solid rgba(255,255,255,.08);
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
          #2b8cff,
          #4f6bff
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
  `}</style>
);

export default GlobalStyle;

