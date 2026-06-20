import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import InputForm from "../components/InputForm";
import ResultDisplay from "../components/ResultDisplay";
import Charts from "../components/Charts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { chatWithAI } from "../services/api";

function Dashboard({ setIsLoggedIn, onBackToHome, setAnalysisData }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', text: 'Hello! I\'m your personal finance assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [customGoals, setCustomGoals] = useState([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [growthRate, setGrowthRate] = useState(3); // in percent
  const [monthsCount, setMonthsCount] = useState(12);
  const [roundPlan, setRoundPlan] = useState(false);

  const printRef = useRef(null);

  // Clear result when dashboard loads (fresh session or after logout/login)
  useEffect(() => {
    setResult(null);
    setChatMessages([
      { type: 'ai', text: 'Hello! I\'m your personal finance assistant. How can I help you today?' }
    ]);
  }, []);

  const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  const handleSubmit = async (data) => {
    // Clear previous results immediately when starting new analysis
    setResult(null);
    setError("");
    setLoading(true);
    const token = localStorage.getItem("token");

    const payload = {
      ...data,
      goals: customGoals.length > 0 ? customGoals.map((g) => ({ name: g.name, target_amount: g.target, years: 5 })) : data.goals,
    };

    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to fetch analysis data");
      }

      const result = await res.json();
      setResult(result);
      setAnalysisData(result);
    } catch (err) {
      setResult(null);
      setError(err.message || "An error occurred while fetching analysis data.");
      console.error("Dashboard handleSubmit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const addGoal = () => {
    if (!newGoalName.trim() || !newGoalTarget.trim()) return;
    setCustomGoals((prev) => [
      ...prev,
      { id: Date.now(), name: newGoalName.trim(), target: Number(newGoalTarget) || 0 },
    ]);
    setNewGoalName("");
    setNewGoalTarget("");
  };

  const removeGoal = (id) => {
    setCustomGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  const moveGoal = (id, direction) => {
    setCustomGoals((prev) => {
      const idx = prev.findIndex((goal) => goal.id === id);
      if (idx === -1) return prev;
      const newIndex = idx + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const clone = [...prev];
      [clone[idx], clone[newIndex]] = [clone[newIndex], clone[idx]];
      return clone;
    });
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Add user message
    setChatMessages(prev => [...prev, { type: 'user', text: chatInput }]);

    try {
      const response = await chatWithAI(chatInput, result ? {
        income: result.sip * 5, // Approximate income from SIP
        expenses: result.sip * 3, // Approximate expenses
        savings: result.emergency_fund || 0,
        risk_profile: result.risk_profile || 'medium',
        age: 30 // Default
      } : null);

      const data = response.data;
      setChatMessages(prev => [...prev, { type: 'ai', text: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback response
      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: "I'm here to help with your financial questions! Please try asking about investments, taxes, savings, or retirement planning."
      }]);
    }

    setChatInput('');
  };

  const exportToPDF = async () => {
    try {
      if (!printRef.current) {
        alert('Content not ready for export');
        return;
      }

      const element = printRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a',
        scale: 1.2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: 1024,
        letterSpacing: 0,
      });

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm for A4
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm for A4
      const margin = 12;
      const contentWidth = pageWidth - 2 * margin;

      // Calculate proportional height
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/png', 0.85);

      // Effective available space per page
      const availableHeight = pageHeight - 2 * margin;

      // If content fits in one page, just add it
      if (imgHeight <= availableHeight) {
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, imgHeight);
      } else {
        // Multi-page: split canvas proportionally
        let heightRemaining = imgHeight;
        let srcTop = 0;
        let pageNum = 0;

        while (heightRemaining > 0) {
          if (pageNum > 0) {
            pdf.addPage();
          }

          const heightToDraw = Math.min(availableHeight, heightRemaining);
          const srcHeight = (heightToDraw * canvas.width) / contentWidth;

          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = canvas.width;
          croppedCanvas.height = srcHeight;
          const ctx = croppedCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, srcTop, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);

          const croppedImgData = croppedCanvas.toDataURL('image/png', 0.85);
          pdf.addImage(croppedImgData, 'PNG', margin, margin, contentWidth, heightToDraw);

          srcTop += srcHeight;
          heightRemaining -= heightToDraw;
          pageNum++;
        }
      }

      pdf.save('Money-Mentor-Financial-Report.pdf');
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const KPICard = ({ title, value, icon, color }) => (
    <div className={`bg-white/10 backdrop-blur-md bg-clip-padding border border-white/20 p-6 rounded-xl shadow-2xl border-l-4 ${color} hover:shadow-2xl transition-shadow duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-100 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  const getMonthlyPlan = () => {
    const baseRate = result ? result.sip || 0 : 5000;
    const multiplier = 1 + growthRate / 100;
    const months = Array.from({ length: monthsCount }, (_, i) => {
      let monthValue = baseRate * Math.pow(multiplier, i);
      if (roundPlan) monthValue = Math.round(monthValue / 100) * 100;
      return {
        month: new Date(new Date().getFullYear(), new Date().getMonth() + i).toLocaleString('default', { month: 'short' }),
        amount: Math.round(monthValue),
      };
    });
    return months;
  };

  const monthlyPlan = getMonthlyPlan();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-sky-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center py-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-black text-lg font-bold">💰</span>
                </div>
                <h1 className="text-2xl font-bold text-white">Money Mentor Dashboard</h1>
              </div>
              <div className="flex space-x-4 ml-8">
                <button
                  onClick={onBackToHome}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium shadow-sm"
                >
                  Home
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium shadow-sm"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={printRef}>
        {/* API status messages */}
        {loading && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">Loading your analysis...</div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {/* Goal Editor (Finalist bonus) */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Editable Goals</h2>
            <button
              onClick={exportToPDF}
              className="bg-cyan-500 hover:bg-cyan-600 text-black px-3 py-2 rounded-md text-sm font-medium"
            >
              Download Report
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
              placeholder="Goal Name"
              className="w-full p-2 rounded-lg bg-slate-900 text-white border border-white/20"
            />
            <input
              type="number"
              value={newGoalTarget}
              onChange={(e) => setNewGoalTarget(e.target.value)}
              placeholder="Target amount"
              className="w-full p-2 rounded-lg bg-slate-900 text-white border border-white/20"
            />
            <button
              onClick={addGoal}
              className="w-full bg-violet-500 hover:bg-violet-600 px-3 py-2 rounded-lg text-white font-medium"
            >
              Add Goal
            </button>
          </div>

          <ul className="space-y-3">
            {customGoals.length === 0 && <p className="text-sky-100 text-sm">No custom goals added yet.</p>}
            {customGoals.map((goal, idx) => (
              <li key={goal.id} className="bg-slate-900 p-3 rounded-lg border border-white/20 flex items-center justify-between gap-2">
                <div>
                  <p className="text-white font-semibold">{idx + 1}. {goal.name}</p>
                  <p className="text-sky-200 text-sm">Target: ₹{goal.target.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => moveGoal(goal.id, -1)} className="px-2 py-1 text-xs rounded-md bg-white/10" aria-label="Move up">↑</button>
                  <button onClick={() => moveGoal(goal.id, 1)} className="px-2 py-1 text-xs rounded-md bg-white/10" aria-label="Move down">↓</button>
                  <button onClick={() => removeGoal(goal.id)} className="px-2 py-1 text-xs rounded-md bg-red-500 hover:bg-red-600 text-black" aria-label="Remove">×</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* KPI Cards */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Monthly SIP"
              value={`₹${result.sip?.toLocaleString() || 0}`}
              icon="💸"
              color="border-indigo-500"
            />
            <KPICard
              title="Tax Savings"
              value={`₹${result.tax_saved?.toLocaleString() || 0}`}
              icon="💼"
              color="border-green-500"
            />
            <KPICard
              title="Emergency Fund"
              value={`₹${result.emergency_fund?.toLocaleString() || 0}`}
              icon="🛡️"
              color="border-yellow-500"
            />
            <KPICard
              title="Goals"
              value={result.goal_plan?.length || 0}
              icon="🎯"
              color="border-purple-500"
            />
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Data-driven Allocations Card */}
          <div className="bg-white/10 backdrop-blur-md bg-clip-padding border border-white/20 p-6 rounded-xl shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Data-driven Allocations
            </h3>
            <div className="space-y-3">
              {result ? (
                <>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-sky-200 text-sm font-medium">Strategy</p>
                    <p className="text-white text-lg font-bold">{result.strategy || 'Balanced'}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-sky-200 text-sm font-medium">Monthly SIP</p>
                    <p className="text-white text-lg font-bold">₹{result.sip?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-sky-200 text-sm font-medium">Tax Savings</p>
                    <p className="text-green-400 text-lg font-bold">₹{result.tax_saved?.toLocaleString() || 0}</p>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center rounded-lg bg-black/20 border border-white/10">
                  <p className="text-sky-200 text-sm">Run financial analysis to see your allocation strategy</p>
                </div>
              )}
            </div>
          </div>

          {/* Risk-first Strategy Card */}
          <div className="bg-white/10 backdrop-blur-md bg-clip-padding border border-white/20 p-6 rounded-xl shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">🛡️</span>
              Risk-first Strategy
            </h3>
            <div className="space-y-3">
              {result ? (
                <>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-sky-200 text-sm font-medium">Risk Profile</p>
                    <p className="text-white text-lg font-bold">{result.risk_profile || 'Medium'}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-sky-200 text-sm font-medium">Emergency Fund</p>
                    <p className="text-green-400 text-lg font-bold">₹{result.emergency_fund?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-sky-200 text-sm font-medium">Savings Rate</p>
                    <p className="text-blue-400 text-lg font-bold">{result.impact?.savings_rate_after || 0}%</p>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center rounded-lg bg-black/20 border border-white/10">
                  <p className="text-sky-200 text-sm">Run financial analysis to see your risk assessment</p>
                </div>
              )}
            </div>
          </div>

          {/* Personal Finance AI Card */}
          <div className="bg-white/10 backdrop-blur-md bg-clip-padding border border-white/20 p-6 rounded-xl shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">🤖</span>
              Personal Finance AI
            </h3>
            <div className="space-y-3">
              <div className="bg-white/5 p-4 rounded-lg h-80 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-2 space-y-2">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className="text-sm">
                      <span className={`font-medium ${msg.type === 'ai' ? 'text-cyan-400' : 'text-purple-400'}`}>
                        {msg.type === 'ai' ? 'AI:' : 'You:'}
                      </span>
                      <div
                        className={`prose prose-sm max-w-none ${msg.type === "ai" ? "text-sky-200" : "text-white"
                          } prose-headings:text-white prose-strong:text-white prose-li:text-sky-200 prose-p:text-sky-200`}
                      >
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>


                    </div>
                  ))}
                </div>
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded text-sm transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 backdrop-blur-md bg-clip-padding border border-white/20 p-6 rounded-xl shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📝</span>
              Financial Input
            </h2>
            <InputForm onSubmit={handleSubmit} darkMode />
          </div>

          <div className="bg-white/10 backdrop-blur-md bg-clip-padding border border-white/20 p-6 rounded-xl shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Analysis Results
            </h2>
            <ResultDisplay result={result} />
          </div>
        </div>

        {/* Charts */}
        {result && (
          <div className="bg-white/10 backdrop-blur-md bg-clip-padding border border-white/20 p-6 rounded-xl shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Financial Charts
            </h2>
            <Charts result={result} monthlyPlan={monthlyPlan} darkMode={true} />
          </div>
        )}
        {!result && (
          <div className="bg-white/10 backdrop-blur-md bg-clip-padding border border-white/20 p-6 rounded-xl shadow-2xl mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Financial Charts
            </h2>
            <div className="p-8 text-center rounded-lg bg-black/20 border border-white/10">
              <p className="text-sky-200 text-lg">Run financial analysis to view your financial charts</p>
            </div>
          </div>
        )}

        {/* Monthly Plan */}
        {result && (
          <div className="bg-white/10 backdrop-blur-md bg-clip-padding border border-white/20 p-6 rounded-xl shadow-2xl mt-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">🗓️</span>
              Monthly SIP Projection
            </h2>
            <p className="text-sky-100 mb-4">
              Estimate your month-wise SIP progress based on your computed SIP (resulting from analysis) and a customized growth model.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <p className="text-sky-200">Growth Rate: {growthRate}% monthly</p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={growthRate}
                  onChange={(e) => setGrowthRate(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sky-200">Months: {monthsCount}</p>
                <input
                  type="range"
                  min="6"
                  max="24"
                  step="1"
                  value={monthsCount}
                  onChange={(e) => setMonthsCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sky-200">Round values to nearest 100</p>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={roundPlan}
                    onChange={(e) => setRoundPlan(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-cyan-500"
                  />
                  <span className="text-white">Enabled</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sky-200 text-sm mb-2">Graphical trend preview</p>
              <div className="h-28 bg-black/10 rounded-lg p-3 overflow-x-auto">
                <div className="flex items-end h-full gap-2">
                  {monthlyPlan.map((item, index) => {
                    const maxAmount = Math.max(...monthlyPlan.map((d) => d.amount));
                    const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 5;
                    return (
                      <div key={index} className="flex flex-col items-center justify-end h-full w-8">
                        <div className="w-full bg-cyan-400 rounded-t" style={{ height: `${Math.max(height, 8)}%` }}></div>
                        <span className="text-xs text-sky-100 mt-1">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {monthlyPlan.map((item, index) => (
                <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-sky-200 text-sm">{item.month}</p>
                  <p className="text-white font-bold text-lg">₹{item.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {!result && (
          <div className="bg-white/10 backdrop-blur-md bg-clip-padding border border-white/20 p-6 rounded-xl shadow-2xl mt-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">🗓️</span>
              Monthly SIP Projection
            </h2>
            <div className="p-8 text-center rounded-lg bg-black/20 border border-white/10">
              <p className="text-sky-200 text-lg">Run financial analysis first to see your monthly SIP projection</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;