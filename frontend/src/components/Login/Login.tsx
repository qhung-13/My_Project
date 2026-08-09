import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/store";
import { setUser } from "../../store/slices/authSlice";
import {
  useLoginMutation,
  useVerifyLoginOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "../../store/api/userApi";
import { buildApiUrl } from "../../config/api";

interface LoginProps {
  onClose: () => void;
  onSwitch: () => void;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { data?: { message?: string } };
  return apiError.data?.message || fallback;
};

const Login = ({ onClose, onSwitch }: LoginProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [step, setStep] = useState<"credentials" | "otp" | "forgot" | "reset">(
    "credentials",
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyLoginOtp, { isLoading: isVerifyLoading }] =
    useVerifyLoginOtpMutation();
  const [forgotPassword, { isLoading: isForgotLoading }] =
    useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetLoading }] =
    useResetPasswordMutation();

  const heading =
    step === "credentials"
      ? "Welcome Back"
      : step === "otp"
        ? "Verify Login"
        : step === "forgot"
          ? "Forgot Password"
          : "Reset Password";

  const subtitle =
    step === "credentials"
      ? "Login to continue"
      : step === "otp"
        ? "Enter the one-time code sent to your email"
        : step === "forgot"
          ? "We’ll send a reset code to your email"
          : "Choose a new password for your account";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const handleLoginClick = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const response = await login({
        username: username.trim(),
        password,
      }).unwrap();
      setEmail(response.email);
      setOtp("");
      setStep("otp");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Đăng nhập thất bại."));
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const response = await verifyLoginOtp({
        email,
        otp: otp.trim(),
      }).unwrap();
      dispatch(
        setUser({
          _id: response._id,
          username: response.username,
          email: response.email,
          avatar: response.avatar ?? null,
          coins: response.coins ?? 0,
          role: response.role ?? "user",
        }),
      );
      onClose();
      if (response.role === "admin") navigate("/admin");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Mã OTP không hợp lệ."));
    }
  };

  const handleForgotPassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const normalizedEmail = resetEmail.trim().toLowerCase();
    setError("");
    setNotice("");

    try {
      await forgotPassword({ email: normalizedEmail }).unwrap();
      setResetEmail(normalizedEmail);
      setResetOtp("");
      setStep("reset");
      setNotice("Nếu email tồn tại, mã OTP đặt lại mật khẩu đã được gửi.");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể gửi yêu cầu đặt lại mật khẩu lúc này.",
        ),
      );
    }
  };

  const handleResetPassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      await resetPassword({
        email: resetEmail,
        otp: resetOtp.trim(),
        newPassword,
      }).unwrap();
      setResetOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
      setStep("credentials");
      setNotice("Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Mã OTP không hợp lệ hoặc đã hết hạn."),
      );
    }
  };

  return (
    <div className="login" role="presentation">
      <button
        type="button"
        className="login__overlay"
        onClick={onClose}
        aria-label="Đóng hộp thoại đăng nhập"
      />
      <section
        className="login__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        aria-describedby="login-subtitle"
      >
        <button
          type="button"
          className="login__close"
          onClick={onClose}
          aria-label="Đóng"
        >
          &times;
        </button>
        <h2 className="login__title" id="login-title">
          {heading}
        </h2>
        <p className="login__subtitle" id="login-subtitle">
          {subtitle}
        </p>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="login__notice" role="status">
            {notice}
          </p>
        )}

        {step === "credentials" ? (
          <form className="login__form" onSubmit={handleLoginClick}>
            <label className="sr-only" htmlFor="login-username">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              placeholder="Username"
              className="login__input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={30}
              autoFocus
              required
            />
            <label className="sr-only" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="Password"
              className="login__input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="login__forgot"
              onClick={() => {
                setError("");
                setNotice("");
                setResetEmail("");
                setStep("forgot");
              }}
            >
              Quên mật khẩu?
            </button>
            <button
              type="submit"
              className="login__button"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? "Đang gửi OTP..." : "Login"}
            </button>
          </form>
        ) : step === "otp" ? (
          <form className="login__form" onSubmit={handleOtpSubmit}>
            <p className="otp-info">
              OTP đã được gửi tới email: <strong>{email}</strong>
            </p>
            <label className="sr-only" htmlFor="login-otp">
              Mã OTP
            </label>
            <input
              id="login-otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="Enter OTP"
              className="otp-input"
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, ""))
              }
              autoComplete="one-time-code"
              autoFocus
              required
            />
            <div className="otp-actions">
              <button
                type="submit"
                className="otp-confirm"
                disabled={isVerifyLoading || otp.length !== 6}
              >
                {isVerifyLoading ? "Verifying..." : "Confirm"}
              </button>
              <button
                type="button"
                className="otp-back"
                onClick={() => setStep("credentials")}
              >
                Back
              </button>
            </div>
          </form>
        ) : step === "forgot" ? (
          <form className="login__form" onSubmit={handleForgotPassword}>
            <p className="otp-info">
              Nhập email đã đăng ký để nhận OTP đặt lại mật khẩu.
            </p>
            <label className="sr-only" htmlFor="forgot-email">
              Email
            </label>
            <input
              id="forgot-email"
              className="login__input"
              type="email"
              placeholder="Email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
            <div className="otp-actions">
              <button
                type="submit"
                className="otp-confirm"
                disabled={isForgotLoading}
              >
                {isForgotLoading ? "Đang gửi..." : "Gửi OTP"}
              </button>
              <button
                type="button"
                className="otp-back"
                onClick={() => setStep("credentials")}
              >
                Back
              </button>
            </div>
          </form>
        ) : (
          <form className="login__form" onSubmit={handleResetPassword}>
            <p className="otp-info">
              Nhập OTP đã gửi tới <strong>{resetEmail}</strong> và mật khẩu mới.
            </p>
            <label className="sr-only" htmlFor="reset-otp">
              Mã OTP
            </label>
            <input
              id="reset-otp"
              className="otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="OTP 6 số"
              value={resetOtp}
              onChange={(event) =>
                setResetOtp(event.target.value.replace(/\D/g, ""))
              }
              autoComplete="one-time-code"
              required
            />
            <label className="sr-only" htmlFor="reset-password">
              Mật khẩu mới
            </label>
            <input
              id="reset-password"
              className="login__input"
              type="password"
              placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <label className="sr-only" htmlFor="reset-password-confirm">
              Xác nhận mật khẩu mới
            </label>
            <input
              id="reset-password-confirm"
              className="login__input"
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <div className="otp-actions">
              <button
                type="submit"
                className="otp-confirm"
                disabled={isResetLoading || resetOtp.length !== 6}
              >
                {isResetLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
              </button>
              <button
                type="button"
                className="otp-back"
                onClick={() => setStep("forgot")}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {step === "credentials" && (
          <div
            className="login__social"
            aria-label="Đăng nhập bằng mạng xã hội"
          >
            <button
              type="button"
              className="login__social-btn login__social-btn--google"
              onClick={() =>
                window.location.assign(buildApiUrl("/users/auth/google"))
              }
              aria-label="Đăng nhập bằng Google"
            >
              <FcGoogle size={24} />
            </button>
            <button
              type="button"
              className="login__social-btn login__social-btn--facebook"
              disabled
              aria-label="Facebook chưa khả dụng"
            >
              <FaFacebook size={24} color="#1877F2" />
            </button>
          </div>
        )}

        {step === "credentials" && (
          <p className="login__footer">
            Don't have an account?{" "}
            <button type="button" className="login__link" onClick={onSwitch}>
              Register
            </button>
          </p>
        )}
      </section>
    </div>
  );
};

export default Login;
