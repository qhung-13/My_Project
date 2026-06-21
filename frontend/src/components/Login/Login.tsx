import { useState } from "react";
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

interface LoginProps {
  onClose: () => void;
  onSwitch: () => void;
}

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

  const handleLoginClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const res = await login({ username, password }).unwrap();
      setEmail(res.email);
      setStep("otp");
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || "Login failed");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const res = await verifyLoginOtp({ email, otp }).unwrap();
      dispatch(
        setUser({
          _id: res._id,
          username: res.username,
          email: res.email,
          avatar: res.avatar || null,
          coins: res.coins || 0,
          role: res.role || "users",
        }),
      );
      onClose();
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || "Invalid OTP");
    }
  };

  return (
    <div className="login">
      <div className="login__overlay" onClick={onClose}></div>
      <div className="login__card">
        <button className="login__close" onClick={onClose}>
          &times;
        </button>
        <h2 className="login__title">Welcome Back</h2>
        <p className="login__subtitle">Login to continue</p>

        {error && <p className="login__error">{error}</p>}

        {step === "credentials" ? (
          <form className="login__form" onSubmit={handleLoginClick}>
            <input
              type="text"
              placeholder="Username"
              className="login__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="login__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="login__button"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? "Loading..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="login__form" onSubmit={handleOtpSubmit}>
            <p className="otp-info">
              OTP đã được gửi tới email: <strong>{email}</strong>
            </p>
            <input
              type="text"
              placeholder="Enter OTP"
              className="otp-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <div className="otp-actions">
              <button
                type="submit"
                className="otp-confirm"
                disabled={isVerifyLoading}
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
          <div className="login__social">
            <button
              className="login__social-btn login__social--google"
              onClick={() =>
                (window.location.href = `${import.meta.env.VITE_API_URL?.replace("/api", "")}/api/users/auth/google`)
              }
            >
              <FcGoogle size={24} />
            </button>
            <button
              className="login__social-btn login__social--facebook"
              disabled
            >
              <FaFacebook size={24} color="#1877F2" />
            </button>
          </div>
        )}

        <p className="login__footer">
          Don't have an account?{" "}
          <button className="login__link" onClick={onSwitch}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
