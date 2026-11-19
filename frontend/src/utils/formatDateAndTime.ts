// Japanese date and time formatting, e.g. 2026年11月19日 / 14:05

const toDate = (value: string | number | Date): Date => (value instanceof Date ? value : new Date(value));

// 2026年11月19日
export const formatJaDate = (value: string | number | Date): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

// 14:05
export const formatJaTime = (value: string | number | Date): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 2026年11月19日 14:05
export const formatJaDateTime = (value: string | number | Date): string => {
  const date = formatJaDate(value);
  return date ? `${date} ${formatJaTime(value)}` : '';
};

// Kept for existing callers.
export const formatPostDate = (dateString: string): string => formatJaDate(dateString);
export const formatPostTime = (timeString: string): string => formatJaTime(timeString);
