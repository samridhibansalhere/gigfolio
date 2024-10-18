"use client";
import { getDateTimeFormat } from "@/helpers/date-time-formats";
import { BidType, TaskType, UserType } from "@/interfaces";
import { Table, message, Popconfirm, Button, Modal, Form, Input } from "antd"; // Import Modal and Form components
import { EyeIcon, Trash2, Edit3 } from "lucide-react"; // Import Edit3 icon for edit action
import React, { useState } from "react";
import BidInfoModal from "./bid-info-modal";
import { deleteBid, canEditBid, updateBid } from "@/server-actions/bids";

function LoggedInUserBidsTable({ bids }: { bids: BidType[] }) {
  const [showBidInfoModal, setShowBidInfoModal] = React.useState(false);
  const [selectedBid, setSelectedBid] = React.useState<BidType | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm] = Form.useForm();

  const onDelete = async (bidId: string) => {
    try {
      setLoading(true);
      const response = await deleteBid(bidId);
      if (response.success) {
        message.success("Bid deleted successfully");
        // Optionally, refresh or update the bids state here to reflect the deletion
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async (bid: BidType) => {
    try {
      // Check if the bid can be edited based on the conditions
      const response = await canEditBid(bid);
      if (response.canEdit) {
        setSelectedBid(bid);
        setShowEditModal(true); // Show edit modal if conditions allow
        editForm.setFieldsValue({
          bidAmount: bid.bidAmount,
          estimatedDays: bid.estimatedDays,
          message: bid.message,
        });
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleEditSubmit = async (values: any) => {
    try {
      if (!selectedBid) return;
      setLoading(true);

      const updatedBid = {
        ...selectedBid,
        bidAmount: values.bidAmount,
        estimatedDays: values.estimatedDays,
        message: values.message,
      };

      const response = await updateBid(updatedBid); // Add server action to update the bid

      if (response.success) {
        message.success("Bid updated successfully");
        setShowEditModal(false);
        // Optionally, refresh the bid data
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      message.error("Error updating bid");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Task",
      dataIndex: "task",
      key: "task",
      render: (text: TaskType) => text.title,
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      render: (text: UserType) => text.name,
    },
    {
      title: "Bid Amount",
      dataIndex: "bidAmount",
      key: "bidAmount",
    },
    {
      title: "Estimated Days",
      dataIndex: "estimatedDays",
      key: "estimatedDays",
    },
    {
      title: "Bid Placed On",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => getDateTimeFormat(text),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (text: any, record: BidType) => (
        <div className="flex gap-5">
          <EyeIcon
            className="cursor-pointer text-blue-500"
            size={20}
            onClick={() => {
              setSelectedBid(record);
              setShowBidInfoModal(true);
            }}
          />
          <Edit3
            className="cursor-pointer text-green-500"
            size={20}
            onClick={() => onEdit(record)} 
          />
          <Popconfirm
            title="Are you sure you want to delete this bid?"
            onConfirm={() => onDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Trash2 size={20} className="cursor-pointer text-red-500" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Table
        loading={loading}
        dataSource={bids}
        columns={columns}
        rowKey="_id"
      />

      {showBidInfoModal && selectedBid && (
        <BidInfoModal
          bid={selectedBid}
          showBidInfoModal={showBidInfoModal}
          setShowBidInfoModal={setShowBidInfoModal}
        />
      )}

      {showEditModal && selectedBid && (
        <Modal
          title="Edit Bid"
          visible={showEditModal}
          onCancel={() => setShowEditModal(false)}
          footer={null}
        >
          <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
            <Form.Item
              name="bidAmount"
              label="Bid Amount (in $)"
              rules={[{ required: true, message: "Please input your bid amount!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="estimatedDays"
              label="Estimated Days"
              rules={[{ required: true, message: "Please input estimated days!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="message"
              label="Message"
              rules={[{ required: true, message: "Please input your message!" }]}
            >
              <Input.TextArea />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading}>
              Update Bid
            </Button>
          </Form>
        </Modal>
      )}
    </div>
  );
}

export default LoggedInUserBidsTable;
