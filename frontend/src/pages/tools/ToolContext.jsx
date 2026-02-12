import React, { createContext, useContext, useState } from "react";

const ToolContext = createContext();

export function ToolProvider({ children }) {
  const [tools, setTools] = useState({});

  function installTool(id) {
    setTools((prev) => ({
      ...prev,
      [id]: {
        status: "installing",
        progress: 0,
      },
    }));

    // Simulated deployment lifecycle
    let progress = 0;

    const interval = setInterval(() => {
      progress += 20;

      setTools((prev) => ({
        ...prev,
        [id]: {
          status: progress >= 100 ? "installed" : "installing",
          progress,
        },
      }));

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 600);
  }

  function uninstallTool(id) {
    setTools((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  return (
    <ToolContext.Provider
      value={{
        tools,
        installTool,
        uninstallTool,
      }}
    >
      {children}
    </ToolContext.Provider>
  );
}

export function useTools() {
  return useContext(ToolContext);
}
