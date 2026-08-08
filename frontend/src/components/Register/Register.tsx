import { useEffect, useState } from "react";
import "./Register.css";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/store";
import { setUser } from "../../store/slices/authSlice";
import {
  useRegisterMutation,
  useVerifyOtpMutation,
} from "../../store/api/userApi";
import { buildApiUrl } from "../../config/api";

interface RegisterProps {
  onClose: () => void;
  onSwitch: () => void;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as { data?: { message?: string } };
  return apiError.data?.message || fallback;
};

const Register = ({ onClose, onSwitch }: RegisterProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [error, setError] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [verifyOtp, { isLoading: isVerifyLoading }] = useVerifyOtpMutation();

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

  const handleRegisterClick = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();
      setOtp("");
      setStep("otp");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Registration failed"));
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const response = await verifyOtp({
        email: email.trim().toLowerCase(),
        otp,
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
      setError(getErrorMessage(requestError, "Invalid OTP"));
    }
  };

  return (
    <div className="register" role="presentation">
      <button
        className="register__overlay"
        onClick={onClose}
        aria-label="Đóng hộp thoại đăng ký"
      />
      <section
        className="register__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-title"
        aria-describedby="register-subtitle"
      >
        <button className="register__close" onClick={onClose} aria-label="Đóng">
          &times;
        </button>
        <h2 className="register__title" id="register-title">
          Create Account
        </h2>
        <p className="register__subtitle" id="register-subtitle">
          Register to get started
        </p>

        {error && (
          <p className="register__error" role="alert">
            {error}
          </p>
        )}

        {step === "credentials" ? (
          <form className="register__form" onSubmit={handleRegisterClick}>
            <label className="sr-only" htmlFor="register-username">
              Username
            </label>
            <input
              id="register-username"
              className="register__input"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={30}
              autoFocus
              required
            />
            <label className="sr-only" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              className="register__input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            <label className="sr-only" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              className="register__input"
              type="password"
              placeholder="Password (minimum 8 characters)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <label className="sr-only" htmlFor="register-password-confirm">
              Confirm password
            </label>
            <input
              id="register-password-confirm"
              className="register__input"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              className="register__button"
              type="submit"
              disabled={isRegisterLoading}
            >
              {isRegisterLoading ? "Creating..." : "Register"}
            </button>
          </form>
        ) : (
          <form className="register__form" onSubmit={handleOtpSubmit}>
            <p className="otp-info">
              OTP đã được gửi tới email: <strong>{email}</strong>
            </p>
            <label className="sr-only" htmlFor="register-otp">
              Mã OTP
            </label>
            <input
              id="register-otp"
              className="otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="Enter OTP"
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
                className="otp-confirm"
                type="submit"
                disabled={isVerifyLoading || otp.length !== 6}
              >
                {isVerifyLoading ? "Verifying..." : "Confirm"}
              </button>
              <button
                className="otp-back"
                type="button"
                onClick={() => setStep("credentials")}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {step === "credentials" && (
          <div
            className="register__social"
            aria-label="Đăng ký bằng mạng xã hội"
          >
            <button
              type="button"
              className="register__social-btn register__social--google"
              onClick={() =>
                window.location.assign(buildApiUrl("/users/auth/google"))
              }
              aria-label="Đăng ký bằng Google"
            >
              <FcGoogle size={24} />
            </button>
            <button
              type="button"
              className="register__social-btn register__social--facebook"
              disabled
              aria-label="Facebook chưa khả dụng"
            >
              <FaFacebook size={24} color="#1877F2" />
            </button>
          </div>
        )}

        <p className="register__footer">
          Already have an account?{" "}
          <button type="button" className="register__link" onClick={onSwitch}>
            Login
          </button>
        </p>
      </section>
    </div>
  );
};

export default Register;
