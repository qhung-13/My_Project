import { useEffect, useState } from "react";
import "./Login.css";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/store";
import { setUser } from "../../store/slices/authSlice";
import {
  useLoginMutation,
  useVerifyLoginOtpMutation,
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [error, setError] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyLoginOtp, { isLoading: isVerifyLoading }] =
    useVerifyLoginOtpMutation();

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
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Mã OTP không hợp lệ."));
    }
  };

  return (
    <div className="login" role="presentation">
      <button
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
        <button className="login__close" onClick={onClose} aria-label="Đóng">
          &times;
        </button>
        <h2 className="login__title" id="login-title">
          Welcome Back
        </h2>
        <p className="login__subtitle" id="login-subtitle">
          Login to continue
        </p>

        {error && (
          <p className="login__error" role="alert">
            {error}
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
              minLength={6}
              required
            />
            <button
              type="submit"
              className="login__button"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? "Đang gửi OTP..." : "Login"}
            </button>
          </form>
        ) : (
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
        )}

        {step === "credentials" && (
          <div
            className="login__social"
            aria-label="Đăng nhập bằng mạng xã hội"
          >
            <button
              type="button"
              className="login__social-btn login__social--google"
              onClick={() =>
                window.location.assign(buildApiUrl("/users/auth/google"))
              }
              aria-label="Đăng nhập bằng Google"
            >
              <FcGoogle size={24} />
            </button>
            <button
              type="button"
              className="login__social-btn login__social--facebook"
              disabled
              aria-label="Facebook chưa khả dụng"
            >
              <FaFacebook size={24} color="#1877F2" />
            </button>
          </div>
        )}

        <p className="login__footer">
          Don't have an account?{" "}
          <button type="button" className="login__link" onClick={onSwitch}>
            Register
          </button>
        </p>
      </section>
    </div>
  );
};

export default Login;
