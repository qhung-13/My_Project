import nodemailer from "nodemailer";

const sendOtpEmail = async (email, otp, type) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
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
    from: `"OmexLive" <${process.env.BREVO_SMTP_USER}>`,
    to: email,
    subject,
    html,
  });
};

export default sendOtpEmail;
