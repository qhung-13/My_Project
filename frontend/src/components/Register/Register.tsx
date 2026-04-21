import { useState } from "react";
import "./Register.css";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import instance from "../../utils/axios";
import type { AxiosError } from "axios";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/store";
import { setUser } from "../../store/slices/authSlice";

interface RegisterProps {
  onClose: () => void;
  onSwitch: () => void;
}

const Register = ({ onClose, onSwitch }: RegisterProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch<AppDispatch>();

  const handleRegisterClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Register account
      await instance.post("/users/register", { username, email, password });

      // Step 2: Send OTP to email
      await instance.post("/users/send-otp", { email });

      setStep("otp");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 3: Verify OTP → isVerified = true
      await instance.post("/users/verify-otp", { email, otp });
      dispatch(
        setUser({
          _id: "",
          username,
          email,
          avatar: null,
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

  return (
    <div className="register">
      <div className="register__overlay" onClick={onClose}></div>

      <div className="register__card">
        <button className="register__close" onClick={onClose}>
          &times;
        </button>

        <h2 className="register__title">Create Account</h2>
        <p className="register__subtitle">Register to get started</p>

        {error && <p className="register__error">{error}</p>}

        {step === "credentials" ? (
          <form className="register__form" onSubmit={handleRegisterClick}>
            <input
              type="text"
              placeholder="Username"
              className="register__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="register__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="register__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="register__input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="register__button"
              disabled={loading}
            >
              {loading ? "Loading..." : "Register"}
            </button>
          </form>
        ) : (
          <form className="register__form" onSubmit={handleOtpSubmit}>
            <p className="otp-info">
              OTP sent to: <strong>{email}</strong>
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
                type="button"
                className="otp-back"
                onClick={() => {
                  setOtp("");
                  setStep("credentials");
                }}
              >
                Back
              </button>
              <button type="submit" className="otp-confirm" disabled={loading}>
                {loading ? "Verifying..." : "Confirm"}
              </button>
            </div>
          </form>
        )}

        {step === "credentials" && (
          <div className="register__social">
            <button
              className="register__social-btn register__social--google"
              onClick={() =>
                (window.location.href =
                  "http://localhost:5000/api/users/auth/google")
              }
            >
              <FcGoogle size={24} />
            </button>
            <button
              className="register__social-btn register__social--facebook"
              disabled
            >
              <FaFacebook size={24} color="#1877F2" />
            </button>
          </div>
        )}

        <p className="register__footer">
          Already have an account?{" "}
          <button className="register__link" onClick={onSwitch}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
