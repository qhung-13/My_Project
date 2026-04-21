import { useState } from "react";
import "./Login.css";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import axios from "../../utils/axios";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/store";
import { setUser } from "../../store/slices/authSlice";
import type { AxiosError } from "axios";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Verify username + password → gửi OTP
  const handleLoginClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/users/login", { username, password });
      // Lưu email để dùng ở bước verify OTP
      setEmail(res.data.email);
      setStep("otp");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP → tạo token
  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp) return;
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/users/verify-login-otp", { email, otp });
      dispatch(
        setUser({
          _id: res.data._id,
          username: res.data.username,
          email: res.data.email,
          avatar: res.data.avatar || null,
        }),
      );
      onClose();
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/users/auth/google";
  };

  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className="login">
      <div className="login__overlay" onClick={onClose}></div>

      <div className="login__card">
        <button className="login__close" onClick={onClose}>
          &times;
        </button>

        <h2 className="login__title">Welcome Back</h2>
        <p className="login__subtitle">Login to continue</p>

        {/* Error message */}
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
            <button type="submit" className="login__button" disabled={loading}>
              {loading ? "Loading..." : "Login"}
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
              <button type="submit" className="otp-confirm" disabled={loading}>
                {loading ? "Verifying..." : "Confirm"}
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
              onClick={handleGoogleLogin}
            >
              <FcGoogle size={24} />
            </button>
            <button
              className="login__social-btn login__social--facebook"
              onClick={() => {}}
              disabled // Facebook chưa làm
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
