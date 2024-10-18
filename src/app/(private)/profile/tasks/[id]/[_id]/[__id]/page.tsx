"use client"
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, message, Table } from "antd";
import { getCurrentAssignedTaskForUser, updateTaskStatus, updateTaskPaymentStatus } from "@/server-actions/allotedtasks"; // Import updateTaskPaymentStatus
import { AllotedTaskType } from "@/interfaces";
import Loading from "@/app/loading";
import PageTitle from "@/components/page-title";
import { findUserById } from "@/server-actions/users";
import { getTaskById } from "@/server-actions/tasks";
import PaymentModal from "../payment-modal";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { createPaymentIntent2 } from "@/server-actions/payments"; // Import server action
import { sendEmail } from "@/server-actions/mails";

const TaskDetails = () => {
  const { id, _id, __id } = useParams(); // Extracting __id as the amount from the URL
  const [allotedTask, setAllotedTask] = useState<AllotedTaskType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false); // State to handle Payment Modal
  const [amountToPay, setAmountToPay] = useState<number>(Number(__id)); // Store the amount for the payment from the URL
  const [clientSecret, setClientSecret] = useState<string | null>(null); // New state for clientSecret
  const router = useRouter();
  const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

  if (!stripePublicKey) {
    throw new Error("Stripe public key is missing from environment variables.");
  }
  
  const stripePromise = loadStripe(stripePublicKey);
  
  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      console.log("Fetching task with id:", id, "and _id:", _id);
      try {
        const result = await getCurrentAssignedTaskForUser(id as string, _id as string);
        console.log("Fetch result:", result);

        if (result && result.success && result.data) {
          const taskData = result.data;

          const sender = await findUserById(taskData.sender.toString());
          const receiver = await findUserById(taskData.receiver.toString());
          const taskDetails = await getTaskById(taskData.task.toString());

          const transformedTask: AllotedTaskType = {
            ...taskData,
            createdAt: taskData.createdAt.toISOString(),
            updatedAt: taskData.updatedAt.toISOString(),
            sender: sender.data || null,
            receiver: receiver.data || null,
            task: taskDetails.data,
          };

          console.log("Transformed task data:", transformedTask);
          setAllotedTask(transformedTask);
        } else {
          message.error("No task data found.");
        }
      } catch (error) {
        console.error("Error fetching task:", error);
        message.error("Error fetching task details.");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, _id]);

  const handleVerifyTask = async () => {
    if (!allotedTask) return;

    setLoading(true);
    try {
      const updateResponse = await updateTaskStatus(allotedTask.task._id.toString(), { isActive: false });

      if (updateResponse.success) {
        message.success("Task verified and status updated.");
        router.push("/profile/tasks");
      } else {
        message.error(`Failed to update task: ${updateResponse.message}`);
      }
    } catch (error) {
      message.error("Error updating task.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!allotedTask) return;
  
    try {
      // Use server action to create payment intent
      const result = await createPaymentIntent2(amountToPay, allotedTask.task._id);

      if (result?.success && result.clientSecret) {
        setClientSecret(result.clientSecret); // Set clientSecret for Elements
        setShowPaymentModal(true); // Show payment modal if clientSecret is received
        console.log("Client secret received:", result.clientSecret);
      } else {
        message.error("Failed to initialize payment.");
      }
    } catch (error) {
      console.error("Error initializing payment:", error);
      message.error("Failed to initialize payment.");
    }
  };

  const handlePaymentSuccess = async () => {
    if (!allotedTask) return;

    try {
      const updateResponse = await updateTaskPaymentStatus(allotedTask.task._id as string,allotedTask.receiver?._id as string);

      if (updateResponse.success) {
        message.success("Payment status updated.");
        setAllotedTask({
          ...allotedTask,
          isPayed: true, // Mark the task as paid
        });
        await sendEmail({
          recipientEmail: allotedTask.receiver?.email || "",
          subject: "Payment Received for Your Task",
          html: `
            <p>
              Hi ${allotedTask.receiver?.name},<br />
              You have successfully received the payment for the task: <b>${allotedTask.task?.title}</b>.<br />
              <b>Amount Paid:</b> $${amountToPay}.
            </p>
          `,
        });
      } else {
        message.error(`Failed to update payment status: ${updateResponse.message}`);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      message.error("Failed to update payment status.");
    }
  };

  if (loading || !allotedTask) {
    return <Loading />;
  }

  const attachments = allotedTask.attachments || [];
  const downloadAttachment = (url: string) => {
    window.open(url, "_blank");
  };

  const columns = [
    {
      title: "Attachment Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Attachment URL",
      dataIndex: "url",
      key: "url",
      render: (text: string) => (
        <div>
          <a href={text} target="_blank" rel="noopener noreferrer" className="text-blue-500">
            View Attachment
          </a>
          <span
            className="text-blue-500 text-sm cursor-pointer ml-3"
            onClick={() => downloadAttachment(text)}
          >
            Download
          </span>
        </div>
      ),
    },
  ];

  const dataSource = attachments.map((attachment, index) => ({
    key: index,
    name: attachment.name,
    url: attachment.url,
  }));

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Button type="primary" onClick={() => router.push("/profile/tasks")}>
          Back to Tasks
        </Button>
        <Button type="primary" onClick={handleVerifyTask} disabled={allotedTask.isVerified}>
          {allotedTask.isVerified ? "Task Verified" : "Verify Task"}
        </Button>
      </div>
      <PageTitle title="Task Details and Attachments" />
      <Table columns={columns} dataSource={dataSource} pagination={false} />
      <Button type="primary" className="mt-4" onClick={handlePayment} disabled={!allotedTask.isVerified || allotedTask.isPayed}>
        {allotedTask.isPayed ? "Task Paid" : `Pay ${allotedTask.receiver?.name}`}
      </Button>

      {/* Pass clientSecret to Elements if it exists */}
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentModal
            showPaymentModal={showPaymentModal}
            setShowPaymentModal={setShowPaymentModal}
            amount={amountToPay} // Use amount from the URL
            onPaymentSuccess={handlePaymentSuccess} // Pass the success handler to the modal
          />
        </Elements>
      )}
    </div>
  );
};

export default TaskDetails;
