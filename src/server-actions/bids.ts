"use server";

import { connectToMongoDB } from "@/config/mongodb-connection";
import BidModel from "@/models/bid-model";
import { getCurrentUserFromMongoDB } from "./users";
import { revalidatePath } from "next/cache";
import TaskModel from "@/models/task-model";
import { sendEmail } from "./mails";
import { BidType, TaskType, UserType } from "@/interfaces";
import { getDateFormat } from "@/helpers/date-time-formats";
import AllotedTaskModel from "@/models/allotedtask-model";

connectToMongoDB();

export const placeBid = async (bidData: any) => {
  try {
    await BidModel.create(bidData);
    await TaskModel.findByIdAndUpdate(bidData.task, {
      $inc: { bidsReceived: 1 },
    });

    revalidatePath("/profile/bids");
    return {
      message: "Bid placed successfully",
      success: true,
    };
  } catch (error: any) {
    return {
      message: error.message,
      success: false,
    };
  }
};

export const getBidsPlacedByLoggedInUser = async () => {
  try {
    const loggedInUserResponse = await getCurrentUserFromMongoDB();
    const bids = await BidModel.find({
      freelancer: loggedInUserResponse.data._id,
    })
      .populate("task")
      .populate("client")
      .sort({ createdAt: -1 });
    return {
      data: JSON.parse(JSON.stringify(bids)),
      success: true,
    };
  } catch (error: any) {
    return {
      message: error.message,
      success: false,
    };
  }
};

export const getBidsByTaskId = async (taskId: string) => {
  try {
    const bids = await BidModel.find({ task: taskId })
      .populate("freelancer")
      .sort({ createdAt: -1 });
    return {
      data: JSON.parse(JSON.stringify(bids)),
      success: true,
    };
  } catch (error: any) {
    return {
      message: error.message,
      success: false,
    };
  }
};

export const deleteBid = async (bidId: string) => {
  try {
    // Find the bid to get the task it belongs to
    const bid = await BidModel.findById(bidId);
    if (!bid) {
      return { success: false, message: "Bid not found" };
    }

    // Delete the bid
    await BidModel.findByIdAndDelete(bidId);

    // Decrease the bidsReceived count in TaskModel
    await TaskModel.findByIdAndUpdate(bid.task, {
      $inc: { bidsReceived: -1 },
    });

    // Revalidate the bids path to ensure fresh data is fetched
    revalidatePath("/profile/bids");

    return {
      success: true,
      message: "Bid deleted successfully",
    };
  } catch (error: any) {
    return {
      message: error.message,
      success: false,
    };
  }
};
export const checkIfAlreadyBid = async (taskId: string, freelancerId: string) => {
  try {
    const existingBid = await BidModel.findOne({
      task: taskId,
      freelancer: freelancerId,
    });

    return { alreadyBid: !!existingBid }; // Return true if a bid exists
  } catch (error) {
    console.error("Error checking bid:", error);
    throw new Error("Error checking existing bid");
  }
};

export const canEditBid = async (bid: BidType) => {
  try {
    // Get the task by ID
    const task = await TaskModel.findById(bid.task);

    // Check if the task exists
    if (!task) {
      return { canEdit: false, message: "The task associated with this bid does not exist." };
    }

    // Check if lastDateToPlaceBid is defined and if it is in the past
    if (task.lastDateToPlaceBid && task.lastDateToPlaceBid < getDateFormat(new Date().toISOString())) {
      return { canEdit: false, message: "The bid cannot be edited as the task's bidding deadline has passed." };
    }

    // Check if the task is allotted to someone
    const allottedTask = await AllotedTaskModel.findOne({
      task: bid.task,
      receiver: bid.freelancer,
    });

    if (allottedTask) {
      return { canEdit: false, message: "The bid cannot be edited as the task has been allotted." };
    }

    return { canEdit: true }; // Return true if both conditions pass
  } catch (error) {
    console.error("Error checking bid conditions:", error);
    throw new Error("Error checking bid conditions");
  }
};

export const updateBid = async (updatedBidData: any) => {
  try {
    // Find the bid by its ID
    const bid = await BidModel.findById(updatedBidData._id);

    // If the bid is not found, return an error message
    if (!bid) {
      return {
        success: false,
        message: "Bid not found.",
      };
    }

    // Update the bid fields with the new values
    bid.bidAmount = updatedBidData.bidAmount;
    bid.estimatedDays = updatedBidData.estimatedDays;
    bid.message = updatedBidData.message;

    // Save the updated bid
    await bid.save();

    // Optionally, revalidate the page displaying bids to reflect changes
    revalidatePath("/profile/bids");

    return {
      success: true,
      message: "Bid updated successfully.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getBidByTaskClientAndFreelancer = async (task: TaskType, client: UserType | null, freelancer: UserType| null) => {
  try {
    console.log('Fetching bid for task:', task, 'client:', client, 'freelancer:', freelancer);

    const bid = await BidModel.findOne({
      task: task,
      client: client,
      freelancer: freelancer,
    }).select('estimatedDays bidAmount').lean();

    console.log('Bid found:', bid);

    if (!bid) {
      return { success: false, message: 'No bid found for this task, client, and freelancer.' };
    }

    const bidData = {
      estimatedDays: bid.estimatedDays,
      bidAmount: bid.bidAmount,
    };

    console.log('Returning bid data:', bidData);
    
    return {
      success: true,
      data: bidData,
    };
  } catch (error: any) {
    console.error('Error fetching bid:', error);
    return { success: false, message: error.message };
  }
};
