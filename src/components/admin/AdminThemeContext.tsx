"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type AdminTheme = "light" | "dark";

export interface AdminThemeContextType {
  theme: AdminTheme;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
  transparentSidebar: boolean;
  setTransparentSidebar: (transparent: boolean) => void;
  toggleTransparentSidebar: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "pf_admin_theme";
const SIDEBAR_TRANSPARENT_KEY = "pf_admin_transparent_sidebar";

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to dark mode for Purple Friday Atelier aesthetic, or load saved preference
  const [theme, setThemeState] = useState<AdminTheme>("dark");
  // Default to transparent frosted sidebar visual mode
  const [transparentSidebar, setTransparentSidebarState] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as AdminTheme | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
      }
      const savedTransparent = localStorage.getItem(SIDEBAR_TRANSPARENT_KEY);
      if (savedTransparent !== null) {
        setTransparentSidebarState(savedTransparent === "true");
      }
    } catch {
      // Fallback to default
    }
  }, []);

  const setTheme = (newTheme: AdminTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore write errors
    }
  };

  const toggleTheme = () => {
    const nextTheme: AdminTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const setTransparentSidebar = (transparent: boolean) => {
    setTransparentSidebarState(transparent);
    try {
      localStorage.setItem(SIDEBAR_TRANSPARENT_KEY, String(transparent));
    } catch {
      // Ignore write errors
    }
  };

  const toggleTransparentSidebar = () => {
    setTransparentSidebar(!transparentSidebar);
  };

  return (
      <AdminThemeContext.Provider
        value={{
          theme,
          toggleTheme,
          setTheme,
          transparentSidebar,
          setTransparentSidebar,
          toggleTransparentSidebar,
        }}
      >
        <div
          data-admin-root="true"
          data-theme={theme}
          data-transparent-sidebar={transparentSidebar ? "true" : "false"}
          className={`admin-portal min-h-screen ${theme === "dark" ? "admin-dark" : "admin-light"
            } transition-colors duration-200`}
        >
          {children}
        </div>
      </AdminThemeContext.Provider>
      );
}

export function useAdminTheme(): AdminThemeContextType {
  const context = useContext(AdminThemeContext);
      if (!context) {
      return {
        theme: "dark",
      toggleTheme: () => { },
      setTheme: () => { },
      transparentSidebar: true,
      setTransparentSidebar: () => { },
      toggleTransparentSidebar: () => { },
    };
  }
      return context;
}
