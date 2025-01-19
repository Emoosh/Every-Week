import { authenticator } from "otplib";

class OTPService {
  constructor() {
    this.authenticator = authenticator;
    this.authenticator.options = { digits: 6 }; 
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
