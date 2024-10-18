"use client";
import React, { useEffect, useState } from "react";
import PageTitle from "@/components/page-title";
import SubscriptionsTable from "./_components/subscriptions-table";
import { getAllSubscriptions } from "@/server-actions/admin";
import Loading from "@/app/loading";

function SubscriptionsPurchased() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    async function fetchSubscriptions() {
      setLoading(true); // Start loading
      const subscriptionsResponse = await getAllSubscriptions();
      if (subscriptionsResponse.success && subscriptionsResponse.data) {
        setSubscriptions(subscriptionsResponse.data);
      } else {
        setSubscriptions([]); // Handle failure or no data
      }
      setLoading(false); // End loading
    }

    fetchSubscriptions();
  }, []);

  return (
    <div>
      <PageTitle title="Subscriptions Purchased" />
      {loading ? (
        <Loading /> // Show loading spinner while fetching data
      ) : (
        <SubscriptionsTable subscriptions={subscriptions} />
      )}
    </div>
  );
}

export default SubscriptionsPurchased;
