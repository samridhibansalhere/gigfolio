import React from "react";
import parse from "html-react-parser";
import { getDateTimeFormat } from "@/helpers/date-time-formats";
import Attachments from "../_common/attachments";
import PlaceBid from "../_common/place-bid";

const TaskDetails = ({ task }: { task: any }) => {
  console.log("Task Details:", task);

  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-info">{task.title}</h1>
        <span className="text-gray-500 text-xs">
          By {task.user.name} on {getDateTimeFormat(task.createdAt)}
        </span>

        <div className="flex flex-wrap gap-5">
          {task.skillsRequired.map((skill: string) => (
            <div className="bg-gray-200 px-2 py-1 text-black text-xs" key={skill}>
              {skill}
            </div>
          ))}
        </div>
      </div>

      <hr className="my-5 border border-solid border-gray-300" />

      <div className="text-sm">{parse(task.description)}</div>

      <hr className="my-5 border border-solid border-gray-300" />

      <div>
        <Attachments task={task} />
      </div>

      <hr className="my-5 border border-solid border-gray-300" />

      <div>
        <PlaceBid task={task} />
      </div>
    </div>
  );
};

export default TaskDetails;
