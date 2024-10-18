"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import { usePathname, useRouter } from "next/navigation";
import { message } from "antd";
import { getCurrentUserFromMongoDB } from "@/server-actions/users";
import useUsersStore from "@/store/users-store";
import Spinner from "@/components/spinner";

function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // Get current path
  const router = useRouter(); // Use Next.js router for redirection

  // Determine if the current route is public or private
  const isPublicRoute = ["sign-in", "sign-up"].includes(pathname.split("/")[1]);
  const isAdminRoute = pathname.split("/")[1] === "admin"; // Admin-specific routes
  const isPrivate = !pathname.includes("sign-in") && !pathname.includes("sign-up");

  // Store functions to set user data
  const { SetLoggedInUserData, loggedInUserData } = useUsersStore() as any;
  const [loading, setLoading] = useState(false);

  // Function to fetch logged-in user data from MongoDB
  const getLoggedInUserData = async () => {
    try {
      setLoading(true);
      const response = await getCurrentUserFromMongoDB();
      if (response.success) {
        SetLoggedInUserData(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data if on private route and user data is not yet loaded
  useEffect(() => {
    if (isPrivate && !loggedInUserData) {
      getLoggedInUserData();
    }
  }, [pathname]);

  // Check if the user is allowed to access the current page
  useEffect(() => {
    if (!loggedInUserData) return; // Do nothing if the user data isn't loaded yet

    // Restrict access to admin routes for non-admin users
    if (isAdminRoute && !loggedInUserData.isAdmin) {
      message.error("Access denied: Admins only");
      router.push("/"); // Redirect to home or some other route
    }
  }, [loggedInUserData, pathname]);

  if (!isPrivate) {
    return <>{children}</>; // Render public routes without restrictions
  }

  if (loading || !loggedInUserData) {
    return <Spinner />; // Show a loading spinner while fetching user data
  }

  return (
    <div className="w-full flex flex-col md:flex-row gap-5 h-screen">
      <div>
        <Sidebar />
      </div>
      <div className="px-5 py-10 flex-1 overflow-y-scroll">{children}</div>
    </div>
  );
}

export default LayoutProvider;
