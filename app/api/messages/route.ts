import { NextResponse } from "next/server";
import { getDoc, setDoc } from "@/lib/store";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface MessagesData {
  items: ContactMessage[];
}

const DEFAULTS: MessagesData = { items: [] };

// Public: Submit a new contact message
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, message } = body || {};

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and message are all required." },
        { status: 400 }
      );
    }

    const current = await getDoc<MessagesData>("messages", DEFAULTS);
    const newMessage: ContactMessage = {
      id: "msg_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    const updated = {
      items: [newMessage, ...(current.items || [])],
    };

    await setDoc("messages", updated);

    return NextResponse.json({
      success: true,
      message: "Your message has been received! I'll get back to you soon.",
    });
  } catch (err) {
    console.error("Failed to save message:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}

// Admin-only: Get all messages
export async function GET() {
  const jar = await cookies();
  if (!jar.get("admin_session")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getDoc<MessagesData>("messages", DEFAULTS);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to load messages:", err);
    return NextResponse.json(DEFAULTS, { status: 200 });
  }
}

// Admin-only: Update message (toggle read/unread or mark all read)
export async function PUT(req: Request) {
  const jar = await cookies();
  if (!jar.get("admin_session")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const current = await getDoc<MessagesData>("messages", DEFAULTS);
    const items = current.items || [];

    if (body.markAllRead) {
      const updated = {
        items: items.map((m) => ({ ...m, read: true })),
      };
      await setDoc("messages", updated);
      return NextResponse.json({ ok: true, items: updated.items });
    }

    if (body.id) {
      const updated = {
        items: items.map((m) =>
          m.id === body.id ? { ...m, read: body.read !== undefined ? Boolean(body.read) : !m.read } : m
        ),
      };
      await setDoc("messages", updated);
      return NextResponse.json({ ok: true, items: updated.items });
    }

    return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
  } catch (err) {
    console.error("Failed to update message:", err);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

// Admin-only: Delete message by id
export async function DELETE(req: Request) {
  const jar = await cookies();
  if (!jar.get("admin_session")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Message id required" }, { status: 400 });
    }

    const current = await getDoc<MessagesData>("messages", DEFAULTS);
    const updated = {
      items: (current.items || []).filter((m) => m.id !== id),
    };

    await setDoc("messages", updated);
    return NextResponse.json({ ok: true, items: updated.items });
  } catch (err) {
    console.error("Failed to delete message:", err);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
