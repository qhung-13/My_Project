import { useState } from "react";
import "./Login.css";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

interface LoginProps {
  onClose: () => void;
  onSwitch: () => void;
}

const Login = ({ onClose, onSwitch }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  const handleLoginClick = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep("otp");
  };

  const handleOtpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp) return;
    console.log("Email: ", email, "Password: ", password);
    onClose();
  };

  const handleSocialLogin = (provider: string) => {
    alert(`Login with ${provider} clicked! `);
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

        {step === "credentials" ? (
          <form className="login__form" onSubmit={handleLoginClick}>
            <input
              type="email"
              placeholder="Email"
              className="login__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <button type="submit" className="login__button">
              Login
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
              <button type="submit" className="otp-confirm">
                Confirm
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
              onClick={() => handleSocialLogin("Google")}
            >
              <FcGoogle size={24} />
            </button>
            <button
              className="login__social-btn login__social--facebook"
              onClick={() => handleSocialLogin("Facebook")}
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
