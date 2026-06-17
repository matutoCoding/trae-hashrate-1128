export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm');
};

export const formatTime = (date: string | Date): string => {
  return formatDate(date, 'HH:mm');
};

export const getWeekDay = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[d.getDay()];
};

export const generateDateRange = (startDate: string, days: number): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
};

export const isToday = (dateStr: string): boolean => {
  const today = formatDate(new Date());
  return dateStr === today;
};

export const compareDate = (date1: string, date2: string): number => {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};

export const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};
