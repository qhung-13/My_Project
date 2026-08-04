import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });

    transporter
      .verify()
      .then(() => console.log("Brevo SMTP connection OK"))
      .catch((err) => console.error("Brevo SMTP verify failed:", err.message));
  }

  return transporter;
};

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

  try {
    const info = await getTransporter().sendMail({
      from: `"OmexLive" <${process.env.BREVO_SMTP_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(
      `Email OTP đã gửi tới ${email} (Message ID: ${info.messageId})`,
    );
    return true;
  } catch (error) {
    console.error(`Lỗi gửi email tới ${email}:`, error.message);
    throw new Error("Không thể gửi email OTP lúc này. Vui lòng thử lại sau.");
  }
};

export default sendOtpEmail;
