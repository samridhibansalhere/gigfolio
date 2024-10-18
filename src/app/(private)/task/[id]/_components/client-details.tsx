import React from "react";
import PageTitle from "@/components/page-title";
import { getDateTimeFormat } from "@/helpers/date-time-formats"; // Assuming you have this helper
import { UserType } from "@/interfaces"; // Make sure to import your UserType interface

const ClientDetails = ({ client }: { client: UserType }) => {
  const getProperty = ({ name, value }: { name: string; value: any }) => {
    return (
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs">{name}</span>
        <span className="text-gray-700 font-semibold text-sm">
          {value || "N/A"}
        </span>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center">
        <img
          src={client.profilePic || '/path/to/default-profile-pic.png'} // Use a default image if no profile pic
          alt={`${client.name}'s profile`}
          className="rounded-full w-10 h-10 object-cover mr-3 border border-gray-300"
        />
        <PageTitle title={client.name} />
      </div>

      <div className="bg-gray-100 p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-5 gap-7 border border-gray-300 border-solid">
        {getProperty({ name: "Name", value: client.name })}
        {getProperty({ name: "Id", value: client._id })}
        {getProperty({
          name: "Joined On",
          value: getDateTimeFormat(client.createdAt),
        })}

        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          {getProperty({ name: "Portfolio", value: client.portfolio })}
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <h1 className="text-sm text-gray-500">Bio</h1>
          <p className="text-gray-500 text-sm">{client.bio || "N/A"}</p>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <h1 className="text-sm text-gray-500">Skills</h1>
          <div className="flex flex-wrap gap-7 mt-2">
            {client.skills && client.skills.length > 0 ? (
              client.skills.map((skill: string) => (
                <div className="bg-info px-2 py-1 text-white text-xs" key={skill}>
                  {skill}
                </div>
              ))
            ) : (
              <div className="text-gray-700 font-semibold text-sm">No skills added</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
