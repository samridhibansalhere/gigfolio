"use server";
import { connectToMongoDB } from "@/config/mongodb-connection";
import ReviewModel from "@/models/review-model";
import { getCurrentUserFromMongoDB } from "./users";

connectToMongoDB();

export const createNewReview = async (reviewData: any) => {
  try {
    const loggedInUser = await getCurrentUserFromMongoDB();
    const userId = loggedInUser.data?._id;

    if (!userId) {
      return {
        success: false,
        message: "User ID not found.",
      };
    }

    const newReview = new ReviewModel({
      ...reviewData,
      user: userId, // Set the logged-in user as the review author
    });

    await newReview.save();

    return {
      success: true,
      message: "Review created successfully.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const editReview = async (reviewId: string, reviewData: any) => {
  try {
    await ReviewModel.findByIdAndUpdate(reviewId, reviewData);
    return {
      success: true,
      message: "Review updated successfully.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const deleteReview = async (reviewId: string) => {
  try {
    await ReviewModel.findByIdAndDelete(reviewId);
    return {
      success: true,
      message: "Review deleted successfully.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const fetchReviews = async (taskId: string) => {
  try {
    const reviews = await ReviewModel.find({ task: taskId }).populate('user', 'name');
    return {
      success: true,
      data: JSON.parse(JSON.stringify(reviews)),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};
