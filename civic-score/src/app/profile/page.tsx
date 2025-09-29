import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AvatarCircle } from "@/components/avatar-circle";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  const label = user?.username ?? "User";
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Profil</h1>
      <div className="flex items-center gap-3">
        <AvatarCircle name={label} size={48} />
        <div className="text-lg font-medium">{label}</div>
      </div>
      <Button asChild variant="link" className="p-0 h-auto text-sm">
        <a href="/api/logout">Logout</a>
      </Button>
    </main>
  );
}


