import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/db";
import localforage from "localforage";

export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [activities, setActivities] = useState([]); // Now stores grouped activities

  useEffect(() => {
    async function load() {
      const cacheKeyLesson = `offline_lesson_${id}`;
      const cacheKeyQuestions = `offline_questions_${id}`;

      try {
        const { data: l } = await supabase.from("lessons").select("*").eq("id", id).single();
        setLesson(l);

        const { data: q } = await supabase.from("questions").select("*").eq("lesson_id", id);
        
        // Group questions by activity_title
        const grouped = (q || []).reduce((acc, question) => {
          const actTitle = question.activity_title || "General Practice";
          if (!acc[actTitle]) acc[actTitle] = [];
          acc[actTitle].push(question);
          return acc;
        }, {});

        // Convert object to array for rendering
        const activitiesArray = Object.keys(grouped).map(title => ({
          title,
          questions: grouped[title]
        }));

        setActivities(activitiesArray);

        await localforage.setItem(cacheKeyLesson, l);
        await localforage.setItem(cacheKeyQuestions, q);
      } catch (err) {
        const offlineLesson = await localforage.getItem(cacheKeyLesson);
        const offlineQs = await localforage.getItem(cacheKeyQuestions) || [];
        
        if (offlineLesson) setLesson(offlineLesson);
        
        const grouped = offlineQs.reduce((acc, question) => {
          const actTitle = question.activity_title || "General Practice";
          if (!acc[actTitle]) acc[actTitle] = [];
          acc[actTitle].push(question);
          return acc;
        }, {});
        setActivities(Object.keys(grouped).map(title => ({ title, questions: grouped[title] })));
      }
    }
    load();
  }, [id]);

  if (!lesson) return <div className="p-6 text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <button onClick={() => navigate(-1)} className="text-sm text-primary mb-4 font-medium text-indigo-600">
        ← Back
      </button>

      <h1 className="text-2xl font-bold">{lesson.title}</h1>

      {lesson.summary && (
        <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-xs font-bold text-indigo-600 mb-1">IN ONE SENTENCE</p>
          <p className="text-sm text-gray-800">{lesson.summary}</p>
        </div>
      )}

          {lesson.body && (
        <div className="mt-6 text-[15px] leading-relaxed text-gray-800">
          {lesson.body.split("\n").map((line, i) => {
            // Check if the line is an image link
            if (line.match(/\.(jpeg|jpg|gif|png)$/) != null && line.startsWith("http")) {
              return (
                <img 
                  key={i} 
                  src={line.trim()} 
                  alt="Lesson illustration" 
                  className="w-full rounded-xl my-4 shadow-sm" 
                />
              );
            }
            // Otherwise, just show the text
            return <p key={i} className="mb-2">{line}</p>;
          })}
        </div>
      )}
      {lesson.common_mistakes && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-700 mb-1">⚠️ COMMON MISTAKES</p>
          <p className="text-sm text-amber-900 whitespace-pre-line">{lesson.common_mistakes}</p>
        </div>
      )}

      {lesson.key_points && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-600 mb-1">📌 KEY POINTS</p>
          <p className="text-sm text-gray-800 whitespace-pre-line">{lesson.key_points}</p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-bold text-gray-800 mb-3">Practice Activities</h2>
        {activities.length === 0 && <p className="text-sm text-gray-500">No activities yet.</p>}
        
        <div className="space-y-3">
          {activities.map((act) => (
            <button
              key={act.title}
              onClick={() => navigate(`/practice/${lesson.id}?activity=${encodeURIComponent(act.title)}`)}
              className="w-full bg-white rounded-2xl p-4 border border-gray-200 text-left flex justify-between items-center active:scale-95 transition"
            >
              <div>
                <p className="font-semibold text-gray-800">{act.title}</p>
                <p className="text-xs text-gray-500">{act.questions.length} questions</p>
              </div>
              <span className="text-indigo-600 text-xl font-bold">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}