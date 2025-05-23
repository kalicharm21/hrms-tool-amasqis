import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { io } from "socket.io-client";

const Validate = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  // const backendUrl = "http://127.0.0.1:5000";

  useEffect(() => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    const isNewUser = user.createdAt
      ? new Date(user.createdAt).getTime() > Date.now() - 60000
      : false;

    // const initializeSocket = async () => {
    //   try {
    //     const token = await getToken();
    //     if (!token) {
    //       throw new Error("No token found");
    //     }

    //     const socket = io(backendUrl, {
    //       auth: { token },
    //     });

    //     socket.on("connect", () => {
    //       console.log("Connected to Socket.IO server");
    //     });

    //     socket.on("connect_error", (err) => {
    //       console.error("Socket.IO connection error:", err.message);
    //     });

    //     // Clean up socket connection on unmount
    //     return () => {
    //       socket.disconnect();
    //     };
    //   } catch (err) {
    //     console.error("Error connecting to Socket.IO:", err.message);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

    // initializeSocket();

    if (isNewUser) {
      // alert("Welcome, new user!");s
      navigate("/employee-dashboard"); // Redirect new users
    } else {
      // alert("Welcome back!");
      navigate("/employee-dashboard"); // Redirect returning users
    }
  }, [isSignedIn, user, navigate, getToken]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>Validating...</div>;
};

export default Validate;
