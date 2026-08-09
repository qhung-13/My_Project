import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/store";
import { updateCoins } from "../../store/slices/authSlice";
import {
  useConfirmTopUpMutation,
  useCreateTopUpMutation,
  useGetCoinBalanceQuery,
  useGetCoinPackagesQuery,
} from "../../store/api/coinApi";
import type { CoinPackage } from "../../types/index";
import "./TopUp.css";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const getApiError = (error: unknown, fallback: string) => {
  const apiError = error as { data?: { message?: string } };
  return apiError.data?.message || fallback;
};

const TopUpCheckoutForm = ({
  coins,
  paymentIntentId,
  onSuccess,
}: {
  coins: number;
  paymentIntentId: string;
  onSuccess: (newBalance: number) => Promise<void>;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmTopUp] = useConfirmTopUpMutation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || loading) return;

    setLoading(true);
    setError("");

    const paymentResult = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (paymentResult.error) {
      setError(paymentResult.error.message || "Payment failed");
      setLoading(false);
      return;
    }

    try {
      const response = await confirmTopUp(paymentIntentId).unwrap();
      await onSuccess(Number(response.coins ?? 0));
    } catch (requestError) {
      setError(getApiError(requestError, "Không thể xác nhận giao dịch"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="topup__checkout">
      <p className="topup__checkout-info">
        Bạn sẽ nhận được <strong>{coins.toLocaleString()} xu</strong>
      </p>
      {error && (
        <p className="topup__error" role="alert">
          {error}
        </p>
      )}
      <PaymentElement />
      <button
        className="topup__btn"
        type="submit"
        disabled={!stripe || !elements || loading}
      >
        {loading ? "Đang xử lý…" : "Thanh toán an toàn"}
      </button>
    </form>
  );
};

const TopUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [totalCoins, setTotalCoins] = useState(0);
  const [step, setStep] = useState<"select" | "payment" | "success">("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    data: packages,
    isLoading: packagesLoading,
    isError: packagesError,
  } = useGetCoinPackagesQuery(undefined);
  const { data: balance, refetch } = useGetCoinBalanceQuery(undefined);
  const [createTopUp] = useCreateTopUpMutation();

  const handleSelectPackage = async (pkg: CoinPackage) => {
    if (loading) return;
    setError("");
    setSelectedPackage(pkg.id);
    setLoading(true);
    try {
      const response = await createTopUp(pkg.id).unwrap();
      setClientSecret(response.clientSecret);
      setPaymentIntentId(response.paymentIntentId);
      setTotalCoins(response.coins);
      setStep("payment");
    } catch (requestError) {
      setError(
        getApiError(requestError, "Không thể tạo giao dịch. Vui lòng thử lại."),
      );
      setSelectedPackage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (newBalance: number) => {
    dispatch(updateCoins(newBalance));
    await refetch();
    setStep("success");
  };

  const resetSelection = () => {
    setStep("select");
    setSelectedPackage(null);
    setClientSecret("");
    setPaymentIntentId("");
    setError("");
  };

  return (
    <main className="topup">
      <div className="topup__header">
        <button
          className="topup__back"
          type="button"
          onClick={() => navigate(-1)}
        >
          ← Quay lại
        </button>
        <div>
          <p className="topup__eyebrow">Wallet</p>
          <h1 className="topup__title">Nạp xu</h1>
        </div>
        <div className="topup__balance">
          Số dư: <strong>{(balance?.coins ?? 0).toLocaleString()} xu</strong>
        </div>
      </div>

      {!publishableKey && (
        <p className="topup__error" role="alert">
          Thanh toán chưa được cấu hình. Hãy đặt VITE_STRIPE_PUBLISHABLE_KEY khi
          build frontend.
        </p>
      )}
      {error && (
        <p className="topup__error" role="alert">
          {error}
        </p>
      )}

      {step === "select" && (
        <section aria-labelledby="topup-package-heading">
          <h2 id="topup-package-heading" className="topup__section-title">
            Chọn gói xu
          </h2>
          <p className="topup__desc">
            Giá và số xu được xác nhận lại ở server trước khi thanh toán.
          </p>

          {packagesLoading ? (
            <p className="topup__state" role="status">
              Đang tải các gói xu…
            </p>
          ) : packagesError ? (
            <p className="topup__state topup__state--error" role="alert">
              Không thể tải các gói xu. Vui lòng thử lại sau.
            </p>
          ) : !packages?.length ? (
            <p className="topup__state">Hiện chưa có gói xu nào.</p>
          ) : (
            <div className="topup__packages">
              {packages.map((pkg: CoinPackage) => (
                <button
                  key={pkg.id}
                  type="button"
                  className={`topup__package ${selectedPackage === pkg.id ? "topup__package--active" : ""}`}
                  disabled={loading || !publishableKey}
                  onClick={() => void handleSelectPackage(pkg)}
                >
                  {pkg.label === "Popular" && (
                    <span className="topup__badge">Phổ biến</span>
                  )}
                  <span className="topup__package-coins">
                    {pkg.coins.toLocaleString()} xu
                  </span>
                  {pkg.bonus > 0 && (
                    <span className="topup__package-bonus">
                      + {pkg.bonus.toLocaleString()} xu bonus
                    </span>
                  )}
                  <span className="topup__package-total">
                    Tổng: {(pkg.coins + pkg.bonus).toLocaleString()} xu
                  </span>
                  <span className="topup__package-price">${pkg.price}</span>
                  <span className="topup__package-cta">
                    {loading && selectedPackage === pkg.id
                      ? "Đang tạo giao dịch…"
                      : "Chọn gói"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {step === "payment" && clientSecret && stripePromise && (
        <section
          className="topup__payment"
          aria-labelledby="topup-payment-title"
        >
          <h2 id="topup-payment-title" className="topup__payment-title">
            Thanh toán
          </h2>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <TopUpCheckoutForm
              coins={totalCoins}
              paymentIntentId={paymentIntentId}
              onSuccess={handleSuccess}
            />
          </Elements>
          <button
            className="topup__back-btn"
            type="button"
            onClick={resetSelection}
          >
            ← Chọn gói khác
          </button>
        </section>
      )}

      {step === "success" && (
        <section className="topup__success" role="status">
          <span aria-hidden="true">✓</span>
          <h2>Nạp xu thành công</h2>
          <p>
            Bạn đã nhận được <strong>{totalCoins.toLocaleString()} xu</strong>.
          </p>
          <p>
            Số dư hiện tại:{" "}
            <strong>{(balance?.coins ?? 0).toLocaleString()} xu</strong>.
          </p>
          <button
            className="topup__btn"
            type="button"
            onClick={() => navigate(-1)}
          >
            Hoàn tất
          </button>
        </section>
      )}
    </main>
  );
};

export default TopUp;
