import { NextResponse } from "next/server";
import { getDoc, setDoc } from "@/lib/store";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string;
  publishedAt: string;
  readTime: string;
  featured: boolean;
  published: boolean;
  content: string;
}

export interface BlogData {
  intro: string;
  items: BlogPost[];
}

const DEFAULT_BLOG: BlogData = {
  intro: "Thoughts, deep-dives, and tutorials on Web3 engineering, full-stack architecture, and AI-driven development.",
  items: [],
};

export async function GET() {
  try {
    const data = await getDoc<BlogData>("blog", DEFAULT_BLOG);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to load blog:", err);
    return NextResponse.json(DEFAULT_BLOG, { status: 200 });
  }
}

export async function PUT(req: Request) {
  const jar = await cookies();
  if (!jar.get("admin_session")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as BlogData;
    await setDoc("blog", body);
    return NextResponse.json(body);
  } catch (err) {
    console.error("Failed to save blog:", err);
    return NextResponse.json({ error: "Failed to save blog data" }, { status: 500 });
  }
}
