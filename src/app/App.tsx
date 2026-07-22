import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Search, Bell, Moon, Sun, Menu, X, Star, Heart,
  Play, ChevronLeft, ChevronRight, Zap, Flame, Sparkles,
  Gamepad2, Trophy, Users, Clock, Share2, Maximize2,
  ArrowRight, Mail, Twitter, Instagram, Linkedin,
  MessageCircle, Shield, HelpCircle, BookOpen, Layers,
  Car, Compass, Puzzle, Swords, Music, Ghost,
  Building2, Globe, Joystick, Upload, ShieldCheck,
  Trash2, ToggleLeft, ToggleRight, Package, Eye, EyeOff,
  CheckCircle2, AlertCircle, FolderOpen, Settings, Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabaseClient";
import { loadZipGame } from "@/lib/zipPlayer";
import azymarLogo from "@/imports/azymar_logo_new.png";
import synthwaveBg from "@/imports/synthwave_bg.jpg";
import gameCharacter from "@/imports/game_character.png";
import floatingController from "@/imports/floating_controller_transparent.png";
import doodles from "@/imports/doodles.png";
import pacmanSprites from "@/imports/pacman_sprites.png";
import pixelCat from "@/imports/pixel_cat.png";
import blackGamepad from "@/imports/black_gamepad.png";
import bowlingStrike from "@/imports/bowling_strike.png";
import omgBubble from "@/imports/omg_bubble.png";
import flamingEightball from "@/imports/flaming_eightball.png";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Game {
  id: number;
  title: string;
  genre: string;
  rating: number;
  plays: string;
  badge?: "HOT" | "NEW" | "TRENDING";
  color: string;
  emoji: string;
  uploadedAt?: string;
  visible?: boolean;
  zipFile?: File;
  isUploaded?: boolean;
  thumbnailUrl?: string;
}

interface UploadEntry {
  id: number;
  file: File;
  thumbnailFile?: File | null;
  thumbnailUrl?: string;
  title: string;
  genre: string;
  emoji: string;
  color: string;
  status: "pending" | "processing" | "ready" | "error";
  progress: number;
  visible: boolean;
  uploadedAt: string;
  size: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const GAMES: Game[] = [];

const CATEGORIES = [
  { name: "Action", icon: Swords, count: 1240, color: "#EF4444" },
  { name: "Adventure", icon: Compass, count: 842, color: "#F59E0B" },
  { name: "Puzzle", icon: Puzzle, count: 1680, color: "#8B5CF6" },
  { name: "Racing", icon: Car, count: 560, color: "#3B82F6" },
  { name: "Horror", icon: Ghost, count: 310, color: "#6B7280" },
  { name: "Sports", icon: Trophy, count: 740, color: "#22C55E" },
  { name: "Arcade", icon: Joystick, count: 920, color: "#F97316" },
  { name: "Casual", icon: Music, count: 1440, color: "#EC4899" },
  { name: "Multiplayer", icon: Users, count: 380, color: "#06B6D4" },
  { name: "Simulation", icon: Building2, count: 490, color: "#10B981" },
];

const RECOMMENDED: any[] = [];

// ─── Badge component ──────────────────────────────────────────────────────────

function Badge({ type }: { type: "HOT" | "NEW" | "TRENDING" }) {
  const styles = {
    HOT: "bg-red-600 text-white",
    NEW: "bg-neutral-800 text-white border border-neutral-700",
    TRENDING: "bg-primary text-primary-foreground",
  };
  const icons = { HOT: <Flame size={10} />, NEW: <Sparkles size={10} />, TRENDING: <Zap size={10} /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[2px] text-[9px] font-black uppercase tracking-wider ${styles[type]}`}>
      {icons[type]} {type}
    </span>
  );
}

// ─── Game Card ────────────────────────────────────────────────────────────────

function GameCard({
  game,
  onPlay,
  isAdmin,
  onAdminDelete,
  isFavorite,
  onToggleFavorite,
}: {
  game: Game;
  onPlay: (g: Game) => void;
  isAdmin?: boolean;
  onAdminDelete?: (id: number, isDbGame: boolean) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}) {
  return (
    <div
      className="bg-white rounded-none overflow-hidden cursor-pointer group border-3 border-black neo-shadow neo-card-hover transition-all duration-200"
    >
      <div
        className="h-36 flex items-center justify-center text-6xl relative overflow-hidden border-b-3 border-black"
        style={{ background: `linear-gradient(135deg, ${game.color}22 0%, ${game.color}44 100%)` }}
      >
        {game.thumbnailUrl ? (
          <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:rotate-1" />
        ) : (
          <motion.span whileHover={{ scale: 1.15 }} transition={{ duration: 0.2 }}>
            {game.emoji}
          </motion.span>
        )}

        {!game.isUploaded && game.badge && (
          <div className="absolute top-2 left-2">
            <Badge type={game.badge} />
          </div>
        )}
        {isAdmin && game.isUploaded && onAdminDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdminDelete(game.id, game.isUploaded || false); toast.success("Game removed"); }}
            className="absolute top-2 right-8 p-1.5 rounded-none border-2 border-black bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
          >
            <Trash2 size={11} className="text-white" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(game.id); }}
          className="absolute top-2 right-2 p-1.5 rounded-none border-2 border-black bg-white hover:bg-primary transition-colors cursor-pointer"
        >
          <motion.div animate={{ scale: isFavorite ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.3 }}>
            <Heart size={14} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </motion.div>
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-black text-sm truncate">{game.title}</h3>
        <p className="text-neutral-600 text-xs mt-0.5">{game.genre}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 bg-amber-400 text-black px-1.5 py-0.5 border-2 border-black text-[9px] font-black uppercase select-none">
            <Star size={10} className="fill-black text-black" />
            <span>{game.rating}</span>
          </div>
          <div className="flex items-center gap-1 bg-white text-black px-1.5 py-0.5 border-2 border-black text-[9px] font-black uppercase select-none">
            <span>{game.plays} plays</span>
          </div>
        </div>
        <button
          onClick={() => onPlay(game)}
          className="mt-3.5 w-full bg-primary text-black hover:bg-[#00D4C8] hover:text-black py-2.5 rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150"
        >
          <Play size={12} fill="currentColor" /> Play Now
        </button>
      </div>
    </div>
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({
  onClose,
  setUser,
  setShowAdmin,
  navigateTo,
}: {
  onClose: () => void;
  setUser: (user: any) => void;
  setShowAdmin?: (show: boolean) => void;
  navigateTo?: (page: "home" | "signin" | "account") => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    if (!supabase) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setUser({
        email,
        user_metadata: {
          full_name: email.split("@")[0],
        },
      });
      toast.success("Welcome to AZYMAR! (Local Mode) 🎮");
      setLoading(false);
      onClose();
      if (email === "azymar03@gmail.com") {
        setShowAdmin?.(true);
        navigateTo?.("home");
      }
      return;
    }

    try {
      if (tab === "login") {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            if (email === "azymar03@gmail.com" && password === "azymar#123") {
              const { error: signUpError } = await supabase.auth.signUp({ email, password });
              if (signUpError) throw signUpError;
              const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
              if (signInError) throw signInError;
            } else {
              throw error;
            }
          }
        } catch (authErr: any) {
          if (email === "azymar03@gmail.com" && password === "azymar#123") {
            setUser({
              email,
              id: "local-admin-uid",
              user_metadata: { full_name: "Admin" }
            });
            toast.success("Welcome back to AZYMAR! (Admin Local Mode) 🎮");
          } else {
            throw authErr;
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created successfully! Check your email to confirm.");
      }
      onClose();
      if (email === "azymar03@gmail.com") {
        setShowAdmin?.(true);
        navigateTo?.("home");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "discord") => {
    if (!supabase) {
      const toastId = toast.loading(`Logging in with ${provider}...`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUser({
        email: `gamer@${provider}.com`,
        user_metadata: {
          full_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Gamer`,
        },
      });
      toast.success(`Welcome to AZYMAR! Logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)} (Local Mode) 🎮`, { id: toastId });
      onClose();
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(`OAuth login failed: ${err.message}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border-3 border-black rounded-none p-8 w-full max-w-md neo-shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AzymarLogo size={28} />
              <span className="font-black text-foreground text-lg tracking-wide uppercase">AZYMAR</span>
            </div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Your gaming universe awaits</p>
          </div>
          <button onClick={onClose} className="p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-3 border-black p-1 bg-neutral-900 mb-6 rounded-none">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tab === t 
                  ? "bg-primary text-primary-foreground border-2 border-black [box-shadow:2px_2px_0px_0px_#000000]" 
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all"
            />
          </div>
          {tab === "login" && (
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold uppercase tracking-wider text-[10px]">
                <input type="checkbox" className="accent-primary border-2 border-black rounded-none" /> Remember me
              </label>
              <button type="button" className="hover:text-primary transition-colors font-bold uppercase tracking-wider text-[10px]">Forgot password?</button>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-none font-black text-xs uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-black" />
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <span className="bg-card px-2">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "google" as const, label: "Google", icon: "🌐" },
            { id: "discord" as const, label: "Discord", icon: "💬" },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => handleOAuth(p.id)}
              className="flex items-center justify-center gap-2 py-2.5 bg-white text-black border-3 border-black rounded-none text-sm font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
            >
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AZYMAR Logo ─────────────────────────────────────────────────────────────

function AzymarLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={azymarLogo}
      alt="AZYMAR logo"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

function PacmanCharacter({ 
  id, 
  size = 64, 
  className = "" 
}: { 
  id: number; 
  size?: number; 
  className?: string; 
}) {
  const col = id % 4;
  const row = Math.floor(id / 4);
  const posX = (col * 100) / 3;
  const posY = row * 100;

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${pacmanSprites})`,
        backgroundSize: "400% 200%",
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: "no-repeat"
      }}
    />
  );
}

function ConsoleSymbol({ type, size = 200 }: { type: "square" | "triangle" | "circle" | "x"; size?: number }) {
  const strokeWidth = 12;
  const colorMap = {
    triangle: "#22c55e", // Green
    circle: "#ef4444",   // Red
    x: "#3b82f6",        // Blue
    square: "#ec4899"    // Pink
  };
  const color = colorMap[type];

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className="filter drop-shadow-[6px_6px_0px_rgba(0,0,0,1)]"
    >
      {type === "circle" && (
        <circle 
          cx="50" 
          cy="50" 
          r="38" 
          fill="none" 
          stroke={color} 
          strokeWidth={strokeWidth} 
        />
      )}
      {type === "square" && (
        <rect 
          x="15" 
          y="15" 
          width="70" 
          height="70" 
          fill="none" 
          stroke={color} 
          strokeWidth={strokeWidth} 
          rx="4"
        />
      )}
      {type === "triangle" && (
        <polygon 
          points="50,12 88,82 12,82" 
          fill="none" 
          stroke={color} 
          strokeWidth={strokeWidth} 
          strokeLinejoin="round"
        />
      )}
      {type === "x" && (
        <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
          <line x1="20" y1="20" x2="80" y2="80" />
          <line x1="80" y1="20" x2="20" y2="80" />
        </g>
      )}
    </svg>
  );
}

// ─── Hero AZYMAR illustration ─────────────────────────────────────────────────

function HeroIllustration() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[380px] w-full py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-72 h-72 rounded-full border-2 border-dashed border-primary/20"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        className="absolute w-52 h-52 rounded-full border border-dashed border-[#00D4C8]/30"
      />
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-36 h-36 rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-primary/30 p-3">
          <img src={azymarLogo} alt="AZYMAR" className="w-full h-full object-contain" />
        </div>
        <p className="mt-4 text-3xl font-black text-foreground tracking-widest">AZYMAR</p>
      </motion.div>
      {/* Floating icons */}
      {[
        { emoji: "🏎️", top: "5%", left: "12%", delay: 0 },
        { emoji: "⚔️", top: "12%", right: "12%", delay: 0.5 },
        { emoji: "🎮", bottom: "18%", left: "10%", delay: 1 },
        { emoji: "🏆", bottom: "8%", right: "14%", delay: 1.5 },
        { emoji: "⭐", top: "45%", left: "4%", delay: 0.8 },
      ].map((f, i) => (
        <motion.div
          key={i}
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: f.delay }}
          className="absolute text-2xl"
          style={{ top: f.top, left: (f as any).left, right: (f as any).right, bottom: f.bottom }}
        >
          {f.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Admin Panel ─────────────────────────────────────────────────────────────

const GENRE_OPTIONS = ["Action", "Adventure", "Puzzle", "Racing", "Horror", "Sports", "Arcade", "Casual", "Multiplayer", "Simulation"];
const EMOJI_OPTIONS = ["🎮", "🚀", "⚔️", "🏎️", "👻", "🧩", "🏆", "🎯", "🌊", "🔥", "🌿", "🎲", "🛸", "🦊", "🐉"];
const COLOR_OPTIONS = ["#11B5A4", "#7C3AED", "#EF4444", "#F59E0B", "#3B82F6", "#EC4899", "#10B981", "#F97316", "#06B6D4", "#8B5CF6"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function AdminPanel({
  uploads,
  dbGames,
  onUpload,
  onToggleVisible,
  onDelete,
  onClose,
  onEditGame,
}: {
  uploads: UploadEntry[];
  dbGames: Game[];
  onUpload: (entry: UploadEntry) => void;
  onToggleVisible: (id: number, isDbGame: boolean) => void;
  onDelete: (id: number, isDbGame: boolean) => void;
  onClose: () => void;
  onEditGame?: (id: number, isDbGame: boolean, updatedFields: { title: string; genre: string; thumbnailFile?: File | null; gameFile?: File | null }) => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);
  const [draggingThumbnail, setDraggingThumbnail] = useState(false);
  const [form, setForm] = useState({ title: "", genre: "Action", emoji: "🎮", color: "#11B5A4" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingThumbnail, setPendingThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [tab, setTab] = useState<"upload" | "manage">("upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);

  const [editingItem, setEditingItem] = useState<{
    id: number;
    isDbGame: boolean;
    title: string;
    genre: string;
    thumbnailUrl: string;
  } | null>(null);

  const [editForm, setEditForm] = useState({ title: "", genre: "Action" });
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);
  const editThumbnailInputRef = useRef<HTMLInputElement>(null);
  const [draggingEditThumbnail, setDraggingEditThumbnail] = useState(false);
  const [editGameFile, setEditGameFile] = useState<File | null>(null);
  const [draggingEditGame, setDraggingEditGame] = useState(false);
  const editGameInputRef = useRef<HTMLInputElement>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setEditForm({
        title: editingItem.title,
        genre: editingItem.genre,
      });
      setEditThumbnail(null);
      setEditThumbnailPreview(editingItem.thumbnailUrl);
      setEditGameFile(null);
    }
  }, [editingItem]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const displayItems = [
    ...uploads.map(u => ({
      id: u.id,
      title: u.title,
      genre: u.genre,
      emoji: u.emoji,
      color: u.color,
      status: u.status,
      progress: u.progress,
      visible: u.visible,
      uploadedAt: u.uploadedAt,
      size: u.size || "Uploading...",
      isDbGame: false,
      thumbnailUrl: u.thumbnailUrl || "",
    })),
    ...dbGames
      .filter((g) => !uploads.some((u) => u.title.toLowerCase() === g.title.toLowerCase()))
      .map(g => ({
        id: g.id,
        title: g.title,
        genre: g.genre,
        emoji: g.emoji,
        color: g.color,
        status: "ready" as const,
        progress: 100,
        visible: g.visible !== false,
        uploadedAt: g.uploadedAt ? new Date(g.uploadedAt).toLocaleString() : "Previously uploaded",
        size: "Saved in DB",
        isDbGame: true,
        thumbnailUrl: g.thumbnailUrl || "",
      }))
  ];

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".zip")) {
      toast.error("Only .zip files are supported");
      return;
    }
    const namePart = file.name.replace(/\.zip$/i, "").replace(/[-_]/g, " ");
    const titleCased = namePart.replace(/\b\w/g, (c) => c.toUpperCase());
    setForm((f) => ({ ...f, title: titleCased }));
    setPendingFile(file);
  };

  const handleThumbnail = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      toast.error("Only image files are supported for thumbnails");
      return;
    }
    setPendingThumbnail(file);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleSubmit = () => {
    if (!pendingFile) { toast.error("Please select a ZIP file first"); return; }
    if (!pendingThumbnail) { toast.error("Please upload a thumbnail image first"); return; }
    if (!form.title.trim()) { toast.error("Game title is required"); return; }

    const entry: UploadEntry = {
      id: Date.now(),
      file: pendingFile,
      thumbnailFile: pendingThumbnail,
      title: form.title.trim(),
      genre: form.genre,
      emoji: "🎮",
      color: "#11B5A4",
      status: "processing",
      progress: 0,
      visible: true,
      uploadedAt: new Date().toLocaleString(),
      size: formatBytes(pendingFile.size),
    };

    onUpload(entry);
    setPendingFile(null);
    setPendingThumbnail(null);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview("");
    }
    setForm({ title: "", genre: "Action", emoji: "🎮", color: "#11B5A4" });
    toast.success(`"${entry.title}" is being processed...`);
    setTab("manage");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border-3 border-black rounded-none w-full max-w-2xl max-h-[90vh] overflow-hidden neo-shadow-lg flex flex-col"
      >
        {editingItem ? (
          <>
            {/* Edit Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b-3 border-black">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none border-2 border-black bg-primary/10 flex items-center justify-center">
                  <Pencil size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-black text-foreground text-lg uppercase tracking-wide">Edit Game</h2>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Modify Title, Genre, and Thumbnail</p>
                </div>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none">
                <X size={18} />
              </button>
            </div>

            {/* Edit Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Game Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all font-bold"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Genre</label>
                  <select
                    value={editForm.genre}
                    onChange={(e) => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all font-bold"
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Thumbnail dropzone */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider block mb-1.5">Update Thumbnail Image</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDraggingEditThumbnail(true); }}
                    onDragLeave={() => setDraggingEditThumbnail(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggingEditThumbnail(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const isImage = file.type.startsWith("image/");
                        if (!isImage) { toast.error("Only image files are supported"); return; }
                        setEditThumbnail(file);
                        setEditThumbnailPreview(URL.createObjectURL(file));
                      }
                    }}
                    onClick={() => editThumbnailInputRef.current?.click()}
                    className={`border-3 border-dashed rounded-none p-6 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                      draggingEditThumbnail 
                        ? "border-primary bg-primary/10" 
                        : "border-black bg-white text-black hover:border-primary transition-colors"
                    }`}
                  >
                    <input
                      ref={editThumbnailInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const isImage = file.type.startsWith("image/");
                          if (!isImage) { toast.error("Only image files are supported"); return; }
                          setEditThumbnail(file);
                          setEditThumbnailPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    {editThumbnailPreview ? (
                      <div className="flex items-center gap-4 w-full text-black">
                        <img
                          src={editThumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-20 h-16 object-cover rounded-none border-2 border-black shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs uppercase truncate">{editThumbnail ? editThumbnail.name : "Current Stored Thumbnail"}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                            {editThumbnail ? formatBytes(editThumbnail.size) : "Using saved image"} · Click to replace
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 flex flex-col items-center justify-center">
                        <FolderOpen size={24} className="text-neutral-500 mb-1" />
                        <p className="font-bold text-xs uppercase">Drag & drop image or click to browse</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Game File dropzone */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider block mb-1.5">Update Game Files (.zip)</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDraggingEditGame(true); }}
                    onDragLeave={() => setDraggingEditGame(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggingEditGame(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        if (!file.name.endsWith(".zip")) { toast.error("Only .zip files are supported"); return; }
                        setEditGameFile(file);
                      }
                    }}
                    onClick={() => editGameInputRef.current?.click()}
                    className={`border-3 border-dashed rounded-none p-6 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                      draggingEditGame 
                        ? "border-primary bg-primary/10" 
                        : "border-black bg-white text-black hover:border-primary transition-colors"
                    }`}
                  >
                    <input
                      ref={editGameInputRef}
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.name.endsWith(".zip")) { toast.error("Only .zip files are supported"); return; }
                          setEditGameFile(file);
                        }
                      }}
                    />
                    {editGameFile ? (
                      <div className="flex flex-col items-center justify-center text-black w-full text-center">
                        <p className="font-bold text-xs uppercase truncate w-full px-4">{editGameFile.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          {formatBytes(editGameFile.size)} · Click to replace
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4 flex flex-col items-center justify-center">
                        <Upload size={24} className="text-neutral-500 mb-1" />
                        <p className="font-bold text-xs uppercase">Drag & drop .zip file or click to browse</p>
                        <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">Leave blank to keep existing files</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t-3 border-black bg-neutral-900 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setEditingItem(null)}
                className="px-6 py-2.5 bg-white text-black border-2 border-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editForm.title.trim()) {
                    toast.error("Please enter a game title");
                    return;
                  }
                  setLoadingEdit(true);
                  try {
                    await onEditGame?.(editingItem.id, editingItem.isDbGame, {
                      title: editForm.title,
                      genre: editForm.genre,
                      thumbnailFile: editThumbnail,
                      gameFile: editGameFile,
                    });
                    setEditingItem(null);
                  } catch (err: any) {
                    toast.error(`Update failed: ${err.message}`);
                  } finally {
                    setLoadingEdit(false);
                  }
                }}
                disabled={loadingEdit || !editForm.title.trim()}
                className="px-6 py-2.5 bg-primary text-primary-foreground border-2 border-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b-3 border-black">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none border-2 border-black bg-primary/10 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-black text-foreground text-lg uppercase tracking-wide">Admin Panel</h2>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Game Upload Manager</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-3 border-black px-6 bg-neutral-900">
              {(["upload", "manage"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-2 px-6 py-3.5 text-xs font-black uppercase tracking-wider border-b-4 transition-all cursor-pointer ${
                    tab === t
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-white"
                  }`}
                >
                  {t === "upload" ? <Upload size={14} /> : <Settings size={14} />}
                  {t === "upload" ? "Upload Game" : "Manage Games"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {tab === "upload" ? (
                <div className="space-y-4">
                  {/* Drag-and-drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-3 border-dashed rounded-none p-8 text-center cursor-pointer transition-all ${
                      dragging 
                        ? "border-primary bg-primary/10" 
                        : pendingFile 
                          ? "border-emerald-500 bg-emerald-50/30 text-emerald-800" 
                          : "border-black bg-white text-black hover:border-primary transition-colors"
                    }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                    <div className="flex flex-col items-center justify-center">
                      <Upload size={32} className="mb-2 text-neutral-500" />
                      {pendingFile ? (
                        <div>
                          <p className="font-bold text-xs uppercase text-emerald-600">Game zip selected successfully!</p>
                          <p className="font-black text-sm text-black mt-1 uppercase">{pendingFile.name}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-1">{formatBytes(pendingFile.size)} · Click to change file</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-xs uppercase text-black">Drag & drop game zip folder or click to browse</p>
                          <p className="text-[10px] text-neutral-500 font-semibold mt-1">HTML5 / WebGL games bundled as a standard .zip (must contain index.html at root)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Title input */}
                    <div className="text-foreground">
                      <label className="text-xs font-black uppercase tracking-wider block mb-1">Game Title</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="My Awesome Arcade Game"
                        className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all font-semibold"
                      />
                    </div>

                    {/* Genre select */}
                    <div className="text-foreground">
                      <label className="text-xs font-black uppercase tracking-wider block mb-1">Genre</label>
                      <select
                        value={form.genre}
                        onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all font-semibold"
                      >
                        {GENRE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 text-foreground">
                      <label className="text-xs font-black uppercase tracking-wider block mb-1.5">Game Thumbnail Image</label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDraggingThumbnail(true); }}
                        onDragLeave={() => setDraggingThumbnail(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDraggingThumbnail(false);
                          const file = e.dataTransfer.files[0];
                          if (file) handleThumbnail(file);
                        }}
                        onClick={() => thumbnailRef.current?.click()}
                        className={`border-3 border-dashed rounded-none p-4 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                          draggingThumbnail 
                            ? "border-primary bg-primary/10" 
                            : pendingThumbnail 
                              ? "border-emerald-500 bg-emerald-50/30" 
                              : "border-black bg-white text-black hover:border-primary transition-colors"
                        }`}
                      >
                        <input
                          ref={thumbnailRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnail(f); }}
                        />
                        {pendingThumbnail ? (
                          <div className="flex items-center gap-3 w-full text-black">
                            {thumbnailPreview && (
                              <img
                                src={thumbnailPreview}
                                alt="Thumbnail preview"
                                className="w-16 h-12 object-cover rounded-none border-2 border-black shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs uppercase truncate">{pendingThumbnail.name}</p>
                              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{formatBytes(pendingThumbnail.size)} · Click to change</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2 flex flex-col items-center justify-center">
                            <FolderOpen size={20} className="text-neutral-500 mb-1" />
                            <p className="font-bold text-xs uppercase">Drag & drop game thumbnail or click to browse</p>
                            <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">PNG, JPG, JPEG or WEBP files</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview card */}
                  {(pendingFile || pendingThumbnail || form.title) && (
                    <div className="rounded-none border-3 border-black overflow-hidden bg-white text-black neo-shadow">
                      <p className="text-[10px] text-neutral-500 px-4 pt-3 pb-2 font-black uppercase tracking-wider border-b-2 border-black">Preview</p>
                      <div className="px-4 pb-4 pt-2">
                        <div className="flex items-center gap-3 p-3 bg-neutral-100 border-2 border-black rounded-none">
                          <div
                            className="w-12 h-12 rounded-none border-2 border-black flex items-center justify-center text-2xl shrink-0 bg-white overflow-hidden"
                          >
                            {thumbnailPreview ? (
                              <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-neutral-400 text-[10px] font-black uppercase">Image</span>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-black text-sm">{form.title || "Untitled Game"}</p>
                            <p className="text-xs text-muted-foreground font-semibold uppercase">{form.genre} · NEW</p>
                          </div>
                          <div className="ml-auto">
                            <span className="text-[9px] font-black text-white bg-red-600 border-2 border-black px-2 py-0.5 rounded-none uppercase tracking-wider">NEW</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!pendingFile || !pendingThumbnail}
                    className="w-full py-3.5 bg-primary text-primary-foreground rounded-none font-black text-xs uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Upload size={16} /> Upload & Publish Game
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayItems.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Package size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-bold uppercase tracking-wider text-sm">No games uploaded yet</p>
                      <p className="text-xs mt-1">Switch to the Upload tab to add your first game</p>
                    </div>
                  ) : (
                    displayItems.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-4 rounded-none border-3 border-black bg-card/95 neo-shadow hover:translate-y-[-1px] transition-all"
                      >
                        <div
                          className="w-12 h-12 rounded-none border-2 border-black flex items-center justify-center text-2xl shrink-0 bg-white"
                          style={{ background: `${entry.color}25` }}
                        >
                          {entry.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground text-sm truncate">{entry.title}</p>
                            {entry.status === "processing" && (
                              <span className="text-[9px] font-black text-amber-800 bg-amber-200 border border-black px-2 py-0.5 rounded-none uppercase tracking-wider">Processing</span>
                            )}
                            {entry.status === "ready" && (
                              <span className="text-[9px] font-black text-emerald-800 bg-emerald-200 border border-black px-2 py-0.5 rounded-none uppercase tracking-wider">Live</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase mt-0.5">{entry.genre} · {entry.size} · {entry.uploadedAt}</p>
                          {entry.status === "processing" && (
                            <div className="mt-2 h-2.5 bg-muted border-2 border-black rounded-none overflow-hidden">
                              <motion.div
                                animate={{ width: `${entry.progress}%` }}
                                className="h-full bg-primary"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setEditingItem({
                                id: entry.id,
                                isDbGame: entry.isDbGame,
                                title: entry.title,
                                genre: entry.genre,
                                thumbnailUrl: entry.thumbnailUrl || ""
                              });
                            }}
                            className="p-2 border-2 border-black bg-yellow-400 text-black rounded-none hover:bg-yellow-500 transition-colors cursor-pointer"
                            title="Edit game details & thumbnail"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => onToggleVisible(entry.id, entry.isDbGame)}
                            className={`p-2 border-2 border-black rounded-none transition-colors cursor-pointer ${entry.visible ? "bg-primary text-primary-foreground" : "bg-neutral-800 text-muted-foreground"}`}
                            title={entry.visible ? "Hide from players" : "Show to players"}
                          >
                            {entry.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            onClick={() => onDelete(entry.id, entry.isDbGame)}
                            className="p-2 border-2 border-black bg-red-600 text-white rounded-none hover:bg-red-700 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LegalModal({
  activeTab,
  setActiveTab,
  onClose,
}: {
  activeTab: "privacy" | "terms" | "cookies" | "about" | "faq" | "contact";
  setActiveTab: (tab: "privacy" | "terms" | "cookies" | "about" | "faq" | "contact") => void;
  onClose: () => void;
}) {
  const content = {
    privacy: {
      title: "Privacy Policy",
      subtitle: "Last updated: July 2026",
      paragraphs: [
        {
          heading: "1. Data Collection",
          text: "We collect only essential information, specifically your email address and profile metadata when you register or sign in via Supabase Auth or Google/Discord OAuth. This data is used solely to identify your account and personalize your AZYMAR experience.",
        },
        {
          heading: "2. Game & Save Data",
          text: "To preserve your experience, we save metadata regarding your uploaded games, active save states, play progress, ratings, and gameplay statistics on our secure cloud database.",
        },
        {
          heading: "3. Information Security",
          text: "We implement industry-standard encryption and security measures. Since your account is powered by Supabase, authentication is protected by secure token exchange. We never share or sell your personal details to third parties.",
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      subtitle: "Last updated: July 2026",
      paragraphs: [
        {
          heading: "1. Agreement to Terms",
          text: "By accessing or playing games on the AZYMAR platform, you agree to comply with and be bound by these Terms of Service. If you disagree with any part, you must refrain from using the platform.",
        },
        {
          heading: "2. Account Termination",
          text: "We reserve the right to remove any uploaded games or terminate accounts that breach copyright rules, distribute malicious code, or degrade the platform experience without prior notice.",
        },
        {
          heading: "3. Disclaimer & Limitations",
          text: "AZYMAR platform and hosted games are provided 'as is' without warranty of any kind. We are not liable for data loss, browser crash, score reset, or system damages resulting from game executions.",
        },
      ],
    },
    cookies: {
      title: "Cookie Policy",
      subtitle: "Last updated: July 2026",
      paragraphs: [
        {
          heading: "1. What are Cookies?",
          text: "Cookies are small text files placed on your device to help websites run properly. We also use modern browser mechanisms like LocalStorage for game storage.",
        },
        {
          heading: "2. How We Use Cookies",
          text: "We use only strictly essential cookies to manage user session persistence and secure your authentication state. These cookies expire automatically when your session closes.",
        },
        {
          heading: "3. No Advertising Cookies",
          text: "We are committed to a clean user interface. AZYMAR does not use marketing, advertising, profiling, or third-party tracking cookies.",
        },
        {
          heading: "4. Managing Preferences",
          text: "You can configure your browser to block or erase cookies, but please note that doing so will sign you out and prevent save data or custom game publishing functions from operating correctly.",
        },
      ],
    },
    about: {
      title: "About AZYMAR STUDIO",
      subtitle: "Arcade Gaming Redefined",
      paragraphs: [
        {
          heading: "Our Mission",
          text: "AZYMAR STUDIO is a independant gaming studio.We build interactive tools that enable indie creators and retro gamer to host,publish,and enjoy games instantly",
        },
        {
          heading: "Zero-Install Instant Play",
          text: "By utilizing advanced zip extraction and temporary blob serving, we run complete web games directly inside sandboxed iframe containers, offering full security and native browser execution speeds.",
        },
        {
          heading: "Join The Crew",
          text: "Connect with our creators, subscribe to our newsletter, and help us expand the limits of open-web arcade gaming. Let's make games fun, accessible, and fast.",
        },
      ],
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Answers to common questions",
      paragraphs: [
        {
          heading: "Q: How do I play games on AZYMAR?",
          text: "Simply browse our catalog, click on any game card, and hit 'Play Now' or 'Play Free'. The game will launch instantly in our high-performance in-browser container. No installations or downloads are required.",
        },
        {
          heading: "Q: Is AZYMAR free to use?",
          text: "Yes! All games hosted on the AZYMAR playground are 100% free to play. We are committed to keeping web-based gaming open and accessible to all.",
        },
        {
          heading: "Q: How do I save my progress and high scores?",
          text: "You can sign up for a free account. Doing so allows you to track your game progress, save scores, mark games as favorites, and manage your play statistics across devices.",
        },
      ],
    },
    contact: {
      title: "Contact Support",
      subtitle: "We are here to help",
      paragraphs: [
        {
          heading: "Email Support",
          text: "For general inquiries, bug reports, publisher questions, or feedback, send an email to: azymar03@gmail.com. We typically respond within 24-48 hours.",
        },
        {
          heading: "Official Discord Community",
          text: "Join our active community on Discord to discuss games, report issues, and chat directly with developers at: https://discord.gg/dnAXsrr8A",
        },
        {
          heading: "Mailing Address",
          text: "AZYMAR,salem,Tamilnadu,India",
        },
      ],
    },
  };

  const activeContent = content[activeTab];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm text-foreground"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border-3 border-black rounded-none w-full max-w-2xl max-h-[85vh] overflow-hidden neo-shadow-lg flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-3 border-black">
          <div>
            <h2 className="font-black text-foreground text-lg uppercase tracking-wide">Legal Center</h2>
            <p className="text-xs text-muted-foreground uppercase font-semibold">AZYMAR STUDIO</p>
          </div>
          <button onClick={onClose} className="p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap border-b-3 border-black px-6 bg-neutral-900">
          {([
            { id: "about", label: "About Us" },
            { id: "faq", label: "FAQ" },
            { id: "contact", label: "Contact Us" },
            { id: "privacy", label: "Privacy Policy" },
            { id: "terms", label: "Terms of Service" },
            { id: "cookies", label: "Cookie Policy" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-4 transition-all cursor-pointer ${
                activeTab === t.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content container */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-neutral-900 [&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-wide">{activeContent.title}</h1>
            <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">{activeContent.subtitle}</p>
          </div>
          <div className="space-y-5 border-t-2 border-black pt-5 text-muted-foreground">
            {activeContent.paragraphs.map((p, idx) => (
              <div key={idx} className="space-y-1.5">
                <h3 className="font-black text-foreground uppercase tracking-wide text-sm">{p.heading}</h3>
                <p className="text-sm leading-relaxed text-neutral-300">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t-3 border-black bg-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-primary-foreground border-2 border-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}


function SignInView({
  setUser,
  navigateTo,
  setShowAdmin,
}: {
  setUser: (user: any) => void;
  navigateTo: (page: "home" | "signin" | "account") => void;
  setShowAdmin?: (show: boolean) => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    if (!supabase) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setUser({
        email,
        user_metadata: {
          full_name: email.split("@")[0],
        },
      });
      toast.success("Welcome to AZYMAR! (Local Mode) 🎮");
      setLoading(false);
      if (email === "azymar03@gmail.com") {
        setShowAdmin?.(true);
        navigateTo("home");
      } else {
        navigateTo("account");
      }
      return;
    }

    try {
      if (tab === "login") {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            if (email === "azymar03@gmail.com" && password === "azymar#123") {
              const { error: signUpError } = await supabase.auth.signUp({ email, password });
              if (signUpError) throw signUpError;
              const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
              if (signInError) throw signInError;
            } else {
              throw error;
            }
          }
        } catch (authErr: any) {
          if (email === "azymar03@gmail.com" && password === "azymar#123") {
            setUser({
              email,
              id: "local-admin-uid",
              user_metadata: { full_name: "Admin" }
            });
            toast.success("Welcome back to AZYMAR! (Admin Local Mode) 🎮");
          } else {
            throw authErr;
          }
        }
        toast.success("Welcome back to AZYMAR! 🎮");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created successfully! Check your email to confirm.");
      }
      if (email === "azymar03@gmail.com") {
        setShowAdmin?.(true);
        navigateTo("home");
      } else {
        navigateTo("account");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "discord") => {
    if (!supabase) {
      const toastId = toast.loading(`Logging in with ${provider}...`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUser({
        email: `gamer@${provider}.com`,
        user_metadata: {
          full_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Gamer`,
        },
      });
      toast.success(`Welcome to AZYMAR! Logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)} (Local Mode) 🎮`, { id: toastId });
      navigateTo("account");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/?page=account`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(`OAuth login failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 relative text-foreground">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
      <div className="bg-card border-3 border-black rounded-none p-8 w-full max-w-md neo-shadow-lg relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-1">
            <AzymarLogo size={36} />
            <span className="font-black text-foreground text-2xl tracking-wide uppercase">AZYMAR</span>
          </div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Sign in to your game hub</p>
        </div>

        <div className="flex border-3 border-black p-1 bg-neutral-900 mb-6 rounded-none">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tab === t 
                  ? "bg-primary text-primary-foreground border-2 border-black [box-shadow:2px_2px_0px_0px_#000000]" 
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-none font-black text-xs uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-black" />
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <span className="bg-card px-2">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "google" as const, label: "Google", icon: "🌐" },
            { id: "discord" as const, label: "Discord", icon: "💬" },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => handleOAuth(p.id)}
              className="flex items-center justify-center gap-2 py-2.5 bg-white text-black border-3 border-black rounded-none text-sm font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
            >
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountView({
  user,
  navigateTo,
  favorites,
  allGames,
  toggleFavorite,
  handlePlayGame,
}: {
  user: any;
  navigateTo: (page: "home" | "signin" | "account") => void;
  favorites: number[];
  allGames: Game[];
  toggleFavorite: (gameId: number) => void;
  handlePlayGame: (game: Game) => void;
}) {
  const favoriteGames = allGames.filter((g) => favorites.includes(g.id));
  const avatarSrc = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 relative text-foreground">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
      
      {/* Success banner */}
      <div className="bg-emerald-500/10 text-emerald-400 border-3 border-emerald-500 p-6 rounded-none flex items-center gap-4 neo-shadow">
        <div className="w-12 h-12 bg-emerald-500 text-neutral-900 border-2 border-black flex items-center justify-center text-2xl shrink-0 font-bold">
          ✓
        </div>
        <div>
          <h2 className="font-black text-lg uppercase tracking-wide">Account Signed In Successfully!</h2>
          <p className="text-sm font-medium text-emerald-400/80">Welcome back, your session is active and secure.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Profile Card */}
        <div className="bg-card border-3 border-black rounded-none p-6 neo-shadow space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-none border-3 border-black bg-primary/10 flex items-center justify-center font-black text-primary text-3xl mb-4 overflow-hidden">
              {avatarSrc ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src={avatarSrc} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <span style={{ display: 'none' }} className="w-full h-full flex items-center justify-center font-black text-primary text-3xl">
                    {(user?.user_metadata?.full_name || user?.email || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              ) : (
                (user?.user_metadata?.full_name || user?.email || "?").charAt(0).toUpperCase()
              )}
            </div>
            <h3 className="font-black text-xl text-foreground uppercase tracking-wide">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </h3>
            <span className="text-[10px] text-primary border-2 border-black px-2 py-0.5 mt-2 uppercase font-black tracking-wider bg-primary/10">
              Verified Player
            </span>
          </div>

          <div className="border-t-3 border-black pt-5 space-y-3.5 text-xs font-semibold uppercase tracking-wider">
            <div>
              <span className="text-muted-foreground block mb-0.5">Email address</span>
              <span className="text-foreground font-bold normal-case text-sm">{user?.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">User identifier ID</span>
              <span className="text-foreground font-mono text-[10px] select-all break-all">{user?.id || "N/A"}</span>
            </div>
          </div>

          <button
            onClick={() => navigateTo("home")}
            className="w-full py-3 bg-white text-black border-3 border-black rounded-none font-black text-xs uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-1.5 cursor-pointer"
          >
            ← Back to Arcade
          </button>
        </div>

        {/* Favorites and activities */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border-3 border-black rounded-none p-6 neo-shadow">
            <h3 className="font-black text-lg text-foreground uppercase tracking-wide mb-5 flex items-center gap-2">
              ❤️ Favorited Games ({favoriteGames.length})
            </h3>
            
            {favoriteGames.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-700 bg-neutral-900/50">
                <span className="text-4xl">👾</span>
                <h4 className="font-bold text-foreground mt-3 uppercase tracking-wide">No favorites yet</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Explore our premium retro game arcade catalog and heart games to save them here.
                </p>
                <button
                  onClick={() => navigateTo("home")}
                  className="mt-4 px-5 py-2 bg-primary text-primary-foreground border-2 border-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
                >
                  Browse Games
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {favoriteGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex border-2 border-black bg-neutral-900 rounded-none overflow-hidden items-center group relative p-3 gap-3"
                  >
                    <div
                      className="w-14 h-14 rounded-none border border-black flex items-center justify-center text-2xl shrink-0"
                      style={{ background: `${game.color}22` }}
                    >
                      {game.thumbnailUrl ? (
                        <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
                      ) : (
                        game.emoji
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-foreground text-sm uppercase tracking-wide truncate">{game.title}</h4>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">{game.genre}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePlayGame(game)}
                        className="p-2 bg-primary text-primary-foreground border border-black rounded-none hover:translate-y-[-1px] transition-transform cursor-pointer"
                        title="Play"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button
                        onClick={() => toggleFavorite(game.id)}
                        className="p-2 bg-neutral-800 text-red-500 border border-black rounded-none hover:translate-y-[-1px] transition-transform cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [logoState, setLogoState] = useState<"logo" | "triangle" | "circle" | "x" | "square">("logo");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLogoState("triangle");
    }, 600);

    const timer2 = setTimeout(() => {
      setLogoState("circle");
    }, 1100);

    const timer3 = setTimeout(() => {
      setLogoState("x");
    }, 1600);

    const timer4 = setTimeout(() => {
      setLogoState("square");
    }, 2100);

    const timer5 = setTimeout(() => {
      setShowIntro(false);
    }, 2650);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  const [dark, setDark] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [trendingIdx, setTrendingIdx] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [email, setEmail] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [remoteGames, setRemoteGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [activePlayUrl, setActivePlayUrl] = useState<string | null>(null);
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [user, setUser] = useState<any>(null);
  const adminUnlocked = user?.email === "azymar03@gmail.com";

  const [activeLegalTab, setActiveLegalTab] = useState<"privacy" | "terms" | "cookies" | "about" | "faq" | "contact" | null>(null);
  const [currentPage, setCurrentPage] = useState<"home" | "signin" | "account">(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("page");
    if (p === "signin" || p === "account") return p;
    return "home";
  });

  const navigateTo = (page: "home" | "signin" | "account") => {
    setCurrentPage(page);
    const params = new URLSearchParams(window.location.search);
    if (page === "home") {
      params.delete("page");
    } else {
      params.set("page", page);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.pushState({}, document.title, newUrl);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("page");
      if (p === "signin" || p === "account") {
        setCurrentPage(p as any);
      } else {
        setCurrentPage("home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigateTo("signin");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auth Guard
  useEffect(() => {
    if (currentPage === "account" && !user) {
      navigateTo("signin");
    }
  }, [currentPage, user]);
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("azymar_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("azymar_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (gameId: number) => {
    if (favorites.includes(gameId)) {
      setFavorites((prev) => prev.filter((id) => id !== gameId));
      toast.success("Removed from favorites!");
    } else {
      setFavorites((prev) => [...prev, gameId]);
      toast.success("Added to favorites! ❤️");
    }
  };

  const handleShareGame = (gameId: number, gameTitle: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success(`Link for "${gameTitle}" copied to clipboard! 🔗`);
    }).catch(() => {
      toast.error("Failed to copy link.");
    });
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const gamesRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);

  const allGames = [...GAMES, ...remoteGames];

  // Parse share link and legal modals on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const legalTab = params.get("legal");
    if (legalTab === "privacy" || legalTab === "terms" || legalTab === "cookies" || legalTab === "about" || legalTab === "faq" || legalTab === "contact") {
      setActiveLegalTab(legalTab as any);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return;
    }

    if (allGames.length > 0) {
      const sharedGameId = params.get("game");
      if (sharedGameId) {
        const gameIdNum = parseInt(sharedGameId, 10);
        const sharedGame = allGames.find((g) => g.id === gameIdNum);
        if (sharedGame) {
          setSelectedGame(sharedGame);
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    }
  }, [allGames.length]);

  // Set page background image on load
  useEffect(() => {
    document.body.style.backgroundImage = `linear-gradient(rgba(11, 9, 51, 0.75), rgba(7, 5, 36, 0.85)), url(${synthwaveBg})`;
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundColor = '#09071f';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Listen for Supabase Auth state changes
  useEffect(() => {
    if (!supabase) return;

    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        setShowLogin(false);
        const params = new URLSearchParams(window.location.search);
        const p = params.get("page");
        if (session.user.email === "azymar03@gmail.com") {
          setShowAdmin(true);
          navigateTo("home");
        } else if (p === "signin" || !p) {
          navigateTo("account");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Lock body scroll when game is playing
  useEffect(() => {
    if (activePlayUrl) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activePlayUrl]);

  const handleSignOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(`Sign out failed: ${error.message}`);
      } else {
        toast.success("Signed out successfully");
      }
    } else {
      setUser(null);
      toast.success("Signed out successfully (Local Mode)");
    }
  };

  // Auto-advance trending carousel
  useEffect(() => {
    if (allGames.length === 0) return;
    const t = setInterval(() => setTrendingIdx((i) => (i + 1) % allGames.length), 5000);
    return () => clearInterval(t);
  }, [allGames.length]);

  useEffect(() => {
    async function fetchGames() {
      if (!supabase) {
        setLoadingGames(false);
        return;
      }
      setLoadingGames(true);
      try {
        const { data, error } = await supabase.from('games').select('*');
        if (error) {
          console.error('Error fetching games:', error);
          toast.error('Failed to load games from server.');
          setRemoteGames([]);
        } else {
          const mapped = (data || []).map((g: any) => ({
            id: g.id,
            title: g.title,
            genre: g.genre,
            rating: g.rating,
            plays: g.plays,
            badge: g.badge,
            color: g.color,
            emoji: g.emoji,
            visible: g.visible,
            isUploaded: g.is_uploaded,
            uploadedAt: g.uploaded_at,
            zipUrl: g.zip_url,
            thumbnailUrl: g.thumbnail_url,
          }));
          setRemoteGames(mapped as Game[]);
        }
      } catch (err) {
        console.error('Error fetching games:', err);
      } finally {
        setLoadingGames(false);
      }
    }
    fetchGames();
  }, []);



  const filteredGames = allGames.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleGames = activeCategory
    ? filteredGames.filter((g) => g.genre === activeCategory)
    : filteredGames;



  const handleUpload = async (entry: UploadEntry) => {
    // 1. Add entry to local uploads state so it shows up in Admin Panel
    setUploads((prev) => [...prev, entry]);

    if (!supabase) {
      // Local Mock Upload Fallback
      // Simulate progress
      for (let i = 10; i <= 90; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setUploads((prev) => prev.map((u) => u.id === entry.id ? { ...u, progress: i } : u));
      }

      const newGameId = Date.now();
      const mockBlobUrl = URL.createObjectURL(entry.file);
      let mockThumbnailUrl = "";
      if (entry.thumbnailFile) {
        mockThumbnailUrl = URL.createObjectURL(entry.thumbnailFile);
      }

      const mockGame: Game = {
        id: newGameId,
        title: entry.title,
        genre: entry.genre,
        rating: 0,
        plays: '0',
        badge: 'NEW',
        color: entry.color || '#11B5A4',
        emoji: entry.emoji || '🎮',
        zipUrl: mockBlobUrl,
        thumbnailUrl: mockThumbnailUrl || undefined,
        isUploaded: true,
        uploadedAt: new Date().toISOString(),
        visible: true,
      } as any;

      setRemoteGames((prev) => [...prev, mockGame]);
      setUploads((prev) =>
        prev.map((u) =>
          u.id === entry.id ? { ...u, progress: 100, status: "ready", uploadedAt: new Date().toLocaleString() } : u
        )
      );
      toast.success(`"${entry.title}" is now live (Local Mode)! 🎮`);
      return;
    }

    // 2. Upload ZIP to Supabase Storage
    const filePath = `${entry.title.replace(/\s+/g, "_")}_${Date.now()}.zip`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('game-files')
      .upload(filePath, entry.file);

    if (storageError) {
      toast.error(`Upload failed: ${storageError.message}`);
      setUploads((prev) => prev.map((u) => u.id === entry.id ? { ...u, status: "error" } : u));
      return;
    }

    // Get public URL of ZIP
    const { data: publicData } = supabase.storage.from('game-files').getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl;

    // 3. Upload Thumbnail if present
    let thumbnailUrl = "";
    if (entry.thumbnailFile) {
      const ext = entry.thumbnailFile.name.split('.').pop();
      const thumbPath = `${entry.title.replace(/\s+/g, "_")}_thumb_${Date.now()}.${ext}`;
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('game-files')
        .upload(thumbPath, entry.thumbnailFile);

      if (thumbError) {
        console.error('Thumbnail upload failed:', thumbError.message);
      } else {
        const { data: thumbPublicData } = supabase.storage.from('game-files').getPublicUrl(thumbPath);
        thumbnailUrl = thumbPublicData?.publicUrl || "";
      }
    }

    // 4. Insert game metadata into Supabase DB
    const newGame = {
      title: entry.title,
      genre: entry.genre,
      rating: 0,
      plays: '0',
      badge: 'NEW' as const,
      color: '#11B5A4', // default color fallback
      emoji: '🎮', // default emoji fallback
      zip_url: publicUrl,
      thumbnail_url: thumbnailUrl || null,
      is_uploaded: true,
      uploaded_at: new Date().toISOString(),
      visible: true,
    };

    const { data: dbData, error: dbError } = await supabase
      .from('games')
      .insert([newGame])
      .select();

    if (dbError) {
      toast.error(`Database error: ${dbError.message}`);
      setUploads((prev) => prev.map((u) => u.id === entry.id ? { ...u, status: "error" } : u));
      return;
    }

    // 5. Update the local uploads array status to "ready"
    setUploads((prev) =>
      prev.map((u) =>
        u.id === entry.id ? { ...u, progress: 100, status: "ready", uploadedAt: new Date().toLocaleString() } : u
      )
    );

    // 6. Instantly push to remoteGames state so it displays dynamically
    if (dbData && dbData[0]) {
      const g = dbData[0];
      const mappedGame: Game = {
        id: g.id,
        title: g.title,
        genre: g.genre,
        rating: g.rating,
        plays: g.plays,
        badge: g.badge,
        color: g.color,
        emoji: g.emoji,
        visible: g.visible,
        isUploaded: g.is_uploaded,
        uploadedAt: g.uploaded_at,
        zipUrl: g.zip_url,
        thumbnailUrl: g.thumbnail_url,
      } as any;
      setRemoteGames((prev) => [...prev, mappedGame]);
    }

    toast.success(`"${entry.title}" is now live! 🎮`);
  };

  const handleToggleVisible = async (id: number, isDbGame: boolean) => {
    if (isDbGame) {
      const game = remoteGames.find((g) => g.id === id);
      if (!game) return;
      const nextVisible = !game.visible;
      setRemoteGames((prev) =>
        prev.map((g) => (g.id === id ? { ...g, visible: nextVisible } : g))
      );
      if (!supabase) {
        toast.info("Visibility updated locally (Local Mode).");
        return;
      }
      const { error } = await supabase
        .from('games')
        .update({ visible: nextVisible })
        .eq('id', id);
      if (error) {
        toast.error(`Failed to update visibility: ${error.message}`);
        setRemoteGames((prev) =>
          prev.map((g) => (g.id === id ? { ...g, visible: !nextVisible } : g))
        );
      } else {
        toast.success(`Game visibility updated!`);
      }
    } else {
      setUploads((prev) => prev.map((u) => u.id === id ? { ...u, visible: !u.visible } : u));
    }
  };

  const handleDeleteUpload = async (id: number, isDbGame: boolean) => {
    if (isDbGame) {
      const game = remoteGames.find((g) => g.id === id);
      if (!game) return;
      const toastId = toast.loading(`Deleting "${game.title}"...`);
      if (!supabase) {
        setRemoteGames((prev) => prev.filter((g) => g.id !== id));
        toast.success(`"${game.title}" deleted locally!`, { id: toastId });
        return;
      }
      try {
        const { error: dbError } = await supabase
          .from('games')
          .delete()
          .eq('id', id);
        if (dbError) throw dbError;
        setRemoteGames((prev) => prev.filter((g) => g.id !== id));
        toast.success(`"${game.title}" deleted successfully!`, { id: toastId });
      } catch (err: any) {
        console.error(err);
        toast.error(`Delete failed: ${err.message}`, { id: toastId });
      }
    } else {
      setUploads((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const handleEditGame = async (
    id: number,
    isDbGame: boolean,
    updatedFields: { title: string; genre: string; thumbnailFile?: File | null; gameFile?: File | null }
  ) => {
    const toastId = toast.loading(`Updating "${updatedFields.title}"...`);
    try {
      let nextThumbnailUrl: string | undefined = undefined;
      let nextZipUrl: string | undefined = undefined;

      if (isDbGame) {
        if (!supabase) {
          if (updatedFields.thumbnailFile) {
            nextThumbnailUrl = URL.createObjectURL(updatedFields.thumbnailFile);
          }
          if (updatedFields.gameFile) {
            nextZipUrl = URL.createObjectURL(updatedFields.gameFile);
          }
          setRemoteGames((prev) =>
            prev.map((g) =>
              g.id === id
                ? {
                    ...g,
                    title: updatedFields.title,
                    genre: updatedFields.genre,
                    ...(nextThumbnailUrl ? { thumbnailUrl: nextThumbnailUrl } : {}),
                    ...(nextZipUrl ? { zipUrl: nextZipUrl } : {}),
                  }
                : g
            )
          );
          toast.success("Game updated locally! 🎮", { id: toastId });
          return;
        }

        if (updatedFields.thumbnailFile) {
          const ext = updatedFields.thumbnailFile.name.split('.').pop();
          const thumbPath = `${updatedFields.title.replace(/\s+/g, "_")}_thumb_${Date.now()}.${ext}`;
          const { data: thumbData, error: thumbError } = await supabase.storage
            .from('game-files')
            .upload(thumbPath, updatedFields.thumbnailFile);

          if (thumbError) {
            throw new Error(`Thumbnail upload failed: ${thumbError.message}`);
          }
          const { data: thumbPublicData } = supabase.storage.from('game-files').getPublicUrl(thumbPath);
          nextThumbnailUrl = thumbPublicData?.publicUrl || "";
        }

        if (updatedFields.gameFile) {
          const filePath = `${updatedFields.title.replace(/\s+/g, "_")}_${Date.now()}.zip`;
          const { data: storageData, error: storageError } = await supabase.storage
            .from('game-files')
            .upload(filePath, updatedFields.gameFile);

          if (storageError) {
            throw new Error(`Game file upload failed: ${storageError.message}`);
          }
          const { data: publicData } = supabase.storage.from('game-files').getPublicUrl(filePath);
          nextZipUrl = publicData?.publicUrl || "";
        }

        const updateData: any = {
          title: updatedFields.title,
          genre: updatedFields.genre,
        };
        if (nextThumbnailUrl) {
          updateData.thumbnail_url = nextThumbnailUrl;
        }
        if (nextZipUrl) {
          updateData.zip_url = nextZipUrl;
        }

        const { error: dbError } = await supabase
          .from('games')
          .update(updateData)
          .eq('id', id);

        if (dbError) throw dbError;

        setRemoteGames((prev) =>
          prev.map((g) =>
            g.id === id
              ? {
                  ...g,
                  title: updatedFields.title,
                  genre: updatedFields.genre,
                  ...(nextThumbnailUrl ? { thumbnailUrl: nextThumbnailUrl } : {}),
                  ...(nextZipUrl ? { zipUrl: nextZipUrl } : {}),
                }
              : g
          )
        );
        toast.success(`"${updatedFields.title}" updated successfully! 🎮`, { id: toastId });
      } else {
        if (updatedFields.thumbnailFile) {
          nextThumbnailUrl = URL.createObjectURL(updatedFields.thumbnailFile);
        }
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  title: updatedFields.title,
                  genre: updatedFields.genre,
                  ...(nextThumbnailUrl ? { thumbnailUrl: nextThumbnailUrl } : {}),
                  ...(updatedFields.gameFile ? { file: updatedFields.gameFile } : {}),
                }
              : u
          )
        );
        toast.success("Local upload entry updated!", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Update failed: ${err.message}`, { id: toastId });
    }
  };

  const handlePlayGame = async (game: Game) => {
    if ((game.isUploaded || (game as any).zipUrl) && (game as any).zipUrl) {
      const toastId = toast.loading(`Loading "${game.title}"...`);
      try {
        const response = await fetch((game as any).zipUrl);
        if (!response.ok) throw new Error('Failed to fetch game file.');
        const blob = await response.blob();
        const playUrl = await loadZipGame(blob);
        setActivePlayUrl(playUrl);
        setPlayingGame(game as any);
        setSelectedGame(null);
        toast.dismiss(toastId);
      } catch (err: any) {
        console.error(err);
        toast.error(`Error starting game: ${err.message}`, { id: toastId });
      }
    } else {
      toast.success(`Launching ${game.title}! 🎮`);
      setSelectedGame(null);
    }
  };

  const navLinks = ["Home", "Games", "About"];

  const scrollToGames = () => {
    gamesRef.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  const scrollToTrending = () => {
    trendingRef.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      if (!supabase) {
        toast.success("You're subscribed locally! 🎮 Game on!");
        setEmail("");
        return;
      }
      const { error } = await supabase.from('subscribers').insert([{ email }]);
      if (error) {
        toast.error('Subscription failed');
      } else {
        toast.success("You're subscribed! 🎮 Game on!");
      }
      setEmail("");
    }
  };

  return (
    <div 
      className="min-h-screen text-foreground transition-colors duration-300"
    >
      {/* Intro Preloader Animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              x: "-100vw", 
              transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
            }}
            className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center"
          >
            {/* Massive Logo Container */}
            <motion.div
              initial={{ y: -150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] md:w-[500px] md:h-[500px] flex items-center justify-center pointer-events-none filter drop-shadow-[8px_8px_0px_rgba(0,0,0,0.1)]"
            >
              <AnimatePresence mode="wait">
                {logoState === "logo" ? (
                  <motion.img 
                    key="logo"
                    initial={{ opacity: 0, scale: 0.7, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.7, rotate: 45 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    src={azymarLogo} 
                    alt="Preloader Icon" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <motion.div
                    key={logoState}
                    initial={{ opacity: 0, scale: 0.7, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.7, rotate: 45 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <ConsoleSymbol type={logoState} size={260} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-4xl sm:text-6xl font-black text-black mt-8 uppercase tracking-widest font-azymar-logo"
            >
              AZYMAR
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-md border-b border-border">
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); navigateTo("home"); }} 
            className="flex items-center gap-2 shrink-0 group select-none cursor-pointer font-azymar-logo text-foreground"
          >
            <div className="transition-transform duration-200 group-hover:scale-105">
              <AzymarLogo size={46} />
            </div>
            <span className="font-black text-2xl tracking-wide hidden sm:block transition-colors duration-150 group-hover:text-primary">
              AZYMAR
            </span>
          </a>

          {/* Nav links – desktop */}
          <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => {
                  if (link === "Home") {
                    navigateTo("home");
                  } else if (link === "About") {
                    setActiveLegalTab("about");
                  } else if (link === "Trending") {
                    navigateTo("home");
                    setTimeout(() => {
                      scrollToTrending();
                    }, 100);
                  } else {
                    navigateTo("home");
                    setTimeout(() => {
                      scrollToGames();
                    }, 100);
                  }
                }}
                className="relative px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group cursor-pointer"
              >
                {link}
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              <AnimatePresence>
                {searchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        scrollToGames();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          scrollToGames();
                        }
                      }}
                      onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                      placeholder="Search games..."
                      className="w-full pl-9 pr-4 py-2 rounded-full text-sm border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </motion.div>
                ) : (
                  <motion.button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Search size={18} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div 
                  onClick={() => navigateTo("account")}
                  className="hidden md:flex flex-col items-end mr-1 cursor-pointer group"
                >
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Player</span>
                </div>
                
                {/* User Avatar */}
                <div 
                  onClick={() => navigateTo("account")}
                  className="w-9 h-9 rounded-full bg-primary/10 border border-border flex items-center justify-center font-bold text-primary text-sm overflow-hidden select-none cursor-pointer hover:border-primary transition-colors"
                >
                  {(() => {
                    const src = user.user_metadata?.avatar_url || user.user_metadata?.picture;
                    const letter = (user.user_metadata?.full_name || user.email || "?").charAt(0).toUpperCase();
                    return src ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src={src} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <span style={{ display: 'none' }} className="w-full h-full flex items-center justify-center font-bold text-primary">
                          {letter}
                        </span>
                      </div>
                    ) : (
                      letter
                    );
                  })()}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="px-3 py-1.5 border border-border hover:border-red-500 hover:text-red-500 rounded-[2px] text-xs font-medium transition-colors cursor-pointer"
                >
                  Sign Out
                </motion.button>
              </div>
            ) : null}

            {adminUnlocked && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAdmin(true)}
                title="Admin Panel"
                className="p-2 rounded-full transition-colors hidden sm:flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
              >
                <ShieldCheck size={18} />
              </motion.button>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden p-2 rounded-full hover:bg-muted transition-colors animate-pulse"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-border bg-background overflow-hidden"
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <button
                    key={link}
                    onClick={() => {
                      setMobileMenu(false);
                      if (link === "Home") {
                        navigateTo("home");
                      } else if (link === "About") {
                        setActiveLegalTab("about");
                      } else {
                        setTimeout(() => {
                          scrollToGames();
                        }, 100);
                      }
                    }}
                    className="text-left px-3 py-2.5 rounded-[2px] text-sm font-medium text-foreground hover:bg-muted hover:text-primary transition-colors"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {currentPage === "signin" ? (
        <SignInView setUser={setUser} navigateTo={navigateTo} setShowAdmin={setShowAdmin} />
      ) : currentPage === "account" ? (
        <AccountView
          user={user}
          navigateTo={navigateTo}
          favorites={favorites}
          allGames={allGames}
          toggleFavorite={toggleFavorite}
          handlePlayGame={handlePlayGame}
        />
      ) : (
        <>
          {/* ── Hero ───────────────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden pt-12 pb-16 neo-grid-bg">

            {/* Pacman-like Characters and New Images scattered around with custom paths and animations */}
            {[
              { type: "pacman", id: 0, style: { left: "6%", top: "12%" }, size: 140, duration: 6, delay: 0, animate: { y: [0, -15, 0], x: [0, 8, 0], rotate: [0, 3, -3, 0] } },
              { type: "pacman", id: 1, style: { right: "8%", top: "18%" }, size: 120, duration: 5.5, delay: 0.5, animate: { y: [0, 12, 0], x: [0, -10, 0], rotate: [0, -4, 4, 0] } },
              { type: "pacman", id: 2, style: { left: "14%", bottom: "10%" }, size: 110, duration: 7, delay: 0.2, animate: { y: [0, -8, 0], scale: [1, 1.05, 0.95, 1], rotate: [0, 5, -5, 0] } },
              { type: "pacman", id: 3, style: { right: "12%", bottom: "15%" }, size: 130, duration: 6.5, delay: 0.8, animate: { y: [0, 10, 0], x: [0, 6, 0], rotate: [0, -3, 3, 0] } },
              { type: "image", src: pixelCat, style: { left: "26%", top: "6%" }, size: 125, duration: 5, delay: 0.3, animate: { y: [0, -12, 0], rotate: [0, 6, -6, 0] } },
              { type: "image", src: blackGamepad, style: { right: "22%", top: "8%" }, size: 130, duration: 8, delay: 0.1, animate: { y: [0, -10, 0], rotate: [0, 360] } },
              { type: "image", src: bowlingStrike, style: { left: "42%", bottom: "5%" }, size: 130, duration: 7.5, delay: 0.6, animate: { y: [0, 15, 0], rotate: [0, 15, -15, 0], scale: [1, 1.06, 1] } },
              { type: "image", src: omgBubble, style: { right: "38%", top: "12%" }, size: 150, duration: 6.2, delay: 0.4, animate: { scale: [1, 1.08, 0.92, 1], y: [0, -8, 0] } },
              { type: "image", src: flamingEightball, style: { right: "26%", bottom: "8%" }, size: 125, duration: 6.8, delay: 0.7, animate: { y: [0, -15, 0], x: [0, 4, -4, 0], rotate: [0, 8, -8, 0] } },
            ].map((char, index) => (
              <motion.div
                key={index}
                style={{ position: "absolute", ...char.style }}
                animate={char.animate}
                whileHover={char.type === "logo" ? { 
                  scale: 1.3, 
                  rotate: 360, 
                  y: -20,
                  filter: "drop-shadow(4px 4px 0px rgba(0,0,0,1)) drop-shadow(0 0 15px rgba(250, 204, 21, 0.6))"
                } : { 
                  scale: 1.25, 
                  rotate: [0, -12, 12, -12, 0], 
                  y: -15 
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ 
                  y: { repeat: Infinity, duration: char.duration, ease: "easeInOut" },
                  x: { repeat: Infinity, duration: char.duration, ease: "easeInOut" },
                  scale: { repeat: Infinity, duration: char.duration, ease: "easeInOut" },
                  rotate: { repeat: Infinity, duration: char.animate.rotate?.[1] === 360 ? 15 : char.duration, ease: char.animate.rotate?.[1] === 360 ? "linear" : "easeInOut" },
                  delay: char.delay
                }}
                className="hidden sm:block z-10 pointer-events-auto filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                {char.type === "pacman" ? (
                  <PacmanCharacter id={char.id!} size={char.size} />
                ) : char.type === "logo" ? (
                  <AzymarLogo size={char.size} />
                ) : (
                  <img src={char.src} alt="Arcade Asset" style={{ width: char.size, height: char.size, objectFit: "contain" }} />
                )}
              </motion.div>
            ))}

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 flex flex-col items-center text-center">
              {/* Center content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center relative z-10"
              >
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-tight text-black tracking-tight uppercase select-none">
                  <motion.span 
                    whileHover={{ scale: 1.1, rotate: -2, color: "#facc15" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 12 }}
                    className="inline-block cursor-pointer transition-colors duration-150"
                  >
                    PLAY.
                  </motion.span>{" "}
                  <motion.span 
                    style={{ display: "inline-block", rotate: -1 }}
                    whileHover={{ scale: 1.12, rotate: 2, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    className="bg-primary text-black px-6 py-2 border-4 border-black my-1 cursor-pointer origin-center"
                  >
                    ENJOY.
                  </motion.span> <br />
                  <motion.span 
                    style={{ display: "inline-block", rotate: 1 }}
                    whileHover={{ scale: 1.12, rotate: -2, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    className="bg-accent text-black px-6 py-2 border-4 border-black my-1 cursor-pointer origin-center"
                  >
                    REPEAT.
                  </motion.span>
                </h1>
                <div className="w-[102vw] relative left-1/2 -translate-x-1/2 overflow-hidden bg-white border-y-4 border-black py-4 select-none flex z-10 -rotate-1 mt-12">
                  <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 16 }}
                    className="flex whitespace-nowrap gap-12 text-3xl font-black uppercase tracking-widest text-black items-center"
                    style={{ width: "fit-content" }}
                  >
                    <span className="shrink-0 flex items-center gap-12">
                      AZYMAR <AzymarLogo size={32} /> GAMES • FUN • PLAY • AZYMAR <AzymarLogo size={32} /> GAMES • FUN • PLAY • AZYMAR <AzymarLogo size={32} /> GAMES • FUN • PLAY • AZYMAR <AzymarLogo size={32} /> GAMES • FUN • PLAY • AZYMAR <AzymarLogo size={32} /> GAMES • FUN • PLAY •
                    </span>
                    <span className="shrink-0 flex items-center gap-12">
                      AZYMAR <AzymarLogo size={32} /> GAMES • FUN • PLAY • AZYMAR <AzymarLogo size={32} /> GAMES • FUN • PLAY • AZYMAR <AzymarLogo size={32} /> GAMES • FUN • PLAY • AZYMAR <AzymarLogo size={32} /> GAMES • FUN • PLAY • AZYMAR <AzymarLogo size={32} /> GAMES • FUN • PLAY •
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Gradient blend transition at the bottom of Hero */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-black pointer-events-none" />
          </section>

          {/* ── Games & Features Section (Dark Grid) ─────────────────────────── */}
          <div className="w-full bg-black border-b-3 border-black neo-grid-dark relative z-10">
            {/* Gradient blend transition at the top of Games section */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />

            {/* ── Popular Games ───────────────────────────────────────────────────── */}
            <section ref={gamesRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20 relative z-20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
                    {activeCategory ? `${activeCategory} Games` : "Our Games"}
                  </h2>
                  {activeCategory && (
                    <button
                      onClick={() => setActiveCategory(null)}
                      className="text-xs text-primary mt-1 hover:underline cursor-pointer"
                    >
                      ← Back to all games
                    </button>
                  )}
                </div>
                {searchOpen && searchQuery && (
                  <span className="text-sm text-neutral-400">{visibleGames.length} results for "{searchQuery}"</span>
                )}
                <button className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                  View All <ArrowRight size={14} />
                </button>
              </div>

              {visibleGames.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {visibleGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPlay={setSelectedGame}
                      isAdmin={adminUnlocked}
                      onAdminDelete={handleDeleteUpload}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-neutral-500">
                  <Gamepad2 size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No games found for "{searchQuery}"</p>
                </div>
              )}
            </section>

            {/* ── Recommended For You ─────────────────────────────────────────────── */}
            {RECOMMENDED.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-20">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                  <Trophy size={22} className="text-primary" /> Recommended For You
                </h2>
                <div className="grid sm:grid-cols-3 gap-5">
                  {RECOMMENDED.map((r) => (
                    <div
                      key={r.id}
                      className="bg-card border-3 border-black rounded-none p-5 cursor-pointer neo-shadow neo-card-hover transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="w-14 h-14 rounded-none border-2 border-black flex items-center justify-center text-3xl shrink-0"
                          style={{ background: `${r.color}22` }}
                        >
                          {r.emoji}
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{r.title}</h3>
                          <p className="text-sm text-neutral-400">{r.genre}</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                          <span>Progress</span>
                          <span className="text-primary font-semibold">{r.progress}%</span>
                        </div>
                        <div className="h-2.5 bg-muted border-2 border-black rounded-none overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${r.progress}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => toast(`Resuming ${r.title}...`)}
                        className="w-full py-2 bg-primary text-primary-foreground border-2 border-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Clock size={13} /> Continue Playing
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Gradient blend transition at the bottom of Games section to blend into solid black */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
          </div>
        </>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-black border-t-3 border-black text-white py-14 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <AzymarLogo size={36} />
                <span className="font-black text-xl text-white font-azymar-logo">AZYMAR</span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
                Your ultimate destination for free online gaming. Play, discover, and connect with millions of gamers worldwide.
              </p>
              <div className="flex gap-3 mt-5">
                {[
                  { icon: Linkedin, label: "LinkedIn", url: "https://www.linkedin.com/company/azymar/" },
                  { icon: (props: { size: number }) => (
                    <svg viewBox="0 0 24 24" width={props.size} height={props.size} fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  ), label: "X", url: "https://x.com/azymar03" },
                  { icon: Instagram, label: "Instagram", url: "https://www.instagram.com/azymar_studio_01?igsh=dngzeW16Y29kZDJ4" },
                ].map((s) => (
                  <motion.a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-primary hover:text-black transition-colors"
                  >
                    <s.icon size={16} />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Company",
                links: [
                  { icon: BookOpen, label: "About" },
                  { icon: Shield, label: "Privacy" },
                  { icon: Layers, label: "Terms" },
                  { icon: Globe, label: "Cookies" },
                ],
              },
              {
                title: "Support",
                links: [
                  { icon: HelpCircle, label: "FAQ" },
                  { icon: Mail, label: "Contact" },
                  { icon: MessageCircle, label: "Discord" },
                  { icon: Gamepad2, label: "Games" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <button
                        onClick={() => {
                          const label = l.label.toLowerCase();
                          if (
                            label === "about" ||
                            label === "privacy" ||
                            label === "terms" ||
                            label === "cookies" ||
                            label === "faq" ||
                            label === "contact"
                          ) {
                            setActiveLegalTab(label as any);
                            if (label === "contact") {
                              window.location.href = "mailto:azymar03@gmmail.com";
                            }
                          } else if (label === "discord") {
                            window.open("https://discord.com/channels/1523952210780880936/1523952211225215079", "_blank");
                          } else if (label === "games") {
                            const target = document.getElementById("games-list");
                            if (target) {
                              target.scrollIntoView({ behavior: "smooth" });
                            } else {
                              gamesRef.current?.scrollIntoView({ behavior: "smooth" });
                            }
                          }
                        }}
                        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-primary transition-colors cursor-pointer"
                      >
                        <l.icon size={14} /> {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            <div>
              <h4 className="font-bold text-white mb-4">Newsletter</h4>
              <p className="text-sm text-neutral-400 mb-3">Get the latest games and updates.</p>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="px-4 py-2.5 rounded-none text-sm border-3 border-black bg-white text-black placeholder:text-neutral-500 focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-primary text-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
            <p>© 2026 AZYMAR. All rights reserved.</p>
            <p>Made with ❤️ for gamers worldwide</p>
          </div>
        </div>
      </footer>

      {/* ── Game Details Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedGame && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedGame(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-card border-3 border-black rounded-none w-full max-w-lg overflow-hidden neo-shadow-lg"
            >
              <div
                className="h-52 flex items-center justify-center text-7xl relative overflow-hidden border-b-3 border-black"
                style={{ background: `linear-gradient(135deg, ${selectedGame.color}30, ${selectedGame.color}60)` }}
              >
                {selectedGame.thumbnailUrl ? (
                  <img src={selectedGame.thumbnailUrl} alt={selectedGame.title} className="w-full h-full object-cover" />
                ) : (
                  selectedGame.emoji
                )}
                <button
                  onClick={() => setSelectedGame(null)}
                  className="absolute top-4 right-4 p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none"
                >
                  <X size={16} />
                </button>
                {selectedGame.badge && (
                  <div className="absolute top-4 left-4">
                    <Badge type={selectedGame.badge} />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-1">
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-wide">{selectedGame.title}</h2>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-foreground">{selectedGame.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">{selectedGame.genre} · {selectedGame.plays} plays</p>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Dive into the world of {selectedGame.title}. An exciting {selectedGame.genre.toLowerCase()} experience designed to keep you entertained for hours. Compete, explore, and conquer.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handlePlayGame(selectedGame)}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-none font-black text-xs uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play size={16} fill="currentColor" /> Play Now
                  </button>
                  <button
                    onClick={() => handleShareGame(selectedGame.id, selectedGame.title)}
                    title="Share Game"
                    className="w-12 h-12 bg-white text-black border-3 border-black rounded-none flex items-center justify-center neo-btn neo-btn-hover cursor-pointer"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => toggleFavorite(selectedGame.id)}
                    title={favorites.includes(selectedGame.id) ? "Remove from Favorites" : "Add to Favorites"}
                    className="w-12 h-12 bg-white text-black border-3 border-black rounded-none flex items-center justify-center neo-btn neo-btn-hover cursor-pointer"
                  >
                    <Heart size={16} className={favorites.includes(selectedGame.id) ? "fill-red-600 text-red-600" : ""} />
                  </button>
                  <button
                    onClick={() => handlePlayGame(selectedGame)}
                    title="Launch Fullscreen"
                    className="w-12 h-12 bg-white text-black border-3 border-black rounded-none flex items-center justify-center neo-btn neo-btn-hover cursor-pointer"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Login Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} setUser={setUser} setShowAdmin={setShowAdmin} navigateTo={navigateTo} />}
      </AnimatePresence>

      {/* ── Admin Panel Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdmin && (
          <AdminPanel
            uploads={uploads}
            dbGames={remoteGames.filter((g) => g.isUploaded || (g as any).zipUrl)}
            onUpload={handleUpload}
            onToggleVisible={handleToggleVisible}
            onDelete={handleDeleteUpload}
            onClose={() => setShowAdmin(false)}
            onEditGame={handleEditGame}
          />
        )}
      </AnimatePresence>

      {/* ── Fullscreen Game Player ─────────────────────────────────────────── */}
      <AnimatePresence>
        {activePlayUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-0 left-0 w-screen h-screen z-50 flex flex-col bg-black animate-in fade-in duration-300"
          >
            {/* Header bar */}
            <div className="h-14 bg-card border-b-3 border-black flex items-center justify-between px-6 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{playingGame?.emoji}</span>
                <div>
                  <h2 className="font-black text-foreground text-sm uppercase tracking-wide">{playingGame?.title}</h2>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">{playingGame?.genre}</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (activePlayUrl) {
                    URL.revokeObjectURL(activePlayUrl);
                  }
                  setActivePlayUrl(null);
                  setPlayingGame(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
              >
                Exit Game
              </button>
            </div>

            {/* Iframe container */}
            <div className="w-full h-[calc(100vh-3.5rem)] bg-black relative overflow-hidden">
              <iframe
                src={activePlayUrl}
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
                allow="autoplay; fullscreen; keyboard"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Legal Center Modal ──────────────────────────────────────────────── */}
      {activeLegalTab && (
        <LegalModal
          activeTab={activeLegalTab}
          setActiveTab={setActiveLegalTab}
          onClose={() => setActiveLegalTab(null)}
        />
      )}

    </div>
  );
}
