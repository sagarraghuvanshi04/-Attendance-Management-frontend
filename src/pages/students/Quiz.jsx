import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Trophy, Clock, CheckCircle, Award, History, Calendar } from "lucide-react";
import Loader from "../../components/Loader";

const Quiz = () => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempted, setAttempted] = useState(false);
  const [score, setScore] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [previousRecords, setPreviousRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("daily");

  useEffect(() => {
    fetchTodayQuiz();
    fetchLeaderboard();
    fetchPreviousRecords();
  }, []);

  const fetchTodayQuiz = async () => {
    try {
      const res = await api.get("/quiz/today");
      setQuiz(res.data.quiz);
      setAttempted(res.data.attempted);
      setScore(res.data.score);
      setAnswers(new Array(res.data.quiz.questions.length).fill(null));
    } catch (err) {
      console.error("Failed to fetch quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get("/quiz/leaderboard");
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      setLeaderboard([]);
    }
  };

  const fetchPreviousRecords = async () => {
    try {
      const res = await api.get("/quiz/my-records");
      setPreviousRecords(res.data.records || []);
    } catch (err) {
      setPreviousRecords([]);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) {
      toast.error("Please answer all questions");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/quiz/submit", {
        quizId: quiz._id,
        answers,
      });
      toast.success(`Quiz submitted! Score: ${res.data.score}/${res.data.total}`);
      setAttempted(true);
      setScore(res.data.score);
      fetchLeaderboard();
      fetchPreviousRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading Quiz..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("daily")}
          className={`px-4 py-3 font-bold transition-all ${
            activeTab === "daily"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Daily Quiz
        </button>
        <button
          onClick={() => setActiveTab("previous")}
          className={`px-4 py-3 font-bold transition-all flex items-center gap-2 ${
            activeTab === "previous"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <History size={18} />
          Previous Quiz
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`px-4 py-3 font-bold transition-all flex items-center gap-2 ${
            activeTab === "leaderboard"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Trophy size={18} />
          Leaderboard
        </button>
      </div>

      {/* Daily Quiz Tab */}
      {activeTab === "daily" && (
        <>
          {!quiz ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <Clock size={64} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-black text-slate-800 mb-2">No Quiz Today</h3>
              <p className="text-slate-500">Check back tomorrow for a new quiz!</p>
            </div>
          ) : attempted ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-2xl font-black text-green-700 mb-2">Quiz Completed!</h3>
              <p className="text-green-600 font-bold text-xl">
                Your Score: {score}/{quiz.questions.length}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">{quiz.title}</h2>
                  <p className="text-sm md:text-base text-slate-500 font-medium">
                    Duration: {quiz.duration} minutes
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {quiz.questions.map((q, qIndex) => (
                  <div key={qIndex} className="bg-white rounded-2xl p-6 border border-slate-100">
                    <h4 className="font-black text-slate-800 mb-4">
                      {qIndex + 1}. {q.question}
                    </h4>
                    <div className="space-y-2">
                      {q.options.map((option, oIndex) => (
                        <button
                          key={oIndex}
                          onClick={() => handleAnswerSelect(qIndex, oIndex)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                            answers[qIndex] === oIndex
                              ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                              : "border-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          {String.fromCharCode(65 + oIndex)}. {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Previous Quiz Tab */}
      {activeTab === "previous" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
            <History size={24} className="text-blue-500" />
            Previous Quiz Records
          </h3>
          {previousRecords.length > 0 ? (
            <div className="space-y-3">
              {previousRecords.map((record, index) => (
                <div key={record._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 font-black">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{record.quiz?.title || "Quiz"}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(record.attemptedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-indigo-600">{record.score}/{record.totalQuestions}</p>
                    <p className="text-xs text-slate-500 font-bold">{Math.round((record.score / record.totalQuestions) * 100)}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <History size={48} className="mx-auto mb-2 opacity-50" />
              <p className="font-bold">No previous quiz records</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
            <Award size={24} className="text-amber-500" />
            Top 10 Performers
          </h3>
          <div className="space-y-2">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div
                  key={entry._id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    index === 0
                      ? "bg-amber-50 border-2 border-amber-200"
                      : "bg-slate-50 border border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-black text-lg ${
                        index === 0
                          ? "text-amber-500"
                          : index === 1
                          ? "text-slate-400"
                          : index === 2
                          ? "text-orange-400"
                          : "text-slate-500"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{entry.student?.name}</p>
                      <p className="text-xs text-slate-500">{entry.student?.studentId}</p>
                    </div>
                  </div>
                  <span className="font-black text-indigo-600">{entry.score} pts</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Trophy size={48} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold">No leaderboard data yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
