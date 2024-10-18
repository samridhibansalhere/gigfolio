"use client";

import { Home, User, AlarmClockCheck, LogOut, List, User2, DollarSign, Bell, BadgeHelp, BadgeHelpIcon } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import useUsersStore, { UsersStoreType } from "@/store/users-store";
import { getUnreadNotificationsCount } from "@/server-actions/notifications"; // Import your server action
import { countUnreadMessagesForUser } from "@/server-actions/chats";

function MenuItems() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { loggedInUserData } = useUsersStore() as UsersStoreType;
  const { signOut } = useAuth();
  const iconSize = 20;
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  // Fetch the unread notifications count on component mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (loggedInUserData?._id) {
        const count = await getUnreadNotificationsCount(loggedInUserData._id);
        setUnreadNotificationsCount(count);
      }
    };
    fetchUnreadCount();
  }, [loggedInUserData]);

  useEffect(() => {
    const fetchUnreadMessagesCount = async () => {
      if (loggedInUserData?._id) {
        const count = await countUnreadMessagesForUser(loggedInUserData); // Fetch unread messages count
        setUnreadMessagesCount(count);
      }
    };
    fetchUnreadMessagesCount();
  }, [loggedInUserData]);

  const userMenuItems: any[] = [
    {
      name: "Home",
      icon: <Home size={iconSize} />,
      onClick: () => router.push("/"),
      isActive: pathname === "/",
    },
    {
      name: "Profile",
      href: "/profile",
      icon: <User size={iconSize} />,
      isActive: pathname === "/profile",
    },
    {
      name: "Bids",
      href: "/profile/bids",
      icon: <List size={iconSize} />,
      isActive: pathname === "/profile/bids",
    },
    {
      name: "Notifications",
      href: "/profile/notifications",
      icon: (
        <div className="relative flex items-center">
          <Bell size={iconSize} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-0 right-0 text-xs font-bold bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center -translate-y-2/4 translate-x-2">
              {unreadNotificationsCount}
            </span>
          )}
        </div>
      ),
      isActive: pathname === "/profile/notifications",
    },
    {
      name: "Tasks",
      href: "/profile/tasks",
      icon: <AlarmClockCheck size={iconSize} />,
      isActive: pathname.includes("/profile/tasks"),
    },
    {
      name: "Help and Support",
      href: "/profile/chats",
      icon: (
        <div className="relative flex items-center">
          <BadgeHelpIcon size={iconSize} />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-0 right-0 text-xs font-bold bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center -translate-y-2/4 translate-x-2">
              {unreadMessagesCount}
            </span>
          )}
        </div>
      ),
      isActive: pathname.includes("/profile/chats"),
    },
    {
      name: "Logout",
      href: "/logout",
      icon: <LogOut size={iconSize} />,
      isActive: pathname === "/logout",
    },
  ];

  const adminMenuItems: any[] = [
    {
      name: "Home",
      icon: <Home size={iconSize} />,
      onClick: () => router.push("/"),
      isActive: pathname === "/",
    },
    {
      name: "Users",
      icon: <User2 size={iconSize} />,
      onClick: () => router.push("/admin/users"),
      isActive: pathname.includes("/admin/users"),
    },
    {
      name: "Notifications",
      icon: (
        <div className="relative flex items-center">
          <Bell size={iconSize} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-0 right-0 text-xs font-bold bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center -translate-y-2/4 translate-x-2">
              {unreadNotificationsCount}
            </span>
          )}
        </div>
      ),
      onClick: () => router.push("/admin/notifications"),
      isActive: pathname.includes("/admin/notifications"),
    },
    {
      name: "Subscriptions",
      icon: <DollarSign size={iconSize} />,
      onClick: () => router.push("/admin/subscriptions"),
      isActive: pathname.includes("/admin/subscriptions"),
    },
    {
      name: "Reports",
      icon: <User2 size={iconSize} />,
      onClick: () => router.push("/admin/reports"),
      isActive: pathname.includes("/admin/reports"),
    },
    {
      name: "Logout",
      href: "/logout",
      icon: <LogOut size={iconSize} />,
      isActive: pathname === "/logout",
    },
  ];

  const menuItemsToShow: any[] = loggedInUserData?.isAdmin ? adminMenuItems : userMenuItems;

  const onLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <div className="w-64 md:bg-primary text-secondary md:h-screen p-5">
<div className="mt-5">
  <h1 className="font-bold text-3xl text-secondary">
    GIG<b className="text-info">FOLIO</b>
  </h1>

  <div className="flex items-center gap-3 mt-3">
    <img
      src={loggedInUserData?.profilePic}
      alt="Profile"
      className="w-9 h-9 rounded-full"
    />
    <span>{loggedInUserData?.name}</span>
  </div>
</div>

      <div className="mt-12 flex flex-col gap-7">
        {menuItemsToShow.map((item, index) => (
          <div
            className={`flex gap-3 items-center text-2xl cursor-pointer p-3 ${
              item.isActive ? "bg-info text-white rounded" : ""
            }`}
            key={item.name}
            onClick={() => {
              if (item.name === "Logout") {
                onLogout();
              } else if (item.onClick) {
                item.onClick();
              } else {
                router.push(item.href);
              }
            }}
          >
            {item.icon}
            <span className="text-sm">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuItems;
