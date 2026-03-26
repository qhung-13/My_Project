import { useState } from "react";
import "./Register.css";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

interface RegisterProps {
  onClose: () => void;
  onSwitch: () => void;
}

const Register = ({ onClose, onSwitch }: RegisterProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  const handleRegisterClick = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Sau này gọi API gửi OTP
    console.log("Send OTP to:", email);

    setStep("otp");
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Verify OTP:", otp);
    console.log("Register account:", email);

    // Sau này gọi API verify OTP

    onClose();
  };

  const handleSocialRegister = (provider: string) => {
    alert(`Register with ${provider} clicked!`);
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

        {step === "credentials" ? (
          <form className="register__form" onSubmit={handleRegisterClick}>
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

            <button type="submit" className="register__button">
              Register
            </button>
          </form>
        ) : (
          <form className="register__form" onSubmit={handleOtpSubmit}>
            <input
              type="text"
              placeholder="Enter OTP"
              className="otp-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <p className="otp-info">OTP sent to your email</p>

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

              <button type="submit" className="otp-confirm">
                Confirm
              </button>
            </div>
          </form>
        )}

        {step === "credentials" && (
          <div className="login__social">
            <button
              className="login__social-btn login__social--google"
              onClick={() => handleSocialRegister("Google")}
            >
              <FcGoogle size={24} />
            </button>
            <button
              className="login__social-btn login__social--facebook"
              onClick={() => handleSocialRegister("Facebook")}
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
