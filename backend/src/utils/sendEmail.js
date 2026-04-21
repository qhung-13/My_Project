import nodemailer from "nodemailer";

const sendOtpEmail = async (email, otp, type) => {
  // Move transporter inside function — dotenv đã load rồi khi function chạy
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

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
