"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, message } from "antd";
import { getUserSubscription } from "@/server-actions/users";
import { getDateTimeFormat } from "@/helpers/date-time-formats";
import Loading from "@/app/loading";
import { ArrowLeftOutlined} from "@ant-design/icons";
const UserSubscriptionPage = () => {
  const { id } = useParams();
  const userId: string = Array.isArray(id) ? id[0] : id; // Ensure userId is a string
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true); // Set loading to true before fetching
      try {
        const result = await getUserSubscription(userId);
        if (result.success) {
          setSubscription(result.data);
        } else {
          message.error(result.message);
        }
      } catch (error) {
        message.error("Error fetching subscription data");
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchSubscription();
  }, [userId]);

  if (loading) return <Loading />; // Show loading spinner while loading is true

  const renderSubscriptionProperty = (label: string, value: string | number | null | undefined) => {
    return (
      <div className="flex flex-col">
        <span className="font-bold text-sm">{label}</span>
        <span className="text-sm text-gray-600">{value ?? "N/A"}</span>
      </div>
    );
  };
  const handleBack = () => {
    router.push("/admin/users");
  };

  return (
    <div className="p-5">
    <Button
        onClick={handleBack}
        type="primary"
        className="flex items-center text-secondary mb-4"
      >
        < ArrowLeftOutlined className="mr-2" />
        Back to Users
      </Button>
      <h1 className="text-2xl font-bold mb-5">User Subscription</h1>
      {subscription ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {renderSubscriptionProperty("Plan", subscription.planName)}
          {renderSubscriptionProperty("Price", `$${subscription.price}`)}
          {renderSubscriptionProperty("Expiry Date", getDateTimeFormat(subscription.expiryDate))}
          {renderSubscriptionProperty("Payment ID", subscription.paymentId)}
          {renderSubscriptionProperty("Purchased On", getDateTimeFormat(subscription.createdAt))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No subscription data available.</p>
      )}
    </div>
  );
};

export default UserSubscriptionPage;
