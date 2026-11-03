import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/db";
import localforage from "localforage";

export default function Practice({ session }) {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activityFilter = searchParams.get("activity") || "General Practice";

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [openAnswer, setOpenAnswer] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Match State
  const [matchState, setMatchState] = useState({ A: null, B: null, C: null });
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    async function loadQuestions() {
      const cacheKey = `offline_questions_${lessonId}`;
      try {
        const { data } = await supabase.from("questions").select("*").eq("lesson_id", lessonId);
        const filtered = (data || []).filter(q => (q.activity_title || "General Practice") === activityFilter);
        setQuestions(filtered.sort(() => Math.random() - 0.5));
        await localforage.setItem(cacheKey, data);
      } catch (err) {
        const offlineData = (await localforage.getItem(cacheKey)) || [];
        const filtered = offlineData.filter(q => (q.activity_title || "General Practice") === activityFilter);
        setQuestions(filtered.sort(() => Math.random() - 0.5));
      }
      setLoading(false);
    }
    loadQuestions();
  }, [lessonId, activityFilter]);

  const currentQ = questions[currentIndex];

  async function handleChoice(choice) {
    if (showExplanation) return;
    setSelected(choice);
    setShowExplanation(true);
    const isCorrect = choice === currentQ.correct;
    if (isCorrect) setScore(score + 1);
    try { await supabase.from("attempts").insert({ student_id: session.user.id, question_id: currentQ.id, chosen: choice, is_correct: isCorrect }); } catch (err) {}
  }

  // Handle Match logic
  function handleMatch(category) {
    if (showExplanation || !selectedCard) return;
    setMatchState({ ...matchState, [category]: selectedCard });
    setSelectedCard(null);
  }

  async function checkMatch() {
    // Build the result string (e.g., "A-B-C-D" or "A-B-C")
    const parts = currentQ.correct.split("-");
    const resultArray = parts.map((_, i) => {
      const catId = ["A", "B", "C", "D"][i];
      return matchState[catId]?.letter || "X";
    });
    
    const resultString = resultArray.join("-");
    const isCorrect = resultString === currentQ.correct;
    
    setSelected(resultString);
    setShowExplanation(true);
    
    if (isCorrect) setScore(score + 1);
    try { await supabase.from("attempts").insert({ student_id: session.user.id, question_id: currentQ.id, chosen: resultString, is_correct: isCorrect }); } catch (err) {}
  }
  function nextQuestion() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null); setOpenAnswer(""); setShowExplanation(false); setMatchState({ A: null, B: null, C: null });
    } else setFinished(true);
  }

  if (loading) return <div className="p-6 text-center mt-10">Loading Quiz...</div>;
  if (questions.length === 0) return <div className="p-6 text-center mt-10">No questions found.</div>;

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto px-4 pt-10 text-center">
        <h1 className="text-2xl font-bold mb-2">{activityFilter} Complete!</h1>
        <div className="my-8">
          <div className={`text-7xl font-black mb-2 ${percentage >= 80 ? "text-green-500" : "text-amber-500"}`}>{score} <span className="text-4xl text-gray-300">/ {questions.length}</span></div>
          <p className="text-lg font-bold text-gray-600">{percentage}% Score</p>
        </div>
        <button onClick={() => navigate(-1)} className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg">Back to Lesson</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <div className="flex justify-between items-center mb-2">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 font-medium">Exit</button>
        <p className="text-sm text-gray-500 font-medium">Question {currentIndex + 1} of {questions.length}</p>
      </div>
      <div className="h-2 bg-gray-200 rounded-full mb-6">
        <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${((currentIndex + (showExplanation ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      <h2 className="text-lg font-bold mb-4 text-gray-900">{currentQ.text}</h2>

          {/* --- MATCH (DUOLINGO) RENDER --- */}
      {currentQ.type === 'match' && (
        <div className="space-y-6 mt-4">
          
          {/* Top Section: The Sentences */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tap a sentence:</p>
            {["A", "B", "C"].map(letter => {
              const optionText = currentQ[`option_${letter.toLowerCase()}`];
              const isPlaced = Object.values(matchState).some(item => item?.letter === letter);
              
              if (isPlaced) return null; // Hide if already placed
              
              return (
                <button 
                  key={letter} 
                  onClick={() => setSelectedCard({ letter, text: optionText })}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all shadow-sm ${
                    selectedCard?.letter === letter 
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <span className="font-bold text-indigo-600 mr-2">{letter}.</span> 
                  <span className="text-gray-800 text-sm leading-relaxed">{optionText}</span>
                </button>
              );
            })}
            {Object.values(matchState).filter(Boolean).length === 3 && (
              <p className="text-sm text-gray-400 text-center italic mt-2">All sentences placed.</p>
            )}
          </div>

                    {/* Bottom Section: The Drop Zones */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            {(() => {
              // Dynamically figure out how many boxes to show based on the correct answer string
              // If the answer is "A-B-C", it shows 3 boxes. If "A-B-C-D", it shows 4 boxes.
              const parts = currentQ.correct.split("-");
              const labels = parts.length === 4 
                ? ["Audience", "Behaviour", "Condition", "Degree"] 
                : ["Aim", "Goal", "Objective"];

              return labels.map((label, index) => {
                const catId = ["A", "B", "C", "D"][index]; // The key to store it (A, B, C, or D)
                const correctLetter = parts[index]; // The correct letter for this box

                return (
                  <div key={catId} className="flex flex-col gap-1">
                    <div className="font-bold text-gray-700 text-sm">{label}:</div>
                    <button 
                      onClick={() => handleMatch(catId)}
                      className={`w-full min-h-[50px] text-left p-3 rounded-lg border-2 border-dashed flex items-center transition-all ${
                        matchState[catId] 
                          ? (showExplanation 
                              ? (matchState[catId].letter === correctLetter ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') 
                              : 'border-indigo-400 bg-white shadow-sm') 
                          : 'border-gray-300 bg-gray-100 text-gray-400'
                      }`}
                    >
                      {matchState[catId] ? (
                        <div className="text-sm">
                          <span className="font-bold mr-1">{matchState[catId].letter}.</span>
                          <span className="text-gray-800">{matchState[catId].text}</span>
                        </div>
                      ) : (
                        <span className="text-sm mx-auto">Tap to place here</span>
                      )}
                    </button>
                  </div>
                );
              });
            })()}
          </div>

          {!showExplanation && (
            <button 
              onClick={checkMatch} 
              disabled={!matchState.A || !matchState.B || !matchState.C} 
              className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50"
            >
              Check Answer
            </button>
          )}
        </div>
      )}
      {/* --- OTHER TYPES (QCM, T/F, ODD, OPEN) --- */}
      {currentQ.type === 'true_false' && (
        <div className="flex gap-3 mt-6">
          <button onClick={() => handleChoice("A")} className={`flex-1 h-16 rounded-xl font-bold text-lg border-2 ${showExplanation ? (currentQ.correct === 'A' ? 'bg-green-100 border-green-500' : (selected === 'A' ? 'bg-red-100 border-red-500' : 'bg-white opacity-50')) : 'bg-white'}`}>True</button>
          <button onClick={() => handleChoice("B")} className={`flex-1 h-16 rounded-xl font-bold text-lg border-2 ${showExplanation ? (currentQ.correct === 'B' ? 'bg-green-100 border-green-500' : (selected === 'B' ? 'bg-red-100 border-red-500' : 'bg-white opacity-50')) : 'bg-white'}`}>False</button>
        </div>
      )}

      {(currentQ.type === 'odd_one_out' || currentQ.type === 'qcm' || currentQ.type === null) && (
        <div className="space-y-3">
          {["A", "B", "C", "D"].map((letter) => {
            const optionText = currentQ[`option_${letter.toLowerCase()}`];
            if (!optionText) return null;
            let btnStyle = "bg-white border-gray-200 text-gray-800";
            if (showExplanation) {
              if (letter === currentQ.correct) btnStyle = "bg-green-50 border-green-500 text-green-900";
              else if (letter === selected) btnStyle = "bg-red-50 border-red-500 text-red-900";
              else btnStyle = "bg-white border-gray-200 text-gray-400 opacity-50";
            }
            return (
              <button key={letter} disabled={showExplanation} onClick={() => handleChoice(letter)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${btnStyle}`}>
                <span className="font-bold mr-3">{letter}</span><span className="font-medium">{optionText}</span>
              </button>
            );
          })}
        </div>
      )}

      {currentQ.type === 'open' && !showExplanation && (
        <div className="space-y-3 mt-4">
          <textarea className="w-full h-32 p-4 rounded-xl border-2 border-gray-200" placeholder="Type your answer..." value={openAnswer} onChange={(e) => setOpenAnswer(e.target.value)} />
          <button onClick={() => setShowExplanation(true)} disabled={openAnswer.length < 3} className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50">Show Model Answer</button>
        </div>
      )}

      {/* --- EXPLANATION BOX --- */}
      {showExplanation && (
        <div className="mt-6">
          <div className={`p-4 rounded-xl border ${currentQ.type === 'open' ? "bg-indigo-50 border-indigo-200" : (currentQ.type === 'match' ? (selected === currentQ.correct ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200") : (selected === currentQ.correct ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"))}`}>
            <p className="font-bold text-sm mb-1">
              {currentQ.type === 'open' ? "Model Answer" : (selected === currentQ.correct || (currentQ.type === 'match' && selected === currentQ.correct) ? "✅ Correct!" : "❌ Not quite.")}
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{currentQ.explanation}</p>
          </div>
          <button onClick={nextQuestion} className="mt-4 w-full h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg">
            {currentIndex + 1 < questions.length ? "Next Question" : "See Results"}
          </button>
        </div>
      )}
    </div>
  );
}