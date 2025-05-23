import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { all_routes } from "./all_routes";

const routes = all_routes;

export const withRoleCheck = (Component, allowedRoles) => {
  return function WrappedComponent(props) {
    const { isLoaded, user } = useUser();

    if (!isLoaded) {
      return <p>Loading...</p>;
    }

    const userRole = user?.publicMetadata?.role || "public"; // Default to "public" if no role is found
    console.log("User Role:", userRole);

    if (allowedRoles.includes(userRole) || allowedRoles.includes("public")) {
      return <Component {...props} />;
    } else {
      switch (userRole) {
        case "superadmin":
          return <Navigate to={routes.superAdminDashboard} />;
        default:
          return <Navigate to={routes.validate} />;
      }
    }
  };
};

export default withRoleCheck;
