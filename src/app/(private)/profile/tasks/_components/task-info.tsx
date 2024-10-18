"use client"
import React, { useEffect, useState } from "react";
import LinkButton from "@/components/link-button";
import { getTasksPostedByLoggedInUser } from "@/server-actions/tasks";
import TasksTable from "../_common/task-table";

function TasksInfo() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    async function fetchTasks() {
      const result = await getTasksPostedByLoggedInUser();
      setTasks(result.data);
    }

    fetchTasks();
  }, []);

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Your Posted Tasks</h2>
        <LinkButton title="Create Task" path="/profile/tasks/create" type="primary" />
      </div>

      <p className="text-gray-700 text-sm mb-4">
        Note: Your tasks will only be visible on the homepage once you have received approval from the admin.
        <span className="font-semibold"> Check your profile for your current approval status.</span>
      </p>

      <TasksTable tasks={tasks} />
    </div>
  );
}

export default TasksInfo;
