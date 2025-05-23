import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { base_path } from "./environment";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../src/style/css/feather.css";
import "../src/index.scss";
import store from "./core/data/redux/store";
import { Provider } from "react-redux";
import "../src/style/icon/boxicons/boxicons/css/boxicons.min.css";
import "../src/style/icon/weather/weathericons.css";
import "../src/style/icon/typicons/typicons.css";
import "../node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
import "../src/style/icon/ionic/ionicons.css";
import "../src/style/icon/tabler-icons/webfont/tabler-icons.css";
import ALLRoutes from "./feature-module/router/router";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
// Clerk

import { ClerkProvider, SignIn } from "@clerk/clerk-react";
import { SocketProvider } from "./SocketContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <React.StrictMode>
  <ClerkProvider
    publishableKey="pk_test_dXAtc2tpbmstNC5jbGVyay5hY2NvdW50cy5kZXYk"
    afterSignOutUrl="/"
  >
    <SocketProvider>
      <Provider store={store}>
        <BrowserRouter basename={base_path}>
          <ALLRoutes />
        </BrowserRouter>
      </Provider>
    </SocketProvider>
  </ClerkProvider>
  // </React.StrictMode>
);
