import React from "react";
import { AuthProvider } from "../context/AuthContext";
import { LoginForm } from "./LoginForm";

export function LoginFormWithProvider() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
