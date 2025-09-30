import { destroySession, getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AvatarCircle } from "@/components/avatar-circle";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const label = session.username ?? "User";
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Profil</h1>
      <div className="flex items-center gap-3">
        <AvatarCircle name={label} size={48} />
        <div className="text-lg font-medium">{label}</div>
      </div>
      {/* Server action to ensure cookie + RSC refresh */}
      <form
        action={async () => {
          "use server";
          await destroySession();
          redirect("/");
        }}
      >
        <Button type="submit" variant="outline">Logout</Button>
      </form>
    </main>
  );
}


