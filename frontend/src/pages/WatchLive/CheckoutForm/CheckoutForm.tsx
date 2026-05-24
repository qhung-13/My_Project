import { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import "./CheckoutForm.css";

const CheckoutForm = ({
  amount,
  onSuccess,
}: {
  amount: number;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      setError(error.message || "Payment failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <h2 className="checkout-form__title">💳 Thanh toán</h2>
      <p className="checkout-form__amount">
        Tổng: <strong>${amount}</strong>
      </p>

      {error && <p className="checkout-form__error">{error}</p>}

      <PaymentElement />

      <button
        className="checkout-form__btn"
        type="submit"
        disabled={!stripe || loading}
      >
        {loading ? "Đang xử lý..." : `Thanh toán $${amount}`}
      </button>
    </form>
  );
};

export default CheckoutForm;
