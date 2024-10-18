"use client";
import { updateUserInMongoDB } from "@/server-actions/users";
import useUsersStore, { UsersStoreType } from "@/store/users-store";
import { Button, Form, Input, Tag, message, Upload } from "antd";
import React, { useEffect, useState } from "react";
import { uploadImageToFirebase } from "@/helpers/uploads"; // Import the upload function

function ProfileForm() {
  const { loggedInUserData, SetLoggedInUserData }: any = useUsersStore() as UsersStoreType;
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsValue, setSkillsValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);
  
  useEffect(() => {
    // Check if loggedInUserData?.skills is an array and cast to string[]
    if (Array.isArray(loggedInUserData?.skills)) {
      const uniqueSkills = [...new Set<string>(loggedInUserData.skills)]; // Cast to string[]
      setSkills(uniqueSkills);
    }
  }, [loggedInUserData]);

  const onAddSkills = () => {
    if (skillsValue.trim()) {
      const newSkills = skillsValue
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");
      const updatedSkills = [...new Set([...skills, ...newSkills])];
      setSkills(updatedSkills);
      setSkillsValue(""); // Clear input field after adding
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const payload: any = { ...values, skills };

      // Upload new profile picture if it exists
      if (newProfilePicFile) {
        const profilePicUrl = await uploadImageToFirebase(newProfilePicFile);
        payload.profilePic = profilePicUrl;
      }

      const response = await updateUserInMongoDB({
        userId: loggedInUserData._id,
        payload,
      });

      if (response.success) {
        message.success("Profile updated successfully");
        SetLoggedInUserData(response.data);
        window.location.reload();
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const rules = [{ required: true, message: "This field is required" }];

  return (
    <Form
      layout="vertical"
      className="grid grid-cols-3 gap-5 mt-7"
      onFinish={onFinish}
      form={form}
      initialValues={loggedInUserData}
    >
      <Form.Item
        label="Name"
        name="name"
        className="col-span-3 md:col-span-1"
        rules={rules}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        className="col-span-3 md:col-span-1"
        rules={rules}
      >
        <Input disabled />
      </Form.Item>

      <Form.Item
        label="Portfolio"
        name="portfolio"
        className="col-span-3 md:col-span-1"
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Bio"
        name="bio"
        className="w-full col-span-3"
      >
        <Input.TextArea />
      </Form.Item>

      {/* Profile Picture Section */}
      <div className="col-span-3 flex flex-col items-start">
        <span className="text-sm mb-2">Profile Picture</span>
        <div className="flex items-center gap-5">
          {newProfilePicFile ? (
            <img
              src={URL.createObjectURL(newProfilePicFile)}
              alt="Profile"
              className="w-24 h-24 object-cover"
            />
          ) : (
            <img
              src={loggedInUserData?.profilePic}
              alt={loggedInUserData?.name}
              className="w-24 h-24 object-cover"
            />
          )}
          <Upload
            listType="picture-card"
            beforeUpload={(file: any) => {
              setNewProfilePicFile(file);
              return false; // Prevent automatic upload
            }}
            onRemove={() => setNewProfilePicFile(null)}
          >
            <span className="text-gray-700 text-xs">Change</span>
          </Upload>
        </div>
      </div>
      {/* Skills Section */}
      <div className="col-span-3">
        <span className="text-sm">
          Skills <span className="text-xs">(Separated by commas)</span>
        </span>
        <div className="flex gap-5">
          <Input
            placeholder="Enter your skills"
            value={skillsValue}
            onChange={(e) => setSkillsValue(e.target.value)}
          />
          <Button type="primary" onClick={onAddSkills}>Add</Button>
        </div>

        <div className="flex flex-wrap gap-5 mt-5">
          {skills.length === 0 ? (
            <p>No skills added yet.</p>
          ) : (
            skills.map((skill, index) => (
              <Tag
                closable
                onClose={() => {
                  const updatedSkills = skills.filter((_, i) => i !== index);
                  setSkills(updatedSkills);
                }}
                key={index}
                className="px-5 py-2 text-primary bg-gray-500"
              >
                {skill}
              </Tag>
            ))
          )}
        </div>
      </div>

      <div className="col-span-3 flex justify-end">
        <Button type="primary" htmlType="submit" loading={loading}>
          Update
        </Button>
      </div>
    </Form>
  );
}

export default ProfileForm;
