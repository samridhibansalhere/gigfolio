"use client";
import React, { useEffect, useState } from "react";
import PageTitle from "@/components/page-title";
import ReportTile from "./_components/report-title";
import { getReportsForAdmin } from "@/server-actions/admin";
import SubscriptionsTable from "../subscriptions/_components/subscriptions-table";
import ReportsFilters from "./_components/reports-filter";
import Loading from "@/app/loading"; // Import the Loading component

function Reports({ searchParams }: { searchParams: any }) {
  const [loading, setLoading] = useState(true); // State to manage loading
  const [reportsData, setReportsData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true); // Start loading
      setError(false); // Reset error

      const response: any = await getReportsForAdmin({
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
        searchTerm: searchParams.searchTerm,
      });

      if (!response.success) {
        setError(true); // Set error if response fails
      } else {
        setReportsData(response.data); // Set fetched data
      }

      setLoading(false); // End loading
    }

    fetchReports();
  }, [searchParams]);

  if (loading) {
    return <Loading />; // Display the loading spinner while fetching
  }

  if (error) {
    return <div>Error fetching data</div>; // Display error message if fetching fails
  }

  const { totalUsers, totalSubscriptions, activeSubscriptions, totalRevenue, lastFiveSubscriptions }: any = reportsData;

  return (
    <div>
      <PageTitle title="Reports" />
      <ReportsFilters searchParams={searchParams} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-7">
        <ReportTile
          name="Total Users"
          description="Total number of users"
          value={totalUsers}
          isCurrency={false}
        />
        <ReportTile
          name="Total Subscriptions"
          description="Total number of subscriptions"
          value={totalSubscriptions}
          isCurrency={false}
        />
        <ReportTile
          name="Active Subscriptions"
          description="Total number of active subscriptions"
          value={activeSubscriptions}
          isCurrency={false}
        />
        <ReportTile
          name="Total Revenue"
          description="Total revenue generated"
          value={totalRevenue.toFixed(2)}
          isCurrency={true}
        />
      </div>

      <div className="mt-7">
        <h1 className="text-sm font-bold">Recently purchased subscriptions</h1>
        <SubscriptionsTable subscriptions={lastFiveSubscriptions} />
      </div>
    </div>
  );
}

export default Reports;
