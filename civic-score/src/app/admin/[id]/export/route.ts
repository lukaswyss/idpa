import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { isCurrentUserAdmin } from "@/lib/user";
import { differenceInDays, format } from "date-fns";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSessionUser();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const admin = await isCurrentUserAdmin();
  if (!admin) return new NextResponse("Forbidden", { status: 403 });

  const challenge = await (prisma as any).challenge.findUnique({ where: { id } });
  if (!challenge) return new NextResponse("Not found", { status: 404 });

  // Fetch data
  const memberships = await (prisma as any).challengeMembership.findMany({
    where: { challengeId: challenge.id },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  const userIds = memberships.map((m: any) => m.userId);
  const entries = await (prisma as any).dayEntry.findMany({
    where: { challengeId: challenge.id, userId: { in: userIds } },
    include: { actions: true },
    orderBy: [{ date: "asc" }],
  });
  const entryIds = entries.map((e: any) => e.id);
  const entryActions = entryIds.length
    ? await (prisma as any).entryAction.findMany({ where: { dayEntryId: { in: entryIds } }, include: { action: true } })
    : [];

  // Build workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = "Civic Score";
  wb.created = new Date();

  // Summary sheet
  const wsSummary = wb.addWorksheet("Summary");
  wsSummary.addRow(["Challenge Title", String(challenge.title || "")] );
  wsSummary.addRow(["Challenge Code", String(challenge.code || "")] );
  wsSummary.addRow(["Start Date", format(new Date(challenge.startDate), "yyyy-MM-dd") ] );
  wsSummary.addRow(["End Date", format(new Date(challenge.endDate), "yyyy-MM-dd") ] );
  wsSummary.addRow(["Duration", (differenceInDays(challenge.endDate, challenge.startDate) + 1) + " Tage"]);
  wsSummary.addRow(["Description", String(challenge.description || "")] );
  wsSummary.addRow(["Start Score", challenge.startScore] );
  wsSummary.addRow(["A/B Enabled", String(Boolean((challenge as any).abEnabled))] );
  wsSummary.addRow(["Download Date and Time", format(new Date(), "yyyy-MM-dd HH:mm:ss") ] );

  // Members sheet
  const wsMembers = wb.addWorksheet("Members");
  wsMembers.addRow(["membershipId", "userId", "joinedAt", "abGroup"]);
  for (const m of memberships as any[]) {
    wsMembers.addRow([m.id, m.userId, format(new Date(m.joinedAt), "yyyy-MM-dd"), m.abGroup ?? ""]);
  }

  // DayEntries sheet
  const wsEntries = wb.addWorksheet("DayEntries");
  wsEntries.addRow([
    "entryId",
    "userId",
    "date",
    "totalScore",
    "markers",
    "firstAnswerAt",
    "lastAnswerAt",
    "submittedAt",
    "durationMs",
  ]);
  for (const e of entries as any[]) {
    const firstAt = e.firstAnswerAt ? format(new Date(e.firstAnswerAt), "yyyy-MM-dd HH:mm:ss") : "";
    const lastAt = e.lastAnswerAt ? format(new Date(e.lastAnswerAt), "yyyy-MM-dd HH:mm:ss") : "";
    const subAt = e.submittedAt ? format(new Date(e.submittedAt), "yyyy-MM-dd HH:mm:ss") : "";
    wsEntries.addRow([
      e.id,
      e.userId,
      format(new Date(e.date), "yyyy-MM-dd"),
      e.totalScore,
      Array.isArray((e as any).markers) ? (e as any).markers.join(" ") : "",
      firstAt,
      lastAt,
      subAt,
      typeof e.durationMs === "number" ? e.durationMs : "",
    ]);
  }

  // EntryActions sheet
  const wsEA = wb.addWorksheet("EntryActions");
  wsEA.addRow(["dayEntryId", "actionId", "actionCode", "label", "category", "weight", "polarity"]);
  for (const ea of entryActions as any[]) {
    wsEA.addRow([
      ea.dayEntryId,
      ea.actionId,
      ea.action?.code ?? "",
      ea.action?.label ?? "",
      ea.action?.category ?? "",
      ea.action?.weight ?? 0,
      ea.action?.polarity ?? "",
    ]);
  }

  // Produce buffer
  const buffer = await wb.xlsx.writeBuffer();
  const filename = `challenge_${challenge.code}_export.xlsx`;
  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${filename}`,
      "Cache-Control": "no-store",
    },
  });
}


