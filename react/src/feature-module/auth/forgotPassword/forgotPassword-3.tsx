"use client";

import React, { useState } from "react";
import { useAuth, useSignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [secondFactor, setSecondFactor] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();

  if (!isLoaded) {
    return null;
  }

  // Redirect signed-in users to the home page
  if (isSignedIn) {
    navigate("/");
    return null;
  }

  //
  // Send the password reset code to the user's email
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setSuccessfulCreation(true);
      setError("");
    } catch (err: any) {
      console.error("Error:", err.errors[0]?.longMessage);
      setError(err.errors[0]?.longMessage || "An error occurred.");
    }
  };

  // Reset the user's password and sign them in
  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "needs_second_factor") {
        setSecondFactor(true);
        setError("");
      } else if (result.status === "complete") {
        setActive({ session: result.createdSessionId });
        setError("");
        navigate("/");
      } else {
        console.log("Result:", result);
      }
    } catch (err: any) {
      console.error("Error:", err.errors[0]?.longMessage);
      setError(err.errors[0]?.longMessage || "An error occurred.");
    }
  };

  return (
    <div style={{ margin: "auto", maxWidth: "500px" }}>
      <h1>Forgot Password?</h1>
      <form
        style={{ display: "flex", flexDirection: "column", gap: "1em" }}
        onSubmit={!successfulCreation ? create : reset}
      >
        {!successfulCreation && (
          <>
            <label htmlFor="email">Provide your email address</label>
            <input
              type="email"
              placeholder="e.g john@doe.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Send password reset code</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </>
        )}

        {successfulCreation && (
          <>
            <label htmlFor="password">Enter your new password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label htmlFor="code">
              Enter the password reset code that was sent to your email
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <button type="submit">Reset</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </>
        )}

        {secondFactor && (
          <p style={{ color: "orange" }}>
            2FA is required, but this UI does not handle that.
          </p>
        )}
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
