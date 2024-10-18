"use client";
import React, { useEffect, useState } from "react";
import { Tabs } from "antd";
import { getTaskById, getUserIdFromTask } from "@/server-actions/tasks"; // Updated to include getUserIdFromTask
import TaskDetails from "./_components/task-details";
import ClientDetails from "./_components/client-details";
import Loading from "./loading";
import Reviews from "./_components/reviews";
import { getCurrentUserFromMongoDB } from "@/server-actions/users";

function TaskInfoPage({ params }: { params: { id: string } }) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [taskOwnerId, setTaskOwnerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch task details by ID
        const taskResponse = await getTaskById(params.id);
        if (taskResponse.success) {
          setTask(taskResponse.data);

          // Fetch the task owner ID using the taskId
          const ownerResponse = await getUserIdFromTask(params.id);
          if (ownerResponse.success) {
            setTaskOwnerId(ownerResponse.userId?.toString() || null); // Assuming this is the field containing the task owner's ID
          } else {
            setError(ownerResponse.message);
          }
        } else {
          setError("Task not found");
        }

        // Fetch the current user details
        const userResponse = await getCurrentUserFromMongoDB();
        if (userResponse.success) {
          setCurrentUser(userResponse.data);
        } else {
          setError(userResponse.message);
        }
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  const client = task?.user;

  return (
    <div>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Task Details" key="1">
          <TaskDetails task={task} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Client Details" key="2">
          {client ? (
            <ClientDetails client={client} />
          ) : (
            <div>No client details available</div>
          )}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Reviews" key="3">
          {/* Pass taskOwnerId to the Reviews component */}
          {taskOwnerId ? (
            <Reviews taskId={task._id} currentUser={currentUser} taskOwnerId={taskOwnerId} />
          ) : (
            <div><Loading/></div>
          )}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default TaskInfoPage;
