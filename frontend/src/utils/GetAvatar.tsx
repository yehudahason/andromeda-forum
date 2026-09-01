type AvatarProps = {
  name: string;
  image: string | null;
  size: number;
};

export function GetAvatar({ name, image, size }: AvatarProps) {
  if (!name) return null;

  const sizeT = `w-${size} h-${size}`;

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`${sizeT} rounded-full object-cover`}
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

  // Consistent color for the same name
  const index =
    [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    colors.length;

  const letter = [...name.trim()][0]?.toUpperCase() ?? "?";

  return (
    <div
      className={`${sizeT} ${colors[index]} rounded-full flex items-center justify-center text-white text-sm font-semibold`}
      aria-label={name}
    >
      {letter}
    </div>
  );
}
