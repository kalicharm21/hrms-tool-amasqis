import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { all_routes } from "../../router/all_routes";

const Validate = () => {
  const { isSignedIn, user } = useUser();
  const routes = all_routes;
  const navigate = useNavigate();
  useEffect(() => {
    if (!isSignedIn || !user) {
      navigate(routes.login);
    }

    console.log("Hihihi");
    // const publicMetadata = user?.publicMetadata || {};
    // const subdomain = publicMetadata?.subdomain;

    // if (subdomain) {
    //   window.location.href = `http://${subdomain}.localhost:3000/employee-dashboard`;
    // } else {
    //   window.location.href = `http://localhost:3000/employee-dashboard`;
    // }

    navigate(routes.superAdminCompanies);

    // Logics for multitenancy system
  }, [isSignedIn, user]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "white",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="loader" />
      <style>{`
        .loader {
          border: 6px solid #f3f3f3;
          border-top: 6px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Validate;
