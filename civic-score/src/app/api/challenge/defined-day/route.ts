import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isCurrentUserAdmin } from "@/lib/user";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

const BodySchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1), // "yyyy-MM-dd"
});

export async function POST(req: NextRequest) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const contentType = req.headers.get("content-type") || "";
  let parsed:
    | { success: true; data: z.infer<typeof BodySchema> }
    | { success: false } = { success: false };

  try {
    if (contentType.includes("application/json")) {
      const json = await req.json();
      parsed = BodySchema.safeParse(json) as any;
    } else {
      const fd = await req.formData();
      parsed = BodySchema.safeParse({ id: fd.get("id"), date: fd.get("date") }) as any;
    }
  } catch {
    parsed = { success: false };
  }
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { id, date } = parsed.data;
  const challenge = await (prisma as any).challenge.findUnique({ where: { id } });
  if (!challenge) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const d = new Date(date);
  const d0 = new Date(challenge.startDate);
  const d1 = new Date(challenge.endDate);
  if (Number.isNaN(d.getTime()) || d < d0 || d > d1) {
    return NextResponse.json({ error: "date_out_of_range" }, { status: 400 });
  }

  const cfg = (challenge.config as any) || {};

  // migrate legacy array cfg.defined (ISO strings) to object shape with days/questions
  let definedObj: any = cfg.defined;
  if (Array.isArray(definedObj)) {
    const daysFromLegacy = (definedObj as string[]).map((iso) => {
      const dt = new Date(iso);
      return `${dt.getFullYear().toString().padStart(4, "0")}-${(dt.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${dt.getDate().toString().padStart(2, "0")}`;
    });
    definedObj = { days: Array.from(new Set(daysFromLegacy)), questions: [] };
  }
  if (!definedObj || typeof definedObj !== "object") {
    definedObj = { days: [], questions: [] };
  }
  if (!Array.isArray(definedObj.days)) definedObj.days = [];
  if (!definedObj.days.includes(date)) definedObj.days.push(date);
  cfg.defined = definedObj;

  await (prisma as any).challenge.update({ where: { id: challenge.id }, data: { config: cfg } });
  revalidatePath(`/admin/${challenge.id}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const contentType = req.headers.get("content-type") || "";
  let parsed:
    | { success: true; data: z.infer<typeof BodySchema> }
    | { success: false } = { success: false };

  try {
    if (contentType.includes("application/json")) {
      const json = await req.json();
      parsed = BodySchema.safeParse(json) as any;
    } else {
      const fd = await req.formData();
      parsed = BodySchema.safeParse({ id: fd.get("id"), date: fd.get("date") }) as any;
    }
  } catch {
    parsed = { success: false };
  }
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { id, date } = parsed.data;
  const challenge = await (prisma as any).challenge.findUnique({ where: { id } });
  if (!challenge) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const cfg = (challenge.config as any) || {};
  const dayKey = date;

  if (Array.isArray(cfg.defined)) {
    cfg.defined = (cfg.defined as string[]).filter((iso: string) => {
      try {
        return format(new Date(iso), "yyyy-MM-dd") !== dayKey;
      } catch {
        return true;
      }
    });
  }
  if (cfg.defined && typeof cfg.defined === "object") {
    if (Array.isArray((cfg.defined as any).days)) {
      (cfg.defined as any).days = ((cfg.defined as any).days as string[]).filter((d) => d !== dayKey);
    }
    for (const value of Object.values(cfg.defined)) {
      if (value && typeof value === "object" && Array.isArray((value as any).days)) {
        (value as any).days = ((value as any).days as string[]).filter((d) => d !== dayKey);
      }
    }
  }

  await (prisma as any).challenge.update({ where: { id: challenge.id }, data: { config: cfg } });
  revalidatePath(`/admin/${challenge.id}`);
  return NextResponse.json({ ok: true });
}


