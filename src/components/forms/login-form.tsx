"use client";

import { Eye, EyeOff, LogIn, User } from "lucide-react";
import { useState } from "react";

export default function LoginForm() {
  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // State for loading indicator during form submission
  const [isLoading, setIsLoading] = useState(false);

  // State for form input values
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // State for form validation errors
  const [errors, setErrors] = useState({ username: "", password: "" });

  // Handle form submission with validation
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = { username: "", password: "" };

    // Validate username field
    if (!username.trim()) {
      newErrors.username = "Username is required";
    }

    // Validate password field
    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    // Stop submission if there are validation errors
    if (newErrors.username || newErrors.password) {
      return;
    }

    // Simulate login process
    setIsLoading(true);
    try {
      console.log("Login button clicked (No auth logic)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 py-6">

      {/* Username Input Field */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text">
          Username
        </label>

        {/* Input container with dynamic border color for errors */}
        <div className={`
          flex items-center gap-3 rounded-md border bg-card px-3 transition
          ${errors.username ? "border-danger focus-within:ring-2 focus-within:ring-red-500" : "border-border focus-within:ring-2 focus-within:ring-blue-500"}
        `}>
          <User className="h-4 w-4 text-muted" />

          <input
            type="text"
            placeholder="your.username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              // Clear error when user starts typing
              if (e.target.value.trim()) {
                setErrors(prev => ({ ...prev, username: "" }));
              }
            }}
            className="h-10 flex-1 bg-transparent text-base text-text outline-none placeholder:text-muted"
          />
        </div>

        {/* Display username error message */}
        {errors.username && <span className="text-sm text-danger">{errors.username}</span>}
      </div>

      {/* Password Input Field */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text">
          Password
        </label>

        {/* Input container with dynamic border color for errors */}
        <div className={`
          flex items-center gap-3 rounded-md border bg-card px-3 transition
          ${errors.password ? "border-danger focus-within:ring-2 focus-within:ring-red-500" : "border-border focus-within:ring-2 focus-within:ring-blue-500"}
        `}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              // Clear error when user starts typing
              if (e.target.value.trim()) {
                setErrors(prev => ({ ...prev, password: "" }));
              }
            }}
            className="h-10 flex-1 bg-transparent text-base text-text outline-none placeholder:text-muted"
          />

          {/* Password visibility toggle button */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="flex items-center justify-center text-muted hover:text-text"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Display password error message */}
        {errors.password && <span className="text-sm text-danger">{errors.password}</span>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex h-10 w-full items-center justify-center gap-3 rounded-md bg-primary text-base font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" />
        {isLoading ? "Signing in..." : "Sign in"}
      </button>

    </form>
  );
}