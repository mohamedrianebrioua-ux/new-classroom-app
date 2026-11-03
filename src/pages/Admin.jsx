import { useState, useEffect } from "react";

import { supabase } from "../lib/db";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("add");
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [saving, setSaving] = useState(false);

  // Form State
  const [activityTitle, setActivityTitle] = useState("Activity 1");
  const [type, setType] = useState("qcm");
  const [text, setText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correct, setCorrect] = useState("A");
  const [explanation, setExplanation] = useState("");

  // Manage State
  const [existingQuestions, setExistingQuestions] = useState([]);

  useEffect(() => {
    async function loadLessons() {
      const { data } = await supabase.from("lessons").select("id, title");
      setLessons(data || []);
    }
    loadLessons();
  }, []);

  async function loadQuestions() {
    if (!selectedLessonId) return;
    const { data } = await supabase.from("questions").select("*").eq("lesson_id", selectedLessonId).order("activity_title");
    setExistingQuestions(data || []);
  }

  useEffect(() => {
    if (activeTab === "manage") loadQuestions();
  }, [activeTab, selectedLessonId]);

  async function saveQuestion(e) {
    e.preventDefault();
    if (!selectedLessonId) return alert("Select a lesson first!");
    
    setSaving(true);
    
    // For the 'match' type, 'correct' stores the correct sequence (e.g., "A-B-C")
    const { error } = await supabase.from("questions").insert({
      lesson_id: selectedLessonId,
      activity_title: activityTitle,
      type,
      text,
      option_a: (type === 'qcm' || type === 'odd_one_out' || type === 'match') ? optionA : null,
      option_b: (type === 'qcm' || type === 'odd_one_out' || type === 'match') ? optionB : null,
      option_c: (type === 'qcm' || type === 'odd_one_out' || type === 'match') ? optionC : null,
      option_d: (type === 'qcm') ? optionD : null,
      correct,
      explanation,
    });

    setSaving(false);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      alert("✅ Question saved successfully!");
      setText(""); setOptionA(""); setOptionB(""); setOptionC(""); setOptionD(""); setExplanation("");
    }
  }

  async function deleteQuestion(id) {
    if (!window.confirm("Delete this question?")) return;
    await supabase.from("questions").delete().eq("id", id);
    loadQuestions();
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("add")} className={`flex-1 p-3 rounded-xl font-bold ${activeTab === "add" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}`}>Add</button>
        <button onClick={() => setActiveTab("manage")} className={`flex-1 p-3 rounded-xl font-bold ${activeTab === "manage" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}`}>Manage</button>
      </div>

      <div className="bg-gray-100 p-4 rounded-xl mb-4">
        <label className="text-sm font-bold text-gray-700 block mb-1">Select Lesson</label>
        <select className="w-full p-3 rounded-xl border" value={selectedLessonId} onChange={(e) => setSelectedLessonId(e.target.value)}>
          <option value="">-- Choose --</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>

      {activeTab === "add" && (
        <form onSubmit={saveQuestion} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Activity</label>
              <input className="w-full p-3 rounded-xl border" value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Type</label>
              <select className="w-full p-3 rounded-xl border" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="qcm">QCM (4 Options)</option>
                <option value="true_false">True / False</option>
                <option value="odd_one_out">Odd One Out</option>
                <option value="open">Open Answer</option>
                <option value="match">Match (Duolingo Style)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold block mb-1">Question / Instructions</label>
            <textarea className="w-full p-3 rounded-xl border" value={text} onChange={(e) => setText(e.target.value)} required />
          </div>

          {(type === "qcm" || type === "odd_one_out" || type === "match") && (
            <div className="space-y-2">
              <input className="w-full p-3 rounded-xl border" placeholder="Option A" value={optionA} onChange={(e) => setOptionA(e.target.value)} required />
              <input className="w-full p-3 rounded-xl border" placeholder="Option B" value={optionB} onChange={(e) => setOptionB(e.target.value)} required />
              <input className="w-full p-3 rounded-xl border" placeholder="Option C" value={optionC} onChange={(e) => setOptionC(e.target.value)} required />
              {type === "qcm" && <input className="w-full p-3 rounded-xl border" placeholder="Option D" value={optionD} onChange={(e) => setOptionD(e.target.value)} required />}
            </div>
          )}

          {type !== "open" && (
            <div>
              <label className="text-sm font-bold block mb-1">Correct Answer</label>
              <select className="w-full p-3 rounded-xl border" value={correct} onChange={(e) => setCorrect(e.target.value)}>
                {type === "true_false" ? (
                  <>
                    <option value="A">True (A)</option>
                    <option value="B">False (B)</option>
                  </>
                ) : type === "match" ? (
                  <>
                    <option value="A-B-C">A (Aim), B (Goal), C (Objective)</option>
                    <option value="A-C-B">A (Aim), C (Goal), B (Objective)</option>
                    <option value="B-A-C">B (Aim), A (Goal), C (Objective)</option>
                    <option value="B-C-A">B (Aim), C (Goal), A (Objective)</option>
                    <option value="C-A-B">C (Aim), A (Goal), B (Objective)</option>
                    <option value="C-B-A">C (Aim), B (Goal), A (Objective)</option>
                  </>
                ) : (
                  <>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    {type === "qcm" && <option value="D">Option D</option>}
                  </>
                )}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-bold block mb-1">Explanation</label>
            <textarea className="w-full p-3 rounded-xl border" value={explanation} onChange={(e) => setExplanation(e.target.value)} required />
          </div>

          <button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-purple-600 text-white font-bold">
            {saving ? "Saving..." : "Save Question"}
          </button>
        </form>
      )}

      {activeTab === "manage" && (
        <div className="space-y-3">
          {existingQuestions.map((q) => (
            <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">{q.activity_title} ({q.type})</span>
                <button onClick={() => deleteQuestion(q.id)} className="text-red-500 text-sm font-bold">Delete</button>
              </div>
              <p className="font-medium text-gray-800 text-sm">{q.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}