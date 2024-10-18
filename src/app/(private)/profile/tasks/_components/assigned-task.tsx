import { useEffect, useState } from "react";
import { AllotedTaskType, UserType } from "@/interfaces";
import { getAssignedTasksForUser } from "@/server-actions/allotedtasks";
import { findUserById, getCurrentUserFromMongoDB } from "@/server-actions/users";
import Loading from "../loading";
import { Table, Button } from "antd";
import { getTaskById } from "@/server-actions/tasks";
import { getBidByTaskClientAndFreelancer } from "@/server-actions/bids";
import { useRouter } from "next/navigation";

interface Bids {
  estimatedDays: number;
  bidAmount: number;
}

const AssignedTasksPage = () => {
  const [loggedInUser, setLoggedInUser] = useState<UserType | null>(null);
  const [tasks, setTasks] = useState<AllotedTaskType[]>([]);
  const [bids, setBids] = useState<Record<string, Bids | null>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingBids, setLoadingBids] = useState<boolean>(true);
  const router = useRouter(); // Using useRouter from next/navigation

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
      const result = await getAssignedTasksForUser(loggedInUser);

      if (result.success) {
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

  const handleSubmitWork = (taskId: string) => {
    router.push(`/profile/tasks/${taskId}`); // Navigate to task submission page
  };

  const columns = [
    {
      title: "Task",
      dataIndex: "taskTitle",
      key: "taskTitle",
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Assigned By",
      dataIndex: "assignedBy",
      key: "assignedBy",
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
      title: "Action",
      key: "action",
      render: (record: any) => {
        const isWithinDateRange = true; // Check if the current date is within start and end date
        return isWithinDateRange ? (
          <Button type="primary" onClick={() => handleSubmitWork(record.key)}>Submit Work</Button>
        ) : (
          <span>Outside Date Range</span>
        );
      },
    },
  ];

  const dataSource = tasks
    .map((allotedTask) => {
      const { task, sender } = allotedTask;

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
        assignedBy: sender?.name || "Unknown Sender",
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
      ote: You can view the task details assigned to you and also submit your work.
      </p>
      <Table dataSource={dataSource} columns={columns} loading={loading} />
    </div>
  );
};

export default AssignedTasksPage;
