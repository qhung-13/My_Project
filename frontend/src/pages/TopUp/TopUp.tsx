import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  useGetCoinPackagesQuery,
  useCreateTopUpMutation,
  useConfirmTopUpMutation,
  useGetCoinBalanceQuery,
} from "../../store/api/coinApi";
import "./TopUp.css";
import { useNavigate } from "react-router-dom";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ─── Checkout Form ───────────────────────────
const TopUpCheckoutForm = ({
  coins,
  paymentIntentId,
  onSuccess,
}: {
  coins: number;
  paymentIntentId: string;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmTopUp] = useConfirmTopUpMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (error) {
      setError(error.message || "Payment failed");
      setLoading(false);
      return;
    }

    // Confirm topup với backend
    await confirmTopUp(paymentIntentId).unwrap();
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="topup__checkout">
      <p className="topup__checkout-info">
        Bạn sẽ nhận được <strong>{coins} xu</strong>
      </p>
      {error && <p className="topup__error">{error}</p>}
      <PaymentElement />
      <button
        className="topup__btn"
        type="submit"
        disabled={!stripe || loading}
      >
        {loading ? "Đang xử lý..." : "Thanh toán"}
      </button>
    </form>
  );
};

// ─── Main TopUp Page ─────────────────────────
const TopUp = () => {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [totalCoins, setTotalCoins] = useState(0);
  const [step, setStep] = useState<"select" | "payment" | "success">("select");
  const [loading, setLoading] = useState(false);

  const { data: packages } = useGetCoinPackagesQuery(undefined);
  const { data: balance, refetch } = useGetCoinBalanceQuery(undefined);
  const [createTopUp] = useCreateTopUpMutation();

  const handleSelectPackage = async (pkg: any) => {
    setSelectedPackage(pkg.id);
    setLoading(true);
    try {
      const res = await createTopUp(pkg.id).unwrap();
      setClientSecret(res.clientSecret);
      setPaymentIntentId(res.clientSecret.split("_secret")[0]);
      setTotalCoins(res.coins);
      setStep("payment");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async () => {
    await refetch();
    setStep("success");
  };

  return (
    <div className="topup">
      <div className="topup__header">
        <button className="topup__back" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
        <h1 className="topup__title">💰 Nạp Xu</h1>
        <div className="topup__balance">
          Số dư: <strong>{balance?.coins || 0} xu</strong>
        </div>
      </div>

      {step === "select" && (
        <>
          <p className="topup__desc">Chọn gói xu phù hợp với bạn</p>
          <div className="topup__packages">
            {packages?.map((pkg: any) => (
              <div
                key={pkg.id}
                className={`topup__package ${selectedPackage === pkg.id ? "topup__package--active" : ""}`}
                onClick={() => !loading && handleSelectPackage(pkg)}
              >
                {pkg.label === "Popular" && (
                  <span className="topup__badge">🔥 Phổ biến</span>
                )}
                <div className="topup__package-coins">
                  🪙 {pkg.coins.toLocaleString()} xu
                </div>
                {pkg.bonus > 0 && (
                  <div className="topup__package-bonus">
                    + {pkg.bonus} xu bonus
                  </div>
                )}
                <div className="topup__package-total">
                  Tổng: {(pkg.coins + pkg.bonus).toLocaleString()} xu
                </div>
                <div className="topup__package-price">${pkg.price}</div>
                <button className="topup__package-btn" disabled={loading}>
                  {loading && selectedPackage === pkg.id
                    ? "Loading..."
                    : "Nạp ngay"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {step === "payment" && clientSecret && (
        <div className="topup__payment">
          <h2 className="topup__payment-title">💳 Thanh toán</h2>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <TopUpCheckoutForm
              coins={totalCoins}
              paymentIntentId={paymentIntentId}
              onSuccess={handleSuccess}
            />
          </Elements>
          <button className="topup__back-btn" onClick={() => setStep("select")}>
            ← Chọn gói khác
          </button>
        </div>
      )}

      {step === "success" && (
        <div className="topup__success">
          <span>🎉</span>
          <h2>Nạp xu thành công!</h2>
          <p>
            Bạn đã nhận được <strong>{totalCoins} xu</strong>
          </p>
          <p>
            Số dư hiện tại: <strong>{balance?.coins || 0} xu</strong>
          </p>
          <button className="topup__btn" onClick={() => navigate(-1)}>
            Quay lại
          </button>
        </div>
      )}
    </div>
  );
};

export default TopUp;
