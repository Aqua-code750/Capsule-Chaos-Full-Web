import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Flame, 
  Zap, 
  CircleCheck, 
  Gamepad2, 
  Sparkles,
  ChevronRight,
  Info,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Settings,
  Monitor,
  Check
} from 'lucide-react';

// --- Audio System (Synthesized) ---
const playSound = (type: 'boot' | 'click' | 'power' | 'dispense' | 'pop' | 'sparkle' | 'success' | 'tick' | 'skip') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    switch(type) {
      case 'boot':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(40, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        osc.start(now);
        osc.stop(now + 1);
        break;
      case 'click':
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'tick':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
        break;
      case 'dispense':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'pop':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'sparkle':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(1500, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'success':
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(f, now + i * 0.1);
          g.gain.setValueAtTime(0.1, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.3);
        });
        break;
      case 'skip':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

// --- Types & Constants ---

enum GameState {
  INITIAL_LOADING = 'INITIAL_LOADING',
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  DISPENSED = 'DISPENSED',
  REVEALING = 'REVEALING',
  REVEALED = 'REVEALED',
  ACTIVE = 'ACTIVE',
  COMPLETING = 'COMPLETING',
  WHEEL_SPINNING = 'WHEEL_SPINNING'
}

enum GameMode {
  NORMAL = 'NORMAL',
  PARTY = 'PARTY',
  CHAOS_WHEEL = 'CHAOS_WHEEL'
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface Dare {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xp: number;
}

const DARES: Dare[] = [
  // EASY (10 XP)
  { id: 'e1', title: 'Robot Walk', description: 'Move and speak strictly like a robot for the next 2 minutes.', difficulty: 'EASY', xp: 10 },
  { id: 'e2', title: 'Socks on Hands', description: 'Put socks on your hands and try to pick up 5 small items.', difficulty: 'EASY', xp: 10 },
  { id: 'e3', title: 'Dramatic Entrance', description: 'Leave the room and re-enter as if you just won an Oscar.', difficulty: 'EASY', xp: 10 },
  { id: 'e4', title: 'Backward Walker', description: 'Walk backwards everywhere you go for the next 3 minutes.', difficulty: 'EASY', xp: 10 },
  { id: 'e5', title: 'Invisible Hat', description: 'Wear an invisible hat and get angry if someone "touches" it.', difficulty: 'EASY', xp: 10 },
  
  // MEDIUM (25 XP)
  { id: 'm1', title: 'Pillow Tower', description: 'Build the tallest tower you can using only pillows. It must stand for 10 seconds.', difficulty: 'MEDIUM', xp: 25 },
  { id: 'm2', title: 'Fake Cooking Show', description: 'Pretend you are a famous chef explaining how to make a peanut butter sandwich.', difficulty: 'MEDIUM', xp: 25 },
  { id: 'm3', title: 'New Dance', description: 'Invent a dance move called "The Dizzy Penguin" and perform it for the group.', difficulty: 'MEDIUM', xp: 25 },
  { id: 'm4', title: 'Blanket Fort', description: 'Create a mini cave using blankets and chairs in under 3 minutes.', difficulty: 'MEDIUM', xp: 25 },
  { id: 'm5', title: 'Mirror Me', description: 'Choose someone and copy their every movement perfectly for 1 minute.', difficulty: 'MEDIUM', xp: 25 },
  
  // HARD (50 XP)
  { id: 'h1', title: 'Floor is Lava', description: 'The floor is now lava for the next 5 minutes. You cannot touch it!', difficulty: 'HARD', xp: 50 },
  { id: 'h2', title: 'Cardboard Armor', description: 'Fashion a piece of armor (helmet, chestplate, or shield) using cardboard or paper.', difficulty: 'HARD', xp: 50 },
  { id: 'h3', title: 'Product Pitch', description: 'Find a random object and pitch it as a life-changing invention to everyone.', difficulty: 'HARD', xp: 50 },
  { id: 'h4', title: 'Obstacle Course', description: 'Setup and complete a simple obstacle course around the furniture.', difficulty: 'HARD', xp: 50 },
  { id: 'h5', title: 'Silent Mode', description: 'Communicate only through gestures and sound effects (no words) for 5 minutes.', difficulty: 'HARD', xp: 50 },
];

const LOADING_STEPS = [
  "Shuffling chaos...",
  "Calibrating capsule...",
  "Summoning madness...",
  "Preparing dare...",
  "Scanning fun levels...",
  "Generating chaos...",
  "Aligning stars...",
  "Priming gears..."
];

// --- Components ---

const FloatingBackground = ({ isDark, graphicsQuality }: { isDark: boolean, graphicsQuality: 'low' | 'medium' | 'high' }) => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none transition-colors duration-700">
    {/* Animated Gradients */}
    {graphicsQuality !== 'low' && (
      <>
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 dark:opacity-10 blur-[100px]"
          style={{ backgroundColor: isDark ? '#1e40af' : '#fca5a5' }}
        />
        <motion.div 
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20 dark:opacity-10 blur-[120px]"
          style={{ backgroundColor: isDark ? '#312e81' : '#60a5fa' }}
        />
      </>
    )}
    
    {/* Particles */}
    {[...Array(graphicsQuality === 'high' ? 12 : graphicsQuality === 'medium' ? 6 : 2)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0.1, 0.2, 0.1], 
          scale: [0.5, 1, 0.5],
          y: [-20, -120],
          x: Math.sin(i) * 50
        }}
        transition={{ 
          duration: 10 + Math.random() * 5, 
          repeat: Infinity, 
          delay: Math.random() * 5 
        }}
        className="absolute w-4 h-4 rounded-full bg-slate-400 dark:bg-white opacity-10 blur-sm"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${80 + Math.random() * 20}%`,
        }}
      />
    ))}
  </div>
);

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.INITIAL_LOADING);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('auto');
  const [isDark, setIsDark] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [spins, setSpins] = useState(100);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.NORMAL);
  const [partyPlayers, setPartyPlayers] = useState<string[]>(['Player 1', 'Player 2']);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isPartyModeActive, setIsPartyModeActive] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [tempPlayerName, setTempPlayerName] = useState('');
  const [history, setHistory] = useState<{ id: string; title: string; xp: number }[]>([]);
  const [progress, setProgress] = useState(0);
  const [introProgress, setIntroProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(LOADING_STEPS[0]);
  const [currentDare, setCurrentDare] = useState<Dare | null>(null);

  // Sync Dark Mode with Body & Auto Theme
  useEffect(() => {
    const applyTheme = (dark: boolean) => {
      setIsDark(dark);
      if (dark) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    };

    if (themeMode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(themeMode === 'dark');
    }
  }, [themeMode]);

  // Sync High Contrast
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  useEffect(() => {
    if (gameState === GameState.INITIAL_LOADING && isAudioEnabled) {
      playSound('boot');
    }
  }, [gameState, isAudioEnabled]);

  // Intro Loading Sequence
  useEffect(() => {
    const startTime = Date.now();
    const duration = 10000; // 10 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const linear = elapsed / duration;
      
      // Organic non-linear progress
      let newProgress = 0;
      if (linear < 0.2) newProgress = linear * 1.4; // Initial jump
      else if (linear < 0.4) newProgress = 0.28 + (linear - 0.2) * 0.65; // Slow crawl
      else if (linear < 0.7) newProgress = 0.41 + (linear - 0.4) * 1.03; // Burst
      else if (linear < 0.85) newProgress = 0.72 + (linear - 0.7) * 0.8; // Slower
      else newProgress = 0.84 + (linear - 0.85) * 1.06; // Final surge

      const finalProgress = Math.min(newProgress * 100, 100);
      setIntroProgress(finalProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(() => setGameState(GameState.IDLE), 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Stats reveal animation
  const [displayXp, setDisplayXp] = useState(0);
  useEffect(() => {
    if (displayXp < xp) {
      const timer = setTimeout(() => setDisplayXp(p => p + 1), 20);
      return () => clearTimeout(timer);
    }
  }, [xp, displayXp]);

  // UseEffect for high-speed counter catching up
  useEffect(() => {
    if (displayXp < xp) {
       const diff = xp - displayXp;
       const step = Math.max(1, Math.floor(diff / 10));
       const timer = setTimeout(() => setDisplayXp(p => Math.min(xp, p + step)), 20);
       return () => clearTimeout(timer);
    }
  }, [xp, displayXp]);

  // Machine loading logic (5 seconds, vertical)
  const startLoading = useCallback(() => {
    if (spins <= 0) return;
    
    if (isAudioEnabled) playSound('click');
    setGameState(GameState.LOADING);
    setSpins(s => s - 1);
    setProgress(0);
    
    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const linear = elapsed / duration;
      
      // Up-and-down / hesitant vertical motion
      let newProgress = 0;
      if (linear < 0.3) newProgress = linear * 1.16; // Rush
      else if (linear < 0.5) newProgress = 0.35 + (linear - 0.3) * 0.65; // Slow
      else if (linear < 0.7) newProgress = 0.48 + (linear - 0.5) * 1.15; // Jump
      else if (linear < 0.9) newProgress = 0.71 + (linear - 0.7) * 0.9; // Crawl
      else newProgress = 0.89 + (linear - 0.9) * 1.1; // Surge

      const finalProgress = Math.min(newProgress * 100, 100);
      setProgress(finalProgress);

      if (isAudioEnabled && Math.random() > 0.9) playSound('tick');

      if (Math.round(finalProgress * 10) % 80 === 0) {
        setLoadingText(LOADING_STEPS[Math.floor(Math.random() * LOADING_STEPS.length)]);
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        if (isAudioEnabled) playSound('dispense');
        setTimeout(() => {
          setGameState(GameState.DISPENSED);
          setCurrentDare(DARES[Math.floor(Math.random() * DARES.length)]);
        }, 300);
      }
    }, 50);
  }, [spins, isAudioEnabled]);

  const skipDare = useCallback(() => {
    if (spins <= 0) return;
    if (isAudioEnabled) playSound('skip');
    setGameState(GameState.IDLE);
    setLoadingText("Skipping dare...");
    setTimeout(() => {
      startLoading();
    }, 400);
  }, [spins, startLoading, isAudioEnabled]);

  const openCapsule = () => {
    if (isAudioEnabled) playSound('pop');
    setGameState(GameState.REVEALING);
    setTimeout(() => {
      if (isAudioEnabled) playSound('sparkle');
      setGameState(GameState.REVEALED);
    }, 1200);
  };

  const declineDare = () => {
    if (isAudioEnabled) playSound('skip');
    setGameState(GameState.IDLE);
    setCurrentDare(null);
  };

  const completeDare = () => {
    if (isAudioEnabled) playSound('success');
    setGameState(GameState.COMPLETING);
    setTimeout(() => {
      if (currentDare) {
        setXp(h => h + currentDare.xp);
        setStreak(s => s + 1);
        setHistory(prev => [{ id: Date.now().toString(), title: currentDare.title, xp: currentDare.xp }, ...prev].slice(0, 5));
        
        if (gameMode === GameMode.PARTY) {
          setCurrentPlayerIndex(prev => (prev + 1) % partyPlayers.length);
        }
      }
      setGameState(GameState.IDLE);
      setCurrentDare(null);
    }, 1500);
  };

  const spinChaosWheel = () => {
    if (isAudioEnabled) playSound('click');
    setGameState(GameState.WHEEL_SPINNING);
    const extraRotation = 1800 + Math.random() * 1800;
    setWheelRotation(prev => prev + extraRotation);
    
    setTimeout(() => {
       if (isAudioEnabled) playSound('pop');
       setCurrentDare(DARES[Math.floor(Math.random() * DARES.length)]);
       setGameState(GameState.REVEALED);
    }, 4000);
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between py-6 px-4 relative overflow-hidden transition-colors duration-700 sm:py-8"
      style={{ 
        paddingTop: `calc(1.5rem + var(--spacing-safe-top))`,
        paddingBottom: `calc(1.5rem + var(--spacing-safe-bottom))`,
        paddingLeft: `calc(1rem + var(--spacing-safe-left))`,
        paddingRight: `calc(1rem + var(--spacing-safe-right))`
      }}
    >
      <FloatingBackground isDark={isDark} graphicsQuality={graphicsQuality} />

      <AnimatePresence>
        {gameState === GameState.INITIAL_LOADING && (
          <motion.div
            key="intro-screen"
            exit={{ opacity: 0, scale: 1.1 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden ${isDark ? 'cinematic-bg' : 'cinematic-bg-light'}`}
          >
            {/* Background Ambience */}
            <div className={`absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b ${isDark ? 'from-chaos-orange/20' : 'from-chaos-orange/10'} to-transparent blur-[120px]`} />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: isDark ? [0.1, 0.4, 0.1] : [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className={`absolute w-[800px] h-[800px] border ${isDark ? 'border-chaos-orange/20' : 'border-chaos-orange/30'} rounded-full blur-[100px]`}
            />

            <div className="text-center z-10 space-y-16 w-full max-w-sm px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
                className="space-y-4"
              >
                <div className="flex justify-center mb-6">
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                     className={`w-20 h-20 rounded-full border-2 border-dashed ${isDark ? 'border-chaos-orange/30' : 'border-chaos-orange/40'} flex items-center justify-center`}
                   >
                      <Sparkles className="w-8 h-8 text-chaos-orange animate-pulse" />
                   </motion.div>
                </div>
                <h1 className={`text-6xl font-black tracking-tighter font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  CAPSULE <span className="text-chaos-orange">CHAOS</span>
                </h1>
                <p className={`text-[10px] font-bold tracking-[0.5em] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  INITIALIZING CHAOS ENGINE
                </p>
              </motion.div>

              <div className="space-y-6">
                <div className={`w-full h-2 rounded-full overflow-hidden p-0.5 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-200 border-slate-300'}`}>
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${introProgress}%` }}
                    className="h-full bg-chaos-orange shadow-[0_0_15px_rgba(242,125,38,0.5)] rounded-full"
                  />
                </div>
                <motion.div
                  key={Math.floor(introProgress / 10)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs font-black uppercase tracking-[0.3em] h-4 flex items-center justify-center gap-3 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}
                >
                  <span className="text-chaos-orange">{Math.round(introProgress)}%</span>
                  <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-600'}`} />
                  <span className="antialiased">{LOADING_STEPS[Math.floor((introProgress / 100) * LOADING_STEPS.length)] || "Entering Chaos"}</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header UI */}
      <header className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center z-20 px-4 md:px-10 gap-4">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display">
            CAPSULE <span className="text-chaos-orange">CHAOS</span>
          </h1>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-400 tracking-[0.2em] uppercase opacity-80">
            Random dares. Pure chaos.
          </p>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex gap-2 justify-center w-full sm:w-auto">
            <button 
              onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'auto' : 'light')}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-700 dark:text-slate-300 hover:scale-110 transition-transform relative group shrink-0"
            >
              {themeMode === 'light' ? <Sun className="w-5 h-5" /> : themeMode === 'dark' ? <Moon className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[8px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity uppercase pointer-events-none whitespace-nowrap z-50">
                {themeMode} Theme
              </span>
            </button>
            <button 
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className="w-10 h-10 rounded-full glass-card hidden sm:flex items-center justify-center text-slate-700 dark:text-slate-300 hover:scale-110 transition-transform shrink-0"
            >
              {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-700 dark:text-slate-300 hover:scale-110 transition-transform shrink-0"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 sm:gap-3 justify-center w-full sm:w-auto">
            <motion.div 
              whileHover={{ y: -2 }}
              className="glass-card flex-1 sm:flex-none justify-center px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 flex-row border-white/50 dark:border-white/10"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-inner shrink-0">
                <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white fill-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400 leading-none">XP</span>
                <span className="text-xs sm:text-sm md:text-lg font-black text-slate-950 dark:text-white leading-none tracking-tight tabular-nums">{displayXp}</span>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -2 }}
              className="glass-card flex-1 sm:flex-none justify-center px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 flex-row border-white/50 dark:border-white/10"
            >
               <div className="text-xs sm:text-sm md:text-xl transform hover:scale-110 transition-transform shrink-0">🔥</div>
              <div className="flex flex-col items-start">
                <span className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400 leading-none">Streak</span>
                <span className="text-xs sm:text-sm md:text-lg font-black text-slate-950 dark:text-white leading-none tracking-tight tabular-nums">{streak}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Machine Section */}
      <main className="flex-1 w-full max-w-6xl flex items-center justify-center relative py-6 z-10 px-4 group gap-4 md:gap-12 md:py-12">
        
        {/* VERTICAL LOADING BAR (Beside Machine) */}
        <div className="hidden md:flex flex-col items-center gap-4">
          <div className="vertical-bar-container">
            <motion.div 
              className="vertical-bar-fill"
              initial={{ height: "0%" }}
              animate={{ height: `${progress}%` }}
              transition={{ type: "spring", damping: 20 }}
            />
          </div>
          <motion.p 
            animate={gameState === GameState.LOADING ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.3 }}
            className="text-[10px] font-black text-slate-600 dark:text-slate-600 rotate-90 whitespace-nowrap mt-8 tracking-[0.2em]"
          >
            CHAOS LEVEL
          </motion.p>
        </div>

        <div className="relative w-full aspect-[4/5] max-w-sm sm:max-w-md md:max-w-sm lg:max-w-md">
          {gameMode === GameMode.CHAOS_WHEEL ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-[300px] sm:max-w-[400px]">
                {/* The Wheel */}
                <motion.div 
                  animate={{ rotate: wheelRotation }}
                  transition={{ duration: 4, ease: [0.15, 0, 0, 1] }}
                  className="w-full h-full rounded-full border-[12px] border-slate-800 dark:border-slate-700 shadow-2xl relative overflow-hidden bg-slate-900"
                >
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`absolute inset-0 origin-center ${i % 2 === 0 ? 'bg-chaos-orange/20' : 'bg-blue-500/20'}`}
                      style={{ 
                        transform: `rotate(${i * 30}deg)`,
                        clipPath: 'polygon(50% 50%, 50% 0%, 65% 0%)'
                      }}
                    />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 dark:bg-slate-900 border-4 border-white flex items-center justify-center shadow-2xl z-10">
                      <Zap className="w-8 h-8 text-chaos-orange fill-chaos-orange" />
                    </div>
                  </div>
                </motion.div>
                {/* Pointer */}
                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-8 h-10 bg-rose-500 shadow-lg z-20" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }} />
              </div>
            </div>
          ) : (
            <>
              {/* THE MACHINE GRAPHICS */}
              <div className="absolute inset-0 z-0">
                {/* Top Chamber - Transparent Glass */}
                <motion.div 
              animate={gameState === GameState.LOADING ? {
                y: [0, -4, 0],
                rotate: [-1, 1, -1],
                scale: [1, 1.02, 1]
              } : gameState === GameState.DISPENSED ? {
                y: [0, -10, 0],
              } : {
                y: [0, -4, 0],
                rotate: [0.5, -0.5, 0.5],
                scale: [1, 1.01, 1]
              }}
              transition={{ duration: gameState === GameState.LOADING ? 0.2 : 5, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-[95%] h-[62%] rounded-[60px] sm:rounded-[100px] border-[8px] sm:border-[12px] overflow-hidden shadow-2xl relative transition-colors duration-500 ${
                isDark ? 'border-slate-800 bg-slate-900/30' : 'machine-chamber-light'
              } backdrop-blur-sm`}
            >
              {/* Internal Glow Lights */}
              {graphicsQuality !== 'low' && (
                <motion.div 
                  animate={gameState === GameState.LOADING ? {
                    opacity: [0.4, 1, 0.4],
                    scale: [1, 1.3, 1],
                    backgroundColor: ['#f27d26', '#3b82f6', '#f27d26']
                  } : {
                    opacity: [0.1, 0.3, 0.1],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-x-8 top-12 bottom-20 bg-chaos-orange/20 rounded-full blur-[60px] pointer-events-none"
                />
              )}

              {/* Scattered Capsules in Chamber */}
              <div className="absolute inset-0 flex flex-wrap gap-1 sm:gap-2 px-6 sm:px-8 pt-10 sm:pt-20 pb-10 sm:pb-16 justify-center content-end opacity-80">
                {[...Array(graphicsQuality === 'low' ? 8 : graphicsQuality === 'medium' ? 14 : 20)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={gameState === GameState.LOADING ? {
                      y: [0, -40, 0],
                      x: [0, Math.random() * 50 - 25, 0],
                      rotate: [0, 720]
                    } : {
                      rotate: i * 35,
                      y: [0, -8, 0],
                      x: [0, Math.sin(i) * 5, 0]
                    }}
                    transition={{ 
                      duration: gameState === GameState.LOADING ? 0.5 : 3 + Math.random() * 2, 
                      repeat: Infinity, 
                      delay: Math.random() * 0.3 
                    }}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/40 shadow-inner overflow-hidden relative ${
                      i % 4 === 0 ? 'bg-[#fca5a5]' : 
                      i % 4 === 1 ? 'bg-[#93c5fd]' : 
                      i % 4 === 2 ? 'bg-[#c4b5fd]' : 'bg-[#fde047]'
                    }`}
                  >
                    <div className="absolute top-1 left-1 w-3 h-3 sm:w-4 sm:h-4 bg-white/40 rounded-full blur-[1px]" />
                    <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/5" />
                  </motion.div>
                ))}
              </div>

              {/* Reflections on glass */}
              <div className="absolute top-10 left-10 w-24 h-48 bg-white/10 rounded-full blur-2xl transform -rotate-15 pointer-events-none opacity-40 md:opacity-100" />
            </motion.div>

            {/* Base Body */}
            <div 
              className={`absolute top-[55%] left-1/2 -translate-x-1/2 w-full h-[45%] rounded-[30px] sm:rounded-[40px] border-b-[6px] sm:border-b-[10px] shadow-2xl flex flex-col items-center pt-6 sm:pt-10 transition-all duration-500 ${
                isDark ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'machine-body-light'
              }`}
            >
              
              {/* Dispense Slot */}
              <div className={`w-40 h-16 sm:w-48 sm:h-20 rounded-xl sm:rounded-2xl shadow-inner border-t flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${
                 isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300'
              }`}>
                {/* Dispensed Capsule */}
                <AnimatePresence>
                  {gameState === GameState.DISPENSED && (
                    <motion.div
                      layoutId="capsule"
                      initial={{ y: -200, opacity: 0, rotate: -45, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      onClick={openCapsule}
                      transition={{ type: "spring", damping: 12, stiffness: 100 }}
                      className="absolute cursor-pointer z-20 group"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          y: [0, -5, 0],
                          boxShadow: ["0 10px 15px -3px rgba(0,0,0,0.1)", "0 25px 30px -5px rgba(242,125,38,0.5)", "0 10px 15px -3px rgba(0,0,0,0.1)"]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-chaos-orange border-[4px] sm:border-[6px] border-white relative flex items-center justify-center"
                      >
                         <div className="w-full h-[2px] bg-white absolute top-1/2 -translate-y-1/2 opacity-30" />
                         <div className="w-4 h-4 bg-white/40 rounded-full absolute top-2 left-2 blur-[1px]" />
                        <motion.div 
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="absolute -top-4 -right-4"
                        >
                          <Sparkles className="w-6 h-6 text-amber-400" />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Internal Glow Behind Hole */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-chaos-orange blur-[8px] opacity-10 animate-pulse"></div>
              </div>

              {/* Decorative Detail */}
              <div className="mt-4 sm:mt-6 flex flex-col items-center gap-1">
                <div className="text-[8px] sm:text-[10px] font-black text-slate-600 dark:text-slate-600 tracking-[0.5em] uppercase">CHAOS MODULE</div>
                <div className="flex gap-2">
                   <motion.div 
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-chaos-orange" 
                   />
                   <motion.div 
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400" 
                   />
                   <motion.div 
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-chaos-orange" 
                   />
                </div>
              </div>
            </div>
          </div>
            </>
          )}
          
          {/* MOBILE PROGRESS INDICATOR */}
          <AnimatePresence>
            {gameState === GameState.LOADING && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 -top-8 z-30 flex md:hidden flex-col items-center justify-center p-4 gap-2"
              >
                {gameMode === GameMode.CHAOS_WHEEL ? (
                  <p className="text-[9px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.2em] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">SPINNING THE CHAOS WHEEL...</p>
                ) : (
                  <>
                    <div className="w-[85%] max-w-[200px] h-2.5 bg-slate-100/70 dark:bg-slate-800/80 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-white/40 dark:border-slate-700 shadow-sm">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-orange-400 to-chaos-orange rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[9px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.2em] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">{loadingText}</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* DARE REVEAL OVERLAY */}
          <AnimatePresence>
            {(gameState === GameState.REVEALING || gameState === GameState.REVEALED || gameState === GameState.ACTIVE) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-[#FDFBF7]/90 dark:bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-6"
              >
                {/* Cinematic Pulse Effect */}
                {graphicsQuality !== 'low' && (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ 
                      scale: [0.8, 1.2, 1],
                      opacity: [0, 0.4, 0]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    className="absolute w-[500px] h-[500px] rounded-full bg-chaos-orange/20 blur-[80px]"
                  />
                )}

                {gameState === GameState.REVEALING ? (
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: [1, 1.5, 1], rotate: 0 }}
                    transition={{ duration: 1.2, ease: "anticipate" }}
                    className="relative"
                  >
                    <div className="w-32 h-32 rounded-full border-[8px] border-chaos-orange/30 flex items-center justify-center p-4 shadow-[0_0_50px_rgba(242,125,38,0.3)]">
                       <Sparkles className="w-full h-full text-chaos-orange fill-chaos-orange animate-pulse" />
                    </div>
                  </motion.div>
                ) : currentDare && (
                  <motion.div
                    initial={{ scale: 0.9, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="w-full max-w-sm glass-card-heavy rounded-[40px] sm:rounded-[50px] p-8 sm:p-10 overflow-visible relative border-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
                  >
                    <div className={`absolute -top-4 right-8 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-md border z-10 ${
                      currentDare.difficulty === 'EASY' ? 'diff-easy' : 
                      currentDare.difficulty === 'MEDIUM' ? 'diff-medium' : 'diff-hard'
                    }`}>
                      {currentDare.difficulty}
                    </div>

                    <div className="mb-6 sm:mb-8 mt-2">
                      <h3 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white leading-[1] tracking-tighter mb-4">{currentDare.title}</h3>
                      <p className="text-slate-800 dark:text-slate-200 font-medium text-base sm:text-lg leading-relaxed antialiased">
                        {currentDare.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-8 bg-slate-200/50 dark:bg-slate-900/60 p-4 rounded-3xl border border-white/40 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">REWARD</span>
                        <span className="text-2xl font-black text-chaos-orange tabular-nums">+{currentDare.xp} XP</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">STATUS</span>
                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${gameState === GameState.ACTIVE ? 'bg-amber-400 text-white shadow-sm' : 'bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-400'}`}>
                          {gameState === GameState.ACTIVE ? 'IN PROGRESS' : 'READY'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {gameState === GameState.REVEALED ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setGameState(GameState.ACTIVE);
                              if (isAudioEnabled) playSound('click');
                            }}
                            className="w-full py-5 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                          >
                            <ChevronRight className="w-5 h-5" />
                            ACCEPT MISSION
                          </motion.button>
                          <div className="flex gap-2">
                             <button
                                onClick={skipDare}
                                className="flex-1 py-3.5 rounded-xl text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800"
                             >
                               <RotateCcw className="w-3 h-3" />
                               Reroll
                             </button>
                             <button
                                onClick={declineDare}
                                className="flex-1 py-3.5 rounded-xl text-rose-500 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center justify-center gap-2 border border-rose-100 dark:border-rose-900/30"
                             >
                               <X className="w-3 h-3" />
                               Decline
                             </button>
                          </div>
                        </>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={completeDare}
                          className="w-full py-5 rounded-2xl bg-chaos-orange text-white font-black text-lg sm:text-xl shadow-xl shadow-chaos-orange/30 transition-all flex items-center justify-center gap-3"
                        >
                          <CircleCheck className="w-7 h-7" />
                          MISSION COMPLETE
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* XP COLLECTION CELEBRATION */}
          <AnimatePresence>
            {gameState === GameState.COMPLETING && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
              >
                <motion.div 
                  initial={{ scale: 0, y: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 0.8, 0],
                    y: [0, -100, -300],
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="bg-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
                    <span className="text-5xl font-black text-coral-500">+{currentDare?.xp}</span>
                    <Trophy className="w-10 h-10 text-amber-500" />
                  </div>
                </motion.div>
                
                {/* Sprinkles */}
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, scale: 0 }}
                    animate={{ 
                      x: (Math.random() - 0.5) * 800,
                      y: (Math.random() - 0.5) * 800,
                      scale: [0, 1.5, 0],
                      rotate: [0, 360]
                    }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                    className={`w-3 h-3 rounded-full absolute ${
                      ['bg-coral-400', 'bg-amber-400', 'bg-blue-400', 'bg-lavender-400'][i % 4]
                    }`}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        <div className="hidden xl:flex flex-col gap-6 w-[320px]">
          <div className="glass-card-heavy rounded-[40px] p-8 h-full flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.2em]">Memory Vault</h4>
              <RotateCcw className="w-3 h-3 text-slate-400 cursor-pointer hover:text-chaos-orange transition-colors" onClick={() => setHistory([])} />
            </div>
            
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              {history.length > 0 ? history.map((item, i) => (
                <motion.div 
                   key={item.id}
                   initial={{ x: 20, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   transition={{ delay: i * 0.1 }}
                   className="flex items-center gap-4 group/item cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-slate-800 flex items-center justify-center text-lg shadow-sm border border-white dark:border-slate-700 group-hover/item:border-chaos-orange transition-all duration-300">
                    <Sparkles className={`w-5 h-5 ${i === 0 ? 'text-chaos-orange animate-pulse' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover/item:text-chaos-orange transition-colors line-clamp-1">{item.title}</span>
                    <span className="text-[10px] text-slate-700 dark:text-slate-500 font-bold uppercase tracking-wider">+{item.xp} XP • ACHIEVED</span>
                  </div>
                </motion.div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-dashed border-slate-300 dark:border-slate-700">
                     <Gamepad2 className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                    Void detected.<br/>Secure some chaos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Button Section */}
      <footer className="w-full max-w-sm flex flex-col items-center gap-6 mb-8 z-20">
        <AnimatePresence mode="wait">
          {gameState === GameState.IDLE && (
            <motion.div
              key="cta-container"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full"
            >
            <motion.button
                onClick={gameMode === GameMode.CHAOS_WHEEL ? spinChaosWheel : startLoading}
                whileHover={spins > 0 ? { scale: 1.02 } : {}}
                whileTap={spins > 0 ? { scale: 0.95 } : {}}
                disabled={spins <= 0}
                className={`w-full py-6 px-12 text-white text-2xl font-black rounded-full btn-3d transition-all uppercase tracking-tight ${
                  spins > 0 ? "bg-gradient-to-b from-[#f27d26] to-[#e65a1e]" : "bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-50 grayscale"
                }`}
              >
                {spins > 0 ? (gameMode === GameMode.CHAOS_WHEEL ? "SPIN WHEEL" : "GIVE DARE") : "OUT OF SPINS"}
              </motion.button>
              
              <div className="mt-8 text-center text-slate-600 dark:text-slate-500">
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase">
                  {spins > 0 ? "INITIATE SESSION" : "Chaos Reserves Depleted"}
                </span>
              </div>
            </motion.div>
          )}

          {gameState === GameState.DISPENSED && (
            <motion.div
              key="hint"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-8 py-4 rounded-full flex flex-col items-center gap-2"
            >
              <p className="text-chaos-orange font-black text-[10px] tracking-[0.5em] flex items-center gap-2">
                 TAP THE CAPSULE TO OPEN 
              </p>
              <div className="w-1 h-1 rounded-full bg-chaos-orange animate-bounce" />
            </motion.div>
          )}
        </AnimatePresence>

          {/* Global Stats Footer */}
          <div className="flex items-center gap-4 text-slate-700 dark:text-slate-500 font-display">
            {gameMode === GameMode.PARTY && (
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-indigo-500 text-white px-3 py-1 rounded-full shadow-sm">
                PARTY MODE: {partyPlayers[currentPlayerIndex]}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{DARES.length} EXPERIENCES</span>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <motion.div 
            animate={{ opacity: [1, 0.4, 1], color: isDark ? ['#475569', '#f27d26', '#475569'] : ['#94a3b8', '#f27d26', '#94a3b8'] }} 
            transition={{ duration: 3, repeat: Infinity }}
            className="text-[10px] font-black uppercase tracking-[0.3em]"
          >
            CHAOS ENGINE ONLINE
          </motion.div>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-card-heavy rounded-[40px] p-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:scale-110 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">SETTINGS</h2>
                <p className="text-[10px] font-bold text-slate-600 tracking-[0.4em] uppercase">Configure Chaos</p>
              </div>

              <div className="space-y-6">
                {/* Graphics Quality */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest px-2">Graphics Quality</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                    {(['low', 'medium', 'high'] as const).map(q => (
                      <button
                        key={q}
                        onClick={() => setGraphicsQuality(q)}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          graphicsQuality === q 
                            ? 'bg-white dark:bg-slate-700 text-chaos-orange shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Mode */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest px-2">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                    {(['light', 'dark', 'auto'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setThemeMode(m)}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                          themeMode === m 
                            ? 'bg-white dark:bg-slate-700 text-chaos-orange shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        {m === 'light' && <Sun className="w-3 h-3" />}
                        {m === 'dark' && <Moon className="w-3 h-3" />}
                        {m === 'auto' && <Monitor className="w-3 h-3" />}
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Game Mode */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest px-2">Game Mode</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                    {([GameMode.NORMAL, GameMode.PARTY, GameMode.CHAOS_WHEEL] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => {
                          setGameMode(m);
                          if (m === GameMode.PARTY) setIsPartyModeActive(true);
                          else setIsPartyModeActive(false);
                          setGameState(GameState.IDLE);
                        }}
                        className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all flex flex-col items-center justify-center gap-1 ${
                          gameMode === m 
                            ? 'bg-white dark:bg-slate-700 text-chaos-orange shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        {m === GameMode.NORMAL && <Gamepad2 className="w-3 h-3" />}
                        {m === GameMode.PARTY && <Trophy className="w-3 h-3" />}
                        {m === GameMode.CHAOS_WHEEL && <RotateCcw className="w-3 h-3" />}
                        <span className="truncate w-full text-center">{m.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2">
                    {gameMode === GameMode.PARTY && (
                      <div className="p-4 rounded-2xl glass-card flex flex-col gap-3">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest leading-none">Party Members</label>
                        <div className="flex flex-wrap gap-2">
                          {partyPlayers.map((name, i) => (
                            <div key={i} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${currentPlayerIndex === i ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'}`}>
                              <span className="text-[10px] font-black">{name}</span>
                              <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => setPartyPlayers(p => p.filter((_, idx) => idx !== i))} />
                            </div>
                          ))}
                          
                          {isAddingPlayer ? (
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-chaos-orange p-1 pr-2 rounded-full">
                              <input 
                                autoFocus
                                value={tempPlayerName}
                                onChange={(e) => setTempPlayerName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && tempPlayerName.trim()) {
                                    setPartyPlayers(p => [...p, tempPlayerName.trim()]);
                                    setTempPlayerName('');
                                    setIsAddingPlayer(false);
                                  } else if (e.key === 'Escape') {
                                    setIsAddingPlayer(false);
                                    setTempPlayerName('');
                                  }
                                }}
                                placeholder="Player name"
                                className="bg-transparent border-none outline-none text-[10px] font-bold px-2 w-20 text-slate-800 dark:text-slate-200"
                              />
                              <button 
                                onClick={() => {
                                  if (tempPlayerName.trim()) {
                                    setPartyPlayers(p => [...p, tempPlayerName.trim()]);
                                    setTempPlayerName('');
                                    setIsAddingPlayer(false);
                                  }
                                }}
                                className="text-chaos-orange hover:scale-110 transition-transform"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => {
                                  setIsAddingPlayer(false);
                                  setTempPlayerName('');
                                }}
                                className="text-slate-400 hover:scale-110 transition-transform"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setIsAddingPlayer(true)}
                              className="px-3 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-[10px] font-bold text-slate-400 hover:border-chaos-orange hover:text-chaos-orange transition-colors"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                  <button 
                    onClick={() => setIsHighContrast(!isHighContrast)}
                    className="w-full p-4 rounded-2xl glass-card flex items-center justify-between group px-5"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">High Contrast</span>
                      <span className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter">Maximize Readability</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${isHighContrast ? 'bg-chaos-orange' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <motion.div 
                        animate={{ x: isHighContrast ? 20 : 0 }}
                        className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </button>

                  <button 
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    className="w-full p-4 rounded-2xl glass-card flex items-center justify-between group px-5"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Audio Feedback</span>
                      <span className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter">Toggle Sound Effects</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${isAudioEnabled ? 'bg-chaos-orange' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <motion.div 
                        animate={{ x: isAudioEnabled ? 20 : 0 }}
                        className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => {
                      setXp(0);
                      setStreak(0);
                      setSpins(100);
                      setHistory([]);
                      setIsSettingsOpen(false);
                      if (isAudioEnabled) playSound('skip');
                    }}
                    className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset All Progress
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
