// contexts/UserContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import { User_model } from "../../services/authService"; // Import User từ authService

interface UserContextType {
  user: User_model | null;
  setUser: (user: User_model | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User_model | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};