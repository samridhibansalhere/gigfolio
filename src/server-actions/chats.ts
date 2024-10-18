"use server";
import ChatModel from "@/models/chat-model"; 
import { connectToMongoDB } from "@/config/mongodb-connection";
import { UserType } from "@/interfaces";
connectToMongoDB(); 

export const sendChat = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  message: string
) => {
  try {
    await connectToMongoDB();
    const newChat = await ChatModel.create({
      conversationId,
      sender: senderId,
      receiver: receiverId,
      message,
      read: true,
      createdAt: new Date() // Ensure createdAt is set
    });
    return JSON.parse(JSON.stringify(newChat));
  } catch (error: any) {
    console.error("Error sending message:", error.message);
    throw new Error("Error sending chat: " + error.message);
  }
};

export const getChats = async (conversationId: string, userId: string) => {
  try {
    await connectToMongoDB();

    const chats = await ChatModel.find({ conversationId }).populate("sender receiver");
    
    const unreadChats = chats.filter(chat => chat.receiver._id.toString() === userId && !chat.isRead);
    
    const readChats = chats.filter(chat => chat.receiver._id.toString() === userId && chat.isRead);

    const sentChats = chats.filter(chat => chat.sender._id.toString() === userId);

    return {
      readChats: JSON.parse(JSON.stringify([...readChats, ...sentChats])), 
      unreadChats: JSON.parse(JSON.stringify(unreadChats))
    };
  } catch (error: any) {
    console.error("Error fetching chats:", error.message);
    throw new Error("Error fetching chats: " + error.message);
  }
};

export const editChat = async (
  conversationId: string, 
  createdAt: string, // Use createdAt for editing
  newMessage: string
) => {
  try {
    await connectToMongoDB();
    console.log("Editing chat for conversation:", conversationId, "at createdAt:", createdAt); // Log values
    
    const updatedChat = await ChatModel.findOneAndUpdate(
      { conversationId, createdAt },  // Filter by conversationId and createdAt
      { message: newMessage }, 
      { new: true }
    );
    
    if (!updatedChat) {
      throw new Error("Chat not found or couldn't be updated");
    }
    
    return JSON.parse(JSON.stringify(updatedChat));
  } catch (error: any) {
    console.error("Error editing message:", error.message);
    throw new Error("Error editing chat: " + error.message);
  }
};

export const deleteChat = async (
  conversationId: string, 
  createdAt: string // Use createdAt for deletion
) => {
  try {
    await connectToMongoDB();
    console.log("Deleting chat for conversation:", conversationId, "at createdAt:", createdAt); // Log values
    
    const deletedChat = await ChatModel.findOneAndDelete({
      conversationId, 
      createdAt, // Use createdAt for deletion
    });
    
    if (!deletedChat) {
      throw new Error("Chat not found or couldn't be deleted");
    }
    
    return JSON.parse(JSON.stringify(deletedChat));
  } catch (error: any) {
    console.error("Error deleting message:", error.message);
    throw new Error("Error deleting chat: " + error.message);
  }
};

export const markChatAsRead = async (
  conversationId: string, 
  createdAt: string // Use createdAt for marking as read
) => {
  try {
    await connectToMongoDB();
    console.log("Marking chat as read for conversation:", conversationId, "at createdAt:", createdAt); // Log values
    
    const updatedChat = await ChatModel.findOneAndUpdate(
      { conversationId, createdAt },  // Use createdAt to identify chat
      { isRead: true }, 
      { new: true }
    );
    
    if (!updatedChat) {
      throw new Error("Chat not found or couldn't be marked as read");
    }
    
    return JSON.parse(JSON.stringify(updatedChat));
  } catch (error: any) {
    console.error("Error marking chat as read:", error.message);
    throw new Error("Error marking chat as read: " + error.message);
  }
};


export const countUnreadMessages = async (user: UserType): Promise<number> => {
  try {
    await connectToMongoDB();

    // Query for messages where the user is the receiver and the message is unread
    const unreadMessagesCount = await ChatModel.countDocuments({
      sender: user,
      isRead: false
    });

    return unreadMessagesCount;
  } catch (error: any) {
    console.error("Error counting unread messages:", error.message);
    throw new Error("Error counting unread messages: " + error.message);
  }
};
export const countUnreadMessagesForUser = async (user: UserType): Promise<number> => {
  try {
    await connectToMongoDB();

    // Query for messages where the user is the receiver and the message is unread
    const unreadMessagesCount = await ChatModel.countDocuments({
      receiver: user,
      isRead: false
    });

    return unreadMessagesCount;
  } catch (error: any) {
    console.error("Error counting unread messages:", error.message);
    throw new Error("Error counting unread messages: " + error.message);
  }
};
