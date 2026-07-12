import { Router, type IRouter } from "express";
import healthRouter from "./health";
import congDoanRouter from "./cong-doan";
import sanLuongRouter from "./san-luong";
import lichTrinhRouter from "./lich-trinh";

import authRouter from "./auth";

const router: IRouter = Router();

router.use("/auth", authRouter);
router.use(healthRouter);
router.use(congDoanRouter);
router.use(sanLuongRouter);
router.use(lichTrinhRouter);

export default router;
