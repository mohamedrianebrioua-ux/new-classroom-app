import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/db";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Module from "./pages/Module";
import Lesson from "./pages/Lesson";     // <-- NEW
import Practice from "./pages/Practice"; // <-- NEW
import Admin from "./pages/Admin";
export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <div className="p-6 text-center mt-10">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={session ? <Home session={session} /> : <Navigate to="/login" />} />
        <Route path="/module/:id" element={session ? <Module /> : <Navigate to="/login" />} />
        <Route path="/admin" element={session ? <Admin /> : <Navigate to="/login" />} />
        {/* NEW ROUTES */}
        <Route path="/lesson/:id" element={session ? <Lesson /> : <Navigate to="/login" />} />
        <Route path="/practice/:lessonId" element={session ? <Practice session={session} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}