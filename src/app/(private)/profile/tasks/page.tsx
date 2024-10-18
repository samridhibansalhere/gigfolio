"use client"
import React from "react";
import { Tabs } from "antd";
import PageTitle from "@/components/page-title";
import TasksInfo from "./_components/task-info";
import AssignedTask from "./_components/assigned-task";
import SubmitTask from "./_components/submitted-task";
function TasksPage() {
  return (
    <div>
      <PageTitle title="Tasks" />
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Create Tasks" key="1">
          <TasksInfo />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Assigned Tasks" key="2">
          <AssignedTask/>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Handed In Tasks" key="3">
          <SubmitTask/>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default TasksPage;
