import { useEffect, useState } from "react";
import { AllotedTaskType, UserType } from "@/interfaces";
import { getSubmittedTasksForUser } from "@/server-actions/allotedtasks";
import { findUserById, getCurrentUserFromMongoDB } from "@/server-actions/users";
import Loading from "../loading";
import { Table, Button, message } from "antd";
import { getTaskById } from "@/server-actions/tasks";
import { getBidByTaskClientAndFreelancer } from "@/server-actions/bids";
import { useRouter } from "next/navigation";

interface Bids {
  estimatedDays: number;
  bidAmount: number;
}

const SubmitTask = () => {
  const [loggedInUser, setLoggedInUser] = useState<UserType | null>(null);
  const [tasks, setTasks] = useState<AllotedTaskType[]>([]);
  const [bids, setBids] = useState<Record<string, Bids | null>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingBids, setLoadingBids] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const result = await getCurrentUserFromMongoDB();
      if (result.success) {
        setLoggedInUser(result.data);
      } else {
        console.error("Failed to fetch user:", result.message);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!loggedInUser) return;

      setLoading(true);
      const result = await getSubmittedTasksForUser(loggedInUser);

      if (result.success && result.data) {
        const transformedTasks: AllotedTaskType[] = [];

        for (const allotedTask of result.data) {
          const sender = await findUserById(allotedTask.sender.toString());
          const receiver = await findUserById(allotedTask.receiver.toString());
          const task = await getTaskById(allotedTask.task.toString());

          if (sender.success && receiver.success && task.success) {
            transformedTasks.push({
              ...allotedTask,
              sender: sender.data || null,
              receiver: receiver.data || null,
              task: task.data,
              createdAt: allotedTask.createdAt.toString(),
              updatedAt: allotedTask.updatedAt.toString(),
            });
          } else {
            console.error("Failed to fetch user or task details");
          }
        }

        setTasks(transformedTasks);
        await fetchBids(transformedTasks);
      } else {
        console.error("Failed to fetch tasks");
      }

      setLoading(false);
    };

    fetchTasks();
  }, [loggedInUser]);

  const fetchBids = async (tasks: AllotedTaskType[]) => {
    setLoadingBids(true);
    const bidsData: Record<string, Bids | null> = {};

    for (const allotedTask of tasks) {
      const bidResult = await getBidByTaskClientAndFreelancer(
        allotedTask.task,
        allotedTask.sender,
        allotedTask.receiver
      );
      if (bidResult.success && bidResult.data) {
        bidsData[allotedTask.task._id] = bidResult.data;
      } else {
        console.error("Failed to fetch bid for task:", allotedTask.task._id);
        bidsData[allotedTask.task._id] = null;
      }
    }

    setBids(bidsData);
    setLoadingBids(false);
  };

  const handleAttachmentsClick = (taskId: string, receiverId: string) => {
    const bid = bids[taskId];
    if (bid) {
      router.push(`/profile/tasks/${taskId}/${receiverId}/${bid.bidAmount}`);
    } else {
      message.error("Bid amount not found.");
    }
  };

  const columns = [
    {
      title: "Task",
      dataIndex: "taskTitle",
      key: "taskTitle",
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Assigned To",
      dataIndex: "assignedBy",
      key: "assignedto",
      render: (text: string) => <span className="text-500">{text}</span>,
    },
    {
      title: "Bid Amount",
      dataIndex: "bidAmount",
      key: "bidAmount",
      render: (text: any, record: any) => {
        return loadingBids ? <Loading /> : record.bid ? `$${record.bid.bidAmount}` : "No Bid";
      },
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
    },
    {
      title: "Attachments",
      key: "attachments",
      render: (text: any, record: any) => {
        const taskId = record.key;
        const receiverId = tasks.find((t) => t.task._id === taskId)?.receiver?._id || "";
        return (
          <Button
            type="primary"
            onClick={() => handleAttachmentsClick(taskId, receiverId)}
          >
            Attachments
          </Button>
        );
      },
    },
  ];

  const dataSource = tasks
    .map((allotedTask) => {
      const { task, receiver } = allotedTask;

      if (!task || !task._id) {
        return null;
      }

      const bid = bids[task._id];
      const startDate = new Date(allotedTask.createdAt).toLocaleDateString();
      const endDate = new Date(
        new Date(allotedTask.createdAt).getTime() + (bid?.estimatedDays || 0) * 24 * 60 * 60 * 1000
      ).toLocaleDateString();

      return {
        key: task._id,
        taskTitle: task.title || "Untitled Task",
        assignedBy: receiver?.name || "Unknown Receiver",
        bid,
        startDate,
        endDate,
      };
    })
    .filter((task) => task !== null);

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">Assigned Tasks</h2>
      <p className="text-gray-600 text-sm mb-4">
        Note: You can view the task details and verify them once completed.
      </p>
      <Table dataSource={dataSource} columns={columns} loading={loading} />
    </div>
  );
};

export default SubmitTask;
