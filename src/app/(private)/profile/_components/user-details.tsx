import { getDateTimeFormat } from "@/helpers/date-time-formats";
import useUsersStore, { UsersStoreType } from "@/store/users-store";
import React from "react";
import { Button, message } from "antd"; // Importing Ant Design components
import {  addNewNotificationtoAdmin } from "@/server-actions/notifications";
import { getAdminUserId } from "@/server-actions/users";

function UserDetails() {
  const { loggedInUserData }: UsersStoreType =
    useUsersStore() as UsersStoreType;

  if (!loggedInUserData) return null;

  const renderUserProperty = (label: string, value: string | React.ReactNode) => {
    return (
      <div className="flex flex-col">
        <span className="font-bold text-sm">{label}</span>
        <span className="text-sm text-gray-600">{value}</span>
      </div>
    );
  };
  const sendNotificationToAdmin = async () => {
    try {
      // Fetch admin user ID
      const adminUserId = await getAdminUserId();
      console.log("Admin User ID:", adminUserId); // Log the admin ID
  
      if (!adminUserId) {
        message.error("Failed to find the admin.");
        return;
      }
  
      const payload = {
        user: adminUserId, // Admin user ID as recipient
        type: "Approval Request",
        text: `${loggedInUserData.name} has requested admin approval.`,
        onClickPath: "/admin/approval-requests", // Admin's notification click path
      };
  
      console.log("Payload being sent to API:", payload);
  
      const response = await addNewNotificationtoAdmin(payload);
      console.log("Response from addNewNotification:", response); // Log the API response
  
      if (response.success) {
        message.success("Notification sent to the admin for approval.");
      } else {
        console.error("Notification Error:", response.message);
        message.error("Failed to send notification.");
      }
    } catch (error) {
      console.error("Error in sending notification:", error); // Log the error
      message.error("An error occurred while sending the notification.");
    }
  };
  
  
  const status = loggedInUserData?.isApproved ? "Approved" : "Unapproved";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
      {renderUserProperty("ID", loggedInUserData?._id.toString())}
      {renderUserProperty("Name", loggedInUserData?.name)}
      {renderUserProperty("Email", loggedInUserData?.email)}
      {renderUserProperty("Role", loggedInUserData?.isAdmin ? "Admin" : "User")}
      {renderUserProperty("Clerk User Id", loggedInUserData?.clerkUserId)}
      {renderUserProperty(
        "Created At",
        getDateTimeFormat(loggedInUserData?.createdAt)
      )}
      {renderUserProperty(
        "Status",
        status === "Approved" ? (
          "Approved"
        ) : (
          <div className="flex items-center gap-10">
            <span>Unapproved</span>
            <Button type="primary" size="small" onClick={sendNotificationToAdmin}>
              Notify Admin
            </Button>
          </div>
        )
      )}
    </div>
  );
}

export default UserDetails;
