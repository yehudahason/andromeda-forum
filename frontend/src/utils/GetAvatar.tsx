import type { User } from "../types";

export function GetAvatar(user: User | null) {
  if (!user) return;
  if (user?.image_url) {
    return (
      <img
        src={user.image_url}
        alt={user.name}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }

  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
  ];
  // Generate a consistent color based on the user's name
  const index =
    [...user.name].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    colors.length;

  const letter = user.name.charAt(0).toUpperCase();

  return (
    <div
      className={`w-7 h-7 rounded-full ${colors[index]} flex items-center justify-center text-white text-sm font-semibold`}
    >
      {letter}
    </div>
  );
}
