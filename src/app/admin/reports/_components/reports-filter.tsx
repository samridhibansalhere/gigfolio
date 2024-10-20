"use client";
import { Button } from "antd";
import { FilterX, Search } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

function ReportsFilters({ searchParams }: { searchParams: any }) {
  const [startDate, setStartDate] = React.useState(
    searchParams.startDate || ""
  );
  const [endDate, setEndDate] = React.useState(searchParams.endDate || "");
  const router = useRouter();

  const onGetData = () => {
    const newSearchParamsObject = { ...searchParams, startDate, endDate };
    const newSearchParams = new URLSearchParams(
      newSearchParamsObject
    ).toString();
    router.push(`/admin/reports?${newSearchParams}`);
  };

  const onClear = () => {
    setStartDate("");
    setEndDate("");
    router.push("/admin/reports");
  };

  // Calculate the minimum end date as startDate + 1 day
  const getMinEndDate = (startDate: string) => {
    return dayjs(startDate).add(1, 'day').format("YYYY-MM-DD");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-7 items-end mt-10">
      <div className="flex flex-col gap-1">
        <span className="text-gray-500 text-sm">Start date</span>
        <input
          placeholder="Check-in"
          className="h-14 px-10 w-full bg-gray-200 border-gray-200 border-solid border outline-none"
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            if (dayjs(e.target.value).isAfter(endDate)) {
              setEndDate(e.target.value);
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-gray-500 text-sm">End Date</span>
        <input
          placeholder="Check-out"
          className="h-14 px-10 w-full bg-gray-200 border-gray-200 border-solid border outline-none"
          type="date"
          value={endDate}
          min={startDate ? getMinEndDate(startDate) : undefined} // Ensure end date is after start date + 1 day
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="flex gap-5">
        <Button
          icon={<FilterX size={20} />}
          className="h-14 px-10 flex items-center"
          onClick={onClear}
        >
          Clear
        </Button>
        <Button
          className="h-14 px-10 flex items-center"
          type="primary"
          icon={<Search size={20} />}
          onClick={onGetData}
          disabled={!startDate || !endDate}
        >
          Get Data
        </Button>
      </div>
    </div>
  );
}

export default ReportsFilters;
