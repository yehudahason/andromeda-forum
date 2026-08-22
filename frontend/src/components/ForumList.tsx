type Forum = {
  id: string;
  name: string;
  description: string;
  messages_count: number;
  last_post_title: string | null;
  last_post_author: string | null;
  last_post_date: string | null;
  image_url: string | null;
};

type ForumListProps = {
  forums: Forum[];
};

export default function ForumList({ forums }: ForumListProps) {
  return (
    <ul className="w-full overflow-hidden rounded-md bg-[#555] text-white">
      {/* Header */}
      <li className="flex h-[61px] items-center justify-between border-b border-white/15 px-7">
        <h1 className="text-xl font-bold">אנדרומדה - פורום אסטרונומיה וחלל</h1>

        <button className="text-3xl text-white/30">⌄</button>
      </li>

      {forums.map((forum) => (
        <li
          key={forum.id}
          dir="rtl"
          className="grid min-h-[120px] py-4 gap-4 grid-cols-1 sm:grid-cols-[1fr_100px_1fr] items-center border-b  border-white/15  last:border-b-0"
        >
          {/* Forum */}
          <div className="flex justify-start min-w-0 items-center gap-5 text-right">
            {/* Menu */}
            <button className="w-4 text-3xl leading-none text-black">⋮</button>
            {/* Image */}

            {/* Text */}
            <div className="min-w-0">
              <a
                href="#"
                className="block flex-1 truncate text-[20px] font-medium text-[#0BD7FD] hover:underline"
              >
                {forum.name}
              </a>

              <p className="truncate text-[16px] text-white">
                {forum.description}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="sm:text-center text-right px-8">
            <p className="text-2xl">{forum.messages_count.toLocaleString()}</p>

            <p className="text-sm text-white/90">הודעות</p>
          </div>

          {/* Last post */}
          <div className="min-w-0 text-right px-8">
            {forum.last_post_title && (
              <a
                href="#"
                className="block truncate text-[18px] text-[#0BD7FD] hover:underline"
              >
                {forum.last_post_title}
              </a>
            )}
            <div className="flex items-center gap-1">
              {forum.last_post_author && (
                <p className="mt-1 text-sm text-white">
                  על-ידי {forum.last_post_author}
                </p>
              )}
              ,
              {forum.last_post_date && (
                <p className="text-sm mt-1 text-white">
                  {forum.last_post_date}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
