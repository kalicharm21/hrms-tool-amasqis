import React from "react";
import { Route, Routes } from "react-router";
import { authRoutes, publicRoutes } from "./router.link";
import Feature from "../feature";
import AuthFeature from "../authFeature";
import { withRoleCheck } from "./withRoleCheck";

const ALLRoutes = () => {
  return (
    <>
      <Routes>
        <Route element={<Feature />}>
          {publicRoutes.map((route, idx) => {
            // Wrap the route element with withRoleCheck
            const ElementWithRoleCheck = withRoleCheck(
              () => route.element,
              route.roles
            );

            return (
              <Route
                path={route.path}
                element={<ElementWithRoleCheck />} // Pass the wrapped component as a JSX element
                key={idx}
              />
            );
          })}
        </Route>

        <Route element={<AuthFeature />}>
          {authRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>
      </Routes>
    </>
  );
};

export default ALLRoutes;
