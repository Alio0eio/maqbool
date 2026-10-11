import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Play, Volume2, VolumeX } from 'lucide-react';

import { DEMO_URL } from '@/config';

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  return (
    <section
      id="top"
      className="relative -mt-16 overflow-hidden bg-gradient-to-b from-primary via-[hsl(222_92%_22%)] to-[hsl(215_95%_30%)] pt-16 text-white"
    >
      {/* ambient blobs + dotted overlay, echoing the app's auth hero */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="float-slow absolute -left-24 top-24 h-80 w-80 rounded-full bg-[hsl(210_100%_55%/0.25)] blur-3xl" />
        <div className="float-slower absolute -right-24 top-64 h-96 w-96 rounded-full bg-[hsl(38_88%_55%/0.12)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'linear-gradient(to bottom, black, transparent 75%)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <motion.p
          custom={0}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur"
        >
          <span className="live-dot" aria-hidden /> AI-native recruitment
        </motion.p>

        <motion.h1
          custom={1}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mx-auto mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl lg:text-7xl"
        >
          Hiring, heard clearly.
        </motion.h1>

        <motion.p
          custom={2}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/75"
        >
          Async video interviews and AI-assisted matching, built so every conversation gets a fair, focused read.
        </motion.p>

        <motion.div
          custom={3}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href={DEMO_URL}
            className="btn-sheen relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3 text-base font-semibold text-primary shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Try the live demo <ArrowRight className="size-4" />
          </a>
          <a
            href="#watch"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            <Play className="size-4 fill-current" /> Watch the 25-second tour
          </a>
        </motion.div>

        <motion.div
          id="watch"
          custom={5}
          variants={rise}
          initial="hidden"
          animate="show"
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <VideoFrame />
        </motion.div>
      </div>
    </section>
  );
}

/** Viewfinder-framed 16:9 stage holding the hero promo. It autoplays muted and loops;
 *  "Play with sound" restarts it from the top with audio on. Reduced-motion users get the poster. */
function VideoFrame() {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduce) {
      v.pause();
      return;
    }
    v.play().catch(() => setPlaying(false));
  }, [reduce]);

  const playWithSound = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.currentTime = 0;
    setMuted(false);
    v.play().catch(() => setPlaying(false));
  };

  const toggleMute = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div className="relative rounded-2xl border border-white/15 bg-[hsl(222_45%_8%)] p-1.5 shadow-[0_40px_120px_-30px_rgba(0,10,40,0.8)]">
      {(['left-0 top-0 border-l-2 border-t-2 rounded-tl-2xl', 'right-0 top-0 border-r-2 border-t-2 rounded-tr-2xl', 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl', 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl'] as const).map((c) => (
        <span key={c} aria-hidden className={`pointer-events-none absolute z-10 size-8 border-accent-record ${c}`} />
      ))}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[hsl(222_45%_8%)]">
        <video
          ref={ref}
          className="absolute inset-0 size-full object-cover"
          poster="/video/poster.jpg"
          autoPlay={!reduce}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Maqbool product tour: async video interviews, AI-ranked shortlist, side-by-side comparison"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src="/video/maqbool-hero.webm" type="video/webm" />
          <source src="/video/maqbool-hero.mp4" type="video/mp4" />
        </video>

        {!playing && (
          <button
            type="button"
            onClick={playWithSound}
            aria-label="Play the Maqbool tour"
            className="absolute inset-0 grid place-items-center bg-black/20 transition-colors hover:bg-black/30"
          >
            <span className="grid size-20 place-items-center rounded-full bg-white text-primary shadow-xl">
              <Play className="size-8 translate-x-0.5 fill-current" />
            </span>
          </button>
        )}

        {playing && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            {muted && (
              <button
                type="button"
                onClick={playWithSound}
                className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-primary shadow-lg backdrop-blur transition-transform hover:-translate-y-px"
              >
                Play with sound
              </button>
            )}
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="grid size-10 place-items-center rounded-full bg-white/90 text-primary shadow-lg backdrop-blur"
            >
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
