"use server";
import mongoose from "mongoose";
import NotificationModel from "@/models/notification-model";
import { getCurrentUserFromMongoDB } from "./users";
import { NotificationType } from "@/interfaces"; 

// Helper to convert ObjectId fields to strings
const convertObjectIdToString = (notification: any) => {
  notification._id = notification._id.toString();
  notification.user = notification.user.toString();
  notification.sender = notification.sender.toString();
  return notification;
};

// Function to add a new notification
export const addNewNotificationtoAdmin = async (payload: any) => {
  try {
    const user = await getCurrentUserFromMongoDB();
    if (!user.data) throw new Error("User not found");

    // Ensure that the sender is stored as ObjectId
    const notificationPayload = {
      ...payload,
      sender: new mongoose.Types.ObjectId(user.data._id), // Ensure sender is ObjectId
    };

    const result = await NotificationModel.create(notificationPayload);

    // Convert ObjectIds to strings for the client
    const plainResult = result.toObject();
    convertObjectIdToString(plainResult);

    return {
      success: true,
      message: "Notification added successfully",
      notification: plainResult,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to create notification",
    };
  }
};
export const addNewNotificationtoUser = async (payload: any) => {
  try {
    const user = await getCurrentUserFromMongoDB();
    if (!user.data) throw new Error("User not found");

    // Ensure that the sender is stored as ObjectId
    const notificationPayload = {
      ...payload,
      sender: new mongoose.Types.ObjectId(user.data._id), // Ensure sender is ObjectId
      text: payload.message, // Set text to the message passed in the payload
      type: payload.type || 'general' // Set type to 'general' or whatever logic you need
    };

    const result = await NotificationModel.create(notificationPayload);

    // Convert ObjectIds to strings for the client
    const plainResult = result.toObject();
    convertObjectIdToString(plainResult);

    return {
      success: true,
      message: "Notification added successfully",
      notification: plainResult,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to create notification",
    };
  }
};
// Function to get notifications for the admin
export const getNotificationsOfAdmin = async () => {
  try {
    const user = await getCurrentUserFromMongoDB();
    const userId = new mongoose.Types.ObjectId(user.data._id);

    const unseen = await NotificationModel.find({
      user: userId,
      read: false,
    })
      .sort({ createdAt: -1 })
      .populate("user", "name email profilePic clerkUserId")
      .populate("sender")
      .lean();

    const seen = await NotificationModel.find({
      user: userId,
      read: true,
    })
      .sort({ createdAt: -1 })
      .populate("user", "name email profilePic clerkUserId")
      .populate("sender")
      .lean();

    // Transform unseen notifications
    const formattedUnseen = unseen.map(notification => ({
      _id: notification._id.toString(),
      user: {
        _id: notification.user._id.toString(),
      },
      sender: {
        _id: notification.sender._id.toString(),
      },
      type: notification.type,
      text: notification.text,
      onClickPath: notification.onClickPath,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(), // Convert to string
      updatedAt: notification.updatedAt.toISOString(), // Convert to string
    }));

    // Transform seen notifications
    const formattedSeen = seen.map(notification => ({
      _id: notification._id.toString(),
      user: {
        _id: notification.user._id.toString(),
      },
      sender: {
        _id: notification.sender._id.toString(),
      },
      type: notification.type,
      text: notification.text,
      onClickPath: notification.onClickPath,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(), // Convert to string
      updatedAt: notification.updatedAt.toISOString(), // Convert to string
    }));

    console.log("Unseen Notifications:", formattedUnseen);
    console.log("Seen Notifications:", formattedSeen);

    return {
      success: true,
      data: {
        unseen: formattedUnseen,
        seen: formattedSeen,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch notifications",
    };
  }
};
// Function to get notifications where the logged-in user is the recipient
export const getNotificationsOfCurrentUser = async () => {
  try {
    const user = await getCurrentUserFromMongoDB();
    if (!user.data) throw new Error("User not found");

    const userId = new mongoose.Types.ObjectId(user.data._id);

    // Fetch unseen notifications where the current user is the recipient
    const unseen = await NotificationModel.find({
      user: userId,
      read: false,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name email profilePic clerkUserId") // Populate sender field with selected properties
      .lean();

    // Fetch seen notifications where the current user is the recipient
    const seen = await NotificationModel.find({
      user: userId,
      read: true,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name email profilePic clerkUserId") // Populate sender field with selected properties
      .lean();

    // Transform unseen notifications
    const formattedUnseen = unseen.map((notification) => ({
      _id: notification._id.toString(),
      sender: {
        _id: notification.sender._id.toString(),
      },
      type: notification.type,
      text: notification.text,
      onClickPath: notification.onClickPath,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(), // Convert to string
      updatedAt: notification.updatedAt.toISOString(), // Convert to string
    }));

    // Transform seen notifications
    const formattedSeen = seen.map((notification) => ({
      _id: notification._id.toString(),
      sender: {
        _id: notification.sender._id.toString(),
      },
      type: notification.type,
      text: notification.text,
      onClickPath: notification.onClickPath,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(), // Convert to string
      updatedAt: notification.updatedAt.toISOString(), // Convert to string
    }));

    console.log("Unseen Notifications:", formattedUnseen);
    console.log("Seen Notifications:", formattedSeen);

    return {
      success: true,
      data: {
        unseen: formattedUnseen,
        seen: formattedSeen,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch notifications",
    };
  }
};
export const markAllAsRead = async () => {
  try {
    const user = await getCurrentUserFromMongoDB();
    if (!user.data) throw new Error("User not found");

    await NotificationModel.updateMany(
      { user: new mongoose.Types.ObjectId(user.data._id), read: false },
      { $set: { read: true } }
    );

    return {
      success: true,
      message: "All notifications marked as read successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const deleteAllNotifications = async () => {
  try {
    const user = await getCurrentUserFromMongoDB();
    if (!user.data) throw new Error("User not found");

    await NotificationModel.deleteMany({ user: new mongoose.Types.ObjectId(user.data._id) });

    return {
      success: true,
      message: "All notifications deleted successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// This function retrieves the count of unread notifications for a specific user
export const getUnreadNotificationsCount = async (userId: string) => {
  try {
    const unreadCount = await NotificationModel.countDocuments({
      user: new mongoose.Types.ObjectId(userId), // Filter by user field (not userId)
      read: false, // Only count notifications that haven't been read
    });
    return unreadCount;
  } catch (error: any) {
    console.error("Error fetching unread notifications count:", error.message);
    return 0; // Return 0 if an error occurs
  }
};



// Function to mark a notification as read
export const markAsRead = async (notificationId: string) => {
  try {
    const user = await getCurrentUserFromMongoDB();
    if (!user.data) throw new Error("User not found");

    // Mark notification as read using ObjectId
    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId), // Convert to ObjectId
        user: new mongoose.Types.ObjectId(user.data._id),
      },
      { read: true },
      { new: true }
    )
    .populate("user"); // Populate user field

    if (!notification) throw new Error("Notification not found or does not belong to the user");

    // Convert notification and related fields to strings for the client
    const plainNotification = notification.toObject();
    convertObjectIdToString(plainNotification);

    return {
      success: true,
      data: plainNotification,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// Function to delete a notification
export const deleteNotification = async (notificationId: string) => {
  try {
    const user = await getCurrentUserFromMongoDB();
    if (!user.data) throw new Error("User not found");

    // Delete the notification using ObjectId
    const notification = await NotificationModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(notificationId), // Convert to ObjectId
      user: new mongoose.Types.ObjectId(user.data._id),
    });

    if (!notification) throw new Error("Notification not found or does not belong to the user");

    return {
      success: true,
      message: "Notification deleted successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

