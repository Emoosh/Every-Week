import { db } from "../../firebaseAdmin.js";
import otpService from "./otpService.js";

const otpController = {
  async requestOTP(mail) {

    if (!mail.endsWith("@tedu.edu.tr")) {
      throw new Error("You can join this community with only your school mail.");
    }

    const secret = otpService.generateSecret();
    const token = otpService.generateToken(secret);

    const docRef = db.collection("otpCodes").doc(mail);

    await docRef.set({
      secret,
      createdAt: new Date(),
      verified: false,
    });

    console.log(token);
    return { secret, token };
  },

  async verifyOTP(mail, token) {
    const docRef = db.collection("otpCodes").doc(mail);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Bu e-posta için OTP bulunamadı.");
    }

    const { secret } = doc.data();

    const isValid = otpService.verifyToken(secret, token);

    if (isValid) {
      await docRef.update({ verified: true });
    }

    return isValid;
  },
};

export default otpController;
