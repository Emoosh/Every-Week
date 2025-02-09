import express from "express";
import authMiddleware from "../middleware/authMiddleware.js"; // ✅ Middleware'i ekledik

const router = express.Router();

// ✅ Bu route sadece doğrulanmış kullanıcılar tarafından erişilebilir
router.get("/", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Profil bilgileri",
    user: req.user  // Token doğrulandıktan sonra kullanıcı bilgileri burada
  });
});

export default router;
