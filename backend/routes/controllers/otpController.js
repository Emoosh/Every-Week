import { connectDB } from "../../Database/db.js";
import otpService from "./otpService.js";

const otpController = {
  async requestOTP(mail) {
    if (!mail.endsWith("edu.tr")) {
      throw new Error("Bu topluluğa sadece okul e-posta adresin ile kayıt olabilirsin.");
    }

    const secret = otpService.generateSecret();
    const token = otpService.generateToken(secret);

    const db = await connectDB();
    const otpCodesCollection = db.collection("otpCodes");

    // MongoDB'de OTP kodunu sakla
    await otpCodesCollection.updateOne(
      { mail },
      {
        $set: {
          secret,
          createdAt: new Date(),
          verified: false,
        }
      },
      { upsert: true } // Eğer belge yoksa oluştur
    );

    return { secret, token };
  },

  async verifyOTP(mail, token) {
    const db = await connectDB();
    const otpCodesCollection = db.collection("otpCodes");

    const otpRecord = await otpCodesCollection.findOne({ mail });

    if (!otpRecord) {
      throw new Error("Bu e-posta için OTP bulunamadı.");
    }

    const { secret } = otpRecord;

    const isValid = otpService.verifyToken(secret, token);

    if (isValid) {
      await otpCodesCollection.updateOne(
        { mail },
        { $set: { verified: true } }
      );
    }

    return isValid;
  }
};

export default otpController;
