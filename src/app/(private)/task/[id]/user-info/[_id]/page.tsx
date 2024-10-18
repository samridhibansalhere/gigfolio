"use client";
import PageTitle from "@/components/page-title";
import { getDateTimeFormat } from "@/helpers/date-time-formats";
import React, { useEffect, useState } from "react";
import { TaskType, UserType } from "@/interfaces";
import Link from "next/link";
import { Button, message, Row } from "antd"; // Import Spin for loading spinner
import { findUserById, getCurrentUserFromMongoDB } from "@/server-actions/users";
import { getTaskById, getTasksPostedByUser } from "@/server-actions/tasks";
import { createNewAllotedTask, isTaskAlreadyAssigned } from "@/server-actions/allotedtasks"; // Import the new function for checking task assignment
import Loading from "./loading";

const UserInfoPage = ({ params }: { params: { id: string; _id: string } }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [client, setClient] = useState<UserType | null>(null);
  const [clientTask, setClientTask] = useState<TaskType | null>(null);
  const [isTaskAssigned, setIsTaskAssigned] = useState(false); // New state to track task assignment status
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await findUserById(params._id);
        const fetchedUser: UserType | null = userResponse?.data ?? null;
        setUser(fetchedUser);

        if (fetchedUser) {
          const tasksResponse = await getTasksPostedByUser(fetchedUser._id);
          setTasks(tasksResponse.data);
        }

        const clientResponse = await getCurrentUserFromMongoDB();
        setClient(clientResponse?.data ?? null);

        const clientTaskResponse = await getTaskById(params.id);
        setClientTask(clientTaskResponse?.data ?? null);

        if (clientResponse?.data && fetchedUser && clientTaskResponse?.data) {
          const assignmentStatus = await isTaskAlreadyAssigned(clientTaskResponse.data._id, fetchedUser._id);
          setIsTaskAssigned(assignmentStatus?.data?.isAssigned || false);
        }

        setLoading(false); // Set loading to false after data fetch is complete
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false); // Set loading to false in case of an error
      }
    };

    fetchData();
  }, [params.id, params._id]);

  const handleAssignTask = async (clientTask: TaskType, client: UserType, freelancer: UserType) => {
    try {
      const assignResponse = await createNewAllotedTask(clientTask, client, freelancer);

      if (assignResponse.success) {
        message.success(assignResponse.message);
        setIsTaskAssigned(true); // Mark task as assigned after successful assignment
      } else {
        message.error(assignResponse.message);
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      message.error("Failed to assign task.");
    }
  };

  const getProperty = ({ name, value }: { name: string; value: any }) => {
    return (
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs">{name}</span>
        <span className="text-gray-700 font-semibold text-sm">{value || "N/A"}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <Link href="/profile/tasks">
        <Button type="primary" className="mb-3">
          &larr; Back to Tasks
        </Button>
      </Link>
      <Row justify="end">
        {client && clientTask && (
          <Button
            type="primary"
            className="mb-3"
            onClick={() => handleAssignTask(clientTask, client, user)}
            disabled={isTaskAssigned} // Disable the button if the task is already assigned
          >
            {isTaskAssigned ? "Task Already Assigned" : "Assign Task"}
          </Button>
        )}
      </Row>

      <div className="flex items-center mt-3">
        <img
          src={user.profilePic || "/path/to/default-profile-pic.png"}
          alt={`${user.name}'s profile`}
          className="rounded-full w-10 h-10 object-cover mr-3 border border-gray-300"
        />
        <PageTitle title={user.name} />
      </div>

      <div className="bg-gray-100 p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-5 gap-7 border border-gray-300 border-solid">
        {getProperty({ name: "Name", value: user.name })}
        {getProperty({ name: "Id", value: user._id })}
        {getProperty({ name: "Joined On", value: getDateTimeFormat(user.createdAt) })}

        <div className="col-span-1 md:col-span-2 lg:grid-cols-3">
          {getProperty({ name: "Portfolio", value: user.portfolio })}
        </div>

        <div className="col-span-1 md:col-span-2 lg:grid-cols-3">
          <h1 className="text-sm text-gray-500">Bio</h1>
          <p className="text-gray-500 text-sm">{user.bio || "N/A"}</p>
        </div>

        <div className="col-span-1 md:col-span-2 lg:grid-cols-3">
          <h1 className="text-sm text-gray-500">Skills</h1>
          <div className="flex flex-wrap gap-7 mt-2">
            {user.skills.map((skill: string, index: number) => (
              <div
                key={index}
                className="border border-gray-300 rounded-full px-4 py-2 text-gray-700 text-sm"
              >
                {skill}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7">
        <h1 className="text-info text-lg">Tasks Posted by {user.name}</h1>

        {tasks.length === 0 && (
          <div className="text-gray-500 mt-7 text-sm">
            No tasks have been posted by {user.name} yet
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-3 gap-7">
          {tasks.map((task: TaskType) => (
            <Link href={`/task/${task._id}`} key={task._id} className="no-underline">
              <div className="p-2 bg-gray-100 flex flex-col gap-4 border border-gray-200 border-solid">
                <h1 className="text-info text-lg">{task.title}</h1>
                <p className="text-sm text-gray-500">{task.subTitle}</p>

                <div className="flex justify-end">
                  <span className="text-gray-500 text-xs">
                    {getDateTimeFormat(task.createdAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserInfoPage;
