import { db } from "./src/index";
import { sanLuongTable } from "./src/schema/san-luong";
import { congDoanTable } from "./src/schema/cong-doan";
import { eq } from "drizzle-orm";

function truncate3(num: number): number {
  if (typeof num !== 'number' || isNaN(num)) return 0;
  const str = num.toFixed(10);
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) return num;
  return Number(str.slice(0, dotIndex + 4));
}

async function main() {
  const records = await db.select().from(sanLuongTable);
  const congDoanList = await db.select().from(congDoanTable);
  const cdMap = new Map(congDoanList.map(c => [c.ma_cong_doan, c.dinh_muc]));

  for (const record of records) {
    const tong_cong_ho_tro = (record.thoi_gian_ho_tro ?? 0) / 480;
    const thong_ke_ngay = record.thong_ke_ngay as any;
    
    const chi_tiet_cong: Record<string, number> = {};
    const chi_tiet = record.chi_tiet as any[];
    
    let tong_cong_sp_recalculated = 0;
    if (chi_tiet && Array.isArray(chi_tiet)) {
      chi_tiet.forEach(ct => {
        if (chi_tiet_cong[ct.cong_doan] === undefined) chi_tiet_cong[ct.cong_doan] = 0;
        
        const dinh_muc = cdMap.get(ct.cong_doan) || 1;
        const phan_tram = (ct.phan_tram_dinh_muc && ct.phan_tram_dinh_muc > 0) ? ct.phan_tram_dinh_muc : 100;
        const rate = dinh_muc * (phan_tram / 100);
        let cong_sp = 0;
        if (ct.cong_doan && ct.cong_doan.startsWith('9')) {
          const fullBaskets = Math.floor(ct.so_luong / 32);
          const remainder = ct.so_luong % 32;
          const cong_sp_full = truncate3(32 / rate);
          const cong_sp_remainder = remainder > 0 ? truncate3(remainder / rate) : 0;
          cong_sp = (fullBaskets * cong_sp_full) + cong_sp_remainder;
        } else {
          cong_sp = truncate3(ct.so_luong / rate);
        }
        
        ct.cong_sp = cong_sp;
        chi_tiet_cong[ct.cong_doan] += cong_sp;
        tong_cong_sp_recalculated += cong_sp;
      });
      
      Object.keys(chi_tiet_cong).forEach(key => {
        chi_tiet_cong[key] = truncate3(chi_tiet_cong[key]);
      });
    }

    if (thong_ke_ngay) {
      let finalTongCongSp = thong_ke_ngay.tong_cong_sp ?? 0;
      let finalCongNhat = (record.thoi_gian_thuc_hien + (record.thoi_gian_ho_tro ?? 0)) / 480;
      
      await db.update(sanLuongTable)
        .set({
          chi_tiet: chi_tiet,
          thong_ke_ngay: {
            ...thong_ke_ngay,
            tong_cong_sp: truncate3(tong_cong_sp_recalculated),
            cong_nhat: finalCongNhat,
            tong_cong_ho_tro,
            chi_tiet_cong
          }
        })
        .where(eq(sanLuongTable.id, record.id));
    }
  }
  console.log("Backfill completed!");
  process.exit(0);
}

main().catch(console.error);
