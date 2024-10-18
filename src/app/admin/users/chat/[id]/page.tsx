"use client";
import React, { useEffect, useState } from "react";
import { ChatType, UserType } from "@/interfaces";
import {
  deleteChat,
  getChats,
  sendChat,
  editChat,
  markChatAsRead,
} from "@/server-actions/chats";
import {
  findUserById,
  getCurrentUserFromMongoDB,
} from "@/server-actions/users";
import {
  Button,
  Input,
  Dropdown,
  Menu,
  Tooltip,
  message as antdMessage,
  Avatar,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ShareAltOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  WhatsAppOutlined,
  FacebookOutlined,
  TwitterOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";
import { useParams } from "next/navigation";
import PageTitle from "@/components/page-title";
import Loading from "@/app/loading";
import copy from "copy-to-clipboard";

const AdminChat: React.FC = () => {
  const { id: userId } = useParams(); // Get the user ID from URL params
  const [messages, setMessages] = useState<ChatType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatType | null>(null);
  const [user, setUser] = useState<UserType | null>(null); // The user being chatted with

  // Fetch the current admin and selected user
  useEffect(() => {
    const fetchCurrentUserAndUser = async () => {
      setLoading(true);
      try {
        const [adminResponse, userResponse] = await Promise.all([
          getCurrentUserFromMongoDB(),
          findUserById(userId as string),
        ]);

        if (adminResponse.success && userResponse.success) {
          setCurrentUser(adminResponse.data);
          setUser(userResponse.data || null);
        } else {
          antdMessage.error("Failed to fetch user information.");
        }
      } catch (error) {
        console.error("Error fetching admin or user:", error);
        antdMessage.error("Error fetching user information.");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUserAndUser();
  }, [userId]);

  // Fetch messages between the admin and the user
  useEffect(() => {
    const fetchMessages = async () => {
      if (currentUser && user) {
        setLoading(true);
        try {
          const [sentChats, receivedChats] = await Promise.all([
            getChats(`${currentUser._id}-${user._id}`, currentUser._id),
            getChats(`${user._id}-${currentUser._id}`, currentUser._id),
          ]);

          const allMessages = [
            ...sentChats.readChats,
            ...sentChats.unreadChats,
            ...receivedChats.readChats,
            ...receivedChats.unreadChats,
          ].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          setMessages(allMessages);
        } catch (error) {
          console.error("Error fetching messages:", error);
          antdMessage.error("Failed to load messages.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMessages();
  }, [currentUser, user]);

  // Sending and editing messages
  const handleSendMessage = async () => {
    if (newMessage.trim() && currentUser && user) {
      setLoading(true);
      try {
        if (editingMessage) {
          await editChat(editingMessage.conversationId as string, editingMessage.createdAt, newMessage);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.conversationId === editingMessage.conversationId &&
              msg.createdAt === editingMessage.createdAt
                ? { ...msg, message: newMessage }
                : msg
            )
          );
          antdMessage.success("Message edited successfully");
          setEditingMessage(null);
        } else {
          const newChat = await sendChat(
            `${currentUser._id}-${user._id}`,
            currentUser._id,
            user._id,
            newMessage
          );
          setMessages((prev) => [...prev, { ...newChat, sender: currentUser }]);
          antdMessage.success("Message sent successfully");
        }
        setNewMessage("");
      } catch (error) {
        console.error("Error sending or editing message:", error);
        antdMessage.error("Failed to send or edit message.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete message
  const handleDeleteMessage = async (message: ChatType) => {
    setLoading(true);
    try {
      await deleteChat(message.conversationId as string, message.createdAt);
      setMessages((prev) =>
        prev.filter(
          (msg) =>
            !(msg.conversationId === message.conversationId &&
              msg.createdAt === message.createdAt)
        )
      );
      antdMessage.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      antdMessage.error("Failed to delete message.");
    } finally {
      setLoading(false);
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = (message: string) => {
    copy(message);
    antdMessage.success("Message copied to clipboard");
  };

  // Share message
  const handleShareMessage = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    return (
      <Menu>
        <Menu.Item key="whatsapp">
          <a
            href={`https://wa.me/?text=${encodedMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppOutlined /> Share on WhatsApp
          </a>
        </Menu.Item>
        <Menu.Item key="facebook">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?quote=${encodedMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookOutlined /> Share on Facebook
          </a>
        </Menu.Item>
        <Menu.Item key="twitter">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TwitterOutlined /> Share on Twitter
          </a>
        </Menu.Item>
        <Menu.Item key="linkedin">
          <a
            href={`https://www.linkedin.com/shareArticle?summary=${encodedMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkedinOutlined /> Share on LinkedIn
          </a>
        </Menu.Item>
      </Menu>
    );
  };

  const handleEditMessage = (message: ChatType) => {
    setNewMessage(message.message);
    setEditingMessage(message);
  };

  const handleMarkAsRead = async (message: ChatType) => {
    setLoading(true);
    try {
      await markChatAsRead(message.conversationId as string, message.createdAt);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.conversationId === message.conversationId &&
          msg.createdAt === message.createdAt
            ? { ...msg, isRead: true }
            : msg
        )
      );
      antdMessage.success("Message marked as read.");
    } catch (error) {
      console.error("Error marking message as read:", error);
      antdMessage.error("Failed to mark message as read.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !currentUser || !user) {
    return <Loading />;
  }
  return (
    <div>
      <PageTitle title={`Chat with ${user?.name}`} />
  
      {messages.map((msg) => {
        const isSentByCurrentUser = msg.sender._id === currentUser?._id;
        const isMessageUnread = !msg.isRead && !isSentByCurrentUser;
  
        return (
          <div
            key={`${msg.conversationId}-${msg.createdAt}`}
            style={{
              textAlign: isSentByCurrentUser ? "right" : "left",
              marginBottom: "10px",
              padding: "10px",
            }}
          >
            <strong>
              {isSentByCurrentUser ? "Me" : user?.name}
            </strong>
            <p>{msg.message}</p>
  
            {isSentByCurrentUser ? (
              // Sent message controls
              <div>
                <Tooltip title="Edit">
                  <EditOutlined
                    onClick={() => handleEditMessage(msg)}
                    style={{ cursor: "pointer", marginRight: 8 }}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <DeleteOutlined
                    onClick={() => handleDeleteMessage(msg)}
                    style={{ cursor: "pointer", marginRight: 8 }}
                  />
                </Tooltip>
                <Dropdown overlay={handleShareMessage(msg.message)}>
                  <ShareAltOutlined
                    style={{ cursor: "pointer", marginRight: 8 }}
                  />
                </Dropdown>
                <Tooltip title="Copy">
                  <CopyOutlined
                    onClick={() => handleCopyMessage(msg.message)}
                    style={{ cursor: "pointer", marginRight: 8 }}
                  />
                </Tooltip>
                {/* Display Read/Unread Status */}
                {msg.isRead ? (
                  <Tooltip title="Read by receiver">
                    <EyeOutlined style={{ color: "green" }} />
                  </Tooltip>
                ) : (
                  <Tooltip title="Not read by receiver">
                    <EyeInvisibleOutlined style={{ color: "red" }} />
                  </Tooltip>
                )}
              </div>
            ) : (
              // Received message controls
              <div>
                {/* Show Mark as Read button for received unread messages */}
                {isMessageUnread ? (
                  <Tooltip title="Mark as Read">
                    <EyeInvisibleOutlined
                      onClick={() => handleMarkAsRead(msg)}
                      style={{ color: "blue", cursor: "pointer" }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title="Read">
                    <EyeOutlined style={{ color: "green" }} />
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        );
      })}
  
      <Input.TextArea
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        rows={3}
        placeholder="Type a message"
        style={{ marginTop: "20px" }}
      />
      <Button
        type="primary"
        onClick={handleSendMessage}
        style={{ marginTop: "10px" }}
      >
        {editingMessage ? "Edit" : "Send"}
      </Button>
    </div>
  );
  
};

export default AdminChat;
