"use client";
import { TaskType } from "@/interfaces";
import { placeBid, checkIfAlreadyBid } from "@/server-actions/bids"; // Import the new server action
import useUsersStore, { UsersStoreType } from "@/store/users-store";
import { Button, Form, Input, Modal, message } from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

function PlaceBid({ task }: { task: TaskType }) {
  const [showPlaceBidModal, setShowPlaceBidModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadyBid, setAlreadyBid] = useState(false); // State to track if the user has already bid
  const { loggedInUserData }: UsersStoreType = useUsersStore() as any;
  const router = useRouter();

  // Check if the logged-in user is the task owner
  const isTaskOwner = loggedInUserData?._id === task.user._id?.toString();

  useEffect(() => {
    const fetchAlreadyBidStatus = async () => {
      try {
        if (loggedInUserData && task) {
          // Call the server action to check if the user has already placed a bid
          const response = await checkIfAlreadyBid(task._id, loggedInUserData?._id);

          setAlreadyBid(response.alreadyBid); // Set the state based on the response
        }
      } catch (error) {
        console.error("Error checking bid:", error);
      }
    };

    // Fetch the bid status when loggedInUserData and task are available
    if (loggedInUserData && task) {
      fetchAlreadyBidStatus();
    }
  }, [loggedInUserData, task]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        task: task._id,
        freelancer: loggedInUserData?._id,
        client: task.user._id || task.user,
        clientEmail: task.user.email,
        taskName: task.title,
        freelancerName: loggedInUserData?.name,
        bidAmount: values.bidAmount,
      };

      const response = await placeBid(payload);

      if (response.success) {
        message.success(response.message);
        router.push("/profile/bids");
        setShowPlaceBidModal(false);
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      console.error("Error placing bid:", error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-center">
        <Button
          type="primary"
          onClick={() => setShowPlaceBidModal(true)}
          disabled={isTaskOwner || alreadyBid} // Disable if the user is the task owner or has already bid
        >
          {alreadyBid
            ? "You have already placed a bid"
            : isTaskOwner
            ? "Task owners cannot bid"
            : "Place Bid"}
        </Button>
      </div>

      {isTaskOwner && (
        <p className="text-red-500 text-center mt-4">
          You cannot place a bid on your own task.
        </p>
      )}

      {alreadyBid && (
        <p className="text-red-500 text-center mt-4">
          You have already placed a bid on this task.
        </p>
      )}

      {showPlaceBidModal && !alreadyBid && !isTaskOwner && (
        <Modal
          open={showPlaceBidModal}
          title="PLACE YOUR BID"
          centered
          closable
          onCancel={() => setShowPlaceBidModal(false)}
          footer={null}
        >
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="bidAmount"
              label="Bid Amount (in $)"
              rules={[{ required: true, message: "Please input your bid amount!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="estimatedDays"
              label="Estimated Days to Complete"
              rules={[{ required: true, message: "Please input your estimated days!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="message"
              label="Message"
              rules={[{ required: true, message: "Please input your message" }]}
            >
              <Input.TextArea />
            </Form.Item>

            <div className="flex justify-end gap-7">
              <Button onClick={() => setShowPlaceBidModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Place Bid
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}

export default PlaceBid;
