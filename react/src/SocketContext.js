import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@clerk/clerk-react";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  const socketRef = useRef(null);
  const [socketState, setSocketState] = useState(null); // for context consumers

  useEffect(() => {
    const connectSocket = async () => {
      if (!isSignedIn) {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocketState(null);
        return;
      }

      const token = await getToken();
      const backend_url = process.env.REACT_APP_BACKEND_URL;
      const newSocket = io(backend_url, {
        auth: { token },
      });

      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket.id);
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socketRef.current = newSocket;
      setSocketState(newSocket);
    };

    connectSocket();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketState(null);
    };
  }, [isSignedIn]);

  return (
    <SocketContext.Provider value={socketState}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
