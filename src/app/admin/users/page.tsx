import PageTitle from "@/components/page-title";
import UsersTable from "./_common/users-table";
import { UserType } from "@/interfaces";
import { connectToMongoDB } from "@/config/mongodb-connection";
import UserModel from "@/models/user-model";

// Server Component to fetch users
export default async function UsersPage() {
  await connectToMongoDB();

  // Fetch users from the database
  const users = await UserModel.find().sort({ createdAt: -1 });

  // Ensure all required fields of UserType are included
  const formattedUsers: UserType[] = users.map((user) => ({
    _id: user._id.toString(), // Convert ObjectId to string for consistent usage
    name: user.name,
    email: user.email,
    profilePic: user.profilePic,
    isAdmin: user.isAdmin,
    portfolio: user.portfolio||"",
    bio: user.bio || "",
    isApproved: user.isApproved,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    clerkUserId: user.clerkUserId || "",
    skills: user.skills|| [],
    currentSubscription: {
      _id: "",
      plan: "",
      expiryDate: "",
      createdAt: "",
      price: 0,
      paymentId: ""
    },
    isActive: user.isActive || false,
  }));
  
  console.log("Formatted Users:", formattedUsers);

  return (
    <div>
      <PageTitle title="Users" />
      <UsersTable users={formattedUsers} />
    </div>
  );
}
