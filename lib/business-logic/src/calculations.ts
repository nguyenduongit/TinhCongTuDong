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
 * Tính công sản phẩm (công SP) cho một công đoạn
 * @param soLuong Số lượng hoàn thành
 * @param dinhMuc Định mức của công đoạn
 * @param phanTramDinhMuc Phần trăm định mức (100 = 100%)
 * @param isBasketLogic true nếu mã công đoạn bắt đầu bằng '9' (logic rổ 32)
 */
export function computeCongSp(
  soLuong: number, 
  dinhMuc: number, 
  phanTramDinhMuc: number, 
  isBasketLogic: boolean
): number {
  const safeDinhMuc = dinhMuc > 0 ? dinhMuc : 1;
  const safePhanTram = phanTramDinhMuc > 0 ? phanTramDinhMuc : 100;
  const rate = safeDinhMuc * (safePhanTram / 100);

  if (isBasketLogic) {
    const fullBaskets = Math.floor(soLuong / BASKET_SIZE);
    const remainder = soLuong % BASKET_SIZE;
    const cong_sp_full = truncate3(BASKET_SIZE / rate);
    const cong_sp_remainder = remainder > 0 ? truncate3(remainder / rate) : 0;
    return truncate3((fullBaskets * cong_sp_full) + cong_sp_remainder);
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
  phanTram: number,
  isBasketLogic: boolean
): number {
  if (targetCong <= 0 || dinhMuc <= 0) return 0;
  
  const safePhanTram = phanTram > 0 ? phanTram : 100;
  const rate = dinhMuc * (safePhanTram / 100);

  if (isBasketLogic) {
    // Dòng 9: tính theo rổ 32 pcs
    const congPerBasket = truncate3(BASKET_SIZE / rate);
    if (congPerBasket <= 0) return 0;
    
    const fullBaskets = Math.floor(targetCong / congPerBasket);
    const congRemain = truncate3(targetCong - (fullBaskets * congPerBasket));
    
    // Công dư cần bao nhiêu pcs lẻ?
    let extraPcs = 0;
    if (congRemain > 0.0005) {
      // Tìm pcs nhỏ nhất sao cho truncate3(pcs / rate) >= congRemain
      for (let p = 1; p <= BASKET_SIZE; p++) {
        if (truncate3(p / rate) >= congRemain) {
          extraPcs = p;
          break;
        }
      }
      if (extraPcs === 0) extraPcs = BASKET_SIZE; // fallback
    }
    
    return fullBaskets * BASKET_SIZE + extraPcs;
  } else {
    // Công đoạn thường: cong_sp = truncate3(so_luong / rate)
    // Tìm so_luong nhỏ nhất sao cho truncate3(so_luong / rate) >= targetCong
    const rawPcs = targetCong * rate;
    let pcs = Math.ceil(rawPcs);
    // Verify bằng truncate3 rồi điều chỉnh
    while (truncate3(pcs / rate) < targetCong && pcs < rawPcs + rate) {
      pcs++;
    }
    return pcs;
  }
}
