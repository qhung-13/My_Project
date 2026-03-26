import { useState } from "react";
import "./Register.css";

interface RegisterProps {
  onClose: () => void;
  onSwitch: () => void;
}

const Register = ({ onClose, onSwitch }: RegisterProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    console.log("Email:", email, "Password:", password);
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

        <form className="register__form" onSubmit={handleSubmit}>
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

          {/* OTP */}
          {!otpSent ? (
            <button type="button" onClick={() => setOtpSent(true)} className="otp-btn">
              Send OTP
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="otp-input"
              />
              <p className="otp-info">OTP sent to your email</p>
            </>
          )}

          <button type="submit" className="register__button">
            Register
          </button>
        </form>

        <div className="register__social">
          <button
            className="register__social-btn register__social-btn--google"
            onClick={() => handleSocialRegister("Google")}
          >
            Continue with Google
          </button>
          <button
            className="register__social-btn register__social-btn--facebook"
            onClick={() => handleSocialRegister("Facebook")}
          >
            Continue with Facebook
          </button>
        </div>

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
