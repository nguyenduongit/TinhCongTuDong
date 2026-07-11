import { format } from 'date-fns';

/**
 * Lấy Tháng Công (Cycle Month) của một ngày.
 * Tháng công N sẽ bắt đầu từ 21 tháng N-1 đến 20 tháng N.
 * Ví dụ: 2026-06-25 -> thuộc Tháng 7 năm 2026.
 */
export function getCycleMonthFromDate(date: Date): Date {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  if (day > 20) {
    // Thuộc tháng tiếp theo
    return new Date(year, month + 1, 1);
  }
  // Thuộc tháng hiện tại
  return new Date(year, month, 1);
}

/**
 * Trả về ngày bắt đầu và kết thúc của một Tháng Công.
 * @param cycleMonth Ngày bất kỳ đại diện cho tháng công (thường là ngày mùng 1 của tháng đó)
 * @returns { start: Date, end: Date }
 */
export function getCycleRange(cycleMonth: Date): { start: Date, end: Date } {
  const month = cycleMonth.getMonth();
  const year = cycleMonth.getFullYear();

  const start = new Date(year, month - 1, 21);
  const end = new Date(year, month, 20, 23, 59, 59, 999);

  return { start, end };
}

/**
 * Hàm hỗ trợ lấy chuỗi yyyy-MM-dd để query DB
 */
export function getCycleRangeStrings(cycleMonth: Date): { startStr: string, endStr: string } {
  const { start, end } = getCycleRange(cycleMonth);
  return {
    startStr: format(start, 'yyyy-MM-dd'),
    endStr: format(end, 'yyyy-MM-dd')
  };
}
