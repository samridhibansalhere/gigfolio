"use client";
import React from "react";
import { Tabs } from "antd";
import ProfileForm from "./_components/profile-form";
import SubscriptionDetails from "./_components/subscription-details";
import PageTitle from "@/components/page-title";
import UserDetails from "./_components/user-details";

function Profile() {
  return (
    <div>
      <PageTitle title="Profile" />
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Profile" key="1">
          <ProfileForm />
        </Tabs.TabPane>
        <Tabs.TabPane tab="User-Details" key="2">
          <UserDetails />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Subscription Details" key="3">
          <SubscriptionDetails/>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default Profile;