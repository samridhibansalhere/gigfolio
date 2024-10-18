import { Button, Modal, message } from "antd";
import React from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

function PaymentModal({
  showPaymentModal,
  setShowPaymentModal,
  amount,
  onPaymentSuccess, // New prop to handle payment success
}: {
  showPaymentModal: boolean;
  setShowPaymentModal: (showPaymentModal: boolean) => void;
  amount: number;
  onPaymentSuccess: () => void; // Callback to execute on successful payment
}) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/profile/tasks",
        },
        redirect: "if_required",
      });

      if (error) {
        message.error(error.message || "Payment failed.");
      } else if (paymentIntent?.status === "succeeded") {
        message.success("Payment successful!");
        onPaymentSuccess(); // Call the success handler
        setShowPaymentModal(false); // Close the modal
        router.push("/profile/tasks");
      }
    } catch (error) {
      console.error("Payment error:", error);
      message.error("Error processing payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Complete Payment"
      visible={showPaymentModal}
      onCancel={() => setShowPaymentModal(false)}
      footer={null}
    >
      <PaymentElement />
      <div className="mt-4">
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          Pay ${amount}
        </Button>
      </div>
    </Modal>
  );
}

export default PaymentModal;
