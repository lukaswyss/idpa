import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { AvatarCircle } from "./avatar-circle";
import { Button } from "@/components/ui/button";

export default async function UserButton() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return (
      <Link href="/login" className="text-sm underline"><Button>Anmelden</Button></Link>
    );
  }
  const label = sessionUser.username ?? "User";
  return (
    <Link href="/profile" className="inline-flex items-center gap-2 ">
      <AvatarCircle name={label}   />
    </Link>
  );
}


