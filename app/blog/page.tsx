"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Tag,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TiltCard from "@/components/TiltCard";
import { sound } from "@/lib/sound";
import type { BlogPost, BlogData } from "@/app/api/blog/route";

const PALETTE = [
  "185 100% 48%", // Teal/Cyan
  "220 90% 58%",  // Blue
  "270 80% 62%",  // Violet
  "330 85% 60%",  // Pink
  "24 95% 55%",   // Orange
  "142 70% 45%",  // Green
];

export default function BlogPage() {
  const [data, setData] = useState<BlogData>({ intro: "", items: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((res: BlogData) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load blog:", err);
        setLoading(false);
      });
  }, []);

  const publicPosts = useMemo(() => {
    return (data.items || []).filter((p) => p.published !== false);
  }, [data.items]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    publicPosts.forEach((p) => {
      if (p.category?.trim()) set.add(p.category.trim());
    });
    return ["All", ...Array.from(set)];
  }, [publicPosts]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return publicPosts.filter((p) => {
      const matchCat =
        selectedCategory === "All" ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCat) return false;

      if (!q) return true;
      const title = p.title?.toLowerCase() || "";
      const excerpt = p.excerpt?.toLowerCase() || "";
      const tags = (p.tags || []).join(" ").toLowerCase();
      return title.includes(q) || excerpt.includes(q) || tags.includes(q);
    });
  }, [publicPosts, search, selectedCategory]);

  const featuredPost = useMemo(() => {
    if (search.trim() || selectedCategory !== "All") return null;
    return publicPosts.find((p) => p.featured) || publicPosts[0] || null;
  }, [publicPosts, search, selectedCategory]);

  const regularPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter((p) => p.id !== featuredPost.id);
  }, [filteredPosts, featuredPost]);

  return (
    <main className="min-h-screen w-full md:pl-20 px-4 md:px-10 pt-10 pb-28 text-white max-w-7xl mx-auto">
      {/* Header Section */}
      <header className="mb-10 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-syne font-semibold uppercase tracking-wider mb-3"
          style={{
            background: "hsl(var(--p) / 0.1)",
            color: "hsl(var(--p))",
            border: "1px solid hsl(var(--p) / 0.25)",
          }}>
          <BookOpen size={13} />
          <span>Articles & Insights</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold font-syne tracking-tight leading-tight">
          Explore The <span style={{ color: "hsl(var(--p))" }}>Knowledge Base</span>
        </h1>

        <p className="text-white/50 text-sm md:text-base max-w-2xl mt-3 leading-relaxed">
          {data.intro ||
            "Deep-dives into software architecture, Web3 protocols, modern design systems, and practical AI integrations."}
        </p>

        {/* Search & Category Filter Bar */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles by title, topic, or tag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all placeholder:text-white/30"
              style={{
                background: "hsl(210 60% 7% / 0.8)",
                border: "1px solid hsl(var(--p) / 0.15)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "hsl(var(--p) / 0.45)")}
              onBlur={(e) => (e.target.style.borderColor = "hsl(var(--p) / 0.15)")}
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedCategory(cat);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-syne font-medium whitespace-nowrap transition-all duration-200 cursor-pointer"
                  style={
                    active
                      ? {
                          background: "hsl(var(--p))",
                          color: "hsl(210 100% 4%)",
                          fontWeight: "700",
                          boxShadow: "0 0 16px hsl(var(--p) / 0.3)",
                        }
                      : {
                          background: "hsl(210 60% 8% / 0.6)",
                          color: "rgba(255,255,255,0.55)",
                          border: "1px solid hsl(0 0% 100% / 0.08)",
                        }
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "hsl(var(--p))", borderTopColor: "transparent" }} />
        </div>
      ) : publicPosts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl"
          style={{ background: "hsl(210 60% 7% / 0.5)", border: "1px solid hsl(var(--p) / 0.1)" }}>
          <BookOpen size={36} className="mx-auto text-white/30 mb-3" />
          <p className="text-white/70 font-semibold font-syne">No blog posts published yet.</p>
          <p className="text-white/40 text-xs mt-1">Check back soon for new articles!</p>
        </div>
      ) : (
        <>
          {/* Featured Spotlight Card */}
          {featuredPost && (
            <section className="mb-10">
              <Link
                href={`/blog/${featuredPost.slug}`}
                onClick={() => sound.playPop()}
                className="group block relative rounded-3xl overflow-hidden transition-all duration-300"
                style={{
                  background: "linear-gradient(145deg, hsl(210 60% 8% / 0.9), hsl(210 60% 5% / 0.9))",
                  border: "1px solid hsl(var(--p) / 0.3)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 40px hsl(var(--p) / 0.1)",
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 md:p-8">
                  {/* Image container */}
                  <div className="lg:col-span-7 relative h-64 md:h-80 w-full rounded-2xl overflow-hidden">
                    {featuredPost.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featuredPost.coverImage}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: "hsl(210 60% 12%)" }}>
                        <BookOpen size={48} style={{ color: "hsl(var(--p))" }} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg text-[11px] font-bold font-syne tracking-wider uppercase flex items-center gap-1.5"
                        style={{
                          background: "hsl(var(--p))",
                          color: "hsl(210 100% 4%)",
                          boxShadow: "0 0 15px hsl(var(--p) / 0.5)",
                        }}>
                        <Sparkles size={11} /> Featured Spotlight
                      </span>
                    </div>
                  </div>

                  {/* Content container */}
                  <div className="lg:col-span-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-3 text-xs text-white/50 mb-3 font-syne">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold"
                          style={{
                            background: "hsl(var(--p) / 0.15)",
                            color: "hsl(var(--p))",
                            border: "1px solid hsl(var(--p) / 0.3)",
                          }}>
                          {featuredPost.category || "General"}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {featuredPost.publishedAt || "Recently"}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {featuredPost.readTime || "5 min read"}
                        </span>
                      </div>

                      <h2 className="text-xl md:text-2xl font-bold font-syne text-white group-hover:text-[hsl(var(--p))] transition-colors leading-snug">
                        {featuredPost.title}
                      </h2>

                      <p className="text-white/60 text-xs md:text-sm mt-3 leading-relaxed line-clamp-3">
                        {featuredPost.excerpt}
                      </p>

                      {featuredPost.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {featuredPost.tags.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md text-[10px] text-white/50"
                              style={{ background: "hsl(0 0% 100% / 0.05)" }}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-xs font-syne font-bold"
                      style={{ color: "hsl(var(--p))" }}>
                      <span>Read Full Article</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Regular Posts Grid */}
          {regularPosts.length === 0 && search.trim() ? (
            <div className="py-16 text-center text-white/50">
              <p className="font-syne text-sm">No articles found matching &quot;{search}&quot;</p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-3 px-4 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  background: "hsl(var(--p) / 0.15)",
                  color: "hsl(var(--p))",
                  border: "1px solid hsl(var(--p) / 0.3)",
                }}
              >
                Clear search filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post, idx) => {
                const accent = PALETTE[idx % PALETTE.length];
                return (
                  <TiltCard key={post.id || post.slug} maxTilt={7} className="h-full">
                    <Link
                      href={`/blog/${post.slug}`}
                      onClick={() => sound.playPop()}
                      className="group flex flex-col justify-between h-full rounded-2xl p-5 overflow-hidden transition-all duration-300 cursor-pointer block"
                      style={{
                        background: `linear-gradient(160deg, hsl(${accent} / 0.08), hsl(210 60% 7% / 0.8))`,
                        border: `1px solid hsl(${accent} / 0.2)`,
                        boxShadow: `0 10px 30px rgba(0,0,0,0.4), 0 0 20px hsl(${accent} / 0.05)`,
                      }}
                    >
                      <div>
                        {/* Thumbnail Image */}
                        <div className="relative h-44 w-full rounded-xl overflow-hidden mb-4"
                          style={{
                            background: `hsl(${accent} / 0.1)`,
                            border: `1px solid hsl(${accent} / 0.25)`,
                          }}>
                          {post.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen size={32} style={{ color: `hsl(${accent})` }} />
                            </div>
                          )}

                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold font-syne uppercase tracking-wider"
                            style={{
                              background: `hsl(${accent})`,
                              color: "hsl(210 100% 4%)",
                            }}>
                            {post.category || "General"}
                          </span>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 text-[11px] text-white/40 mb-2 font-syne">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} /> {post.publishedAt || "Recently"}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {post.readTime || "4 min read"}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold font-syne text-white group-hover:text-white transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-white/50 text-xs mt-2 line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-white/40 truncate max-w-[70%]">
                          {post.tags?.slice(0, 2).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-white/5">
                              #{t}
                            </span>
                          ))}
                        </div>

                        <span className="text-xs font-bold font-syne flex items-center gap-1 transition-transform group-hover:translate-x-1"
                          style={{ color: `hsl(${accent})` }}>
                          Read <ArrowRight size={12} />
                        </span>
                      </div>
                    </Link>
                  </TiltCard>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
