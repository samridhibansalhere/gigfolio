"use client";
import { UserType } from "@/interfaces";
import { UpdateUserRole, ApproveUser, getAdminUserId } from "@/server-actions/users"; 
import { Table, Input, Button, message, Badge } from "antd";
import dayjs from "dayjs";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { countUnreadMessages } from "@/server-actions/chats";

function UsersTable({ users }: { users: UserType[] }) {
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>(users);
  const router = useRouter(); 
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({})
  // Effect to filter users based on search value
  useEffect(() => {
    if (!searchValue) {
      setFilteredUsers(users); // Reset to all users if search is empty
    } else {
      const lowerSearchValue = searchValue.toLowerCase();
      const filtered = users.filter((user) =>
        user.name.toLowerCase().includes(lowerSearchValue)
      );
      setFilteredUsers(filtered);
    }
  }, [searchValue, users]);
  
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      setLoading(true);
      try {
        const counts: { [key: string]: number } = {};
        for (const user of users) {
          counts[user._id] = await countUnreadMessages(user); // Count unread messages for each user
        }
        setUnreadCounts(counts); // Set unread counts in state
      } catch (error) {
        console.error("Error fetching unread message counts:", error);
        message.error("Failed to fetch unread message counts.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUnreadCounts();
  }, [users]);

  // Fetch the admin user ID
  const fetchAdminId = async () => {
    try {
      const adminId = await getAdminUserId();
      if (!adminId) {
        throw new Error("No admin ID found.");
      }
      return adminId;
    } catch (error) {
      console.error("Error fetching admin ID:", error);
      message.error("Failed to retrieve admin ID.");
      return null;
    }
  };

  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      const adminId = await fetchAdminId(); // Fetch the admin ID
      if (!adminId) return; // Abort if admin ID is not found

      const response = await ApproveUser(userId, currentStatus, adminId); // Pass the admin ID

      if (response.success) {
        message.success("User status updated successfully.");
        setFilteredUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, isApproved: !currentStatus } : user
          )
        );
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error("Error while updating status:", error);
      message.error("An error occurred while updating the user status.");
    } finally {
      setLoading(false);
    }
  };

  const onRoleChange = async (userId: string, isAdmin: boolean) => {
    try {
      setLoading(true);
      const adminId = await fetchAdminId(); // Fetch the admin ID
      if (!adminId) return; // Abort if admin ID is not found

      const response = await UpdateUserRole(userId, isAdmin, adminId); // Pass the admin ID

      if (response.success) {
        message.success("User role updated successfully.");
        setFilteredUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, isAdmin: !isAdmin } : user
          )
        );
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error("Error while updating role:", error);
      message.error("An error occurred while updating the user role.");
    } finally {
      setLoading(false);
    }
  };
  // Function to navigate to user's subscription page
  const handleSubscriptionClick = (userId: string) => {
    router.push(`/admin/users/subscriptions/${userId}`);
  };
  const handleChatClick = (user: UserType) => {
    // Navigate to the chat page
    router.push(`/admin/users/chat/${user._id}`);
  }
  const columns = [
    {
      title: "Profile Pic",
      dataIndex: "profilePic",
      render: (profilePic: string) => <img src={profilePic} alt="Profile" width={50} />,
      key: "profilePic",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "User Id",
      dataIndex: "_id",
      key: "_id",
      render: (id: string) => <span>{id}</span>, // Treating _id as a string
    },
    {
      title: "Joined At",
      dataIndex: "createdAt",
      render: (value: string) => dayjs(value).format("MMM DD, YYYY hh:mm A"),
      key: "createdAt",
    },
    {
      title: "Status",
      dataIndex: "isApproved",
      render: (isApproved: boolean, user: UserType) => (
        <select
          className="border border-gray-300 py-3 px-7"
          onChange={(e) => handleStatusChange(user._id, e.target.value === "approved")}
        >
          <option value="approved" selected={isApproved}>
            Approved
          </option>
          <option value="unapproved" selected={!isApproved}>
            Unapproved
          </option>
        </select>
      ),
    },
    {
      title: "Role",
      dataIndex: "isAdmin",
      render: (isAdmin: boolean, user: UserType) => (
        <select
          className="border border-gray-300 py-3 px-7"
          onChange={(e) => onRoleChange(user._id, e.target.value === "admin")}
        >
          <option value="admin" selected={isAdmin}>
            Admin
          </option>
          <option value="user" selected={!isAdmin}>
            User
          </option>
        </select>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: UserType) => (
        !record.isAdmin && (
          <Button type="primary" size="small" onClick={() => handleSubscriptionClick(record._id)}>
            Subscriptions
          </Button>
        )
      ),
    },
    {
      title: "Support",
      dataIndex: "support",
      render: (_: any, record: UserType) => (
        !record.isAdmin && (
          
          <Button type="primary" size="small" onClick={() => handleChatClick(record)}> 
          <Badge count={unreadCounts[record._id] || 0}/>
          User Queries
          </Button>
        )
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center mb-4">
        <Input 
          className="search-input"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search by username"
        />
      </div>
      <Table dataSource={filteredUsers} columns={columns} loading={loading} />
    </div>
  );
}

export default UsersTable;
