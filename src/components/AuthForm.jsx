import { useState } from "react";
import { signIn, signInWithGoogle, signUp } from "../lib/supabase.js";

function AuthForm({ isConfigured }) {
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      if (mode === "sign-up") {
        const { data, error: authError } = await signUp(email.trim(), password);
        if (authError) throw authError;
        if (!data.session) setMessage("Check your email to confirm your account, then sign in.");
      } else {
        const { error: authError } = await signIn(email.trim(), password);
        if (authError) throw authError;
      }
    } catch (authError) {
      setError(authError.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    try {
      const { error: authError } = await signInWithGoogle();
      if (authError) throw authError;
    } catch (authError) {
      setError(authError.message || "Google sign-in could not be started.");
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">YOUR PERSONAL LIBRARY</p>
        <h1 id="auth-title">Your things,<br />where you left them.</h1>
        <p className="auth-copy">Sign in to keep your links and files private and in sync.</p>
        {!isConfigured ? (
          <p className="status-message" role="alert">Add your Supabase URL and publishable key to the local environment file to enable sign-in.</p>
        ) : (
          <>
            <div className="auth-switch" role="group" aria-label="Account action">
              <button type="button" aria-pressed={mode === "sign-in"} onClick={() => changeMode("sign-in")}>Sign in</button>
              <button type="button" aria-pressed={mode === "sign-up"} onClick={() => changeMode("sign-up")}>Create account</button>
            </div>
            <button className="google-button" type="button" onClick={handleGoogleSignIn}>
              <span aria-hidden="true">G</span> Continue with Google
            </button>
            <div className="auth-divider"><span>or use email</span></div>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Email</span>
                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label className="field">
                <span>Password</span>
                <input type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              {message && <p className="auth-message" role="status">{message}</p>}
              <button className="add-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : mode === "sign-up" ? "Create account" : "Sign in"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default AuthForm;