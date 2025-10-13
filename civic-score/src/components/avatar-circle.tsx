"use client";

import Avatar from "boring-avatars";

export function AvatarCircle({ name, size = 28 }: { name: string; size?: number}) {
  const colors = [   
    "#df7777",
    "#ff7d10",
    "#905182",
    "#315e96",
    "#a4ccea"
  ] ;

  return (
    <div style={{ width: size, height: size }} className={` overflow-hidden inline-block align-middle rounded-sm`}>
      <Avatar size={size} name={name} square={true} variant="marble" colors={colors} />
    </div>
  );
}


