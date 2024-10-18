"use server"
import AllotedTaskModel from "@/models/allotedtask-model";
import { connectToMongoDB } from "@/config/mongodb-connection";
import { AllotedTaskType, TaskType, UserType } from "@/interfaces";
import NotificationModel from "@/models/notification-model";
import { uploadImageToFirebase } from "@/helpers/uploads";
import TaskModel from "@/models/task-model";
connectToMongoDB();
export const createNewAllotedTask = async (task: TaskType, client: UserType, freelancer: UserType) => {
  try {
    const newAllotedTask = new AllotedTaskModel({
      sender: client,
      receiver: freelancer,
      task: task,
      isPayed: false,
      isVerified:false,
      attachments: [],
    });

    await newAllotedTask.save();

    // Notify the freelancer about the task assignment
    const notificationPayload = {
      receiver: freelancer._id, // Freelancer's ID
      sender: client._id,       // Client's ID (used as sender in the notification)
      message: `You have been assigned a task by ${client.name} for task ${task.title}.`,
      type: "task_assigned",
    };

    const notificationResponse = await addNewNotificationtoFreelancer(notificationPayload);

    if (!notificationResponse.success) {
      console.error("Notification error:", notificationResponse.message);
      return { success: true, message: "Task assigned but notification failed to send." };
    }

    return { success: true, message: "Task assigned and notification sent successfully." };

  } catch (error: any) {
    console.error("Error assigning task:", error);
    return { success: false, message: error.message };
  }
};
export const addNewNotificationtoFreelancer = async (payload: {
  receiver: string; // Freelancer's user ID
  sender: string;   // Client's user ID
  message: string;  // Notification message
  type: string;     // Type of notification
}) => {
  try {
    // Log the payload for debugging
    console.log("Creating notification with payload:", payload);

    // Create a new notification document
    const newNotification = new NotificationModel({
      user: payload.receiver,  // Freelancer's ID
      sender: payload.sender,  // Client's ID
      text: payload.message,   // Notification message
      type: payload.type,      // Type of notification (e.g., task_assigned)
      onClickPath: "/some-path", // Optionally provide a path to navigate when clicked
    });

    // Save the notification to the database
    await newNotification.save();

    console.log("Notification created successfully:", newNotification);
    return { success: true, message: "Notification created successfully." };
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return { success: false, message: error.message };
  }
};

export const isTaskAlreadyAssigned = async (taskId: string, freelancerId: string) => {
  try {
    const assignedTask = await AllotedTaskModel.findOne({ task: taskId, receiver: freelancerId });
    return { data: { isAssigned: !!assignedTask } };
  } catch (error) {
    console.error("Error checking task assignment:", error);
    return { data: { isAssigned: false } };
  }
};


export const getAssignedTasksForUser = async (user: UserType) => {
  try {
    console.log('Fetching assigned tasks for user:', user.name);
    const allotedTasks = await AllotedTaskModel.find({ receiver: user });
    
    console.log('Assigned tasks found:', allotedTasks);
    
    return { success: true, data: allotedTasks };
  } catch (error) {
    console.error("Error fetching assigned tasks:", error);
    return { success: false, data: [] };
  }
};

export const getCurrentAssignedTaskForUser = async (taskId: string, freelancerId: string) => {
  try {
    const allotedTask = await AllotedTaskModel.findOne({ task: taskId, receiver: freelancerId });
    if (!allotedTask) {
      return { success: false, data: null };
    }
    return { success: true, data: allotedTask };
  } catch (error) {
    console.error("Error fetching assigned task:", error);
    return { success: false, data: null };
  }
};

export const updateTaskAttachments = async (taskId: string, freelancerId: string, attachments: { name: string; url: string }[]) => {
  try {
    const task = await AllotedTaskModel.findOne({ task: taskId, receiver: freelancerId });
    if (!task) {
      return { success: false, message: "Task not found" };
    }

    task.attachments = attachments;
    await task.save();

    return { success: true, message: "Task attachments updated successfully" };
  } catch (error: any) {
    console.error("Error updating task attachments:", error);
    return { success: false, message: error.message };
  }
};

export const getSubmittedTasksForUser = async (user: UserType) => {
  try {
    const submittedTasks = await AllotedTaskModel.find({
      sender: user._id,
      attachments: { $exists: true, $ne: [] } // Ensure attachments array is not empty
    });

    if (submittedTasks) {
      return {
        success: true,
        data: submittedTasks,
      };
    } else {
      return {
        success: false,
        message: "No tasks found for the current user",
      };
    }
  } catch (error) {
    console.error("Error fetching submitted tasks:", error);
    return {
      success: false,
      message: "Error fetching submitted tasks",
    };
  }
};

export const updateTaskStatus = async (taskId: string, statusUpdate: { isActive: boolean }) => {
  try {
    // Update TaskModel first
    const updatedTask = await TaskModel.updateOne(
      { _id: taskId },
      { $set: statusUpdate }
    );

    if (updatedTask.modifiedCount === 0) {
      console.error(`Task with ID ${taskId} not found or status unchanged`);
      return {
        success: false,
        message: "Task status update failed: Task not found or status unchanged.",
      };
    }

    // Update AllotedTaskModel
    const updatedAllotedTask = await AllotedTaskModel.updateOne(
      { task: taskId },
      { $set: { isVerified: true } } // Mark the allotted task as verified
    );

    if (updatedAllotedTask.modifiedCount === 0) {
      console.error(`Alloted task with task ID ${taskId} not found or not verified`);
      return {
        success: false,
        message: "Task verification failed: Alloted task not found or verification unchanged.",
      };
    }

    return {
      success: true,
      message: "Task status and verification updated successfully.",
    };

  } catch (error) {
    console.error("Error updating task status and verification:", error);
    return {
      success: false,
      message: "Error updating task status and verification.",
    };
  }
};
export async function updateTaskPaymentStatus(taskId: string,receiverId:string) {
  console.log("Task ID for payment status update:", taskId); // Log the taskId
  try {
    const result = await AllotedTaskModel.updateOne(
      {task: taskId,
        receiver: receiverId,
      },
      { $set: { isPayed: true } }
    );

    if (result.modifiedCount > 0) {
      return { success: true, message: "Payment status updated." };
    } else {
      return { success: false, message: "No task found or no update made." };
    }
  } catch (error) {
    console.error("Error updating payment status:", error);
    return { success: false, message: "Error updating payment status." };
  }
}

