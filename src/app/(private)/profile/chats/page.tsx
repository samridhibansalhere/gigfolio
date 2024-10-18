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
  getCurrentUserFromMongoDB,
  getAdminUsers,
} from "@/server-actions/users";
import {
  Button,
  Input,
  Select,
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
  FacebookOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import PageTitle from "@/components/page-title";
import Loading from "@/app/loading";
import copy from "copy-to-clipboard";

const { Option } = Select;

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<UserType | null>(null);
  const [admins, setAdmins] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatType | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      setLoading(true);
      try {
        const userResponse = await getCurrentUserFromMongoDB();
        if (userResponse.success && userResponse.data) {
          setCurrentUser(userResponse.data);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const adminResponse = await getAdminUsers();
        setAdmins(adminResponse);
      } catch (error) {
        console.error("Error fetching admins:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);
  const fetchMessages = async () => {
    if (selectedAdmin && currentUser) {
      setLoading(true);
      try {
        // **Fetch sent messages** (currentUser -> selectedAdmin)
        const { readChats: readSentChats, unreadChats: unreadSentChats } = await getChats(
          `${currentUser._id}-${selectedAdmin._id}`,
          currentUser._id
        );
  
        console.log("Sent messages:", readSentChats, unreadSentChats); // Debug sent messages
  
        // **Fetch received messages** (selectedAdmin -> currentUser)
        const { readChats: readReceivedChats, unreadChats: unreadReceivedChats } = await getChats(
          `${selectedAdmin._id}-${currentUser._id}`,
          currentUser._id
        );
  
        console.log("Received messages:", readReceivedChats, unreadReceivedChats); // Debug received messages
  
        // **Mark unread received messages as read**
        for (const chat of unreadReceivedChats) {
          await markChatAsRead(chat.conversationId, chat.createdAt);
        }
  
        // **Combine sent and received messages**
        const allMessages = [
          ...readSentChats,
          ...unreadSentChats,
          ...readReceivedChats,
          ...unreadReceivedChats,
        ];
  
        // **Sort by creation time**
        const sortedMessages = allMessages.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
  
        console.log("Combined sorted messages:", sortedMessages); // Debug final combined messages
  
        // **Set messages state**
        setMessages(sortedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  useEffect(() => {
    fetchMessages(); // Fetch messages when admin is selected or current user is available
  }, [selectedAdmin, currentUser]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && currentUser && selectedAdmin) {
      setLoading(true);
      try {
        if (editingMessage) {
          // Edit message
          await editChat(editingMessage.conversationId as string, editingMessage.createdAt, newMessage);
          antdMessage.success("Message edited successfully");
          setEditingMessage(null);
        } else {
          // Send new message
          await sendChat(
            `${currentUser._id}-${selectedAdmin._id}`,
            currentUser._id,
            selectedAdmin._id,
            newMessage
          );
          antdMessage.success("Message sent successfully");
        }
        setNewMessage("");
        await fetchMessages(); // Re-fetch messages after send/edit
      } catch (error) {
        console.error("Error sending or editing message:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteMessage = async (message: ChatType) => {
    setLoading(true);
    try {
      await deleteChat(message.conversationId as string, message.createdAt); // Delete message
      await fetchMessages(); // Re-fetch messages after deletion
      antdMessage.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = (message: ChatType) => {
    setNewMessage(message.message);
    setEditingMessage(message);
  };

  const handleMarkAsRead = async (message: ChatType) => {
    setLoading(true);
    try {
      await markChatAsRead(message.conversationId as string, message.createdAt); // Mark as read
      await fetchMessages(); // Re-fetch messages after marking as read
      antdMessage.success("Message marked as read");
    } catch (error) {
      console.error("Error marking message as read:", error);
    } finally {
      setLoading(false);
    }
  };
  

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
            <WhatsAppOutlined style={{ marginRight: 8 }} /> Share on WhatsApp
          </a>
        </Menu.Item>
        <Menu.Item key="facebook">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=&quote=${encodedMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookOutlined style={{ marginRight: 8 }} /> Share on Facebook
          </a>
        </Menu.Item>
        <Menu.Item key="twitter">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TwitterOutlined style={{ marginRight: 8 }} /> Share on Twitter
          </a>
        </Menu.Item>
        <Menu.Item key="linkedin">
          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=&title=&summary=${encodedMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkedinOutlined style={{ marginRight: 8 }} /> Share on LinkedIn
          </a>
        </Menu.Item>
      </Menu>
    );
  };

  const handleCopyMessage = (message: string) => {
    copy(message);
    antdMessage.success("Message copied to clipboard");
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <PageTitle title="Help and Support" />

      <Select
        showSearch
        value={selectedAdmin?.name}
        placeholder="Select Admin"
        onChange={(value) =>
          setSelectedAdmin(admins.find((admin) => admin._id === value) || null)
        }
        style={{ width: "100%", marginBottom: "20px" }}
      >
        {admins.map((admin) => (
          <Option key={admin._id} value={admin._id}>
            <Avatar src={admin.profilePic} style={{ marginRight: 8 }} />
            <span>{admin.name}</span>
            <br />
            <span>{admin.email}</span>
          </Option>
        ))}
      </Select>

      <div className="text-info" style={{ marginBottom: "20px" }}>
        {currentUser && (
          <p>
            Hi {currentUser.name}, how can Gigfolio make your day easier?
          </p>
        )}
      </div>

      {messages.length === 0 ? (
  <p>No messages to display</p>
) : (
  messages.map((msg) => {
    const isSentByCurrentUser = msg.sender._id === currentUser?._id;
    const isMessageUnread = !msg.isRead && !isSentByCurrentUser;

    return (
      <div
        key={`${msg.conversationId}-${msg.createdAt}`}
        style={{
          textAlign: isSentByCurrentUser ? "right" : "left",
          marginBottom: "10px",
        }}
      >
        <div>
          <strong>
            {isSentByCurrentUser ? "Me" : selectedAdmin?.name}
          </strong>
          <p>{msg.message}</p>

          {/* Render options for messages sent by current user */}
          {isSentByCurrentUser ? (
            <>
              <Tooltip title="Edit">
                <EditOutlined
                  onClick={() => handleEditMessage(msg)}
                  style={{ marginRight: 8 }}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <DeleteOutlined onClick={() => handleDeleteMessage(msg)} />
              </Tooltip>
              <Dropdown overlay={handleShareMessage(msg.message)}>
                <ShareAltOutlined style={{ marginLeft: 8 }} />
              </Dropdown>
              <CopyOutlined
                onClick={() => handleCopyMessage(msg.message)}
                style={{ cursor: "pointer", marginLeft: 8, marginRight: 4 }}
              />
              {msg.isRead ? (
                <Tooltip title="Read by receiver">
                  <EyeOutlined style={{ marginLeft: 8, color: "green" }} />
                </Tooltip>
              ) : (
                <Tooltip title="Not read yet">
                  <EyeInvisibleOutlined style={{ marginLeft: 8, color: "red" }} />
                </Tooltip>
              )}
            </>
          ) : (
            <>
              {/* Render options for received messages */}
              {isMessageUnread ? (
                <Tooltip title="Mark as Read">
                  <EyeInvisibleOutlined
                    onClick={() => handleMarkAsRead(msg)}
                    style={{ marginLeft: 8, color: "blue", cursor: "pointer" }}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Read">
                  <EyeOutlined style={{ marginLeft: 8, color: "green" }} />
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>
    );
  })
)}


      <Input
        value={newMessage}
        disabled={!selectedAdmin}
        onChange={(e) => setNewMessage(e.target.value)}
        onPressEnter={handleSendMessage}
        placeholder="Type your message..."
        style={{ marginBottom: "20px" }}
      />
      <Button  disabled={!selectedAdmin} type="primary" onClick={handleSendMessage}>
      {editingMessage ? "Edit Message" : "Send Message"}
      </Button>
    </div>
  );
};

export default Chat;
