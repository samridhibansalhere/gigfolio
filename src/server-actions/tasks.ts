"use server";
import { connectToMongoDB } from "@/config/mongodb-connection";
import TaskModel from "@/models/task-model";
import { findUserById, getCurrentUserFromMongoDB, getUserSubscription } from "./users";
import { revalidatePath } from "next/cache";
import dayjs from "dayjs"; 
connectToMongoDB();

export const createNewTask = async (taskData: any) => {
  try {
    // Get the logged-in user from the database
    const loggedInUser = await getCurrentUserFromMongoDB();
    const userId = loggedInUser.data?._id;

    // Check if userId is valid
    if (!userId) {
      return {
        success: false,
        message: "User ID not found.",
      };
    }

    // Fetch the user's subscription
    const subscriptionResponse = await getUserSubscription(userId);
    if (!subscriptionResponse.success) {
      return {
        success: false,
        message: subscriptionResponse.message,
      };
    }

    // Proceed to check task limit with subscription data
    const taskLimitCheck = await checkTaskLimit(userId, subscriptionResponse.data);
    if (!taskLimitCheck.canAddTask) {
      return {
        success: false,
        message: taskLimitCheck.error,
      };
    }

    // Proceed to create the task
    const newTask = new TaskModel({
      ...taskData,
      user: userId, // Ensure user ID is set correctly
    });

    await newTask.save();
    revalidatePath("/profile/tasks");

    return {
      success: true,
      message: "Task created successfully.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const editTask = async ({
  taskId,
  taskData,
}: {
  taskId: string;
  taskData: any;
}) => {
  try {
    await TaskModel.findByIdAndUpdate(taskId, taskData);
    revalidatePath("/profile/tasks"); // Ensure this refreshes the task list
    return {
      success: true,
      message: "Task updated successfully.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    await TaskModel.findByIdAndDelete(taskId);
    revalidatePath("/profile/tasks");
    return {
      success: true,
      message: "Task deleted successfully.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getTasksPostedByLoggedInUser = async () => {
  try {
    const loggedInUser = await getCurrentUserFromMongoDB();
    const tasks = await TaskModel.find({ user: loggedInUser.data?._id }).sort({
      createdAt: -1,
    });
    return {
      success: true,
      data: JSON.parse(JSON.stringify(tasks)),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getTaskById = async (taskId: string) => {
  try {
    const task = await TaskModel.findById(taskId).populate("user");
    return {
      success: true,
      data: JSON.parse(JSON.stringify(task)),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};
export const getTasksPostedByUser = async (userId:string) => {
  try {
    const loggedInUser = await findUserById(userId);
    const tasks = await TaskModel.find({ user: loggedInUser.data?._id }).sort({
      createdAt: -1,
    });
    return {
      success: true,
      data: JSON.parse(JSON.stringify(tasks)),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getUserIdFromTask = async (taskId: string) => {
  try {
    // Fetch the task by its ID
    const task = await TaskModel.findById(taskId);

    // Check if the task exists
    if (!task) {
      return {
        success: false,
        message: "Task not found.",
      };
    }

    // Return the user ID associated with the task
    return {
      success: true,
      userId: task.user, // Assuming 'user' is the field storing the user ID in TaskModel
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};
export const getAllTasks = async (query: string) => {
  try {
    const tasks = await TaskModel.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { subTitle: { $regex: query, $options: "i" } },
        { skillsRequired: { $regex: query, $options: "i" } },
      ],
      // Ensuring the tasks are active
      isActive: true,
    })
      .populate({
        path: "user",
        match: { isApproved: true }, // Filter for approved users
      })
      .sort({ createdAt: -1 });

    // Filter out tasks where the user is not approved
    const filteredTasks = tasks.filter(task => task.user !== null);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(filteredTasks)), // Ensure the tasks are properly serialized
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};
// Function to get the number of tasks created in the current month
export const getTasksCountForCurrentMonth = async (userId: string) => {
  const currentMonthStart = dayjs().startOf("month").toDate();
  const currentMonthEnd = dayjs().endOf("month").toDate();

  const taskCount = await TaskModel.countDocuments({
    user: userId,
    createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
  });

  return taskCount;
};

export const checkTaskLimit = async (userId: string, subscriptionData: any) => {
  // Fetch current user data
  const mongoUser = await (await getCurrentUserFromMongoDB()).data;

  // If the user is not found, restrict task creation
  if (!mongoUser) {
    return {
      canAddTask: false,
      error: "User not found.",
    };
  }

  // Fetch current task count for the month
  const tasksCount = await getTasksCountForCurrentMonth(userId);

  // Default task limit for users without any subscription
  const defaultTaskLimit = 3;

  // Initialize maximum tasks based on user's subscription status
  let maxTasks = defaultTaskLimit; // Set default task limit
  // If the user has a subscription, get the corresponding maximum tasks
  if (subscriptionData) {
    console.log(subscriptionData);
    const subscriptionPlan = subscriptionData.plan; // Adjust this according to your subscription structure
    console.log(subscriptionPlan);
    // If the subscription plan is found, update maxTasks
    if (subscriptionPlan) {
      maxTasks = subscriptionPlan.maximumTasks;
    }
  }
  console.log(maxTasks);
  // Check if the user has reached their task limit
  if (tasksCount >= maxTasks) {
    return {
      canAddTask: false,
      error: `You have reached your task limit of ${maxTasks} tasks for this month. Please upgrade your subscription to add more tasks.`,
    };
  }

  // If the user is within their limit
  return {
    canAddTask: true,
  };
};




