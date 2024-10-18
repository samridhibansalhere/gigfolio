"use client";
import React, { useEffect, useState } from "react";
import { fetchReviews, deleteReview } from "@/server-actions/reviews";
import ReviewModal from "./review-modal";
import { ReviewType } from "@/interfaces";
import PageTitle from "@/components/page-title";
import { Rate, Button, message } from "antd";
import { getDateTimeFormat } from "@/helpers/date-time-formats"; // Assuming this helper function exists
import Loading from "../loading";

const Reviews = ({ taskId, currentUser, taskOwnerId }: { taskId: string; currentUser: any; taskOwnerId: string }) => {
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [existingReview, setExistingReview] = useState<ReviewType | null>(null);

  useEffect(() => {
    const fetchReviewsData = async () => {
      const response = await fetchReviews(taskId);
      if (response.success) {
        setReviews(response.data || []);
      } else {
        setError("Failed to load reviews");
      }
      setLoading(false);
    };

    fetchReviewsData();
  }, [taskId]);

  const handleDeleteReview = async (reviewId: string) => {
    const response = await deleteReview(reviewId);
    if (response.success) {
      setReviews(reviews.filter(review => review._id !== reviewId));
      message.success("Review deleted successfully!");
    } else {
      message.error("Failed to delete review.");
    }
  };

  const handleEditReview = (review: ReviewType) => {
    setExistingReview(review);
    setModalVisible(true);
  };

  const handleReviewChange = async () => {
    const response = await fetchReviews(taskId);
    if (response.success) {
      setReviews(response.data || []);
    }
    setModalVisible(false);
  };

  // Check if the user can add a review
  const isApprovedUser = currentUser?.isAdmin || currentUser?.isApproved;
  const canAddReview = isApprovedUser && currentUser._id !== taskOwnerId;
  
  return (
    <div className="reviews-container p-4">
      <PageTitle title="Reviews" />
      <div className="flex justify-between mt-4">
        <div />
        {canAddReview ? (
          <Button
            type="primary"
            onClick={() => {
              setExistingReview(null);
              setModalVisible(true);
            }}
          >
            Add Review
          </Button>
        ) : (
          <span className="text-gray-500">
            {currentUser._id === taskOwnerId
              ? "You cannot add a review to your own task."
              : "You can only add a review if you are approved."}
          </span>
        )}
      </div>

      {loading && <Loading />}
      {error && <p className="text-red-500">{error}</p>}
      {reviews.length === 0 ? (
        <p>No reviews available.</p>
      ) : (
        reviews.map(review => (
          <div key={review._id} className="review-item my-4 p-4 bg-white shadow-md rounded border border-gray-300 flex justify-between items-center">
            <div className="flex flex-col flex-grow">
              <div className="flex items-center gap-5">
                <span className="text-gray-700 font-medium text-sm">
                  By {review.user.name} on {getDateTimeFormat(review.createdAt)}
                </span>
                <Rate disabled value={review.rating} />
              </div>
              <div className="mt-2">
                <span className="review-text text-gray-600">{review.review}</span>
              </div>
            </div>
            {currentUser?._id === review.user._id && (
              <div className="flex flex-row gap-3">
                <Button
                  onClick={() => handleEditReview(review)}
                  size="small"
                  type="primary"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeleteReview(review._id)}
                  size="small"
                  type="default"
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))
      )}
      <ReviewModal
        visible={isModalVisible}
        onClose={() => { setModalVisible(false); setExistingReview(null); }}
        taskId={taskId}
        existingReview={existingReview}
        currentUser={currentUser}
        onReviewChange={handleReviewChange}
      />
    </div>
  );
};

export default Reviews;
