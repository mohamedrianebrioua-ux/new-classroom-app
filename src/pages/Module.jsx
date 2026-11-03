import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/db";
import localforage from "localforage";
export default function Module() {
  const { id } = useParams(); // Gets the module ID from the URL
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
     async function load() {
      const cacheKeyLessons = `offline_lessons_${id}`;
      
      try {
        // 1. Fetch from internet
        const { data: m } = await supabase.from("modules").select("*").eq("id", id).single();
        setModule(m);

        const { data: l } = await supabase.from("lessons").select("*").eq("module_id", id).order("order");
        const lessonsData = l || [];
        setLessons(lessonsData);
        
        // 2. Save to phone
        await localforage.setItem(cacheKeyLessons, lessonsData);
      } catch (err) {
        // 3. Load from phone if offline
        console.log("Offline mode: loading lessons from device");
        const offlineData = await localforage.getItem(cacheKeyLessons);
        if (offlineData) setLessons(offlineData);
      }
    }
    load();
  }, [id]);

  if (!module) return <div className="p-6 text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <button onClick={() => navigate("/")} className="text-sm text-primary mb-4">
        ← Back to Home
      </button>

      <h1 className="text-2xl font-bold">{module.title}</h1>
      <p className="text-sm text-gray-500 mt-1">{module.description}</p>

      <h2 className="font-semibold mt-6 mb-3 text-gray-700">Lessons</h2>

      {lessons.length === 0 && <p className="text-sm text-gray-500">No lessons yet.</p>}

      <div className="space-y-3">
        {lessons.map((l, i) => (
          <button
            key={l.id}
            onClick={() => navigate(`/lesson/${l.id}`)} // We'll build this page next!
            className="w-full bg-white rounded-2xl p-4 border border-gray-100 text-left active:scale-95 transition flex justify-between items-center"
          >
            <div>
              <p className="text-xs text-gray-400">Lesson {i + 1}</p>
              <p className="font-semibold text-sm mt-0.5">{l.title}</p>
            </div>
            <span className="text-gray-300 text-xl">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}