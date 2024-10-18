"use client";
import React, { useEffect, useState } from "react";
import { createNewReview, editReview } from "@/server-actions/reviews";
import { Modal, Form, Input, Rate, Button, message } from "antd";
import { ReviewType } from "@/interfaces";

interface ReviewModalProps {
  taskId: string;
  visible: boolean;
  onClose: () => void;
  existingReview: ReviewType | null;
  currentUser: any;
  onReviewChange: () => void;
}

const ReviewModal = ({
  taskId,
  visible,
  onClose,
  existingReview,
  currentUser,
  onReviewChange
}: ReviewModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingReview) {
      form.setFieldsValue({
        review: existingReview.review,
        rating: existingReview.rating,
      });
    } else {
      form.resetFields(); // Reset form when adding a new review
    }
  }, [existingReview, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (existingReview) {
        const response = await editReview(existingReview._id, {
          review: values.review,
          rating: values.rating
        });
        if (response.success) {
          message.success("Review updated successfully!");
          onReviewChange();
        } else {
          message.error("Failed to update review.");
        }
      } else {
        const response = await createNewReview({
          task: taskId,
          review: values.review,
          rating: values.rating
        });
        if (response.success) {
          message.success("Review added successfully!");
          onReviewChange();
        } else {
          message.error("Failed to add review.");
        }
      }
    } catch (error) {
      message.error("An error occurred while submitting the review.");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal
      open={visible}
      title={existingReview ? "Edit Review" : "Add Review"}
      centered
      closable
      onCancel={onClose}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="review"
          label="Review"
          rules={[{ required: true, message: "Please input your review!" }]}
        >
          <Input.TextArea placeholder="Write your review..." />
        </Form.Item>

        <Form.Item
          name="rating"
          label="Rating"
          rules={[{ required: true, message: "Please rate the task!" }]}
        >
          <Rate />
        </Form.Item>

        <div className="flex justify-end gap-4">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {existingReview ? "Update Review" : "Submit Review"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ReviewModal;
