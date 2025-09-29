"use client";

import Avatar from "boring-avatars";

export function AvatarCircle({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="rounded-full overflow-hidden inline-block align-middle">
      <Avatar size={size} name={name} variant="beam" colors={["#0ea5e9","#22c55e","#f59e0b","#8b5cf6","#ef4444"]} />
    </div>
  );
}


