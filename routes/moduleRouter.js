import { Router } from "express";
import {
  validateModuleByCourseInput,
  validateModuleInput,
} from "../middleware/validationMiddleware.js";
import {
  addModule,
  deleteModule,
  getAllModule,
  getModuleByCourse,
  getSingleModule,
  updateModule,
} from "../controllers/moduleController.js";
import { isAdmin } from "../middleware/authenticationMiddleware.js";

const router = Router();
router.post("/addModule", validateModuleInput, isAdmin, addModule);
router.get("/getModule", getAllModule);
router.patch("/updateModule/:id", validateModuleInput, isAdmin, updateModule);
router.get("/getModule/:id", getSingleModule);
router.delete("/deleteModule/:id", isAdmin, deleteModule);
router.get(
  "/getModuleByCourse/:id",
  validateModuleByCourseInput,
  getModuleByCourse
);
export default router;
