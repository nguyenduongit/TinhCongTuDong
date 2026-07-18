// Re-export từ work-rules để duy trì tương thích ngược.
// Không định nghĩa lại giá trị ở đây — mọi thay đổi phải thực hiện tại src/lib/work-rules.ts
export { FULL_WORKDAY_MINUTES as MINUTES_PER_WORKDAY } from '../work-rules.js';

export const BASKET_SIZE = 32;
