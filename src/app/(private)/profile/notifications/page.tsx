"use client";
import React, { useEffect, useState } from "react";
import { Tabs, Button, Row } from "antd";
import UserNotificationItem from "./user-notification-item";
import {
  getNotificationsOfCurrentUser,
  markAsRead,
  deleteNotification,
  markAllAsRead as markAllNotificationsAsRead,
  deleteAllNotifications,
} from "@/server-actions/notifications";
import { NotificationType, UserType } from "@/interfaces";
import Loading from "./loading";
import PageTitle from "@/components/page-title";

function UserNotificationsPage() {
  const [unseen, setUnseen] = useState<NotificationType[]>([]);
  const [seen, setSeen] = useState<NotificationType[]>([]);
  const [activeTabKey, setActiveTabKey] = useState("unseen");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      const notificationsResponse = await getNotificationsOfCurrentUser();
      if (notificationsResponse?.success && notificationsResponse?.data) {
        const unseenNotifications: NotificationType[] = notificationsResponse.data.unseen.map((notification: any) => ({
          _id: notification._id.toString(),
          user: transformUser(notification.user),
          sender: transformUser(notification.sender),
          type: notification.type as string,
          text: notification.text as string,
          onClickPath: notification.onClickPath as string,
          read: notification.read as boolean,
          createdAt: new Date(notification.createdAt).toISOString(),
        }));

        const seenNotifications: NotificationType[] = notificationsResponse.data.seen.map((notification: any) => ({
          _id: notification._id.toString(),
          user: transformUser(notification.user),
          sender: transformUser(notification.sender),
          type: notification.type as string,
          text: notification.text as string,
          onClickPath: notification.onClickPath as string,
          read: notification.read as boolean,
          createdAt: new Date(notification.createdAt).toISOString(),
        }));

        setUnseen(unseenNotifications);
        setSeen(seenNotifications);
      } else {
        setUnseen([]);
        setSeen([]);
      }
      setLoading(false);
    }

    fetchNotifications();
  }, []);

  const transformUser = (user: any): UserType | null => {
    if (!user) return null;
    return {
      _id: user._id ? user._id.toString() : '',
      name: user.name,
      email: user.email,
      clerkUserId: user.clerkUserId,
      profilePic: user.profilePic,
      bio: user.bio,
      portfolio: user.portfolio,
      skills: user.skills,
      isAdmin: user.isAdmin ?? false,
      isApproved: user.isApproved ?? false,
      currentSubscription: user.currentSubscription
        ? {
            _id: user.currentSubscription._id.toString(),
            plan: user.currentSubscription.plan,
            expiryDate: user.currentSubscription.expiryDate,
            createdAt: user.currentSubscription.createdAt,
            price: user.currentSubscription.price ?? 0,
            paymentId: user.currentSubscription.paymentId || "",
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isActive: user.isActive ?? false,
    };
  };

  const transformNotification = (notification: any): NotificationType => {
    return {
      _id: notification._id?.toString() || "",
      user: transformUser(notification.user),
      sender: transformUser(notification.sender),
      type: notification.type || "",
      text: notification.text || "",
      onClickPath: notification.onClickPath || "",
      read: notification.read ?? false,
      createdAt: new Date(notification.createdAt).toISOString(),
    };
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const response = await markAsRead(notificationId);
    if (response.success && response.data) {
      const updatedNotification = transformNotification(response.data);
      setUnseen((prev) => prev.filter((n) => n._id !== notificationId));
      setSeen((prev) => [...prev, updatedNotification]);
      window.location.reload();
    } else {
      console.error("Failed to mark notification as read.", response);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const response = await deleteNotification(notificationId);
    if (response.success) {
      setUnseen((prev) => prev.filter((n) => n._id !== notificationId));
      setSeen((prev) => prev.filter((n) => n._id !== notificationId));
      window.location.reload();
    } else {
      console.error("Failed to delete notification.");
    }
  };

  const handleDeleteAllNotifications = async () => {
    const response = await deleteAllNotifications();
    if (response.success) {
      setUnseen([]);
      setSeen([]);
      window.location.reload();
    } else {
      console.error("Failed to delete all notifications.");
    }
  };

  const handleMarkAllAsRead = async () => {
    const response = await markAllNotificationsAsRead();
    if (response?.success) {
      setSeen((prev) => [...prev, ...unseen]);
      setUnseen([]);
      window.location.reload();
    } else {
      console.error("Failed to mark all notifications as read.");
    }
  };

  return (
    <div>
      <PageTitle title="User Notifications"/>
      {loading?(<Loading/>):(<Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
        <Tabs.TabPane tab="Unseen" key="unseen">
          <Row justify="end">
            <Button type="primary" size="small" onClick={handleMarkAllAsRead}>
              Mark All As Read
            </Button>
          </Row>
          {unseen.length === 0 ? (
            <p>No unseen notifications.</p>
          ) : (
            unseen.map((notification) => (
              <UserNotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteNotification}
              />
            ))
          )}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Seen" key="seen">
          <Row justify="end">
            <Button type="primary" size="small" onClick={handleDeleteAllNotifications}>
              Delete All
            </Button>
          </Row>
          {seen.length === 0 ? (
            <p>No seen notifications.</p>
          ) : (
            seen.map((notification) => (
              <UserNotificationItem
                key={notification._id}
                notification={notification}
                onDelete={handleDeleteNotification}
              />
            ))
          )}
        </Tabs.TabPane>
      </Tabs>)}
    </div>
  );
}

export default UserNotificationsPage;
