import { getDateTimeFormat, getDateFormat } from "@/helpers/date-time-formats";
import { TaskType } from "@/interfaces";
import { getAllTasks } from "@/server-actions/tasks";
import Link from "next/link";
import React from "react";

async function TasksData({
  searchParams,
}: {
  searchParams: { query: string };
}) {
  const query = searchParams.query || "";
  const response = await getAllTasks(query as string);
  let tasks: TaskType[] = [];

  if (response.success) {
    tasks = response.data;
  }

  // Filter out tasks where the lastDateToPlaceBid is older than the current date
  const currentDate = new Date();
  const validTasks = tasks.filter((task) => {
    const taskDate = new Date(task.lastDateToPlaceBid);
    // Compare only the date portion using getDateFormat to ignore time differences
    return getDateFormat(taskDate.toISOString()) >= getDateFormat(currentDate.toISOString());
  });

  if (validTasks.length === 0) {
    return <div className="text-gray-500">No tasks found.</div>;
  }

  return (
    <div className="flex flex-col gap-7">
      {validTasks.map((task: TaskType) => (
        <Link
          href={`/task/${task._id}`}
          key={task._id}
          className="no-underline"
        >
          <div className="border p-5 border-solid border-gray-300 flex flex-col gap-4">
            <h1 className="text-lg text-info">{task.title}</h1>
            <p className="text-sm text-gray-500">{task.subTitle}</p>

            <div className="flex flex-wrap gap-5">
              {task.skillsRequired.map((skill: string) => (
                <div className="bg-info px-2 py-1 text-secondary text-xs" key={skill}>
                  {skill}
                </div>
              ))}
            </div>

            <div className="flex justify-end text-gray-500 text-xs">
            {task.user.profilePic && (
    <img
      src={task.user.profilePic}
      alt={task.user.name}
      className="w-6 h-6 rounded-full mr-2"
    />
  )}<span>
                By {task.user.name} on {getDateTimeFormat(task.createdAt)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default TasksData;
