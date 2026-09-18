"use client";
import { useState, useEffect, useCallback, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import {
  User, Briefcase, FolderOpen, Code, Lock, LogOut, Save, Plus, Trash2,
  ChevronRight, Bot, Eye, EyeOff, Palette, Search, Wrench, Quote, Sun, Moon,
  LayoutGrid, GripVertical, Sparkles, BookOpen, Mail, CheckCheck, Reply, Check,
  ExternalLink, FileText, X, Globe, Settings, Clock, Tag, RefreshCw, Send, AlertCircle
} from "lucide-react";
import { Reorder } from "framer-motion";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import { DEFAULT_CONFIG, type SiteConfig } from "@/lib/siteConfig";
import { HIGHLIGHT_ICON_NAMES, highlightIcon, type HighlightItem } from "@/lib/highlightIcons";
import { sanitizeProjectHtml } from "@/lib/utils";
import type { BlogPost, BlogData } from "@/app/api/blog/route";
import type { ContactMessage } from "@/app/api/messages/route";

type Tab =
  | "profile"
  | "home"
  | "design"
  | "seo"
  | "projects"
  | "blog"
  | "inbox"
  | "career"
  | "skills"
  | "highlights"
  | "services"
  | "testimonials"
  | "ai"
  | "password";

interface Project {
  id: string; title: string; category: string; description: string;
  tech: string[]; year: string; link: string; imageURL: string; featured: boolean;
  focus?: string;
}
interface CareerItem { id: string; type: string; title: string; org: string; years: string; }
interface CareerSection { title: string; items: CareerItem[]; }
interface SkillGroup { name: string; items: string[]; }
interface Service { id: string; title: string; description: string; icon: string; }
interface Testimonial { id: string; name: string; role: string; quote: string; avatar: string; }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

// ── Shared styles ──
const inputCls = "w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none transition-all";
const inputStyle: React.CSSProperties = { background: "hsl(210 60% 6%)", border: "1px solid hsl(var(--p) / 0.12)" };
const btnPrimary: React.CSSProperties = { background: "linear-gradient(135deg,hsl(var(--p)),hsl(var(--p2)))", color: "hsl(210 100% 4%)" };
const cardStyle: React.CSSProperties = { background: "hsl(210 60% 8% / 0.5)", border: "1px solid hsl(var(--p) / 0.08)" };
const focusOn = (e: React.FocusEvent<HTMLElement>) => (e.currentTarget.style.borderColor = "hsl(var(--p) / 0.35)");
const focusOff = (e: React.FocusEvent<HTMLElement>) => (e.currentTarget.style.borderColor = "hsl(var(--p) / 0.12)");

const COLOR_PRESETS = [
  { name: "Teal", v: "185 100% 48%" }, { name: "Sky", v: "199 100% 50%" },
  { name: "Blue", v: "220 90% 58%" }, { name: "Indigo", v: "245 80% 62%" },
  { name: "Violet", v: "270 80% 62%" }, { name: "Pink", v: "330 85% 60%" },
  { name: "Rose", v: "350 90% 62%" }, { name: "Orange", v: "24 95% 55%" },
  { name: "Amber", v: "40 96% 54%" }, { name: "Emerald", v: "160 84% 42%" },
  { name: "Green", v: "142 70% 45%" }, { name: "Crimson", v: "0 84% 60%" },
];
const BG_PRESETS = [
  { name: "Deep Navy", v: "210 100% 4%" }, { name: "Black", v: "0 0% 3%" },
  { name: "Charcoal", v: "220 18% 8%" }, { name: "Midnight", v: "240 40% 6%" },
  { name: "Plum", v: "280 40% 6%" }, { name: "Forest", v: "160 45% 5%" },
  { name: "Light", v: "210 30% 96%" },
];

function TextField({ label, value, onChange, full, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; full?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "col-span-2" : ""}`}>
      <label className="text-white/35 text-xs uppercase tracking-wider font-syne">{label}</label>
      <input type={type} value={value ?? ""} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} className={inputCls} style={inputStyle}
        onFocus={focusOn} onBlur={focusOff} />
    </div>
  );
}
function TextArea({ label, value, onChange, rows = 3, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <div className="col-span-2 flex flex-col gap-1.5">
      <label className="text-white/35 text-xs uppercase tracking-wider font-syne">{label}</label>
      <textarea value={value ?? ""} rows={rows} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} className={inputCls + " resize-none"} style={inputStyle}
        onFocus={focusOn} onBlur={focusOff} />
    </div>
  );
}
function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 p-3.5 rounded-xl text-left transition-all w-full" style={cardStyle}>
      <div>
        <p className="text-white/80 text-sm font-medium">{label}</p>
        {desc && <p className="text-white/30 text-xs mt-0.5">{desc}</p>}
      </div>
      <div className="w-10 h-6 rounded-full p-0.5 shrink-0 transition-all"
        style={{ background: checked ? "hsl(var(--p) / 0.9)" : "hsl(210 30% 20%)" }}>
        <div className="w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }} />
      </div>
    </button>
  );
}
function SaveBtn({ onClick, saving, label }: { onClick: () => void; saving?: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-syne transition-all hover:scale-[1.02] disabled:opacity-60"
      style={btnPrimary}>
      <Save size={14} /> {saving ? "Saving…" : label}
    </button>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const deferredTab = useDeferredValue(activeTab);

  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [projectDescTab, setProjectDescTab] = useState<"edit" | "preview">("edit");

  // Blog State
  const [blogIntro, setBlogIntro] = useState("");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [postPreviewMode, setPostPreviewMode] = useState<"edit" | "preview">("edit");
  const [blogFilter, setBlogFilter] = useState("");
  const [savingBlog, setSavingBlog] = useState(false);

  // Messages Inbox State
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messageFilter, setMessageFilter] = useState<"all" | "unread">("all");

  const [careerIntro, setCareerIntro] = useState("");
  const [careerSections, setCareerSections] = useState<CareerSection[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [highlightsTitle, setHighlightsTitle] = useState("Beyond Code");
  const [highlightsIntro, setHighlightsIntro] = useState("");
  const [highlightItems, setHighlightItems] = useState<HighlightItem[]>([]);
  const [servicesIntro, setServicesIntro] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [testiIntro, setTestiIntro] = useState("");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pwForm, setPwForm] = useState({ newPassword: "", confirm: "" });

  const [aiSettings, setAiSettings] = useState<Record<string, string>>({
    provider: "gemini",
    assistantName: "Portfolio Assistant",
    greeting: "Hi! I'm here to answer any questions about this portfolio. Ask me anything!",
    openaiKey: "",
    openaiModel: "gpt-4o-mini",
    geminiKey: "",
    geminiModel: "gemini-2.0-flash",
    claudeKey: "",
    claudeModel: "claude-3-5-haiku-20241022",
    openrouterKey: "",
    openrouterModel: "deepseek/deepseek-chat",
    customName: "DeepSeek / Custom AI",
    customBaseUrl: "https://api.deepseek.com/v1",
    customKey: "",
    customModel: "deepseek-chat",
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);

  const setCfg = useCallback(<K extends keyof SiteConfig>(k: K, v: SiteConfig[K]) =>
    setConfig((c) => ({ ...c, [k]: v })), []);

  const loadAll = useCallback(async () => {
    const safe = async (url: string, init?: RequestInit) => {
      try {
        const r = await fetch(url, { credentials: "include", ...init });
        return r.ok ? await r.json() : null;
      } catch {
        return null;
      }
    };
    const [cfg, pr, ca, sk, hl, sv, ts, ai, bl, ms] = await Promise.all([
      safe("/api/config"),
      safe("/api/projects"),
      safe("/api/career"),
      safe("/api/skills"),
      safe("/api/highlights"),
      safe("/api/services"),
      safe("/api/testimonials"),
      safe("/api/ai-settings", { method: "POST" }),
      safe("/api/blog"),
      safe("/api/messages"),
    ]);
    if (cfg) setConfig({ ...DEFAULT_CONFIG, ...cfg });
    if (pr) setProjects(pr.items ?? []);
    if (ca) { setCareerIntro(ca.intro ?? ""); setCareerSections(ca.sections ?? []); }
    if (sk) setSkillGroups(sk.groups ?? []);
    if (hl) { setHighlightsTitle(hl.title ?? "Beyond Code"); setHighlightsIntro(hl.intro ?? ""); setHighlightItems(hl.items ?? []); }
    if (sv) { setServicesIntro(sv.intro ?? ""); setServices(sv.items ?? []); }
    if (ts) { setTestiIntro(ts.intro ?? ""); setTestimonials(ts.items ?? []); }
    if (ai) setAiSettings((s) => ({ ...s, ...ai }));
    if (bl) { setBlogIntro(bl.intro ?? ""); setBlogPosts(bl.items ?? []); }
    if (ms) setMessages(ms.items ?? []);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  // ── Config saver ──
  async function saveConfig(msg = "Saved!") {
    setSavingConfig(true);
    const r = await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
    setSavingConfig(false);
    r.ok ? toast.success(msg) : toast.error("Failed to save.");
  }

  // ── Projects ──
  function newProject(): Project {
    return { id: uid(), title: "", category: "Web App", description: "", tech: [], year: new Date().getFullYear().toString(), link: "", imageURL: "", featured: false, focus: "50% 50%" };
  }
  async function saveProjectsList(list: Project[], silent = false): Promise<boolean> {
    const r = await fetch("/api/projects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intro: "", items: list }) });
    if (r.ok) { if (!silent) toast.success("Order saved"); return true; }
    toast.error("Failed to save."); return false;
  }
  function persistOrder() {
    setProjects((curr) => { void saveProjectsList(curr); return curr; });
  }
  async function saveProject(p: Project) {
    const list = editProject && projects.find((x) => x.id === editProject.id) ? projects.map((x) => (x.id === p.id ? p : x)) : [...projects, p];
    if (await saveProjectsList(list, true)) { setProjects(list); setEditProject(null); toast.success("Project saved!"); }
  }
  async function deleteProject(id: string) {
    const list = projects.filter((p) => p.id !== id);
    const r = await fetch("/api/projects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intro: "", items: list }) });
    if (r.ok) { setProjects(list); toast.success("Deleted."); }
  }

  // ── Blog helpers & savers ──
  function newBlogPost(): BlogPost {
    return {
      id: uid(),
      slug: "post-" + Date.now().toString(36),
      title: "",
      excerpt: "",
      category: "Tech",
      tags: [],
      coverImage: "",
      publishedAt: new Date().toISOString().split("T")[0],
      readTime: "5 min read",
      featured: false,
      published: true,
      content: "### Heading\n\nWrite your article here using Markdown...",
    };
  }

  async function saveBlogList(list: BlogPost[], introVal = blogIntro, silent = false) {
    setSavingBlog(true);
    const r = await fetch("/api/blog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intro: introVal, items: list }),
    });
    setSavingBlog(false);
    if (r.ok) {
      if (!silent) toast.success("Blog updated!");
      return true;
    }
    toast.error("Failed to save blog.");
    return false;
  }

  async function savePost(p: BlogPost) {
    if (!p.title.trim()) return toast.error("Title is required.");
    if (!p.slug.trim()) return toast.error("Slug is required.");

    const list = editPost && blogPosts.find((x) => x.id === editPost.id)
      ? blogPosts.map((x) => (x.id === p.id ? p : x))
      : [p, ...blogPosts];

    if (await saveBlogList(list, blogIntro, true)) {
      setBlogPosts(list);
      setEditPost(null);
      toast.success("Blog post saved!");
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    const list = blogPosts.filter((p) => p.id !== id);
    if (await saveBlogList(list, blogIntro, true)) {
      setBlogPosts(list);
      toast.success("Post deleted.");
    }
  }

  // ── Messages Inbox helpers ──
  async function toggleMessageRead(id: string, currentRead: boolean) {
    const r = await fetch("/api/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: !currentRead }),
    });
    if (r.ok) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: !currentRead } : m)));
      toast.success(!currentRead ? "Marked as read" : "Marked as unread");
    }
  }

  async function markAllMessagesRead() {
    const r = await fetch("/api/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    if (r.ok) {
      setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
      toast.success("All messages marked as read");
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm("Delete this message?")) return;
    const r = await fetch(`/api/messages?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (r.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success("Message deleted.");
    }
  }

  // ── Other Savers ──
  async function saveCareer() {
    const r = await fetch("/api/career", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intro: careerIntro, sections: careerSections }) });
    r.ok ? toast.success("Career saved!") : toast.error("Failed.");
  }
  async function saveSkills() {
    const r = await fetch("/api/skills", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groups: skillGroups }) });
    r.ok ? toast.success("Skills saved!") : toast.error("Failed.");
  }
  async function saveHighlights() {
    const r = await fetch("/api/highlights", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: highlightsTitle, intro: highlightsIntro, items: highlightItems }) });
    r.ok ? toast.success("Highlights saved!") : toast.error("Failed.");
  }
  async function saveServices() {
    const r = await fetch("/api/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intro: servicesIntro, items: services }) });
    r.ok ? toast.success("Services saved!") : toast.error("Failed.");
  }
  async function saveTestimonials() {
    const r = await fetch("/api/testimonials", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intro: testiIntro, items: testimonials }) });
    r.ok ? toast.success("Testimonials saved!") : toast.error("Failed.");
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Passwords don't match.");
    if (pwForm.newPassword.length < 6) return toast.error("Password must be at least 6 characters.");
    const r = await fetch("/api/admin/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword: pwForm.newPassword }) });
    r.ok ? (toast.success("Password updated!"), setPwForm({ newPassword: "", confirm: "" })) : toast.error("Failed.");
  }

  // ── AI Settings Savers & Tester ──
  async function saveAiSettings() {
    setAiSaving(true);
    try {
      const r = await fetch("/api/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiSettings),
      });
      const data = await r.json();
      if (r.ok) {
        toast.success("AI settings saved successfully!");
      } else {
        toast.error(data.error || "Failed to save AI settings.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setAiSaving(false);
    }
  }

  async function testAiConnection() {
    setAiTesting(true);
    try {
      // Save settings first
      await fetch("/api/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiSettings),
      });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Reply in one sentence: 'AI Connected Successfully!'" }],
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to get response from AI");
      }
      toast.success(`Connected! Response: "${data.reply}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI connection test failed.");
    } finally {
      setAiTesting(false);
    }
  }

  const unreadMessagesCount = messages.filter((m) => !m.read).length;

  const navItems: { id: Tab; icon: React.ComponentType<{ size?: number }>; label: string; badge?: number }[] = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "home", icon: LayoutGrid, label: "Home Hero" },
    { id: "design", icon: Palette, label: "Design" },
    { id: "seo", icon: Search, label: "SEO" },
    { id: "projects", icon: FolderOpen, label: "Projects" },
    { id: "blog", icon: BookOpen, label: "Blog" },
    { id: "inbox", icon: Mail, label: "Inbox", badge: unreadMessagesCount },
    { id: "career", icon: Briefcase, label: "Career" },
    { id: "skills", icon: Code, label: "Skills" },
    { id: "highlights", icon: Sparkles, label: "Highlights" },
    { id: "services", icon: Wrench, label: "Services" },
    { id: "testimonials", icon: Quote, label: "Testimonials" },
    { id: "ai", icon: Bot, label: "AI Settings" },
    { id: "password", icon: Lock, label: "Password" },
  ];

  const Swatches = ({ value, onPick, presets }: { value: string; onPick: (v: string) => void; presets: { name: string; v: string }[] }) => (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => (
        <button key={p.v} type="button" onClick={() => onPick(p.v)} title={p.name}
          className="w-8 h-8 rounded-lg transition-all hover:scale-110"
          style={{ background: `hsl(${p.v})`, border: value === p.v ? "2px solid white" : "2px solid transparent", boxShadow: value === p.v ? `0 0 12px hsl(${p.v})` : "none" }} />
      ))}
    </div>
  );

  return (
    <div className="h-screen w-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 20% 50%,#041628,#020b14 50%,#020810)" }}>
      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 flex flex-col justify-between p-4 border-r overflow-y-auto no-scrollbar"
        style={{ background: "hsl(210 60% 6% / 0.8)", borderColor: "hsl(var(--p) / 0.1)" }}>
        <div>
          <div className="flex items-center gap-2.5 px-3 py-2 mb-6">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm font-syne"
              style={{ background: "linear-gradient(135deg,hsl(var(--p)),hsl(var(--p2)))", color: "hsl(210 100% 4%)" }}>
              {config.brandName?.slice(0, 1) || "A"}
            </div>
            <div>
              <p className="text-white font-bold text-xs font-syne truncate max-w-[130px]">{config.brandName || "Portfolio"}</p>
              <p className="text-white/30 text-[10px]">Admin Panel</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map(({ id, icon: Icon, label, badge }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium font-syne transition-all cursor-pointer"
                  style={active ? { background: "hsl(var(--p) / 0.12)", color: "hsl(var(--p))", border: "1px solid hsl(var(--p) / 0.25)" } : { color: "rgba(255,255,255,0.45)" }}>
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} />
                    <span>{label}</span>
                  </div>
                  {badge && badge > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                      style={{ background: "hsl(var(--p))", color: "hsl(210 100% 4%)" }}>
                      {badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t flex flex-col gap-1" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white transition-colors">
            <ExternalLink size={13} /> View Live Site
          </a>
          <button onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400/60 hover:text-red-400 transition-colors">
            <LogOut size={13} /> Log out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto p-8 no-scrollbar">
        {/* ── Profile ── */}
        {deferredTab === "profile" && (
          <div className="max-w-2xl">
            <h2 className="text-white font-bold text-lg font-syne mb-1">Personal Profile</h2>
            <p className="text-white/35 text-xs mb-6">Manage identity, personal contact details, and sidebar information.</p>

            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-4">Identity & Titles</p>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Brand / Logo text" value={config.brandName} onChange={(v) => setCfg("brandName", v)} />
                <TextField label="Hero name" value={config.heroTitle} onChange={(v) => setCfg("heroTitle", v)} />
                <TextField label="Hero role / headline" value={config.heroSubtitle} onChange={(v) => setCfg("heroSubtitle", v)} full />
                <TextArea label="Short bio" value={config.aboutText} onChange={(v) => setCfg("aboutText", v)} rows={3} />
              </div>
            </div>

            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-4">Photo & Contact Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <ImageUpload label="Profile photo" value={config.photoURL} onChange={(v) => setCfg("photoURL", v)}
                    focus={config.photoFocus} onFocusChange={(v) => setCfg("photoFocus", v)} aspect="square" />
                </div>
                <TextField label="Location" value={config.location} onChange={(v) => setCfg("location", v)} />
                <TextField label="Email" value={config.email} onChange={(v) => setCfg("email", v)} />
                <TextField label="Phone" value={config.phone} onChange={(v) => setCfg("phone", v)} />
                <TextField label="Resume / CV link" value={config.resumeURL} onChange={(v) => setCfg("resumeURL", v)} />
              </div>
            </div>

            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-4">Social Links</p>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="GitHub" value={config.github} onChange={(v) => setCfg("github", v)} />
                <TextField label="LinkedIn" value={config.linkedin} onChange={(v) => setCfg("linkedin", v)} />
                <TextField label="Twitter / X" value={config.twitter} onChange={(v) => setCfg("twitter", v)} />
                <TextField label="Instagram" value={config.instagram} onChange={(v) => setCfg("instagram", v)} />
                <TextField label="YouTube" value={config.youtube} onChange={(v) => setCfg("youtube", v)} />
                <TextField label="Dribbble" value={config.dribbble} onChange={(v) => setCfg("dribbble", v)} />
              </div>
            </div>

            <SaveBtn onClick={() => saveConfig("Profile saved!")} saving={savingConfig} label="Save profile" />
          </div>
        )}

        {/* ── Home Hero ── */}
        {deferredTab === "home" && (
          <div className="max-w-2xl">
            <h2 className="text-white font-bold text-lg font-syne mb-1">Home Hero</h2>
            <p className="text-white/35 text-xs mb-6">The big landing section: typing roles, stat counters, and tech marquee.</p>

            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-4">Typing roles</p>
              <TextArea label="Roles (one per line, or comma-separated)" value={config.roles}
                onChange={(v) => setCfg("roles", v)} rows={4} placeholder={"Full-Stack Developer\nUI/UX Designer\nFreelancer"} />
              <p className="text-white/25 text-[11px] mt-2">These cycle with a typing animation under your name.</p>
            </div>

            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-3">Stat counters</p>
              <div className="mb-4"><Toggle label="Show stat counters on the home page" checked={config.showStats} onChange={(v) => setCfg("showStats", v)} /></div>
              {(config.stats ?? []).map((s, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={s.value} placeholder="30+" className={inputCls + " max-w-[120px]"} style={inputStyle}
                    onChange={(e) => setCfg("stats", config.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} onFocus={focusOn} onBlur={focusOff} />
                  <input value={s.label} placeholder="Projects Completed" className={inputCls} style={inputStyle}
                    onChange={(e) => setCfg("stats", config.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} onFocus={focusOn} onBlur={focusOff} />
                  <button onClick={() => setCfg("stats", config.stats.filter((_, j) => j !== i))} className="p-2.5 rounded-lg text-red-400/50 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => setCfg("stats", [...(config.stats ?? []), { value: "", label: "" }])}
                className="flex items-center gap-1.5 px-3 py-2 mt-1 rounded-xl text-xs font-medium" style={{ background: "hsl(var(--p) / 0.08)", color: "hsl(var(--p))", border: "1px solid hsl(var(--p) / 0.15)" }}>
                <Plus size={12} /> Add stat
              </button>
            </div>

            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-3">Tech marquee</p>
              <div className="mb-4"><Toggle label="Show scrolling tech marquee" checked={config.showMarquee} onChange={(v) => setCfg("showMarquee", v)} /></div>
              <TextArea label="Tech stack (comma-separated)" value={config.techStack}
                onChange={(v) => setCfg("techStack", v)} rows={2} placeholder="React, Next.js, TypeScript, Node.js" />
            </div>

            <SaveBtn onClick={() => saveConfig("Home hero saved!")} saving={savingConfig} label="Save home hero" />
          </div>
        )}

        {/* ── Design ── */}
        {deferredTab === "design" && (
          <div className="max-w-2xl">
            <h2 className="text-white font-bold text-lg font-syne mb-1">Design & Theme</h2>
            <p className="text-white/35 text-xs mb-6">Accent colors, background styling, and section toggles.</p>

            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-3">Primary accent color</p>
              <Swatches value={config.themePrimary} onPick={(v) => setCfg("themePrimary", v)} presets={COLOR_PRESETS} />
            </div>

            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-3">Background color</p>
              <Swatches value={config.themeBackground} onPick={(v) => setCfg("themeBackground", v)} presets={BG_PRESETS} />
            </div>

            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-4">Visible sections</p>
              <div className="grid grid-cols-2 gap-2">
                <Toggle label="Projects" checked={config.showProjects} onChange={(v) => setCfg("showProjects", v)} />
                <Toggle label="Blog" checked={config.showBlog ?? true} onChange={(v) => setCfg("showBlog", v)} />
                <Toggle label="Career" checked={config.showCareer} onChange={(v) => setCfg("showCareer", v)} />
                <Toggle label="Skills" checked={config.showSkills} onChange={(v) => setCfg("showSkills", v)} />
                <Toggle label="Services" checked={config.showServices} onChange={(v) => setCfg("showServices", v)} />
                <Toggle label="Testimonials" checked={config.showTestimonials} onChange={(v) => setCfg("showTestimonials", v)} />
                <Toggle label="Contact" checked={config.showContact} onChange={(v) => setCfg("showContact", v)} />
              </div>
            </div>

            <SaveBtn onClick={() => saveConfig("Theme saved!")} saving={savingConfig} label="Save theme" />
          </div>
        )}

        {/* ── SEO ── */}
        {deferredTab === "seo" && (
          <div className="max-w-2xl">
            <h2 className="text-white font-bold text-lg font-syne mb-1">SEO & Metadata</h2>
            <p className="text-white/35 text-xs mb-6">Page title, meta description, favicon, and social share cards.</p>
            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Page title" value={config.seoTitle} onChange={(v) => setCfg("seoTitle", v)} full />
                <TextArea label="Meta description" value={config.seoDescription} onChange={(v) => setCfg("seoDescription", v)} rows={2} />
                <TextField label="Keywords (comma-separated)" value={config.seoKeywords} onChange={(v) => setCfg("seoKeywords", v)} full />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <ImageUpload label="Social share image (OG)" value={config.ogImage} onChange={(v) => setCfg("ogImage", v)} />
                <ImageUpload label="Favicon" value={config.faviconURL} onChange={(v) => setCfg("faviconURL", v)} aspect="square" />
              </div>
            </div>
            <SaveBtn onClick={() => saveConfig("SEO saved!")} saving={savingConfig} label="Save SEO" />
          </div>
        )}

        {/* ── Projects ── */}
        {deferredTab === "projects" && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg font-syne">Projects</h2>
              <button onClick={() => setEditProject(newProject())}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-syne transition-all hover:scale-105"
                style={{ background: "hsl(var(--p) / 0.12)", color: "hsl(var(--p))", border: "1px solid hsl(var(--p) / 0.2)" }}>
                <Plus size={13} /> New project
              </button>
            </div>
            {editProject ? (
              <div className="rounded-2xl p-6" style={{ background: "hsl(210 60% 8% / 0.6)", border: "1px solid hsl(var(--p) / 0.1)" }}>
                <h3 className="text-white font-semibold font-syne mb-4">{projects.find((p) => p.id === editProject.id) ? "Edit" : "New"} Project</h3>
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Title" value={editProject.title} onChange={(v) => setEditProject((p) => p && { ...p, title: v })} />
                  <TextField label="Category" value={editProject.category} onChange={(v) => setEditProject((p) => p && { ...p, category: v })} />
                  <TextField label="Year" value={editProject.year} onChange={(v) => setEditProject((p) => p && { ...p, year: v })} />
                  <TextField label="Link" value={editProject.link} onChange={(v) => setEditProject((p) => p && { ...p, link: v })} />
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-white/35 text-xs uppercase tracking-wider font-syne">
                        Description (HTML Supported)
                      </label>
                      <div className="flex rounded-lg p-0.5 bg-white/5 border border-white/10">
                        <button
                          type="button"
                          onClick={() => setProjectDescTab("edit")}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-syne transition-all ${
                            projectDescTab === "edit" ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white"
                          }`}
                        >
                          Code
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectDescTab("preview")}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-syne transition-all ${
                            projectDescTab === "preview" ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white"
                          }`}
                        >
                          Live Preview
                        </button>
                      </div>
                    </div>

                    {projectDescTab === "edit" ? (
                      <>
                        <div className="flex flex-wrap items-center gap-1.5 py-1">
                          {[
                            { label: "<p>", insert: "<p>Text here</p>" },
                            { label: "<b>", insert: "<strong>Bold text</strong>" },
                            { label: "<ul>", insert: "<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>" },
                            { label: "<li>", insert: "<li>New item</li>" },
                            { label: "<a>", insert: '<a href="https://example.com" target="_blank">Link text</a>' },
                            { label: "<code>", insert: "<code>code</code>" },
                            { label: "<br>", insert: "<br/>" },
                          ].map((t) => (
                            <button
                              key={t.label}
                              type="button"
                              onClick={() => {
                                const current = editProject.description || "";
                                setEditProject((p) => (p ? { ...p, description: current + (current ? "\n" : "") + t.insert } : null));
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] border border-white/[0.1] text-white/70 hover:text-white hover:border-white/30 transition-all"
                            >
                              + {t.label}
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={4}
                          value={editProject.description}
                          onChange={(e) => setEditProject((p) => p && { ...p, description: e.target.value })}
                          placeholder="<p>Full project description supporting HTML tags like <strong>bold</strong>, <ul><li>lists</li></ul>, etc.</p>"
                          className={inputCls + " resize-none font-mono text-xs leading-relaxed"}
                          style={inputStyle}
                          onFocus={focusOn}
                          onBlur={focusOff}
                        />
                      </>
                    ) : (
                      <div
                        className="w-full p-4 rounded-xl min-h-[110px] project-html-content text-sm overflow-y-auto max-h-[220px]"
                        style={{ background: "hsl(210 60% 6%)", border: "1px solid hsl(var(--p) / 0.25)" }}
                        dangerouslySetInnerHTML={{
                          __html: sanitizeProjectHtml(editProject.description) || "<p class='text-white/30 italic text-xs'>No description yet. Switch to Code to add HTML content.</p>",
                        }}
                      />
                    )}
                    <p className="text-white/30 text-[10px]">
                      Tip: Use standard HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, &lt;code&gt; to format case studies.
                    </p>
                  </div>
                  <TextField label="Tech (comma-separated)" value={editProject.tech.join(", ")} onChange={(v) => setEditProject((p) => p && { ...p, tech: v.split(",").map((s) => s.trim()).filter(Boolean) })} full />
                  <div className="col-span-2">
                    <ImageUpload label="Project image" value={editProject.imageURL} onChange={(v) => setEditProject((p) => p && { ...p, imageURL: v })}
                      focus={editProject.focus} onFocusChange={(v) => setEditProject((p) => p && { ...p, focus: v })} />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="featured" checked={editProject.featured} onChange={(e) => setEditProject((p) => p && { ...p, featured: e.target.checked })} className="w-4 h-4 rounded" />
                    <label htmlFor="featured" className="text-white/60 text-sm">Featured project</label>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => saveProject(editProject)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-syne" style={btnPrimary}><Save size={13} /> Save</button>
                  <button onClick={() => setEditProject(null)} className="px-4 py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/70">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {projects.length > 1 && (
                  <p className="text-white/30 text-xs mb-3 flex items-center gap-1.5">
                    <GripVertical size={12} /> Drag the handle to reorder — this is the order shown on your site.
                  </p>
                )}
                <Reorder.Group axis="y" values={projects} onReorder={setProjects} className="flex flex-col gap-3">
                  {projects.map((p) => (
                    <Reorder.Item key={p.id} value={p} onDragEnd={persistOrder}
                      className="flex items-center gap-3 p-4 rounded-xl" style={cardStyle}>
                      <span className="cursor-grab active:cursor-grabbing text-white/25 hover:text-white/60 transition-colors touch-none">
                        <GripVertical size={16} />
                      </span>
                      {p.imageURL && <img src={p.imageURL} alt={p.title} className="w-14 h-10 object-cover rounded-lg shrink-0" style={{ objectPosition: p.focus || "50% 50%" }} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium font-syne truncate">{p.title || "Untitled"}</p>
                        <p className="text-white/35 text-xs">{p.category} · {p.year}{p.featured ? " · ★ Featured" : ""}</p>
                      </div>
                      <button onClick={() => setEditProject(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "hsl(var(--p) / 0.08)", color: "hsl(var(--p))", border: "1px solid hsl(var(--p) / 0.15)" }}>Edit</button>
                      <button onClick={() => deleteProject(p.id)} className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </>
            )}
          </div>
        )}

        {/* ── BLOG TAB (NEW) ── */}
        {deferredTab === "blog" && (
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-bold text-lg font-syne">Blog Articles & Tutorials</h2>
                <p className="text-white/40 text-xs mt-0.5">Publish articles, dev guides, and thoughts with rich Markdown support.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditPost(newBlogPost())}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-syne transition-all hover:scale-105"
                style={{ background: "hsl(var(--p) / 0.12)", color: "hsl(var(--p))", border: "1px solid hsl(var(--p) / 0.25)" }}
              >
                <Plus size={14} /> Write New Article
              </button>
            </div>

            {/* Post Editor Drawer/Modal */}
            {editPost ? (
              <div className="rounded-2xl p-6 mb-8" style={{ background: "hsl(210 60% 8% / 0.7)", border: "1px solid hsl(var(--p) / 0.25)" }}>
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                  <h3 className="text-white font-bold font-syne text-base">
                    {blogPosts.find((x) => x.id === editPost.id) ? "Edit Article" : "Create New Article"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-xl p-1 bg-white/5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => setPostPreviewMode("edit")}
                        className={`px-3 py-1 rounded-lg text-xs font-syne transition-all ${
                          postPreviewMode === "edit" ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white"
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostPreviewMode("preview")}
                        className={`px-3 py-1 rounded-lg text-xs font-syne transition-all ${
                          postPreviewMode === "preview" ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white"
                        }`}
                      >
                        Live Preview
                      </button>
                    </div>
                    <button type="button" onClick={() => setEditPost(null)} className="p-1.5 text-white/40 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {postPreviewMode === "edit" ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <TextField
                        label="Article Title"
                        value={editPost.title}
                        onChange={(v) => {
                          setEditPost((p) => {
                            if (!p) return null;
                            const newSlug = p.slug.startsWith("post-")
                              ? v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || p.slug
                              : p.slug;
                            return { ...p, title: v, slug: newSlug };
                          });
                        }}
                      />
                      <TextField
                        label="URL Slug (/blog/slug)"
                        value={editPost.slug}
                        onChange={(v) => setEditPost((p) => p && { ...p, slug: v.toLowerCase().replace(/[^a-z0-9_-]/g, "-") })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-white/35 text-xs uppercase tracking-wider font-syne">Category</label>
                        <input
                          value={editPost.category}
                          onChange={(e) => setEditPost((p) => p && { ...p, category: e.target.value })}
                          placeholder="e.g. Web3, AI, Design, Tech"
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>
                      <TextField
                        label="Publish Date (YYYY-MM-DD)"
                        value={editPost.publishedAt}
                        onChange={(v) => setEditPost((p) => p && { ...p, publishedAt: v })}
                      />
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-white/35 text-xs uppercase tracking-wider font-syne">Read Time</label>
                          <button
                            type="button"
                            onClick={() => {
                              const words = (editPost.content || "").trim().split(/\s+/).length;
                              const min = Math.max(1, Math.ceil(words / 200));
                              setEditPost((p) => p && { ...p, readTime: `${min} min read` });
                            }}
                            className="text-[10px] text-cyan-400 hover:underline"
                          >
                            ⚡ Auto-calc
                          </button>
                        </div>
                        <input
                          value={editPost.readTime}
                          onChange={(e) => setEditPost((p) => p && { ...p, readTime: e.target.value })}
                          placeholder="e.g. 5 min read"
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <TextField
                      label="Tags (comma-separated)"
                      value={(editPost.tags || []).join(", ")}
                      onChange={(v) =>
                        setEditPost((p) => p && { ...p, tags: v.split(",").map((s) => s.trim()).filter(Boolean) })
                      }
                      full
                      placeholder="Next.js, Tailwind, Blockchain, AI"
                    />

                    <TextArea
                      label="Summary Excerpt (Shown on cards & previews)"
                      value={editPost.excerpt}
                      onChange={(v) => setEditPost((p) => p && { ...p, excerpt: v })}
                      rows={2}
                      placeholder="Brief 1-2 sentence overview of the article..."
                    />

                    <div className="col-span-2">
                      <ImageUpload
                        label="Cover Image (Recommended 16:9)"
                        value={editPost.coverImage}
                        onChange={(v) => setEditPost((p) => p && { ...p, coverImage: v })}
                      />
                    </div>

                    {/* Markdown Formatting Toolbar */}
                    <div className="flex flex-col gap-1.5 mt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-white/35 text-xs uppercase tracking-wider font-syne">
                          Article Content (Markdown)
                        </label>
                        <div className="flex items-center gap-1 text-[11px] text-white/50">
                          <button
                            type="button"
                            onClick={() => setEditPost((p) => p && { ...p, content: (p.content || "") + "\n\n## Section Heading\n" })}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditPost((p) => p && { ...p, content: (p.content || "") + "\n\n### Sub-heading\n" })}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
                          >
                            H3
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditPost((p) => p && { ...p, content: (p.content || "") + " **bold text** " })}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 font-bold"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditPost((p) => p && { ...p, content: (p.content || "") + " *italic text* " })}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 italic"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditPost((p) => p && { ...p, content: (p.content || "") + "\n\n> Important quote or callout\n" })}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
                          >
                            &quot;
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditPost((p) => p && { ...p, content: (p.content || "") + "\n\n```typescript\n// your code here\n```\n" })}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 font-mono"
                          >
                            &lt;/&gt;
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditPost((p) => p && { ...p, content: (p.content || "") + "\n\n- Key bullet point 1\n- Key bullet point 2\n" })}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
                          >
                            • List
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={editPost.content}
                        onChange={(e) => setEditPost((p) => p && { ...p, content: e.target.value })}
                        rows={14}
                        placeholder="Write your article content using Markdown..."
                        className={inputCls + " font-mono text-xs leading-relaxed"}
                        style={inputStyle}
                        onFocus={focusOn}
                        onBlur={focusOff}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <Toggle
                        label="Published"
                        desc="Live and visible on your public blog"
                        checked={editPost.published}
                        onChange={(v) => setEditPost((p) => p && { ...p, published: v })}
                      />
                      <Toggle
                        label="Featured on Top"
                        desc="Spotlight prominently in hero banner"
                        checked={editPost.featured}
                        onChange={(v) => setEditPost((p) => p && { ...p, featured: v })}
                      />
                    </div>
                  </div>
                ) : (
                  /* Live Preview */
                  <div className="p-6 rounded-2xl bg-black/40 border border-white/10 max-h-[600px] overflow-y-auto">
                    {editPost.coverImage && (
                      <div className="h-56 w-full rounded-xl overflow-hidden mb-6">
                        <img src={editPost.coverImage} alt={editPost.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-cyan-400 font-syne mb-2">
                      <span>{editPost.category}</span>
                      <span>·</span>
                      <span>{editPost.publishedAt}</span>
                      <span>·</span>
                      <span>{editPost.readTime}</span>
                    </div>
                    <h1 className="text-2xl font-bold font-syne text-white mb-3">{editPost.title || "Untitled Article"}</h1>
                    <p className="text-white/60 text-sm italic mb-6 border-l-2 border-cyan-400 pl-3">{editPost.excerpt}</p>
                    <div className="text-white/80 space-y-3 font-sans text-sm leading-relaxed whitespace-pre-line">
                      {editPost.content}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => savePost(editPost)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold font-syne"
                    style={btnPrimary}
                  >
                    <Save size={13} /> Save Article
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPost(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/70"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Blog Section Header & Intro Setting */}
            <div className="rounded-2xl p-5 mb-6" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-3">Blog Header Intro</p>
              <div className="flex gap-2">
                <input
                  value={blogIntro}
                  onChange={(e) => setBlogIntro(e.target.value)}
                  placeholder="Intro description shown at top of /blog page..."
                  className={inputCls}
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
                <button
                  type="button"
                  onClick={() => saveBlogList(blogPosts, blogIntro)}
                  disabled={savingBlog}
                  className="px-4 py-2 rounded-xl text-xs font-semibold font-syne whitespace-nowrap"
                  style={btnPrimary}
                >
                  <Save size={12} className="inline mr-1" /> {savingBlog ? "Saving..." : "Save Intro"}
                </button>
              </div>
            </div>

            {/* Articles List */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne">
                Articles ({blogPosts.length})
              </p>
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={blogFilter}
                  onChange={(e) => setBlogFilter(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs text-white outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            {blogPosts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl" style={cardStyle}>
                <BookOpen size={28} className="mx-auto text-white/20 mb-2" />
                <p className="text-white/60 text-sm font-syne">No blog posts yet.</p>
                <button
                  type="button"
                  onClick={() => setEditPost(newBlogPost())}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-cyan-400 border border-cyan-400/30"
                >
                  + Write your first article
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {blogPosts
                  .filter((p) => !blogFilter.trim() || p.title.toLowerCase().includes(blogFilter.toLowerCase()))
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl transition-all hover:border-cyan-400/30"
                      style={cardStyle}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {p.coverImage ? (
                          <img src={p.coverImage} alt={p.title} className="w-14 h-10 object-cover rounded-lg shrink-0" />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/30 shrink-0">
                            <BookOpen size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-semibold font-syne truncate">{p.title || "Untitled"}</p>
                            {p.featured && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-400/20 text-cyan-400 font-bold">
                                Featured
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                p.published ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {p.published ? "Published" : "Draft"}
                            </span>
                          </div>
                          <p className="text-white/40 text-xs mt-0.5">
                            {p.category} · {p.publishedAt} · {p.readTime} · /blog/{p.slug}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on site"
                          className="p-2 rounded-lg text-white/40 hover:text-white transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setEditPost(p);
                            setPostPreviewMode("edit");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{
                            background: "hsl(var(--p) / 0.08)",
                            color: "hsl(var(--p))",
                            border: "1px solid hsl(var(--p) / 0.15)",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePost(p.id)}
                          className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ── INBOX TAB (NEW) ── */}
        {deferredTab === "inbox" && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-bold text-lg font-syne">Direct Contact Inbox</h2>
                <p className="text-white/40 text-xs mt-0.5">Messages sent by visitors directly through your website&apos;s contact form.</p>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={markAllMessagesRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-syne text-white/60 hover:text-white bg-white/5 border border-white/10 transition-all"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 mb-5">
              <button
                type="button"
                onClick={() => setMessageFilter("all")}
                className={`px-3 py-1 rounded-xl text-xs font-syne font-medium transition-all ${
                  messageFilter === "all"
                    ? "bg-white/15 text-white font-bold border border-white/20"
                    : "text-white/40 hover:text-white"
                }`}
              >
                All ({messages.length})
              </button>
              <button
                type="button"
                onClick={() => setMessageFilter("unread")}
                className={`px-3 py-1 rounded-xl text-xs font-syne font-medium transition-all ${
                  messageFilter === "unread"
                    ? "bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30"
                    : "text-white/40 hover:text-white"
                }`}
              >
                Unread ({unreadMessagesCount})
              </button>
            </div>

            {/* Messages list */}
            {messages.length === 0 ? (
              <div className="p-10 text-center rounded-2xl" style={cardStyle}>
                <Mail size={32} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/60 font-semibold font-syne">No messages yet.</p>
                <p className="text-white/35 text-xs mt-1">When someone submits your contact form, their message will appear here!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages
                  .filter((m) => messageFilter === "all" || !m.read)
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-2xl p-5 transition-all"
                      style={{
                        ...cardStyle,
                        border: !msg.read ? "1px solid hsl(var(--p) / 0.35)" : cardStyle.border,
                        background: !msg.read ? "hsl(210 60% 8% / 0.85)" : cardStyle.background,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2.5">
                          {!msg.read && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                background: "hsl(var(--p))",
                                boxShadow: "0 0 10px hsl(var(--p))",
                              }}
                            />
                          )}
                          <div>
                            <p className="text-white font-bold text-sm font-syne leading-tight">{msg.name}</p>
                            <a
                              href={`mailto:${msg.email}?subject=Re: Your message to Asikur`}
                              className="text-xs text-cyan-400 hover:underline"
                            >
                              {msg.email}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                          <Clock size={11} />
                          <span>
                            {new Date(msg.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 text-white/80 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${msg.email}?subject=Re: Your message to Asikur`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-syne transition-all hover:scale-105"
                            style={{
                              background: "hsl(var(--p) / 0.12)",
                              color: "hsl(var(--p))",
                              border: "1px solid hsl(var(--p) / 0.25)",
                            }}
                          >
                            <Reply size={12} /> Reply via Email
                          </a>
                          <button
                            type="button"
                            onClick={() => toggleMessageRead(msg.id, msg.read)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white/50 hover:text-white bg-white/5 transition-all"
                          >
                            <Check size={12} /> {msg.read ? "Mark as unread" : "Mark as read"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ── Career ── */}
        {deferredTab === "career" && (
          <div className="max-w-2xl">
            <h2 className="text-white font-bold text-lg font-syne mb-1">Career & Experience</h2>
            <p className="text-white/35 text-xs mb-6">Work experience, education, and milestones.</p>
            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <TextArea label="Career page intro" value={careerIntro} onChange={setCareerIntro} rows={2} />
            </div>
            {careerSections.map((sec, si) => (
              <div key={si} className="rounded-2xl p-5 mb-5" style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <input value={sec.title} placeholder="Section title" className={inputCls + " font-syne font-bold max-w-xs"} style={inputStyle}
                    onChange={(e) => setCareerSections(careerSections.map((s, j) => (j === si ? { ...s, title: e.target.value } : s)))} onFocus={focusOn} onBlur={focusOff} />
                  <button onClick={() => setCareerSections(careerSections.filter((_, j) => j !== si))} className="text-red-400/60 hover:text-red-400 text-xs font-syne">Remove section</button>
                </div>
                {sec.items.map((item, ii) => (
                  <div key={item.id} className="grid grid-cols-2 gap-2 mb-3 p-3 rounded-xl" style={{ background: "hsl(210 60% 6% / 0.5)", border: "1px solid hsl(0 0% 100% / 0.05)" }}>
                    <input value={item.title} placeholder="Role / Degree" className={inputCls} style={inputStyle}
                      onChange={(e) => setCareerSections(careerSections.map((s, j) => (j === si ? { ...s, items: s.items.map((it, k) => (k === ii ? { ...it, title: e.target.value } : it)) } : s)))} onFocus={focusOn} onBlur={focusOff} />
                    <input value={item.org} placeholder="Company / University" className={inputCls} style={inputStyle}
                      onChange={(e) => setCareerSections(careerSections.map((s, j) => (j === si ? { ...s, items: s.items.map((it, k) => (k === ii ? { ...it, org: e.target.value } : it)) } : s)))} onFocus={focusOn} onBlur={focusOff} />
                    <input value={item.years} placeholder="Years (e.g. 2022 - Present)" className={inputCls} style={inputStyle}
                      onChange={(e) => setCareerSections(careerSections.map((s, j) => (j === si ? { ...s, items: s.items.map((it, k) => (k === ii ? { ...it, years: e.target.value } : it)) } : s)))} onFocus={focusOn} onBlur={focusOff} />
                    <div className="flex gap-2">
                      <input value={item.type} placeholder="Type (e.g. Full-time)" className={inputCls} style={inputStyle}
                        onChange={(e) => setCareerSections(careerSections.map((s, j) => (j === si ? { ...s, items: s.items.map((it, k) => (k === ii ? { ...it, type: e.target.value } : it)) } : s)))} onFocus={focusOn} onBlur={focusOff} />
                      <button onClick={() => setCareerSections(careerSections.map((s, j) => (j === si ? { ...s, items: s.items.filter((_, k) => k !== ii) } : s)))} className="p-2 text-red-400/50 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setCareerSections(careerSections.map((s, j) => (j === si ? { ...s, items: [...s.items, { id: uid(), type: "", title: "", org: "", years: "" }] } : s)))}
                  className="flex items-center gap-1 text-xs text-white/50 hover:text-white mt-1 font-syne"><Plus size={12} /> Add item</button>
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setCareerSections([...careerSections, { title: "New Section", items: [] }])}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-syne" style={{ background: "hsl(var(--p) / 0.1)", color: "hsl(var(--p))", border: "1px solid hsl(var(--p) / 0.2)" }}>
                <Plus size={13} /> Add section
              </button>
              <SaveBtn onClick={saveCareer} label="Save career" />
            </div>
          </div>
        )}

        {/* ── Skills ── */}
        {deferredTab === "skills" && (
          <div className="max-w-2xl">
            <h2 className="text-white font-bold text-lg font-syne mb-1">Skills</h2>
            <p className="text-white/35 text-xs mb-6">Group skills by category (e.g. Frontend, Backend, Tools).</p>
            {skillGroups.map((g, gi) => (
              <div key={gi} className="rounded-2xl p-5 mb-4" style={cardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <input value={g.name} placeholder="Group name" className={inputCls + " font-syne font-bold max-w-xs"} style={inputStyle}
                    onChange={(e) => setSkillGroups(skillGroups.map((x, j) => (j === gi ? { ...x, name: e.target.value } : x)))} onFocus={focusOn} onBlur={focusOff} />
                  <button onClick={() => setSkillGroups(skillGroups.filter((_, j) => j !== gi))} className="text-red-400/60 hover:text-red-400 text-xs font-syne">Remove group</button>
                </div>
                <TextArea label="Skills (comma-separated)" value={g.items.join(", ")}
                  onChange={(v) => setSkillGroups(skillGroups.map((x, j) => (j === gi ? { ...x, items: v.split(",").map((s) => s.trim()).filter(Boolean) } : x)))} rows={2} />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setSkillGroups([...skillGroups, { name: "New Group", items: [] }])}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-syne" style={{ background: "hsl(var(--p) / 0.1)", color: "hsl(var(--p))", border: "1px solid hsl(var(--p) / 0.2)" }}>
                <Plus size={13} /> Add group
              </button>
              <SaveBtn onClick={saveSkills} label="Save skills" />
            </div>
          </div>
        )}

        {/* ── Highlights ── */}
        {deferredTab === "highlights" && (
          <div className="max-w-2xl">
            <h2 className="text-white font-bold text-lg font-syne mb-1">Highlights</h2>
            <p className="text-white/35 text-xs mb-6">Interactive highlight cards showcased on your personal about page.</p>
            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Section title" value={highlightsTitle} onChange={setHighlightsTitle} full />
                <TextArea label="Intro text" value={highlightsIntro} onChange={setHighlightsIntro} rows={2} />
              </div>
            </div>
            {highlightItems.map((item, idx) => (
              <div key={item.id || idx} className="rounded-2xl p-5 mb-4" style={cardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-bold text-sm font-syne">Highlight #{idx + 1}</p>
                  <button onClick={() => setHighlightItems(highlightItems.filter((_, j) => j !== idx))} className="text-red-400/60 hover:text-red-400 text-xs font-syne">Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Title" value={item.title} onChange={(v) => setHighlightItems(highlightItems.map((x, j) => (j === idx ? { ...x, title: v } : x)))} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/35 text-xs uppercase tracking-wider font-syne">Icon</label>
                    <select
                      value={item.icon || "Sparkles"}
                      onChange={(e) => setHighlightItems(highlightItems.map((x, j) => (j === idx ? { ...x, icon: e.target.value } : x)))}
                      className={inputCls}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {HIGHLIGHT_ICON_NAMES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <TextArea label="Description" value={item.description} onChange={(v) => setHighlightItems(highlightItems.map((x, j) => (j === idx ? { ...x, description: v } : x)))} rows={2} />
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setHighlightItems([...highlightItems, { id: uid(), title: "", description: "", icon: "Sparkles" }])}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-syne" style={{ background: "hsl(var(--p) / 0.1)", color: "hsl(var(--p))", border: "1px solid hsl(var(--p) / 0.2)" }}>
                <Plus size={13} /> Add highlight
              </button>
              <SaveBtn onClick={saveHighlights} label="Save highlights" />
            </div>
          </div>
        )}

        {/* ── Services ── */}
        {deferredTab === "services" && (
          <div className="max-w-2xl">
            <h2 className="text-white font-bold text-lg font-syne mb-1">Services</h2>
            <p className="text-white/35 text-xs mb-6">Showcase client offerings and freelancing capabilities.</p>
            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <TextArea label="Services page intro" value={servicesIntro} onChange={setServicesIntro} rows={2} />
            </div>
            {services.map((s, idx) => (
              <div key={s.id} className="rounded-2xl p-5 mb-4" style={cardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <input value={s.title} placeholder="Service title" className={inputCls + " font-syne font-bold max-w-xs"} style={inputStyle}
                    onChange={(e) => setServices(services.map((x, j) => (j === idx ? { ...x, title: e.target.value } : x)))} onFocus={focusOn} onBlur={focusOff} />
                  <button onClick={() => setServices(services.filter((_, j) => j !== idx))} className="text-red-400/60 hover:text-red-400 text-xs font-syne">Remove</button>
                </div>
                <TextArea label="Description" value={s.description} onChange={(v) => setServices(services.map((x, j) => (j === idx ? { ...x, description: v } : x)))} rows={2} />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setServices([...services, { id: uid(), title: "", description: "", icon: "Wrench" }])}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-syne" style={{ background: "hsl(var(--p) / 0.1)", color: "hsl(var(--p))", border: "1px solid hsl(var(--p) / 0.2)" }}>
                <Plus size={13} /> Add service
              </button>
              <SaveBtn onClick={saveServices} label="Save services" />
            </div>
          </div>
        )}

        {/* ── Testimonials ── */}
        {deferredTab === "testimonials" && (
          <div className="max-w-2xl">
            <h2 className="text-white font-bold text-lg font-syne mb-1">Testimonials</h2>
            <p className="text-white/35 text-xs mb-6">Client reviews and peer recommendations.</p>
            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <TextArea label="Testimonials intro" value={testiIntro} onChange={setTestiIntro} rows={2} />
            </div>
            {testimonials.map((t, idx) => (
              <div key={t.id} className="rounded-2xl p-5 mb-4" style={cardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-bold text-sm font-syne">Testimonial #{idx + 1}</p>
                  <button onClick={() => setTestimonials(testimonials.filter((_, j) => j !== idx))} className="text-red-400/60 hover:text-red-400 text-xs font-syne">Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Name" value={t.name} onChange={(v) => setTestimonials(testimonials.map((x, j) => (j === idx ? { ...x, name: v } : x)))} />
                  <TextField label="Role / Company" value={t.role} onChange={(v) => setTestimonials(testimonials.map((x, j) => (j === idx ? { ...x, role: v } : x)))} />
                  <TextArea label="Quote / Feedback" value={t.quote} onChange={(v) => setTestimonials(testimonials.map((x, j) => (j === idx ? { ...x, quote: v } : x)))} rows={3} />
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setTestimonials([...testimonials, { id: uid(), name: "", role: "", quote: "", avatar: "" }])}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-syne" style={{ background: "hsl(var(--p) / 0.1)", color: "hsl(var(--p))", border: "1px solid hsl(var(--p) / 0.2)" }}>
                <Plus size={13} /> Add testimonial
              </button>
              <SaveBtn onClick={saveTestimonials} label="Save testimonials" />
            </div>
          </div>
        )}

        {/* ── AI SETTINGS TAB (UPGRADED WITH CUSTOM AI & LATEST MODELS) ── */}
        {deferredTab === "ai" && (
          <div className="max-w-2xl">
            <h2 className="text-white font-bold text-lg font-syne mb-1">AI Settings & Integrations</h2>
            <p className="text-white/35 text-xs mb-6">
              Configure the AI assistant for your portfolio. Choose from leading cloud models or connect any Custom AI API.
            </p>

            {/* Provider Selector (5 options including Custom AI) */}
            <div className="mb-6">
              <p className="text-white/35 text-xs uppercase tracking-wider font-syne mb-3">AI Provider</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { id: "gemini", label: "Gemini", emoji: "✦", color: "hsl(200,100%,50%)" },
                  { id: "openai", label: "ChatGPT", emoji: "🤖", color: "hsl(142,70%,45%)" },
                  { id: "claude", label: "Claude", emoji: "🔶", color: "hsl(30,90%,55%)" },
                  { id: "openrouter", label: "OpenRouter", emoji: "🌐", color: "hsl(280,70%,60%)" },
                  { id: "custom", label: "Custom AI", emoji: "⚙️", color: "hsl(330,85%,60%)" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAiSettings((s) => ({ ...s, provider: p.id }))}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold font-syne transition-all hover:scale-105 cursor-pointer"
                    style={
                      aiSettings.provider === p.id
                        ? { background: `${p.color}22`, border: `1px solid ${p.color}55`, color: p.color }
                        : { background: "hsl(210 60% 7%)", border: "1px solid hsl(var(--p) / 0.08)", color: "rgba(255,255,255,0.4)" }
                    }
                  >
                    <span className="text-lg">{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Details Card */}
            <div className="rounded-xl p-5 mb-5" style={cardStyle}>
              {/* Google Gemini */}
              {aiSettings.provider === "gemini" && (
                <ProviderKey
                  label="Google Gemini (Recommended)"
                  keyField="geminiKey"
                  placeholder="AIzaSy..."
                  link="https://aistudio.google.com/app/apikey"
                  linkText="Google AI Studio"
                  aiSettings={aiSettings}
                  setAiSettings={setAiSettings}
                  showKeys={showKeys}
                  setShowKeys={setShowKeys}
                >
                  <select
                    value={aiSettings.geminiModel || "gemini-2.0-flash"}
                    onChange={(e) => setAiSettings((s) => ({ ...s, geminiModel: e.target.value }))}
                    className={inputCls}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="gemini-2.0-flash">gemini-2.0-flash (Fast, Multimodal — Recommended ⭐)</option>
                    <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Ultra Lightweight)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Balanced)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Complex Reasoning & 2M Context)</option>
                  </select>
                  <div className="mt-2">
                    <label className="text-white/30 text-[11px] block mb-1">Or enter custom Gemini model ID:</label>
                    <input
                      value={aiSettings.geminiModel || ""}
                      onChange={(e) => setAiSettings((s) => ({ ...s, geminiModel: e.target.value }))}
                      placeholder="e.g. gemini-2.0-flash"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                </ProviderKey>
              )}

              {/* OpenAI */}
              {aiSettings.provider === "openai" && (
                <ProviderKey
                  label="OpenAI / ChatGPT"
                  keyField="openaiKey"
                  placeholder="sk-proj-..."
                  link="https://platform.openai.com/api-keys"
                  linkText="OpenAI Platform"
                  aiSettings={aiSettings}
                  setAiSettings={setAiSettings}
                  showKeys={showKeys}
                  setShowKeys={setShowKeys}
                >
                  <select
                    value={aiSettings.openaiModel || "gpt-4o-mini"}
                    onChange={(e) => setAiSettings((s) => ({ ...s, openaiModel: e.target.value }))}
                    className={inputCls}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast & Low Cost — Recommended ⭐)</option>
                    <option value="gpt-4o">gpt-4o (Flagship Omni Model)</option>
                    <option value="o3-mini">o3-mini (High-Speed Reasoning)</option>
                    <option value="o1">o1 (Advanced Deep Reasoning)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                  </select>
                  <div className="mt-2">
                    <label className="text-white/30 text-[11px] block mb-1">Or enter custom OpenAI model ID:</label>
                    <input
                      value={aiSettings.openaiModel || ""}
                      onChange={(e) => setAiSettings((s) => ({ ...s, openaiModel: e.target.value }))}
                      placeholder="e.g. gpt-4o-mini"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                </ProviderKey>
              )}

              {/* Anthropic Claude */}
              {aiSettings.provider === "claude" && (
                <ProviderKey
                  label="Anthropic Claude"
                  keyField="claudeKey"
                  placeholder="sk-ant-..."
                  link="https://console.anthropic.com/account/keys"
                  linkText="Anthropic Console"
                  aiSettings={aiSettings}
                  setAiSettings={setAiSettings}
                  showKeys={showKeys}
                  setShowKeys={setShowKeys}
                >
                  <select
                    value={aiSettings.claudeModel || "claude-3-5-haiku-20241022"}
                    onChange={(e) => setAiSettings((s) => ({ ...s, claudeModel: e.target.value }))}
                    className={inputCls}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="claude-3-5-haiku-20241022">claude-3-5-haiku-20241022 (Fast & Cost Efficient ⭐)</option>
                    <option value="claude-3-7-sonnet-20250219">claude-3-7-sonnet-20250219 (Latest 3.7 Hybrid Reasoning)</option>
                    <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022 (Industry Leading)</option>
                    <option value="claude-3-opus-20240229">claude-3-opus-20240229 (Deep Analysis)</option>
                  </select>
                  <div className="mt-2">
                    <label className="text-white/30 text-[11px] block mb-1">Or enter custom Claude model ID:</label>
                    <input
                      value={aiSettings.claudeModel || ""}
                      onChange={(e) => setAiSettings((s) => ({ ...s, claudeModel: e.target.value }))}
                      placeholder="e.g. claude-3-7-sonnet-20250219"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                </ProviderKey>
              )}

              {/* OpenRouter */}
              {aiSettings.provider === "openrouter" && (
                <ProviderKey
                  label="OpenRouter (Access 100+ Models)"
                  keyField="openrouterKey"
                  placeholder="sk-or-..."
                  link="https://openrouter.ai/keys"
                  linkText="openrouter.ai"
                  aiSettings={aiSettings}
                  setAiSettings={setAiSettings}
                  showKeys={showKeys}
                  setShowKeys={setShowKeys}
                >
                  <input
                    value={aiSettings.openrouterModel || "deepseek/deepseek-chat"}
                    onChange={(e) => setAiSettings((s) => ({ ...s, openrouterModel: e.target.value }))}
                    placeholder="e.g. deepseek/deepseek-chat or google/gemini-2.0-flash-001"
                    className={inputCls}
                    style={inputStyle}
                    onFocus={focusOn}
                    onBlur={focusOff}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      "deepseek/deepseek-chat",
                      "deepseek/deepseek-r1",
                      "google/gemini-2.0-flash-001",
                      "meta-llama/llama-3.3-70b-instruct",
                    ].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAiSettings((s) => ({ ...s, openrouterModel: m }))}
                        className="px-2 py-0.5 rounded text-[10px] bg-white/5 hover:bg-white/10 text-white/60 font-mono"
                      >
                        {m.split("/")[1]}
                      </button>
                    ))}
                  </div>
                </ProviderKey>
              )}

              {/* Custom AI Provider (OpenAI Compatible: DeepSeek, Groq, Ollama, etc.) */}
              {aiSettings.provider === "custom" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne">
                      Custom AI Integration (OpenAI-Compatible)
                    </p>
                    <span className="text-[11px] text-pink-400 font-mono">Compatible with DeepSeek, Groq, Ollama, vLLM</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <TextField
                      label="Provider Name"
                      value={aiSettings.customName || ""}
                      onChange={(v) => setAiSettings((s) => ({ ...s, customName: v }))}
                      placeholder="e.g. DeepSeek, Groq, Local Ollama"
                    />
                    <TextField
                      label="API Base URL"
                      value={aiSettings.customBaseUrl || ""}
                      onChange={(v) => setAiSettings((s) => ({ ...s, customBaseUrl: v }))}
                      placeholder="https://api.deepseek.com/v1"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/35 text-xs uppercase tracking-wider font-syne">
                      API Key (Optional for local Ollama)
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys["custom"] ? "text" : "password"}
                        value={aiSettings.customKey || ""}
                        placeholder="sk-... or leave blank for local models"
                        onChange={(e) => setAiSettings((s) => ({ ...s, customKey: e.target.value }))}
                        className={inputCls + " pr-10"}
                        style={inputStyle}
                        onFocus={focusOn}
                        onBlur={focusOff}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys((kk) => ({ ...kk, custom: !kk["custom"] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showKeys["custom"] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <TextField
                    label="Model Name"
                    value={aiSettings.customModel || ""}
                    onChange={(v) => setAiSettings((s) => ({ ...s, customModel: v }))}
                    placeholder="e.g. deepseek-chat, llama-3.3-70b-versatile, mistral"
                    full
                  />

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/50 space-y-1">
                    <p>💡 <strong>Quick setups:</strong></p>
                    <p>• <strong>DeepSeek:</strong> URL: <code>https://api.deepseek.com/v1</code>, Model: <code>deepseek-chat</code></p>
                    <p>• <strong>Groq:</strong> URL: <code>https://api.groq.com/openai/v1</code>, Model: <code>llama-3.3-70b-versatile</code></p>
                    <p>• <strong>Local Ollama:</strong> URL: <code>http://localhost:11434/v1</code>, Model: <code>llama3.2</code> (Key: optional)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Assistant Personality Card */}
            <div className="rounded-xl p-5 mb-5" style={cardStyle}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne mb-4">
                Assistant Personality
              </p>
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Assistant Name"
                  value={aiSettings.assistantName}
                  onChange={(v) => setAiSettings((s) => ({ ...s, assistantName: v }))}
                  full
                />
                <TextArea
                  label="Greeting Message"
                  value={aiSettings.greeting}
                  onChange={(v) => setAiSettings((s) => ({ ...s, greeting: v }))}
                  rows={2}
                />
              </div>
            </div>

            {/* Save & Test Buttons */}
            <div className="flex items-center gap-3">
              <SaveBtn onClick={saveAiSettings} saving={aiSaving} label="Save AI settings" />
              <button
                type="button"
                onClick={testAiConnection}
                disabled={aiTesting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-syne transition-all hover:scale-[1.02] disabled:opacity-60 cursor-pointer"
                style={{
                  background: "hsl(var(--p) / 0.12)",
                  color: "hsl(var(--p))",
                  border: "1px solid hsl(var(--p) / 0.25)",
                }}
              >
                <Sparkles size={14} className={aiTesting ? "animate-spin" : ""} />
                {aiTesting ? "Testing AI connection..." : "Test AI Connection"}
              </button>
            </div>
          </div>
        )}

        {/* ── Password ── */}
        {deferredTab === "password" && (
          <div className="max-w-sm">
            <h2 className="text-white font-bold text-lg font-syne mb-6">Change Password</h2>
            <form onSubmit={changePassword} className="flex flex-col gap-4 p-5 rounded-2xl" style={{ background: "hsl(210 60% 8% / 0.6)", border: "1px solid hsl(var(--p) / 0.1)" }}>
              {["newPassword", "confirm"].map((f) => (
                <div key={f} className="flex flex-col gap-1.5">
                  <label className="text-white/35 text-xs uppercase tracking-wider font-syne">{f === "newPassword" ? "New password" : "Confirm password"}</label>
                  <input type="password" required value={pwForm[f as keyof typeof pwForm]} onChange={(e) => setPwForm((p) => ({ ...p, [f]: e.target.value }))} className={inputCls} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
              ))}
              <button type="submit" className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold font-syne transition-all hover:scale-[1.02]" style={btnPrimary}><Lock size={13} /> Update password</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

// ── AI provider key block ──
function ProviderKey({ label, keyField, placeholder, link, linkText, aiSettings, setAiSettings, showKeys, setShowKeys, children }: {
  label: string; keyField: string; placeholder: string; link: string; linkText: string;
  aiSettings: Record<string, string>; setAiSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showKeys: Record<string, boolean>; setShowKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  children: React.ReactNode;
}) {
  const k = keyField.replace("Key", "");
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider font-syne">{label}</p>
      <div className="flex flex-col gap-1.5">
        <label className="text-white/35 text-xs uppercase tracking-wider font-syne">API Key</label>
        <div className="relative">
          <input type={showKeys[k] ? "text" : "password"} value={aiSettings[keyField] ?? ""} placeholder={placeholder}
            onChange={(e) => setAiSettings((s) => ({ ...s, [keyField]: e.target.value }))} className={inputCls + " pr-10"} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
          <button type="button" onClick={() => setShowKeys((kk) => ({ ...kk, [k]: !kk[k] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            {showKeys[k] ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-[11px]" style={{ color: "hsl(var(--p))" }}>↗ Get your API key from {linkText}</a>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-white/35 text-xs uppercase tracking-wider font-syne">Model</label>
        {children}
      </div>
    </div>
  );
}
