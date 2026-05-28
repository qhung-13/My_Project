import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";
import {
  useGetCoinBalanceQuery,
  useDonateCoinsMutation,
} from "../../../store/api/coinApi";
import { useNavigate } from "react-router-dom";
import "./DonateModal.css";

const PRESET_COINS = [10, 50, 100, 500, 1000];

const DonateModal = ({
  streamerId,
  streamerName,
  onClose,
}: {
  streamerId: string;
  streamerName: string;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(50);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"donate" | "success">("donate");
  const [error, setError] = useState("");

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { data: balance } = useGetCoinBalanceQuery(undefined, {
    skip: !authUser,
  });
  const [donateCoins, { isLoading }] = useDonateCoinsMutation();

  const handleDonate = async () => {
    setError("");

    if (!authUser) {
      setError("Bạn cần đăng nhập để donate");
      return;
    }

    if ((balance?.coins || 0) < coins) {
      setError("Số xu không đủ! Hãy nạp thêm xu.");
      return;
    }

    try {
      await donateCoins({
        toUserId: streamerId,
        coins,
        message,
      }).unwrap();
      setStep("success");
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || "Donate thất bại");
    }
  };

  return (
    <div className="donate-modal">
      <div className="donate-modal__overlay" onClick={onClose} />
      <div className="donate-modal__card">
        <button className="donate-modal__close" onClick={onClose}>&times;</button>

        {step === "donate" && (
          <>
            <h2 className="donate-modal__title">💝 Donate</h2>
            <p className="donate-modal__subtitle">
              Ủng hộ <strong>{streamerName}</strong>
            </p>

            {/* Coin balance */}
            <div className="donate-modal__balance">
              Số dư: <strong>{balance?.coins || 0} xu</strong>
              <button
                className="donate-modal__topup-link"
                onClick={() => { onClose(); navigate("/topup"); }}
              >
                + Nạp thêm
              </button>
            </div>

            {error && <p className="donate-modal__error">{error}</p>}

            {/* Preset coins */}
            <div className="donate-modal__presets">
              {PRESET_COINS.map((preset) => (
                <button
                  key={preset}
                  className={`donate-modal__preset ${coins === preset ? "donate-modal__preset--active" : ""}`}
                  onClick={() => setCoins(preset)}
                >
                  🪙 {preset}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="donate-modal__field">
              <label className="donate-modal__label">Số xu</label>
              <input
                className="donate-modal__input"
                type="number"
                min={1}
                value={coins}
                onChange={(e) => setCoins(Number(e.target.value))}
              />
            </div>

            {/* Message */}
            <div className="donate-modal__field">
              <label className="donate-modal__label">
                Lời nhắn{" "}
                <span className="donate-modal__count">{message.length}/200</span>
              </label>
              <textarea
                className="donate-modal__textarea"
                placeholder="Nhắn gì đó cho streamer..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
              />
            </div>

            <button
              className="donate-modal__btn"
              onClick={handleDonate}
              disabled={isLoading || coins < 1}
            >
              {isLoading ? "Đang gửi..." : `Donate 🪙 ${coins} xu`}
            </button>
          </>
        )}

        {step === "success" && (
          <div className="donate-modal__success">
            <span>🎉</span>
            <h2>Donate thành công!</h2>
            <p>Bạn đã gửi <strong>🪙 {coins} xu</strong> cho {streamerName}</p>
            {message && <p className="donate-modal__success-msg">"{message}"</p>}
            <button className="donate-modal__btn" onClick={onClose}>Đóng</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonateModal;