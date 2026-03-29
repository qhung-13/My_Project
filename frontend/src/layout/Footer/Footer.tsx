import "./Footer.css";
import { FaFacebook, FaYoutube, FaDiscord, FaTiktok } from "react-icons/fa";
import Logo from "../../assets/images/Logo.png";
import { Link } from "react-router-dom";

const LINKS = [
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
  { label: "Terms", path: "/terms" },
  { label: "Privacy", path: "/privacy" },
  { label: "Help", path: "/help" },
  { label: "Careers", path: "/careers" },
];

const SOCIALS = [
  { icon: <FaFacebook size={16} color="#1877F2" />, label: "Facebook" },
  { icon: <FaYoutube size={16} color="#FF0000" />, label: "Youtube" },
  { icon: <FaDiscord size={16} color="#5865F2" />, label: "Discord" },
  { icon: <FaTiktok size={16} color="white" />, label: "TikTok" },
];

const Footer = () => {
  return (
    <footer className="footer">
      {/* Logo + mô tả */}
      <div className="footer__brand">
        <img src={Logo} alt="OmexLive" className="footer__logo" />
        <p className="footer__desc">
          Nền tảng xem livestream gaming hàng đầu Việt Nam. Kết nối streamer và
          khán giả mọi lúc mọi nơi.
        </p>
      </div>

      {/* Links */}
      <div className="footer__links-wrap">
        <span className="footer__section-title">Khám phá</span>
        <ul className="footer__links">
          {LINKS.map((item) => (
            <li key={item.label}>
              <Link to={item.path} className="footer__link">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Social */}
      <div className="footer__social-wrap">
        <span className="footer__section-title">Theo dõi chúng tôi</span>
        <ul className="footer__socials">
          {SOCIALS.map((item) => (
            <li key={item.label}>
              <button className="footer__social-btn" aria-label={item.label}>
                {item.icon}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div className="footer__divider" />

      {/* Copyright */}
      <p className="footer__copyright">© 2026 OmexLive. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
