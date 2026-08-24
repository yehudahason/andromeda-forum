function isValidUTC(value: string): boolean {
  if (!value.endsWith("Z")) return false;

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "";
  if (!isValidUTC(dateString)) return "";
  const date = new Date(dateString);
  const now = new Date();

  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneYear = new Date(now);

  oneYear.setFullYear(now.getFullYear() - 1);

  const pad = (value: number) => String(value).padStart(2, "0");

  const getMonthName = (month: number) => {
    return String(month).padStart(2, "0");
  };

  // Less than 24 hours ago → HH:MM
  if (diff < oneDay && diff >= 0) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // Older than a year → DD-MMM-YY
  if (date < oneYear) {
    return `${pad(date.getDate())}-${getMonthName(
      date.getMonth() + 1,
    )}-${String(date.getFullYear()).slice(-2)}`;
  }

  // Otherwise → DD-MMM
  return `${pad(date.getDate())}-${getMonthName(date.getMonth() + 1)}`;
}
