import { authenticator } from "otplib";

class OTPService {
  constructor() {
    this.authenticator = authenticator;
    this.authenticator.options = { digits: 6, step: 30, window: 0 }; 
//    console.log(authenticator.timeRemaining()); This does not work as I thought. Don't understand.!
  }

  generateSecret() {
    return this.authenticator.generateSecret();
  }

  generateToken(secret) {
    return this.authenticator.generate(secret);
  }

  verifyToken(secret, token) {
    return this.authenticator.verify({ token, secret });
  }
}

export default new OTPService();
