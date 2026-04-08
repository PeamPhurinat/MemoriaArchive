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

    try {
      if (mode === "signin") {
        await signIn({ email, password });
        return;
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
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
      <div className="ma-auth-shell">
        <section className="ma-auth-panel">
          <div className="ma-auth-brand">
            <span className="ma-auth-brand-mark" aria-hidden="true">M</span>
            <span className="ma-auth-brand-name">Memoria Archive</span>
          </div>

          <form className="ma-auth-card" onSubmit={handleSubmit}>
            <div className="ma-auth-header">
              <h1 className="ma-auth-title">
                {mode === "signin" ? "Welcome back" : "Create account"}
              </h1>
              <p className="ma-auth-subtitle">
                {mode === "signin"
                  ? "Sign in to continue your archive."
                  : "Create your account to start preserving memories."}
              </p>
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
                  placeholder="Enter email address"
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
                  placeholder={mode === "signin" ? "Enter password" : "At least 6 characters"}
                />
              </div>

              {mode === "signup" ? (
                <div className="ma-auth-field">
                  <label className="ma-auth-label" htmlFor="auth-confirm-password">
                    Confirm password
                  </label>
                  <input
                    id="auth-confirm-password"
                    className="ma-auth-input"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
              ) : null}
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
                  ? "Continue"
                  : "Create account"}
            </button>
          </form>

          <p className="ma-auth-footer">
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button
              type="button"
              className="ma-auth-footer-link"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setMessage("");
                setConfirmPassword("");
              }}
            >
              {mode === "signin" ? "Create one" : "Sign in instead"}
            </button>
          </p>

          <p className="ma-auth-legal">
            By continuing, you agree to Memoria&apos;s Terms of Service and Privacy Policy.
          </p>
        </section>

        <aside className="ma-auth-visual" aria-hidden="true">
          <div className="ma-auth-collage">
            <article className="ma-auth-tile ma-auth-tile-a">
              <span>Memory boards</span>
            </article>
            <article className="ma-auth-tile ma-auth-tile-b">
              <span>Voice stories</span>
            </article>
            <article className="ma-auth-tile ma-auth-tile-c">
              <span>3D halls</span>
            </article>
            <article className="ma-auth-tile ma-auth-tile-d">
              <span>Shared links</span>
            </article>
            <article className="ma-auth-tile ma-auth-tile-e">
              <span>Family gallery</span>
            </article>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AuthPage;
