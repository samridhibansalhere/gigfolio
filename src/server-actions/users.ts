"use server";

import { connectToMongoDB } from "@/config/mongodb-connection";
import { UserType } from "@/interfaces";
import SubscriptionModel from "@/models/subscription-model";
import UserModel from "@/models/user-model";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { addNewNotificationtoUser } from "./notifications";

connectToMongoDB();

export const searchUsers = async (searchValue: string): Promise<UserType[]> => {
  await connectToMongoDB();

  const users = await UserModel.find({
    name: { $regex: searchValue, $options: "i" }, // 'i' for case-insensitive
  }).sort({ createdAt: -1 });

  console.log("Fetched users:", users);

  const formattedUsers: UserType[] = users.map((user) => ({
    _id: user._id.toString(), // Treat _id as a string
    name: user.name,
    email: user.email,
    bio: user.bio || "",
    portfolio: user.portfolio || "",
    skills: user.skills || [],
    profilePic: user.profilePic,
    isAdmin: user.isAdmin,
    isApproved: user.isApproved,
    createdAt: user.createdAt.toISOString(), // Convert to ISO string
    updatedAt: user.updatedAt.toISOString(), // Convert to ISO string
    clerkUserId: user.clerkUserId || "", // Fallback to empty string if undefined
    currentSubscription: {
      _id: "", // Empty for now; can be filled based on your logic
      plan: "", // Empty for now
      expiryDate: "", // Empty for now
      createdAt: "", // Empty for now
      price: 0, // Default price to 0
      paymentId: "", // Empty for now
    },
    isActive: user.isActive || false, // Default to false if undefined
  }));

  console.log("Formatted users:", formattedUsers);

  return formattedUsers; // Return the array of users
};

export const getCurrentUserFromMongoDB = async () => {
  try {
    const clerkUser = await currentUser();
    const user = await UserModel.findOne({ clerkUserId: clerkUser?.id });
    if (user) {
      return {
        success: true,
        data: JSON.parse(JSON.stringify(user)),
      };
    }
    let name = clerkUser?.username;
    if (!name) {
      name = clerkUser?.firstName + " " + clerkUser?.lastName;
    }
    name = name.replace("null", "");
    
    const newUser = new UserModel({
      name,
      email: clerkUser?.emailAddresses[0]?.emailAddress,
      clerkUserId: clerkUser?.id,
      profilePic: clerkUser?.imageUrl,
    });

    await newUser.save();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newUser)),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateUserInMongoDB = async ({
  userId,
  payload,
}: {
  userId: string;
  payload: any;
}) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(userId, payload, {
      new: true,
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedUser)),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getUserSubscription = async (userId: string) => {
  try {
    const subscription = await SubscriptionModel.findOne({ user: userId }).populate("user");

    if (subscription) {
      return {
        success: true,
        data: JSON.parse(JSON.stringify(subscription)),
      };
    }

    return {
      success: false,
      message: "Subscription not found",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// UpdateUserRole function
export const UpdateUserRole = async (userId: string, isAdmin: boolean, senderId: string) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    user.isAdmin = isAdmin;
    await user.save();

    // Prepare notification payload
    const role = isAdmin ? "Admin" : "User";
    const notificationPayload = {
      user: user._id.toString(), // User receiving the notification
      sender: senderId, // Admin sending the notification
      message: `Your role has been updated to ${role}.`,
      type: 'role-update', // Specify the type for role updates
    };

    // Add the notification
    await addNewNotificationtoUser(notificationPayload);

    revalidatePath("/admin/users");
    
    return {
      success: true,
      message: `User role changing to ${role} and notification sent successfully`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Error while changing user role",
      error: error.message,
    };
  }
};

// ApproveUser function
export const ApproveUser = async (userId: string, currentStatus: boolean, senderId: string) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    user.isApproved = currentStatus;
    await user.save();

    // Prepare notification payload
    const statusMessage = currentStatus ? "approved" : "unapproved";
    const notificationPayload = {
      user: user._id.toString(), // User receiving the notification
      sender: senderId, // Admin sending the notification
      message: `Your account has been ${statusMessage}.`,
      type: 'status-update', // Specify the type for status updates
    };
    
    // Add the notification
    await addNewNotificationtoUser(notificationPayload);

    revalidatePath("/admin/users");
    
    return {
      success: true,
      message: `User ${statusMessage} and notification sent successfully`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error while updating user approval status`,
      error: error.message,
    };
  }
};

export const getAdminUserId = async () => {
  try {
    const admin = await UserModel.findOne({ isAdmin: true }).lean();
    if (!admin) {
      console.error("No admin user found.");
      return null;
    }
    return admin._id.toString(); // Return _id as a string
  } catch (error: any) {
    console.error("Error fetching admin user ID:", error.message);
    return null;
  }
};

export const getAdminUsers = async (): Promise<UserType[]> => {
  try {
    const admins = await UserModel.find({ isAdmin: true }).lean();
    return admins.map((admin) => ({
      _id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      bio: admin.bio || "",
      portfolio: admin.portfolio || "",
      profilePic: admin.profilePic,
      clerkUserId: admin.clerkUserId,
      isAdmin: admin.isAdmin,
      isActive: admin.isActive,
      currentSubscription: null,
      isApproved: admin.isApproved,
      skills: admin.skills || [], 
      createdAt: admin.createdAt.toString(),
      updatedAt: admin.updatedAt.toString(),
    }));
  } catch (error: any) {
    console.error(`Error fetching admin users: ${error.message}`);
    return []; 
  }
};

export const searchAdmins = async (searchValue: string): Promise<UserType[]> => {
  await connectToMongoDB();
  const admins = await UserModel.find({
    isAdmin: true,
    name: { $regex: searchValue, $options: "i" }, 
  }).sort({ createdAt: -1 });

  console.log("Fetched admins:", admins);

  const formattedAdmins: UserType[] = admins.map((admin) => ({
    _id: admin._id.toString(), 
    name: admin.name,
    email: admin.email,
    profilePic: admin.profilePic,
    isAdmin: admin.isAdmin,
    isApproved: admin.isApproved,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
    clerkUserId: admin.clerkUserId || "", 
    currentSubscription: {
      _id: "", 
      plan: "", 
      expiryDate: "",
      createdAt: "",
      price: 0, 
      paymentId: "",
    },
    isActive: admin.isActive || false, 
    skills: admin.skills || [], 
  }));

  console.log("Formatted admins:", formattedAdmins);

  return formattedAdmins; 
};

export const findUserById = async (userId: string): Promise<{ success: boolean; data?: UserType; message?: string }> => {
  try {
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return { success: false, message: "User not found." };
    }
    const userWithDefaults: UserType = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isApproved: user.isApproved ?? false,
      currentSubscription: null,
      skills: user.skills ?? [],
      profilePic: user.profilePic,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      bio: user.bio || "",
      portfolio: user.portfolio||"",
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      clerkUserId: user.clerkUserId || "", 
    };

    return { success: true, data: userWithDefaults };
  } catch (error: any) {
    console.error("Error finding user by ID:", error.message);
    return { success: false, message: error.message };
  }
};

