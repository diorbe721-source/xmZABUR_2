import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gamesRouter from "./games";
import packagesRouter from "./packages";
import ordersRouter from "./orders";
import checkoutRouter from "./checkout";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gamesRouter);
router.use(packagesRouter);
router.use(ordersRouter);
router.use(checkoutRouter);
router.use(statsRouter);

export default router;
