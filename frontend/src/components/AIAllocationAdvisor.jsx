import React, { useState } from 'react';
import { Sparkles, MessageSquare, ChevronRight, Send } from 'lucide-react';
import { aiApi } from '../services/api';

export default function AIAllocationAdvisor() {
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am FiNAl, your AI Allocation Assistant. I can explain the reasoning behind my allocation recommendations, run stress-test scenarios, or compare allocations. How can I help you today?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiSource, setAiSource] = useState('simulated');

  const suggestedQuestions = [
    'Why did you recommend this allocation?',
    'Compare with current allocation',
    'What is the impact of a market downturn?'
  ];

  const handleSend = async (text) => {
    if (!text.trim()) return;

    // Add user message
    setChatHistory(prev => [...prev, { sender: 'user', text }]);
    setInputText('');
    setIsTyping(true);

    try {
      // Exclude the initial assistant greeting to avoid context overhead
      const conversationHistory = chatHistory.slice(1);
      
      const rawResponse = await aiApi.chat({
        message: text,
        history: conversationHistory
      });

      if (!rawResponse || !rawResponse.ok) {
        const errBody = rawResponse ? await rawResponse.text() : 'No response from server';
        console.error('AI chat HTTP error:', errBody);
        setChatHistory(prev => [...prev, { sender: 'assistant', text: "I'm sorry, I encountered an issue retrieving the response." }]);
        return;
      }

      const data = await rawResponse.json();

      if (data && data.answer) {
        setChatHistory(prev => [...prev, { sender: 'assistant', text: data.answer }]);
        if (data.source) {
          setAiSource(data.source);
        }
      } else {
        setChatHistory(prev => [...prev, { sender: 'assistant', text: "I'm sorry, I encountered an issue retrieving the response." }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory(prev => [...prev, { sender: 'assistant', text: `Failed to connect to the AI engine. Error: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div>
      {/* Breadcrumbs / Page Header */}
      <div className="page-header-strip">
        <div className="page-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>FinTrend Analytic Platform</span>
            <ChevronRight size={10} />
            <span style={{ fontWeight: '600', color: 'var(--primary-blue)' }}>AI Allocation Advisor</span>
          </div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            AI Allocation Advisor
            {aiSource === 'gemini' ? (
              <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                ✨ Gemini AI Active
              </span>
            ) : (
              <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--warning-orange)', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                💻 Local AI Simulator
              </span>
            )}
          </h1>
          <p className="page-subtitle">AI-assisted portfolio optimization and allocation advice for fund managers</p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-row-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="card kpi-card">
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">95%</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Liquidity Coverage</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">Target &gt; 90%</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">0.92</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Portfolio Beta</div>
          </div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--text-secondary)' }}>Vs Benchmark: 1.00</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">1.85</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Sharpe Ratio</div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-change-positive">Optimized (+0.20)</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div>
            <div className="kpi-value-row">
              <span className="kpi-value">1.2%</span>
            </div>
            <div className="kpi-title" style={{ marginTop: '8px' }}>Tracking Error</div>
          </div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--text-secondary)' }}>Within safe limits</span>
          </div>
        </div>
      </div>

      {/* AI Recommendation Panel */}
      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--primary-blue)' }}>
        <div className="card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent-blue-bg)', color: 'var(--primary-blue)' }}>
            <Sparkles size={16} />
          </div>
          <h3 className="card-title">AI Recommendation Panel</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              RECOMMENDATION
            </span>
            <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.4' }}>
              Allocate ₹500 Cr with 40% Large Cap, 30% Hybrid, 20% Debt, and 10% Small Cap.
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              BUSINESS REASONING
            </span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.6' }}>
              Strong inflows, stable liquidity, reduced sector concentration, and balanced risk profile support this allocation. Large Cap momentum and debt liquidity guide the strategy.
            </p>
          </div>
        </div>
      </div>

      {/* Ask FiNAl Chat Interface */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '400px' }}>
        <div className="card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} style={{ color: 'var(--primary-blue)' }} />
          <h3 className="card-title">Ask FiNAl</h3>
        </div>

        {/* Suggested Questions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              className="dropdown-filter-btn"
              onClick={() => handleSend(q)}
              style={{ fontSize: '0.72rem', padding: '6px 14px' }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div style={{
          flex: 1,
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: 'var(--bg-main)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '260px'
        }}>
          {chatHistory.map((chat, idx) => {
            const isAI = chat.sender === 'assistant';
            return (
              <div
                key={idx}
                style={{
                  alignSelf: isAI ? 'flex-start' : 'flex-end',
                  maxWidth: '80%',
                  backgroundColor: isAI ? 'var(--card-bg)' : 'var(--primary-blue)',
                  color: isAI ? 'var(--text-primary)' : '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: isAI ? '0 12px 12px 12px' : '12px 0 12px 12px',
                  border: isAI ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.8rem',
                  lineHeight: '1.5'
                }}
              >
                {chat.text}
              </div>
            );
          })}
          {isTyping && (
            <div style={{
              alignSelf: 'flex-start',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-secondary)',
              padding: '10px 14px',
              borderRadius: '0 12px 12px 12px',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem'
            }}>
              FiNAl is thinking...
            </div>
          )}
        </div>

        {/* Chat input form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
          style={{ display: 'flex', gap: '10px' }}
        >
          <input
            type="text"
            className="form-select"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about allocation strategy, risk scenarios, or portfolio optimization..."
            style={{ flex: 1, padding: '10px 14px', fontSize: '0.8rem', outline: 'none' }}
          />
          <button
            type="submit"
            className="button-primary"
            style={{ padding: '0 20px' }}
          >
            <Send size={14} style={{ marginRight: '6px' }} />
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
