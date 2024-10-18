import React from "react";
import { NotificationType } from "@/interfaces";
import { Button } from "antd"; // Import Button from antd if you're using it

function AdminNotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: NotificationType;
  onMarkAsRead: (id: string) => void; // Function to mark as read
  onDelete: (id: string) => void; // Function to delete notification
}) {
  const isUnseen = !notification.read; // Determine if the notification is unseen

  return (
    <div className="p-5 bg-gray-100 border border-gray-200 flex justify-between items-center">
      <div>
        <span className="font-semibold">{notification.text}</span>
        <span className="text-xs text-gray-500">
          {new Date(notification.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="flex gap-2">
        {isUnseen ? (
          <Button onClick={() => onMarkAsRead(notification._id)} type="primary" size="small">
            Mark as Read
          </Button>
        ) : (
          <Button onClick={() => onDelete(notification._id)} type="primary" size="small">
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default AdminNotificationItem;
