import React from "react";
import MenuItems from "./menu-items";
import { Menu } from "lucide-react";
import { Drawer } from "antd";

function Sidebar() {
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);
  return (
    <div className="overflow-hidden">
      <div className="bg-info px-5 py-2 lg:hidden">
        <Menu
          size={24}
          color="white"
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="cursor-pointer"
        />

        <Drawer open={showMobileSidebar} className="drawer" placement="left"
         onClose={() => setShowMobileSidebar(false)}
        >
          <MenuItems />
        </Drawer>
      </div>
      <div className="hidden lg:flex">
        <MenuItems />
      </div>
    </div>
  );
}

export default Sidebar;