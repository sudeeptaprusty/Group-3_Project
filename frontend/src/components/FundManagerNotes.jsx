import React, { useState, useEffect } from 'react';
import { Download, Trash2, ArrowRightLeft } from 'lucide-react';

export default function FundManagerNotes() {
  const [notes, setNotes] = useState(() => localStorage.getItem('fund-manager-notes') || '');
  const [savedStatus, setSavedStatus] = useState('Saved locally');

  // Synchronize changes made in sidebar notes immediately
  useEffect(() => {
    const handleStorageChange = () => {
      setNotes(localStorage.getItem('fund-manager-notes') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    // Poll localstorage periodically in case the sidebar component changes it inside the same window context
    const interval = setInterval(() => {
      const currentNotes = localStorage.getItem('fund-manager-notes') || '';
      if (currentNotes !== notes) {
        setNotes(currentNotes);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [notes]);

  const handleChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    localStorage.setItem('fund-manager-notes', val);
    setSavedStatus('Saving...');
    setTimeout(() => setSavedStatus('Saved locally'), 600);
  };

  const handleExport = () => {
    const blob = new Blob([notes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fund-manager-strategic-notes-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all your notes? This action cannot be undone.')) {
      setNotes('');
      localStorage.setItem('fund-manager-notes', '');
      setSavedStatus('Cleared notes');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-strip">
        <div className="page-title-area">
          <h1 className="page-title">Fund Manager Notes</h1>
          <p className="page-subtitle">Full-screen strategic text editor synced with your sidebar notes</p>
        </div>
      </div>

      {/* Editor Card */}
      <div className="card" style={{ minHeight: '520px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title">Strategic Insights Editor</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success-green)' }}></span>
              {savedStatus}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="dropdown-filter-btn"
              onClick={handleExport}
              style={{ padding: '8px 16px', fontSize: '0.78rem' }}
            >
              <Download size={14} style={{ marginRight: '6px' }} />
              Export Notes (.TXT)
            </button>
            <button
              className="dropdown-filter-btn"
              onClick={handleClear}
              style={{ borderColor: 'var(--error-red)', color: 'var(--error-red)', padding: '8px 16px', fontSize: '0.78rem' }}
            >
              <Trash2 size={14} style={{ marginRight: '6px' }} />
              Clear All
            </button>
          </div>
        </div>

        {/* Textarea Editor */}
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder="Write down strategic fund allocation plans, compliance directives, and market observations here... Notes are auto-saved to localStorage and shared across the dashboard sidebar view."
          style={{
            flex: 1,
            width: '100%',
            minHeight: '380px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '20px',
            fontSize: '0.92rem',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-main)',
            lineHeight: '1.6',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowRightLeft size={12} />
          Your edits are synchronized immediately to the sidebar strategic notes block in real time.
        </div>
      </div>
    </div>
  );
}
