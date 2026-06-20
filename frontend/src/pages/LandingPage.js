import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const LandingPage = ({ onGetStarted, analysisData, onNavigateFeatures, onNavigatePricing }) => {
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', text: 'Hello! I\'m your personal finance assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  // Format currency
  const formatCurrency = (value) => {
    if (!value) return "₹0";
    return "₹" + value.toLocaleString("en-IN");
  };

  // Calculate portfolio metrics from analysis data
  const getMetrics = () => {
    if (!analysisData) {
      return {
        totalValue: "₹43,08,720",
        returns: "+16.9%",
        taxSaved: "₹0",
        monthlyInvestment: "₹0",
        strategy: "Balanced",
        allocation: 42,
        riskLevel: "Moderate",
      };
    }

    const { sip, tax_saved, strategy, emergency_fund, impact } = analysisData;
    const monthlySIP = sip || 0;
    const years = 10;
    const monthlyRate = 0.01; // 12% annual compounding approximation

    // Future value for monthly SIP contributions (ordinary annuity)
    const futureSIPValue = monthlySIP * ((Math.pow(1 + monthlyRate, years * 12) - 1) / monthlyRate);
    const totalValueNum = (emergency_fund || 0) + futureSIPValue;

    return {
      totalValue: formatCurrency(totalValueNum),
      returns: impact?.savings_rate_after ? `+${(impact.savings_rate_after * 100).toFixed(1)}%` : "+16.9%",
      taxSaved: formatCurrency(tax_saved || 0),
      monthlyInvestment: formatCurrency(sip || 0),
      strategy: strategy || "Balanced",
      allocation: strategy === "Aggressive" ? 70 : strategy === "Conservative" ? 30 : 42,
      riskLevel: strategy === "Aggressive" ? "High" : strategy === "Conservative" ? "Low" : "Moderate",
    };
  };

  const metrics = getMetrics();

  const handleChatSubmit = async (e) => {
    e.preventDefault();

    if (!chatInput.trim()) return;

    const userMessage = chatInput;

    // Show user's message immediately
    setChatMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: userMessage,
      },
    ]);

    setChatInput("");

    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message: userMessage,
          user_data: analysisData || {},
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: data.response,
        },
      ]);
    } catch (error) {
      console.error(error);

      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: "Sorry! I couldn't connect to the AI assistant.",
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-sky-900 text-white">
      {/* Top Navbar */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Money Mentor</h1>
                <p className="text-xs text-sky-200 font-medium">AI financial planning for the 21st century</p>
              </div>
            </div>
            <div className="space-x-3">
              <button onClick={onNavigateFeatures} className="py-2 px-4 rounded-md text-sm font-medium text-sky-100 hover:text-white hover:bg-white/15 transition">
                Features
              </button>
              <button onClick={onNavigatePricing} className="py-2 px-4 rounded-md text-sm font-medium text-sky-100 hover:text-white hover:bg-white/15 transition">
                Pricing
              </button>
              <button
                onClick={onGetStarted}
                className="py-2 px-5 rounded-lg bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-semibold hover:scale-105 transform transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_20%,_rgba(43,211,255,0.4),_transparent_40%),radial-gradient(circle_at_80%_40%,_rgba(148,163,255,0.45),_transparent_35%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-cyan-300 mb-4">
                <span className="rounded-full bg-white/10 px-3 py-1">{analysisData ? "AI-Powered Analysis" : "Top rated AI finance"}</span>
                {analysisData ? "Plan Generated" : "Trusted by 18,000+ users"}
              </p>
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
                {analysisData ? `Your ${metrics.strategy} Plan is Ready` : "Take control of your money the smart way"}
              </h2>
              <p className="mt-6 text-lg text-sky-100 max-w-xl">
                {analysisData
                  ? `Invest ₹${analysisData.sip?.toLocaleString("en-IN") || "0"} monthly, save ₹${analysisData.tax_saved?.toLocaleString("en-IN") || "0"} in taxes, and build an emergency fund of ₹${analysisData.emergency_fund?.toLocaleString("en-IN") || "0"}.`
                  : "Build and execute a data-backed plan for savings, investment, risk and taxes with a smooth dashboard and industry-grade insights."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold shadow-xl hover:scale-105 transition"
                >
                  Start Free Trial
                </button>
                <button className="px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition">
                  Explore Demo
                </button>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-2xl font-bold">{analysisData ? formatCurrency(analysisData.emergency_fund) : "₹1.2T"}</p>
                  <p className="text-xs text-sky-200 uppercase mt-1">{analysisData ? "Emergency Fund" : "client funds"}</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-2xl font-bold">{analysisData ? metrics.strategy : "98%"}</p>
                  <p className="text-xs text-sky-200 uppercase mt-1">{analysisData ? "Strategy" : "satisfaction"}</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-2xl font-bold">{analysisData ? formatCurrency(analysisData.sip) : "350+"}</p>
                  <p className="text-xs text-sky-200 uppercase mt-1">{analysisData ? "Monthly SIP" : "decision metrics"}</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-2xl font-bold">{analysisData ? "24/7" : "24/7"}</p>
                  <p className="text-xs text-sky-200 uppercase mt-1">support</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-b from-white/20 to-white/5 border border-white/20 p-8 backdrop-blur-lg shadow-2xl">
              <div className="flex justify-between items-center text-xs text-sky-100 mb-4">
                <span className="font-semibold">{analysisData ? "Your Portfolio Snapshot" : "Portfolio Snapshot"}</span>
                <span className="bg-white/10 px-2 py-1 rounded-full">Live</span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/10 p-4">
                    <p className="text-xs uppercase text-sky-200">Total Value</p>
                    <p className="text-2xl font-bold">{metrics.totalValue}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4">
                    <p className="text-xs uppercase text-sky-200">Savings Rate</p>
                    <p className="text-2xl font-bold text-emerald-300">{metrics.returns}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs uppercase text-sky-200">Monthly Investment</p>
                  <p className="text-2xl font-bold text-cyan-300">{metrics.monthlyInvestment}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs uppercase text-sky-200">Strategy</p>
                  <p className="text-xl font-bold">{metrics.strategy}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs uppercase text-sky-200">Tax Savings / Year</p>
                  <p className="text-2xl font-bold text-emerald-300">{metrics.taxSaved}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-white/10 border-y border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-white mb-10">Built for modern investors</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Data-driven Allocations Card */}
            <div className="p-6 rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 shadow-lg">
              <div className="text-5xl mb-3">📈</div>
              <h4 className="text-xl font-semibold mb-3">Data-driven Allocations</h4>
              <div className="space-y-3">
                {analysisData ? (
                  <>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Strategy</p>
                      <p className="text-white text-lg font-bold">{analysisData.strategy || 'Balanced'}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Monthly SIP</p>
                      <p className="text-white text-lg font-bold">{formatCurrency(analysisData.sip)}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Tax Savings</p>
                      <p className="text-green-400 text-lg font-bold">{formatCurrency(analysisData.tax_saved)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Equity Allocation</p>
                      <p className="text-white text-lg font-bold">65%</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Debt Allocation</p>
                      <p className="text-white text-lg font-bold">25%</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Gold Allocation</p>
                      <p className="text-white text-lg font-bold">10%</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Risk-first Strategy Card */}
            <div className="p-6 rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 shadow-lg">
              <div className="text-5xl mb-3">🛡️</div>
              <h4 className="text-xl font-semibold mb-3">Risk-first Strategy</h4>
              <div className="space-y-3">
                {analysisData ? (
                  <>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Risk Profile</p>
                      <p className="text-white text-lg font-bold">{analysisData.risk_profile || 'Medium'}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Emergency Fund</p>
                      <p className="text-green-400 text-lg font-bold">{formatCurrency(analysisData.emergency_fund)}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Savings Rate</p>
                      <p className="text-blue-400 text-lg font-bold">{analysisData.impact?.savings_rate_after || 0}%</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Risk Level</p>
                      <p className="text-white text-lg font-bold">Moderate</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Max Drawdown</p>
                      <p className="text-red-400 text-lg font-bold">-12.5%</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Volatility</p>
                      <p className="text-yellow-400 text-lg font-bold">8.2%</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sky-200 text-sm font-medium">Sharpe Ratio</p>
                      <p className="text-green-400 text-lg font-bold">1.45</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Personal Finance AI Card */}
            <div className="p-6 rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 shadow-lg">
              <div className="text-5xl mb-3">🤖</div>
              <h4 className="text-xl font-semibold mb-3">Personal Finance AI</h4>
              <div className="bg-white/5 p-3 rounded-lg h-64 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-2 space-y-2">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className="text-xs">
                      <span
                        className={`font-medium ${msg.type === "ai" ? "text-cyan-400" : "text-purple-400"
                          }`}
                      >
                        {msg.type === "ai" ? "AI:" : "You:"}
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
                    className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-2 py-1 rounded text-xs transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customers & Footer */}
      <footer className="bg-black/50 text-slate-200 py-14 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div>
              <h4 className="text-2xl font-bold">Trusted by professionals</h4>
              <p className="mt-3 text-sky-200 max-w-lg">
                Used by financial planners, investors and new entrants across the country with end-to-end security and 2FA protection.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
              <span className="text-center text-sm font-semibold bg-white/10 rounded-lg p-3">Morgan</span>
              <span className="text-center text-sm font-semibold bg-white/10 rounded-lg p-3">Axis</span>
              <span className="text-center text-sm font-semibold bg-white/10 rounded-lg p-3">FinStrat</span>
              <span className="text-center text-sm font-semibold bg-white/10 rounded-lg p-3">Yukti</span>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div>
              <h5 className="text-lg font-semibold">Money Mentor</h5>
              <p className="mt-2 text-sm text-sky-200">© 2026 Money Mentor. All rights reserved.</p>
            </div>
            <div>
              <h5 className="text-lg font-semibold">Explore</h5>
              <ul className="space-y-2 mt-3 text-sm text-sky-200">
                <li>Features</li>
                <li>Pricing</li>
                <li>Security</li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold">Support</h5>
              <ul className="space-y-2 mt-3 text-sm text-sky-200">
                <li>Help Center</li>
                <li>Contact</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;