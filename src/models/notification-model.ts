import mongoose from "mongoose";

// Define the Notification schema
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Ensure this matches the exact name of the User model in your database
      required: true, // This can be the recipient
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Ensure this matches the exact name of the User model
      required: true, // Ensure sender is always provided
    },
    type: {
      type: String,
      required: true,
      // Optionally, define an enum if you have specific types of notifications
      // enum: ["info", "warning", "error"], // Example types
    },
    text: {
      type: String,
      required: true,
    },
    onClickPath: {
      type: String,
      required: false,
      default: "",
    },
    read: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);
// Check and delete the existing model if it already exists
if (mongoose.models && mongoose.models.notifications) {
  delete mongoose.models.notifications;
}

// Create and export the Notification model
const NotificationModel = mongoose.model("notifications", notificationSchema);

export default NotificationModel;
