import React from "react";
import { NotificationType } from "@/interfaces";
import { useRouter } from "next/navigation";
import { Button } from "antd";

function UserNotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: NotificationType;
  onMarkAsRead?: (id: string) => void; // Make onMarkAsRead optional
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const isUnseen = !notification.read; // Determine if the notification is unseen

  return (
    <div className="p-5 bg-gray-100 border border-gray-200 flex justify-between items-center">
      <div
        className="cursor-pointer"
        onClick={() => router.push(notification.onClickPath)}
      >
        <span className="font-semibold">{notification.text}</span>
        <span className="text-xs text-gray-500">
          {new Date(notification.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="flex gap-2">
        {isUnseen && onMarkAsRead ? (
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

export default UserNotificationItem;
