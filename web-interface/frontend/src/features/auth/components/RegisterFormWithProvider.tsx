import React from "react";
import { AuthProvider } from "../context/AuthContext";
import { RegisterForm } from "./RegisterForm";

export function RegisterFormWithProvider() {
  return (
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>
  );
}
