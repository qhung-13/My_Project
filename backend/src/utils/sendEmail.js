import nodemailer from "nodemailer";

/**
 * Reusable Nodemailer transporter instance.
 * Uses Gmail service with App Passwords for authentication.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password, không phải password Gmail thật
  },
});

/**
 * Sends an email containing a One-Time Password (OTP) to the user.
 * Dynamically switches subject and HTML template based on the OTP type.
 *
 * @param {string} email - The recipient's email address
 * @param {string} otp - The generated OTP string (usually 6 digits)
 * @param {string} type - The purpose of the OTP (enum: "verify_email", "reset_password")
 * @returns {Promise<void>} Resolves when the email is successfully sent
 */
const sendOtpEmail = async (email, otp, type) => {
  const isVerification = type === "verify_email";

  const subject = isVerification
    ? "Xác minh tài khoản OmexLive"
    : "Khôi phục mật khẩu OmexLive";

  const html = isVerification
    ? `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2>Xác minh email của bạn</h2>
        <p>Chào mừng bạn đến với OmexLive! Mã OTP để xác minh tài khoản của bạn là:</p>
        <p><b style="font-size: 24px; color: #4CAF50;">${otp}</b></p>
        <p><i>Lưu ý: Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</i></p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2>Yêu cầu khôi phục mật khẩu</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản OmexLive của bạn. Mã OTP của bạn là:</p>
        <p><b style="font-size: 24px; color: #f44336;">${otp}</b></p>
        <p><i>Lưu ý: Mã này sẽ hết hạn sau 5 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và bảo mật tài khoản của mình.</i></p>
      </div>
    `;

  await transporter.sendMail({
    from: `"OmexLive Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  });
};

export default sendOtpEmail;
