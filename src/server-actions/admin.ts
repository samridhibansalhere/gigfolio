"use server";

import UserModel from "@/models/user-model";
import SubscriptionModel from "@/models/subscription-model";
export const getAllUsers = async () => {
  try {
    const users = await UserModel.find().select("-password");
    return {
      success: true,
      data: JSON.parse(JSON.stringify(users)),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getAllSubscriptions = async () => {
  try {
    const subscriptions = await SubscriptionModel.find()
      .populate("user")
      .sort({ createdAt: -1 });
    return {
      success: true,
      data: JSON.parse(JSON.stringify(subscriptions)),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};


export const getReportsForAdmin = async (searchParams: {
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}) => {
  const { startDate, endDate, searchTerm } = searchParams;

  try {
    // Build filters for subscriptions based on provided search parameters
    const subscriptionFilters: any = {};
    if (startDate) {
      subscriptionFilters.createdAt = { $gte: new Date(startDate) }; // Greater than or equal to startDate
    }
    if (endDate) {
      subscriptionFilters.createdAt = {
        ...subscriptionFilters.createdAt,
        $lte: new Date(endDate), // Less than or equal to endDate
      };
    }

    // Fetch users and subscriptions based on filters
    const [users, subscriptions] = await Promise.all([
      UserModel.find(searchTerm ? { name: { $regex: searchTerm, $options: "i" } } : {}), // Filter users by searchTerm (username)
      SubscriptionModel.find(subscriptionFilters)
        .populate("user")
        .sort({ createdAt: -1 }),
    ]);

    const reportsData = {
      totalUsers: users.length,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(
        (subscription) => subscription.isActive
      ).length,
      totalRevenue: subscriptions.reduce(
        (acc, subscription) => acc + subscription.price,
        0
      ),
      lastFiveSubscriptions: JSON.parse(
        JSON.stringify(subscriptions.slice(0, 5))
      ),
    };

    return {
      success: true,
      data: reportsData,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};
