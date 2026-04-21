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
  const subject =
    type === "verify_email"
      ? "Xác minh tài khoản OmexLive"
      : type === "login"
        ? "Mã OTP đăng nhập OmexLive"
        : "Reset mật khẩu OmexLive";

  const html =
    type === "verify_email"
      ? `<h2>Xác minh email của bạn</h2><p>Mã OTP: <b>${otp}</b></p><p>Hết hạn sau 5 phút.</p>`
      : type === "login"
        ? `<h2>Mã OTP đăng nhập</h2><p>Mã OTP: <b>${otp}</b></p><p>Hết hạn sau 5 phút.</p>`
        : `<h2>Reset mật khẩu</h2><p>Mã OTP: <b>${otp}</b></p><p>Hết hạn sau 5 phút.</p>`;

  await transporter.sendMail({
    from: `"OmexLive" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  });
};

export default sendOtpEmail;
