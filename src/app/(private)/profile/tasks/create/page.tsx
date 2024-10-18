"use client";
import PageTitle from "@/components/page-title";
import React, { useEffect, useState } from "react";
import TaskForm from "./_common/task-form";
import Loading from "../loading";
import { getCurrentUserFromMongoDB } from "@/server-actions/users";
import { checkTaskLimit } from "@/server-actions/tasks";
import { getUserSubscription } from "@/server-actions/users"; // Import the new server action
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { Button } from "antd"; // Import Button from Ant Design

const CreateTaskPage = () => {
  const [showForm, setShowForm] = useState(false); // Start with false
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize useRouter for navigation

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      
      try {
        // Fetch user data
        const mongoUser = await (await getCurrentUserFromMongoDB()).data;

        if (mongoUser?._id) {
          // Fetch user's subscription data using the server action
          const subscriptionResponse = await getUserSubscription(mongoUser._id);

          if (subscriptionResponse.success) {
            const subscriptionData = subscriptionResponse.data;

            // Fetch user's task limit status using the subscription data
            const { canAddTask, error } = await checkTaskLimit(mongoUser._id, subscriptionData);

            if (canAddTask) {
              setShowForm(true); // Show form if user can add tasks
            } else {
              setErrorMessage(error || "You have reached your task limit.");
            }
          } else {
            setErrorMessage(subscriptionResponse.message || "Unable to fetch subscription data.");
          }
        } else {
          setErrorMessage("Logged-in user ID not found.");
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrorMessage("Error fetching user data.");
      }

      setLoading(false);
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <span><Loading/></span>; 
  }

  return (
    <div>
      <PageTitle title="Create Task" />
      {showForm ? (
        <TaskForm />
      ) : (
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-600">{errorMessage}</span>
          <Button
            type="primary"
            onClick={() => router.push("/profile")} // Navigate to profile when clicked
            className="mt-4"
          >
            Get Subscription
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreateTaskPage;
