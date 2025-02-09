import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const user = process.env.MAIL;
const passUser = process.env.MAIL_KEY;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: user, 
    pass: passUser, 
  },
});

export const sendMail = async (to, subject, text) => {
  const mailOptions = {
    from: user,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("E-posta başarıyla gönderildi.");
  } catch (error) {
    console.error("E-posta gönderme hatası:", error);
    throw new Error("E-posta gönderilemedi.");
  }  
};

export default sendMail;

