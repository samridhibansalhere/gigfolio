import React from "react";
import { ConfigProvider } from "antd";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const primaryColor = "#000";
  return (
    <div>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: primaryColor,
            borderRadius: 0,
          },
          components: {
            Button: {
              controlOutline: "none",
              controlHeight: 42,
              defaultBg : '#D3D3D3',
              defaultHoverBg : '#A9A9A9',
              defaultHoverBorderColor : 'none',
            },
            Input: {
              controlHeight: 45,
              activeShadow: "none",
              controlOutline: "none",
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </div>
  );
}

export default ThemeProvider;