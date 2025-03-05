import express from "express";
import { registerUser, loginUser, getProfile } from "../controllers/AuthController.js";
import { authMiddleware }from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile);

export default router;
