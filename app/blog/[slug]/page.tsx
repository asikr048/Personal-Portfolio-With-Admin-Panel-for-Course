"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Copy,
  Check,
  Twitter,
  Linkedin,
  BookOpen,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { sound } from "@/lib/sound";
import { useSiteConfig } from "@/lib/hooks/useSiteConfig";
import type { BlogPost, BlogData } from "@/app/api/blog/route";

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const cfg = useSiteConfig();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data: BlogData) => {
        const found = (data.items || []).find((p) => p.slug === slug || p.id === slug);
        if (found) {
          setPost(found);
          const others = (data.items || []).filter((p) => p.id !== found.id && p.published !== false);
          setRelated(others.slice(0, 2));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load post:", err);
        setLoading(false);
      });
  }, [slug]);

  // Scroll Progress Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleCopyLink() {
    sound.playPop();
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Article link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  }

  function handleShareTwitter() {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this article: "${post.title}"`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }

  function handleShareLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  }

  // Simple, clean Markdown renderer for article content
  function renderContent(md: string) {
    if (!md) return null;
    const blocks = md.split("\n\n");

    return blocks.map((block, index) => {
      const trimmed = block.trim();

      // Code Block
      if (trimmed.startsWith("```")) {
        const lines = trimmed.split("\n");
        const lang = lines[0].replace("```", "").trim();
        const code = lines.slice(1, lines[lines.length - 1].startsWith("```") ? -1 : undefined).join("\n");

        return (
          <div
            key={index}
            className="my-6 rounded-2xl overflow-hidden border"
            style={{
              background: "hsl(210 60% 5%)",
              borderColor: "hsl(var(--p) / 0.18)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-2 border-b text-xs font-mono"
              style={{
                background: "hsl(210 60% 8% / 0.6)",
                borderColor: "hsl(var(--p) / 0.12)",
                color: "hsl(var(--p))",
              }}
            >
              <span>{lang || "code"}</span>
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  navigator.clipboard.writeText(code);
                  toast.success("Code copied!");
                }}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Copy size={12} />
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 text-xs md:text-sm font-mono text-white/85 overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={index} className="text-xl md:text-2xl font-bold font-syne text-white mt-8 mb-3">
            {trimmed.replace("### ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={index} className="text-2xl md:text-3xl font-bold font-syne text-white mt-10 mb-4">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={index} className="text-3xl md:text-4xl font-extrabold font-syne text-white mt-12 mb-5">
            {trimmed.replace("# ", "")}
          </h1>
        );
      }

      // Blockquote
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote
            key={index}
            className="my-6 pl-4 py-2 rounded-r-xl border-l-2 text-sm md:text-base italic text-white/80"
            style={{
              borderColor: "hsl(var(--p))",
              background: "hsl(var(--p) / 0.05)",
            }}
          >
            {trimmed.replace(/^>\s*/gm, "")}
          </blockquote>
        );
      }

      // Bullet List
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed.split("\n").map((line) => line.replace(/^[-*]\s*/, ""));
        return (
          <ul key={index} className="my-4 space-y-2 list-disc list-inside text-sm md:text-base text-white/70">
            {items.map((it, i) => (
              <li key={i} className="leading-relaxed">
                <span className="text-white/85">{it}</span>
              </li>
            ))}
          </ul>
        );
      }

      // Regular paragraph
      return (
        <p key={index} className="my-4 text-sm md:text-base text-white/75 leading-relaxed">
          {trimmed}
        </p>
      );
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "hsl(var(--p))", borderTopColor: "transparent" }} />
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold font-syne text-white mb-2">Article Not Found</h1>
        <p className="text-white/50 text-sm mb-6">The article you are looking for does not exist or has been removed.</p>
        <Link
          href="/blog"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold font-syne"
          style={{ background: "hsl(var(--p))", color: "hsl(210 100% 4%)" }}
        >
          Back to Blog
        </Link>
      </main>
    );
  }

  return (
    <>
      {/* Scroll Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-50 transition-all duration-75"
        style={{
          width: `${scrollProgress}%`,
          background: "linear-gradient(90deg, hsl(var(--p)), hsl(var(--p2)))",
          boxShadow: "0 0 10px hsl(var(--p))",
        }}
      />

      <main className="min-h-screen w-full md:pl-20 px-4 md:px-10 pt-8 pb-32 max-w-4xl mx-auto text-white">
        {/* Top Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/blog"
            onClick={() => sound.playClick()}
            className="inline-flex items-center gap-2 text-xs font-syne font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to all articles
          </Link>

          {/* Share Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy link"
              className="p-2 rounded-xl text-white/50 hover:text-white transition-all hover:scale-105"
              style={{ background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            <button
              type="button"
              onClick={handleShareTwitter}
              title="Share on X"
              className="p-2 rounded-xl text-white/50 hover:text-white transition-all hover:scale-105"
              style={{ background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
            >
              <Twitter size={14} />
            </button>
            <button
              type="button"
              onClick={handleShareLinkedIn}
              title="Share on LinkedIn"
              className="p-2 rounded-xl text-white/50 hover:text-white transition-all hover:scale-105"
              style={{ background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
            >
              <Linkedin size={14} />
            </button>
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 text-xs font-syne text-white/50 mb-3">
            <span
              className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
              style={{
                background: "hsl(var(--p) / 0.15)",
                color: "hsl(var(--p))",
                border: "1px solid hsl(var(--p) / 0.3)",
              }}
            >
              {post.category || "General"}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {post.publishedAt || "Recently"}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={13} /> {post.readTime || "5 min read"}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold font-syne text-white leading-tight tracking-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-white/60 text-base md:text-lg mt-4 leading-relaxed font-sans">
              {post.excerpt}
            </p>
          )}

          {/* Author Block */}
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
            <div
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: "hsl(var(--p) / 0.2)", border: "1px solid hsl(var(--p) / 0.4)" }}
            >
              {cfg.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.photoURL} alt={cfg.heroTitle} className="w-full h-full object-cover" />
              ) : (
                <User size={18} style={{ color: "hsl(var(--p))" }} />
              )}
            </div>
            <div>
              <p className="text-white font-bold text-sm font-syne">{cfg.heroTitle || "Asikur Rahman"}</p>
              <p className="text-white/40 text-xs">{cfg.heroSubtitle || "Author & Engineer"}</p>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div
            className="relative w-full h-72 md:h-96 rounded-3xl overflow-hidden mb-10"
            style={{
              border: "1px solid hsl(var(--p) / 0.2)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <article className="prose prose-invert max-w-none text-white/80 leading-relaxed font-sans text-base">
          {renderContent(post.content)}
        </article>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 rounded-lg text-xs font-syne text-white/60"
                style={{ background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Share Footer */}
        <div
          className="mt-10 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background: "hsl(210 60% 7% / 0.8)",
            border: "1px solid hsl(var(--p) / 0.15)",
          }}
        >
          <div>
            <p className="text-white font-bold text-sm font-syne">Enjoyed this article?</p>
            <p className="text-white/50 text-xs mt-0.5">Share it with fellow developers and colleagues!</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl text-xs font-semibold font-syne flex items-center gap-2 transition-all hover:scale-105"
              style={{ background: "hsl(var(--p))", color: "hsl(210 100% 4%)" }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? "Link Copied" : "Copy Link"}</span>
            </button>
            <button
              type="button"
              onClick={handleShareTwitter}
              className="p-2.5 rounded-xl text-white/70 hover:text-white transition-all hover:scale-105"
              style={{ background: "hsl(0 0% 100% / 0.08)" }}
            >
              <Twitter size={14} />
            </button>
            <button
              type="button"
              onClick={handleShareLinkedIn}
              className="p-2.5 rounded-xl text-white/70 hover:text-white transition-all hover:scale-105"
              style={{ background: "hsl(0 0% 100% / 0.08)" }}
            >
              <Linkedin size={14} />
            </button>
          </div>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold font-syne text-white mb-6">More Articles to Read</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  onClick={() => sound.playPop()}
                  className="p-5 rounded-2xl block transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "hsl(210 60% 7% / 0.6)",
                    border: "1px solid hsl(var(--p) / 0.12)",
                  }}
                >
                  <p className="text-[11px] font-syne text-white/40 mb-1">{r.category} · {r.readTime}</p>
                  <h3 className="text-sm font-bold font-syne text-white line-clamp-1">{r.title}</h3>
                  <p className="text-xs text-white/50 mt-1 line-clamp-2">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
