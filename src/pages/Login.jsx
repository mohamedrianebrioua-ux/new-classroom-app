import { useState } from "react";
import { supabase } from "../lib/db";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

    async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setBusy(true);

    if (isLogin) {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message || "Login failed. Please check your email and password.");
        setIsError(true);
        setBusy(false);
      }
    } else {
      // SIGN UP
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name, role: "student" } },
      });

      if (error) {
        // This safely extracts the text from the error object
       const errorText = JSON.stringify(error);
        setMessage(errorText);
        setIsError(true);
        setBusy(false);
      } else {
        await supabase.auth.signOut(); 
        setMessage("Account created! Please log in below.");
        setIsError(false);
        setIsLogin(true); 
        setPassword(""); 
        setBusy(false);
      }
    }
  }
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 max-w-md mx-auto bg-white">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600">StudyApp</h1>
        <p className="text-sm text-gray-500 mt-2">Practice. Master. Be ready.</p>
      </div>

      <h2 className="text-xl font-bold mb-4 text-gray-800">
        {isLogin ? "Log in to your account" : "Create a new account"}
      </h2>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {!isLogin && (
          <input
            className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-gray-50"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-gray-50"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-gray-50"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <button
          disabled={busy}
          className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50 mt-2"
        >
          {busy ? "Please wait..." : isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
          }}
          className="text-sm text-indigo-600 font-bold hover:underline"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}