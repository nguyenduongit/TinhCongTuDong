import { Router, type IRouter } from "express";
import healthRouter from "./health";
import congDoanRouter from "./cong-doan";
import sanLuongRouter from "./san-luong";

const router: IRouter = Router();

router.use(healthRouter);
router.use(congDoanRouter);
router.use(sanLuongRouter);

export default router;
