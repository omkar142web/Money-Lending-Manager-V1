import express from "express";
import {
  getLogin,
  getRegister,
  logoutUser,
  postLogin,
  postRegister,
} from "../controllers/auth.controller.js";
import { validate, validateLogin, validateRegister } from "../middleware/validate.js";

const router = express.Router();

router.get("/login", getLogin);
router.post("/login", validate(validateLogin), postLogin);
router.get("/register", getRegister);
router.post("/register", validate(validateRegister), postRegister);
router.get("/logout", logoutUser);

export default router;
