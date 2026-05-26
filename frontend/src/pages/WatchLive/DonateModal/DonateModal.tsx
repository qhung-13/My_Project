import { useState } from "react";
import { useSelector } from "react-redux";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import type { RootState } from "../../../store/store";
import CheckoutForm from "../CheckoutForm/CheckoutForm";
import instance from "../../../utils/axios";
import "./DonateModal.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PRESET_AMOUNTS = [1, 5, 10, 20, 50];

const DonateModal = ({
  streamerId,
  onClose,
}: {
  streamerId: string;
  onClose: () => void;
}) => {
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [step, setStep] = useState<"amount" | "payment" | "success">("amount");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user: authUser } = useSelector((state: RootState) => state.auth);

  const handleProceed = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await instance.post("/donations/create-payment-intent", {
        fromUserId: authUser?._id,
        toUserId: streamerId,
        amount,
        message,
      });
      setClientSecret(res.data.clientSecret);
      setStep("payment");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to create payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donate-modal">
      <div className="donate-modal__overlay" onClick={onClose} />
      <div className="donate-modal__card">
        <button className="donate-modal__close" onClick={onClose}>
          &times;
        </button>

        {step === "amount" && (
          <>
            <h2 className="donate-modal__title">💝 Donate</h2>
            <p className="donate-modal__subtitle">Ủng hộ streamer yêu thích!</p>

            {error && <p className="donate-modal__error">{error}</p>}

            {/* Preset amounts */}
            <div className="donate-modal__presets">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  className={`donate-modal__preset ${amount === preset ? "donate-modal__preset--active" : ""}`}
                  onClick={() => setAmount(preset)}
                >
                  ${preset}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="donate-modal__field">
              <label className="donate-modal__label">Số tiền ($)</label>
              <input
                className="donate-modal__input"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>

            {/* Message */}
            <div className="donate-modal__field">
              <label className="donate-modal__label">
                Lời nhắn{" "}
                <span className="donate-modal__count">
                  {message.length}/200
                </span>
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
              onClick={handleProceed}
              disabled={loading || amount < 1}
            >
              {loading ? "Loading..." : `Donate $${amount}`}
            </button>
          </>
        )}

        {step === "payment" && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              amount={amount}
              onSuccess={() => setStep("success")}
            />
          </Elements>
        )}

        {step === "success" && (
          <div className="donate-modal__success">
            <span>🎉</span>
            <h2>Cảm ơn bạn!</h2>
            <p>Donation ${amount} đã được gửi thành công!</p>
            <button className="donate-modal__btn" onClick={onClose}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonateModal;
