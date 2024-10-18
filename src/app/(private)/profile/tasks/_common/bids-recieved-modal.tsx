import { BidType, TaskType } from "@/interfaces";
import { getBidsByTaskId } from "@/server-actions/bids";
import { Modal, message, InputNumber } from "antd";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDateTimeFormat } from "@/helpers/date-time-formats";

function BidsReceivedModal({
  task,
  showBidsReceivedModal,
  setShowBidsReceivedModal,
}: {
  task: TaskType;
  showBidsReceivedModal: boolean;
  setShowBidsReceivedModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const [bids = [], setBids] = useState<BidType[]>([]);
  const [costFilter, setCostFilter] = useState<number | null>(null);
  const [daysFilter, setDaysFilter] = useState<number | null>(null);

  const getBids = async () => {
    try {
      const response = await getBidsByTaskId(task._id);
      if (response.success) {
        setBids(response.data);
      } else {
        message.error("Failed to get bids");
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  useEffect(() => {
    getBids();
  }, []);

  // Filtering the bids based on cost and days filter
  const filteredBids = bids.filter((bid) => {
    const meetsCostCriteria = costFilter ? bid.bidAmount <= costFilter : true;
    const meetsDaysCriteria = daysFilter ? bid.estimatedDays <= daysFilter : true;
    return meetsCostCriteria && meetsDaysCriteria;
  });

  const getProperty = ({ name, value }: { name: string; value: any }) => {
    return (
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs">{name}</span>
        <span className="text-gray-700 font-semibold text-sm">{value}</span>
      </div>
    );
  };

  return (
    <Modal
      title="BIDS RECEIVED"
      open={showBidsReceivedModal}
      onCancel={() => setShowBidsReceivedModal(false)}
      footer={null}
      width={800}
    >
      <hr className="my-5 border border-gray-300 border-solid" />

      <h1 className="text-lg text-info">Bids Received: {bids.length}</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3 mt-5 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2">
          <span>Max Bid Amount:</span>
          <InputNumber
            min={0}
            value={costFilter}
            onChange={(value) => setCostFilter(value)}
            placeholder="Filter by cost"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>Max Estimated Days:</span>
          <InputNumber
            min={0}
            value={daysFilter}
            onChange={(value) => setDaysFilter(value)}
            placeholder="Filter by days"
          />
        </div>
      </div>

      {/* Filtered Bids */}
      <div className="flex flex-col gap-7 mt-5 lg:h-96 overflow-y-auto px-2">
        {filteredBids.map((bid) => (
          <div
            key={bid._id}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-3 bg-gray-100 gap-4 border border-gray-200 border-solid"
          >
            {getProperty({ name: "Freelancer", value: bid.freelancer.name })}
            {getProperty({ name: "Bid Amount", value: bid.bidAmount })}
            {getProperty({ name: "Estimated Days", value: bid.estimatedDays })}
            {getProperty({
              name: "Bid Placed On",
              value: getDateTimeFormat(bid.createdAt),
            })}
            {getProperty({ name: "Message", value: bid.message })}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end">
              <span
                className="text-blue-700 underline cursor-pointer"
                onClick={() => router.push(`/task/${task._id}/user-info/${bid.freelancer._id}`)}
              >
                View Freelancer Profile
              </span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default BidsReceivedModal;
