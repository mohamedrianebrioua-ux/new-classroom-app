import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- NEW
import { supabase } from "../lib/db";
import localforage from "localforage";
export default function Home({ session }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // <-- NEW

  
  useEffect(() => {
        async function loadModules() {
      try {
        // 1. Try to get fresh data from Supabase
        const { data, error } = await supabase.from("modules").select("*").order("order");
        
        if (error) throw error;
        
        if (data) {
          setModules(data);
          // 2. Save to the phone for offline use!
          await localforage.setItem("offline_modules", data);
        }
      } catch (err) {
        // 3. If Supabase fails (no internet), load from the phone's memory!
        console.log("Offline mode: loading modules from device");
        const offlineData = await localforage.getItem("offline_modules");
        if (offlineData) setModules(offlineData);
      }
      setLoading(false);
    }
    loadModules();
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hi there! 👋</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg"
        >
          Log out
        </button>
      </div>

      <h2 className="font-semibold text-gray-700 mb-3">Your Modules</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading modules...</p>
      ) : modules.length === 0 ? (
        <p className="text-sm text-gray-500">No modules found. Add some in Supabase!</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {modules.map((m) => (
            // <-- NEW: changed from div to button and added onClick
            <button
              key={m.id}
              onClick={() => navigate(`/module/${m.id}`)}
              className="bg-white rounded-2xl p-4 border border-gray-100 text-left active:scale-95 transition"
            >
              <p className="font-semibold text-sm">{m.title}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}