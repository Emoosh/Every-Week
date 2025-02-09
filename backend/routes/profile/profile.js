import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { connectDB } from "../../Database/db.js";
import { ObjectId } from "mongodb";  // ✅ ObjectId'yi ekledik

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");

    const userId = req.user.id;  

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı."
      });
    }

    res.status(200).json({
      success: true,
      message: "Profil bilgileri başarıyla getirildi.",
      user: {
        uid: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Profil hatası:", error);
    res.status(500).json({
      success: false,
      message: "Profil bilgileri alınırken bir hata oluştu."
    });
  }
});

export default router;
