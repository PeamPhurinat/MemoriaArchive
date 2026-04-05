import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthPage = () => {
  const location = useLocation();
  const { loading, isAuthenticated, signIn, signUp, authError } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (loading) {
    return (
      <div className="ma-auth-page">
        <div className="ma-auth-card">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    const targetPath = location.state?.from?.pathname || "/";
    return <Navigate to={targetPath} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      if (mode === "signin") {
        await signIn({ email, password });
        return;
      }

      const response = await signUp({ email, password });
      if (!response?.session) {
        setMessage("Account created. Please check your email to confirm your account.");
      }
    } catch (submitError) {
      setError(submitError.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ma-auth-page">
      {/* Floating orbs */}
      <div className="ma-auth-orb ma-auth-orb-1" />
      <div className="ma-auth-orb ma-auth-orb-2" />
      <div className="ma-auth-orb ma-auth-orb-3" />

      <div className="ma-auth-wrapper">
        {/* Branding */}
        <div className="ma-auth-brand">
          <div className="ma-auth-brand-icon">✦</div>
          <span className="ma-auth-brand-name">Memoria</span>
        </div>

        <form className="ma-auth-card" onSubmit={handleSubmit}>
          <div className="ma-auth-header">
            <h1 className="ma-auth-title">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="ma-auth-subtitle">
              {mode === "signin"
                ? "Sign in to your memory archive"
                : "Start preserving your memories"}
            </p>
          </div>

          <div className="ma-auth-mode-row">
            <button
              type="button"
              className={`ma-auth-mode ${mode === "signin" ? "active" : ""}`}
              onClick={() => { setMode("signin"); setConfirmPassword(""); setError(""); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`ma-auth-mode ${mode === "signup" ? "active" : ""}`}
              onClick={() => { setMode("signup"); setConfirmPassword(""); setError(""); }}
            >
              Sign Up
            </button>
          </div>

          <div className="ma-auth-fields">
            <div className="ma-auth-field">
              <label className="ma-auth-label" htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                className="ma-auth-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="ma-auth-field">
              <label className="ma-auth-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                className="ma-auth-input"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            {mode === "signup" && (
              <div className="ma-auth-field">
                <label className="ma-auth-label" htmlFor="auth-confirm-password">Confirm Password</label>
                <input
                  id="auth-confirm-password"
                  className="ma-auth-input"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your password"
                />
              </div>
            )}
          </div>

          {(error || authError) ? <p className="ma-auth-error">{error || authError}</p> : null}
          {message ? <p className="ma-auth-message">{message}</p> : null}

          <button className="ma-auth-submit" type="submit" disabled={submitting}>
            {submitting ? (
              <span className="ma-auth-spinner" />
            ) : null}
            {submitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <p className="ma-auth-footer">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className="ma-auth-footer-link"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setConfirmPassword(""); setError(""); }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
