import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Brain, Plus, X, Trash2 } from "lucide-react";

const ManageQuiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    duration: 10,
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ],
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await api.get("/quiz/all");
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/quiz/create", formData);
      toast.success("Quiz created successfully");
      setShowModal(false);
      resetForm();
      fetchQuizzes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create quiz");
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      duration: 10,
      questions: [
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Manage Quizzes</h2>
          <p className="text-slate-500 font-medium">Create daily quizzes for students</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} /> Create Quiz
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((quiz) => (
          <div key={quiz._id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <Brain size={32} className="text-indigo-600" />
              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-green-50 text-green-600">
                {quiz.questions.length} Questions
              </span>
            </div>
            <h3 className="font-black text-slate-800 mb-2">{quiz.title}</h3>
            <p className="text-sm text-slate-600 mb-1">
              Date: {new Date(quiz.date).toLocaleDateString()}
            </p>
            <p className="text-sm text-slate-600">Duration: {quiz.duration} minutes</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-800">Create New Quiz</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Quiz Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-800">Questions</h4>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-bold hover:bg-indigo-100"
                  >
                    + Add Question
                  </button>
                </div>

                {formData.questions.map((q, qIndex) => (
                  <div key={qIndex} className="bg-slate-50 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <label className="text-sm font-bold text-slate-700">Question {qIndex + 1}</label>
                      {formData.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                      placeholder="Enter question"
                      required
                    />

                    <div className="space-y-2">
                      {q.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctAnswer === oIndex}
                            onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                            className="w-4 h-4"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Create Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuiz;
