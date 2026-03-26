import { useState } from "react";
import "./Login.css";

interface LoginProps {
  onClose: () => void;
  onSwitch: () => void;
}

const Login = ({ onClose, onSwitch }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

        <form className="login__form" onSubmit={handleSubmit}>
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
          <button type="submit" className="login__button">
            Login
          </button>
        </form>

        <div className="login__social">
          <button
            className="login__social-btn login__social--google"
            onClick={() => handleSocialLogin("Google")}
          >
            Continue with Google
          </button>
          <button
            className="login__social-btn login__social--facebook"
            onClick={() => handleSocialLogin("Facebook")}
          >
            Continue with Facebook
          </button>
        </div>

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
