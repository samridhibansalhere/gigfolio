"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button, message, Form } from "antd";
import { uploadImageToFirebase } from "@/helpers/uploads";
import Loading from "../loading";
import PageTitle from "@/components/page-title";
import { AllotedTaskType } from "@/interfaces";
import Attatchments from "../create/_common/task-form/attachments";
import { getCurrentUserFromMongoDB } from "@/server-actions/users";
import { getCurrentAssignedTaskForUser, updateTaskAttachments } from "@/server-actions/allotedtasks";
import { findUserById } from "@/server-actions/users"; // Import findUserById
import { getTaskById } from "@/server-actions/tasks"; // Import getTaskById

const UploadWork = () => {
  const { id } = useParams();
  const [taskDetails, setTaskDetails] = useState<AllotedTaskType | null>(null);
  const [attachments, setAttachments] = useState<{ name: string; file: File | null }[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    const fetchAllottedTask = async () => {
      try {
        const currentUserResponse = await getCurrentUserFromMongoDB();
        if (!currentUserResponse || !currentUserResponse.data) {
          message.error("Failed to load user details");
          return;
        }

        const currentUser = currentUserResponse.data;

        // Fetch the allotted task for the user
        const taskResponse = await getCurrentAssignedTaskForUser(id as string, currentUser._id);
        if (taskResponse?.data) {
          const taskData = taskResponse.data;

          // Fetch sender's user details
          const sender = await findUserById(taskData.sender.toString());
          if (!sender || !sender.success) {
            message.error("Failed to fetch sender details.");
            return;
          }

          // Fetch receiver's user details
          const receiver = await findUserById(taskData.receiver.toString());
          if (!receiver || !receiver.success) {
            message.error("Failed to fetch receiver details.");
            return;
          }

          // Fetch task details
          const taskDetailsResponse = await getTaskById(taskData.task.toString());
          if (!taskDetailsResponse || !taskDetailsResponse.success) {
            message.error("Failed to fetch task details.");
            return;
          }

          // Transform the task data into AllotedTaskType
          const transformedTask: AllotedTaskType = {
            ...taskData,
            createdAt: taskData.createdAt.toISOString(),
            updatedAt: taskData.updatedAt.toISOString(),
            sender: sender.data || null, // Convert sender to UserType
            receiver: receiver.data || null, // Convert receiver to UserType
            task: taskDetailsResponse.data, // Convert task to TaskType
          };

          setTaskDetails(transformedTask);
          setExistingAttachments(transformedTask.attachments || []);
        } else {
          message.error("Failed to load task details");
        }
      } catch (error) {
        message.error("Failed to load task details");
        console.error("Error fetching task details:", error);
      }
    };
    fetchAllottedTask();
  }, [id]);

  const handleAttachmentsUpdate = useCallback(async () => {
    const uploadedFiles: { name: string; url: string }[] = [];
    setLoading(true);

    try {
      for (const attachment of attachments) {
        if (attachment.file) {
          const url = await uploadImageToFirebase(attachment.file);
          uploadedFiles.push({ name: attachment.name, url });
        }
      }

      const updatedAttachments = [...existingAttachments, ...uploadedFiles];
      const updateResponse = await updateTaskAttachments(id as string, taskDetails?.receiver?._id as string, updatedAttachments);

      if (updateResponse?.success) {
        message.success("Attachments updated successfully!");
        setExistingAttachments(updatedAttachments);
      } else {
        message.error(`Failed to update attachments: ${updateResponse?.message || "Unknown error"}`);
      }
    } catch (error) {
      message.error("Error updating attachments.");
      console.error("Error during task attachment update:", error);
    } finally {
      setLoading(false);
    }
  }, [attachments, existingAttachments, id, taskDetails?.receiver]);

  const handleSubmit = async () => {
    if (!taskDetails || taskDetails.isVerified) {
      message.error("Task is already verified or missing task data");
      return;
    }

    if (attachments.length === 0 && existingAttachments.length === 0) {
      message.error("Please upload at least one file.");
      return;
    }

    await handleAttachmentsUpdate();
  };

  if (!taskDetails) {
    return <Loading />;
  }

  return (
    <div>
      <Button
        type="primary"
        onClick={() => router.push("/profile/tasks")} // Navigate to profile when clicked
        className="mt-4 mb-4"
      >
        Back to Tasks
      </Button>
      <PageTitle title="Upload Attachments" />
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item>
          <Attatchments
            newAttachments={attachments}
            setNewAttachments={setAttachments}
            existingAttachments={existingAttachments}
            setExistingAttachments={setExistingAttachments}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Update Attachments
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UploadWork;
