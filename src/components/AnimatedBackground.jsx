export default function AnimatedBackground() {
  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <style>{`
        .animated-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: #080c14; overflow: hidden;
        }
        .blob {
          position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.6;
          animation: blobFloat 20s infinite alternate ease-in-out;
        }
        .blob-1 { width: 60vh; height: 60vh; background: rgba(99, 102, 241, 0.15); top: -10vh; left: -10vw; }
        .blob-2 { width: 50vh; height: 50vh; background: rgba(16, 185, 129, 0.1); bottom: -5vh; right: -5vw; animation-delay: -5s; }
        .blob-3 { width: 40vh; height: 40vh; background: rgba(245, 158, 11, 0.08); top: 50%; left: 50%; transform: translate(-50%, -50%); animation-duration: 25s; }

        @keyframes blobFloat {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5vw, -5vh) scale(1.1); }
          66% { transform: translate(-5vw, 5vh) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
    </>
  );
}