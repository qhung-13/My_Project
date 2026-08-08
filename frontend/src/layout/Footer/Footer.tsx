import "./Footer.css";
import Logo from "../../assets/images/Logo.png";
import { Link } from "react-router-dom";

const LINKS = [
  { label: "Trang chủ", path: "/home" },
  { label: "Đang live", path: "/live" },
  { label: "Trò chơi", path: "/game" },
  { label: "Tìm kiếm", path: "/search" },
];

const Footer = () => (
  <footer className="footer">
    <div className="footer__container">
      <div className="footer__content">
        <div className="footer__brand">
          <img src={Logo} alt="OmexLive" className="footer__logo" />
          <p className="footer__desc">
            Nền tảng livestream gaming kết nối streamer và khán giả trên mọi
            thiết bị.
          </p>
        </div>

        <nav className="footer__links-wrap" aria-label="Liên kết cuối trang">
          <span className="footer__section-title">Khám phá</span>
          <ul className="footer__links">
            {LINKS.map((item) => (
              <li key={item.path}>
                <Link to={item.path} className="footer__link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="footer__divider" />
      <p className="footer__copyright">© 2026 OmexLive. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
