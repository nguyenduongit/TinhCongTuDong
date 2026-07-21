import { BASKET_SIZE } from "./constants.js";

/**
 * Phân tích chuỗi quy_cách dạng "32pcs/rổ" thành số lượng & đơn vị.
 * Đây là nguồn parse DUY NHẤT dùng chung cho cả UI (form nhập công đoạn)
 * và business logic (tính công) — tránh mỗi nơi tự viết 1 bản dễ lệch nhau.
 */
export function parseQuyCach(qc: string | null | undefined): { sl: string; unit: string } {
  if (!qc) return { sl: '', unit: 'hộp' };
  const match = qc.match(/^(\d+)\s*pcs\/(.+)$/i);
  if (match) return { sl: match[1], unit: match[2].toLowerCase() };
  return { sl: qc.replace(/\D/g, ''), unit: 'hộp' };
}

/**
 * true nếu quy_cách của công đoạn là "32pcs/rổ" — đây là điều kiện DUY NHẤT
 * để áp dụng logic tính công theo rổ (gộp số lượng theo rổ 32 pcs).
 *
 * Trước đây điều kiện này bị gắn nhầm với "mã công đoạn bắt đầu bằng số 9",
 * chỉ đúng một cách tình cờ vì trong thực tế các công đoạn dòng 9 đều có
 * quy_cách 32pcs/rổ. Điều này khiến các công đoạn KHÁC dòng 9 nhưng cũng
 * đóng rổ 32 bị tính sai (bị tính như công đoạn thường), và ngược lại nếu
 * có công đoạn dòng 9 nào đó không đóng rổ 32 cũng sẽ bị tính sai theo
 * hướng ngược lại. Dùng đúng quy_cách làm điều kiện sẽ chính xác cho mọi
 * trường hợp, không phụ thuộc vào quy ước đặt mã.
 */
export function isBasketQuyCach(qc: string | null | undefined): boolean {
  const { sl, unit } = parseQuyCach(qc);
  return sl === String(BASKET_SIZE) && unit.trim() === 'rổ';
}
