import { BASKET_SIZE, MINUTES_PER_WORKDAY } from "./constants.js";

/**
 * Cắt giữ 3 chữ số thập phân mà không làm tròn (cắt bỏ phần đuôi).
 * VD: 1.1239 -> 1.123
 */
export function truncate3(num: number): number {
  if (typeof num !== 'number' || isNaN(num)) return 0;
  const str = num.toFixed(10);
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) return num;
  return Number(str.slice(0, dotIndex + 4));
}

/**
 * Làm tròn toán học 3 chữ số thập phân (làm tròn lên/xuống).
 * VD: 1.1235 -> 1.124
 */
export function round3(num: number): number {
  if (typeof num !== 'number' || isNaN(num)) return 0;
  return Math.round(num * 1000) / 1000;
}

/**
 * Tính công sản phẩm (công SP) cho một công đoạn
 * @param soLuong Số lượng hoàn thành
 * @param dinhMuc Định mức của công đoạn
 * @param isBasketLogic true nếu mã công đoạn bắt đầu bằng '9' (logic rổ 32)
 */
export function computeCongSp(
  soLuong: number, 
  dinhMuc: number, 
  isBasketLogic: boolean
): number {
  const rate = dinhMuc > 0 ? dinhMuc : 1;


  if (isBasketLogic) {
    const fullBaskets = Math.floor(soLuong / BASKET_SIZE);
    const remainder = soLuong % BASKET_SIZE;
    const cong_sp_full = truncate3(BASKET_SIZE / rate); // [32/định mức] cắt 3 số
    const cong_sp_remainder = remainder > 0 ? (remainder * (cong_sp_full / BASKET_SIZE)) : 0; // lẻ tỷ lệ với rổ chẵn
    return round3((fullBaskets * cong_sp_full) + cong_sp_remainder); // Cuối cùng cộng lại và làm tròn toán học 3 chữ số
  } else {
    return truncate3(soLuong / rate);
  }
}

/**
 * Tính công hỗ trợ
 */
export function computeCongHoTro(thoiGianHoTroPhut: number): number {
  return thoiGianHoTroPhut / MINUTES_PER_WORKDAY;
}

/**
 * Tính công nhật
 */
export function computeCongNhat(thoiGianThucHienPhut: number, thoiGianHoTroPhut: number): number {
  return (thoiGianThucHienPhut + thoiGianHoTroPhut) / MINUTES_PER_WORKDAY;
}

/**
 * Tính ngược số lượng (pcs) cần thiết để đạt được một số công SP mục tiêu
 * Hàm này dùng vòng lặp để đảm bảo tính chính xác với logic truncate3 và rổ.
 */
export function reverseCalcPcs(
  targetCong: number,
  dinhMuc: number,
  isBasketLogic: boolean
): number {
  targetCong = round3(targetCong); // Fix floating point inaccuracy from upstream subtraction
  if (targetCong <= 0 || dinhMuc <= 0) return 0;
  
  const rate = dinhMuc;

  if (isBasketLogic) {
    // Dòng 9: tính theo rổ 32 pcs, rổ chẵn tính bằng [32/rate] cắt 3 số
    const congPerBasket = truncate3(BASKET_SIZE / rate);
    
    // Thêm delta nhỏ (1e-9) tránh sai số float gây hụt rổ, vd 2.9999999999 -> 2
    const exactRatio = (targetCong / congPerBasket) + 1e-9;
    const fullBaskets = Math.floor(exactRatio);
    
    if (round3(fullBaskets * congPerBasket) >= targetCong) {
      return fullBaskets * BASKET_SIZE;
    }

    // Công dư cần bao nhiêu pcs lẻ?
    let extraPcs = 0;
    for (let p = 1; p <= BASKET_SIZE; p++) {
      const cong_sp_remainder = p * (congPerBasket / BASKET_SIZE);
      if (round3((fullBaskets * congPerBasket) + cong_sp_remainder) >= targetCong) {
        extraPcs = p;
        break;
      }
    }
    
    if (extraPcs === 0) extraPcs = BASKET_SIZE; // fallback
    
    return fullBaskets * BASKET_SIZE + extraPcs;
  } else {
    // Công đoạn thường: cong_sp = truncate3(so_luong / rate)
    // Tìm so_luong nhỏ nhất sao cho truncate3(so_luong / rate) >= targetCong
    const rawPcs = targetCong * rate;
    let pcs = Math.ceil(rawPcs);
    let iterations = 0;
    const MAX_ITERATIONS = 10000;
    // Verify bằng truncate3 rồi điều chỉnh
    while (truncate3(pcs / rate) < targetCong && pcs < rawPcs + rate && iterations < MAX_ITERATIONS) {
      pcs++;
      iterations++;
    }
    return pcs;
  }
}

export interface ChiTietItem {
  ma_cong_doan: string;
  so_luong: number;
  dinh_muc: number; // Effective quota
}

/**
 * Tính tổng công sản phẩm cho một tập hợp các chi tiết (thường là 1 tuần).
 * Tự động gom nhóm số lượng của công đoạn rổ (dòng 9) trước khi tính.
 */
export function computeWeeklyCongSp(items: ChiTietItem[]): number {
  let totalCong = 0;
  
  // Nhóm các công đoạn rổ theo mã công đoạn
  const basketGroups: Record<string, { totalSoLuong: number, rate: number }> = {};
  
  for (const item of items) {
    const isBasketLogic = item.ma_cong_doan.startsWith('9');
    
    if (isBasketLogic) {
      const key = `${item.ma_cong_doan}_${item.dinh_muc}`;
      if (!basketGroups[key]) {
        const rate = item.dinh_muc > 0 ? item.dinh_muc : 1;
        basketGroups[key] = {
          totalSoLuong: 0,
          rate: rate
        };
      }
      basketGroups[key].totalSoLuong += item.so_luong;
    } else {
      // Công đoạn thường: tính độc lập và cộng dồn
      totalCong += computeCongSp(item.so_luong, item.dinh_muc, false);
    }
  }
  
  // Tính công cho các nhóm rổ (dòng 9) sau khi đã gom tổng số lượng
  for (const key in basketGroups) {
    const group = basketGroups[key];
    const fullBaskets = Math.floor(group.totalSoLuong / BASKET_SIZE);
    const remainder = group.totalSoLuong % BASKET_SIZE;
    const cong_sp_full = truncate3(BASKET_SIZE / group.rate); // [32/rate] cắt 3 số
    const cong_sp_remainder = remainder > 0 ? (remainder * (cong_sp_full / BASKET_SIZE)) : 0; // lẻ tỷ lệ với rổ chẵn
    
    // Cuối cùng cộng lại và làm tròn toán học 3 chữ số cho từng mã công đoạn
    totalCong += round3((fullBaskets * cong_sp_full) + cong_sp_remainder);
  }
  
  return round3(totalCong);
}
