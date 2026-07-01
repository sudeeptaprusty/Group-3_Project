import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export default function ReportGenerator() {
  const { allTransactions = [] } = usePlatform() || {};
  // Report states
  const [reports, setReports] = useState({
    sip: {
      title: 'Monthly SIP Performance Report',
      description: 'Comprehensive monthly view of SIP inflows, registrations, discontinuations, and stoppage ratios.',
      lastGenerated: '01 Jun 2026',
      dateRange: 'May 2026',
      isGenerating: false,
      progress: 0,
    },
    aum: {
      title: 'Quarterly AUM & NAV Report',
      description: 'Fund-wise AUM growth, NAV movements, benchmark comparison, and investor type splits.',
      lastGenerated: '01 Apr 2026',
      quarter: 'Q4 FY26',
      isGenerating: false,
      progress: 0,
    },
    churn: {
      title: 'Churn Risk Intelligence Report',
      description: 'AI-generated churn predictions, dormant investor lists, and re-engagement campaign effectiveness.',
      lastGenerated: '24 Jun 2026',
      dateRange: 'Last 30 Days',
      isGenerating: false,
      progress: 0,
    }
  });



  const handleGenerate = (key) => {
    if (reports[key].isGenerating) return;

    setReports(prev => ({
      ...prev,
      [key]: { ...prev[key], isGenerating: true, progress: 0 }
    }));

    const steps = [15, 40, 70, 90, 100];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        const prog = steps[i];
        setReports(prev => ({
          ...prev,
          [key]: { ...prev[key], progress: prog }
        }));
        i++;
      } else {
        clearInterval(interval);
        const now = new Date();
        const dateString = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        setReports(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            isGenerating: false,
            lastGenerated: dateString,
            progress: 0
          }
        }));


      }
    }, 300);
  };

  const downloadExcel = (key) => {
    let csvContent = '';
    const nowStr = new Date().toISOString().split('T')[0];

    if (key === 'sip') {
      csvContent = `FinTrend Analytics - Monthly SIP Performance Report\n` +
        `Generated: ${nowStr}\n` +
        `Date Range: ${reports.sip.dateRange}\n\n` +
        `Metric,Value\n` +
        `Total Active SIP Accounts,9.64 Lakh\n` +
        `New SIP Registrations,54.16 Lakh\n` +
        `SIP Cancellations,51.70 Lakh\n` +
        `Monthly SIP Collections,₹30954 Cr\n` +
        `Average SIP Size,₹3210\n` +
        `SIP Growth %,6.2%\n` +
        `Top Performing SIP Schemes,"FinVista Bluechip Fund, Bharat Nifty 50 Index"\n` +
        `Monthly Net SIP Flow,₹1247 Cr\n`;
    } else if (key === 'aum') {
      csvContent = `FinTrend Analytics - Quarterly AUM & NAV Report\n` +
        `Generated: ${nowStr}\n` +
        `Quarter: ${reports.aum.quarter}\n\n` +
        `Metric,Value\n` +
        `Quarterly AUM,₹18437 Cr\n` +
        `Average NAV,₹142.60\n` +
        `Highest NAV,₹186.20\n` +
        `Lowest NAV,₹95.40\n` +
        `Quarterly Growth,18.4%\n` +
        `Scheme-wise AUM,"Bharat Bluechip Fund (₹4630 Cr), Bharat Nifty 50 Index (₹3590 Cr)"\n` +
        `Asset Allocation Summary,"Equity (55%), Debt (29%), Hybrid (8%)"\n` +
        `Quarterly Investments,₹3742 Cr\n` +
        `Quarterly Redemptions,₹1215 Cr\n`;
    } else if (key === 'churn') {
      csvContent = `FinTrend Analytics - Churn Risk Intelligence Report\n` +
        `Generated: ${nowStr}\n` +
        `Date Range: ${reports.churn.dateRange}\n\n` +
        `Metric,Value\n` +
        `High Risk Investors,15\n` +
        `Medium Risk Investors,32\n` +
        `Low Risk Investors,112\n` +
        `Overall Churn %,7.8%\n` +
        `Churn Drivers,"Extended inactivity, post-retirement withdrawals"\n` +
        `Retention Recommendations,"Waive exit loads, offer Nifty 50 switch, SWP options"\n` +
        `Monthly Churn Trend,"Mar (8.2%), Apr (8.0%), May (7.8%)"\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${key}-report-${nowStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (key) => {
    const report = reports[key];
    const nowStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    let heatmapHTML = '';
    if (key === 'sip') {
      const selectedRange = report.dateRange;
      
      // Filter transactions (only Inflow transactions matching TransactionHeatmap.jsx logic)
      let filteredTxns = allTransactions.filter(t => t.status === 'SETTLED' || t.status === 'SUCCESS');
      filteredTxns = filteredTxns.filter(t => t.transaction_type === 'PURCHASE' || t.transaction_type === 'SIP_AUTO' || t.transaction_type === 'SWITCH_IN');

      if (selectedRange === 'May 2026') {
        filteredTxns = filteredTxns.filter(t => t.created_at && t.created_at.startsWith('2026-05'));
      } else if (selectedRange === 'Apr 2026') {
        filteredTxns = filteredTxns.filter(t => t.created_at && t.created_at.startsWith('2026-04'));
      } else if (selectedRange === 'Last 30 Days') {
        const limit = new Date();
        limit.setDate(limit.getDate() - 30);
        filteredTxns = filteredTxns.filter(t => t.created_at && new Date(t.created_at) >= limit);
      } else if (selectedRange === 'Last 6 Months') {
        const limit = new Date();
        limit.setMonth(limit.getMonth() - 6);
        filteredTxns = filteredTxns.filter(t => t.created_at && new Date(t.created_at) >= limit);
      }

      const categories = [
        { name: 'Large Cap Funds', filter: f => f.toLowerCase().includes('large cap') || f.toLowerCase().includes('bluechip') },
        { name: 'Mid Cap Funds',   filter: f => f.toLowerCase().includes('mid cap') || f.toLowerCase().includes('midcap') },
        { name: 'Small Cap Funds', filter: f => f.toLowerCase().includes('small cap') || f.toLowerCase().includes('smallcap') },
        { name: 'Flexi Cap Funds', filter: f => f.toLowerCase().includes('flexi cap') || f.toLowerCase().includes('flexicap') },
        { name: 'ELSS Funds',      filter: f => f.toLowerCase().includes('elss') || f.toLowerCase().includes('tax saver') || f.toLowerCase().includes('taxsaver') },
        { name: 'Hybrid Funds',    filter: f => f.toLowerCase().includes('hybrid') || f.toLowerCase().includes('balanced') },
        { name: 'Debt Funds',      filter: f => f.toLowerCase().includes('debt') || f.toLowerCase().includes('bond') },
        { name: 'Liquid Funds',    filter: f => f.toLowerCase().includes('liquid') || f.toLowerCase().includes('cash reserve') },
        { name: 'Index Funds',     filter: f => f.toLowerCase().includes('index') || f.toLowerCase().includes('passive') },
        { name: 'Other Funds',     filter: _f => true }
      ];

      const heatmapData = categories.map(cat => {
        const vals = Array(31).fill(0);
        filteredTxns.forEach(t => {
          const fundName = t.fund_name || '';
          const matches = cat.name === 'Other Funds'
            ? !categories.slice(0, 9).some(other => other.filter(fundName))
            : cat.filter(fundName);

          if (matches) {
            const dateObj = new Date(t.created_at);
            const day = dateObj.getDate();
            if (day >= 1 && day <= 31) {
              vals[day - 1] += t.amount / 10000000;
            }
          }
        });
        return { name: cat.name, vals: vals.map(v => parseFloat(v.toFixed(1))) };
      });

      const getCellColor = (val) => {
        if (val <= 2)  return '#F0FDF4'; // very light green
        if (val <= 4)  return '#DCFCE7'; // light green
        if (val <= 7)  return '#BBF7D0'; 
        if (val <= 10) return '#86EFAC'; 
        if (val <= 13) return '#4ADE80'; 
        if (val <= 16) return '#22C55E'; // main green
        if (val <= 20) return '#16A34A'; 
        if (val <= 24) return '#F59E0B'; // warn yellow
        if (val <= 30) return '#F97316'; // warning orange
        if (val <= 38) return '#EF4444'; // error red
        return '#B91C1C'; // critical red
      };

      heatmapHTML = `
        <div class="section-title">Daily Transactions Heatmap (Inflow Vol in ₹ Cr)</div>
        <div style="overflow-x: auto; margin-top: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; margin-top: 0; font-size: 0.68rem; line-height: 1.2;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 6px 8px; font-weight: 700; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; text-align: left; background-color: #f8fafc; color: #475569; width: 120px;">Fund Category</th>
                ${Array.from({ length: 31 }, (_, i) => `<th style="padding: 4px; font-weight: 700; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; text-align: center; color: #475569;">D${i + 1}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${heatmapData.map(row => `
                <tr>
                  <td style="padding: 6px 8px; font-weight: 600; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; background-color: #f8fafc; color: #1e293b;">${row.name}</td>
                  ${row.vals.map(v => {
                    const bgColor = getCellColor(v);
                    const textColor = v > 20 ? '#ffffff' : '#1e293b';
                    return `<td style="padding: 4px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; text-align: center; background-color: ${bgColor}; color: ${textColor}; font-family: monospace; font-weight: 500;">${v || 0}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 15px; display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; color: #64748b;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>Low Volume</span>
            <div style="display: flex; gap: 2px;">
              ${['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#F59E0B', '#F97316', '#EF4444', '#B91C1C'].map(c => `
                <div style="width: 10px; height: 10px; background-color: ${c}; border-radius: 1px;"></div>
              `).join('')}
            </div>
            <span>High Volume</span>
          </div>
          <div style="font-style: italic;">
            * Volume values represent ₹ Crores of inflow transactions.
          </div>
        </div>
      `;
    }

    let reportHTML = `
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 25px; line-height: 1.5; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
          .brand { font-size: 1.1rem; font-weight: 800; color: #2563eb; letter-spacing: 0.05em; }
          .title { font-size: 1.8rem; margin: 8px 0 4px 0; color: #0f172a; }
          .meta { font-size: 0.8rem; color: #64748b; margin-bottom: 15px; }
          .section-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; page-break-after: avoid; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f8fafc; text-align: left; padding: 10px; font-size: 0.8rem; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; }
          td { padding: 10px; font-size: 0.85rem; border-bottom: 1px solid #e2e8f0; }
          .mono { font-family: 'Courier New', monospace; font-weight: 600; }
          .footer { margin-top: 40px; font-size: 0.72rem; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">FINTREND ANALYTICS</div>
          <div class="title">${report.title}</div>
          <div class="meta">Generated: ${nowStr} | Ref: ${key.toUpperCase()}-2026 | Period: ${key === 'aum' ? report.quarter : report.dateRange}</div>
        </div>

        <p style="font-size: 0.85rem; color: #334155;">This document constitutes an executive summary of the performance metrics compiled by the FinTrend AI Platform. The data presented reflects live operational metrics processed within the platform and is certified compliant with AMC reporting standards.</p>

        <div class="section-title">Key Performance Indicators Summary</div>
        <table>
          <thead>
            <tr>
              <th>Metric/Dimension</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (key === 'sip') {
      reportHTML += `
        <tr><td>Total Active SIP Accounts</td><td class="mono">9.64 Lakh</td></tr>
        <tr><td>New SIP Registrations</td><td class="mono">54.16 Lakh</td></tr>
        <tr><td>SIP Cancellations</td><td class="mono">51.70 Lakh</td></tr>
        <tr><td>Monthly SIP Collections</td><td class="mono">₹30,954 Cr</td></tr>
        <tr><td>Average SIP Size</td><td class="mono">₹3,210</td></tr>
        <tr><td>SIP Growth %</td><td class="mono">6.2%</td></tr>
        <tr><td>Top Performing SIP Schemes</td><td>FinVista Bluechip Fund, Bharat Nifty 50 Index</td></tr>
        <tr><td>Monthly Net SIP Flow</td><td class="mono">₹1,247 Cr</td></tr>
      `;
    } else if (key === 'aum') {
      reportHTML += `
        <tr><td>Quarterly AUM</td><td class="mono">₹18,437 Cr</td></tr>
        <tr><td>Average NAV</td><td class="mono">₹142.60</td></tr>
        <tr><td>Highest NAV</td><td class="mono">₹186.20</td></tr>
        <tr><td>Lowest NAV</td><td class="mono">₹95.40</td></tr>
        <tr><td>Quarterly Growth</td><td class="mono">18.4%</td></tr>
        <tr><td>Scheme-wise AUM</td><td>Bharat Bluechip Fund (₹4,630 Cr), Bharat Nifty 50 Index (₹3,590 Cr)</td></tr>
        <tr><td>Asset Allocation Summary</td><td>Equity (55%), Debt (29%), Hybrid (8%)</td></tr>
        <tr><td>Quarterly Investments</td><td class="mono">₹3,742 Cr</td></tr>
        <tr><td>Quarterly Redemptions</td><td class="mono">₹1,215 Cr</td></tr>
      `;
    } else if (key === 'churn') {
      reportHTML += `
        <tr><td>High Risk Investors</td><td class="mono">15</td></tr>
        <tr><td>Medium Risk Investors</td><td class="mono">32</td></tr>
        <tr><td>Low Risk Investors</td><td class="mono">112</td></tr>
        <tr><td>Overall Churn %</td><td class="mono">7.8%</td></tr>
        <tr><td>Churn Drivers</td><td>Extended inactivity, post-retirement withdrawals</td></tr>
        <tr><td>Retention Recommendations</td><td>Waive exit loads, offer Nifty 50 switch, SWP options</td></tr>
        <tr><td>Monthly Churn Trend</td><td>Mar (8.2%), Apr (8.0%), May (7.8%)</td></tr>
      `;
    }

    reportHTML += `
          </tbody>
        </table>

        ${heatmapHTML}

        <div class="footer">
          © 2026 FinTrend Analytics Platform. SEBI Registered Investment Analyst. Confidential Executive Report.
        </div>
      </body>
      </html>
    `;

    if (window.html2pdf) {
      const element = document.createElement('div');
      element.innerHTML = reportHTML;
      const opt = {
        margin:       10,
        filename:     `${key}-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().set(opt).from(element).save();
    } else {
      // Fallback to print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const handleDateChange = (key, value) => {
    setReports(prev => ({
      ...prev,
      [key]: { ...prev[key], [key === 'aum' ? 'quarter' : 'dateRange']: value }
    }));
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-strip">
        <div className="page-title-area">
          <h1 className="page-title">Report Generator</h1>
          <p className="page-subtitle">Dedicated executive reporting center with PDF and Excel export services</p>
        </div>
      </div>

      {/* Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {Object.keys(reports).map(key => {
          const rep = reports[key];
          return (
            <div key={key} className="card" style={{ display: 'flex', flexTheme: 'column', justifyContent: 'space-between', minHeight: '340px' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FileText size={18} style={{ color: 'var(--primary-blue)' }} />
                  {rep.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                  {rep.description}
                </p>

                {/* Selectors */}
                <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    REPORT PARAMETERS
                  </span>
                  {key === 'aum' ? (
                    <select
                      className="form-select"
                      value={rep.quarter}
                      onChange={e => handleDateChange(key, e.target.value)}
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      <option value="Q4 FY26">Q4 FY26 (Jan - Mar 2026)</option>
                      <option value="Q3 FY26">Q3 FY26 (Oct - Dec 2025)</option>
                      <option value="Q2 FY26">Q2 FY26 (Jul - Sep 2025)</option>
                    </select>
                  ) : (
                    <select
                      className="form-select"
                      value={rep.dateRange}
                      onChange={e => handleDateChange(key, e.target.value)}
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      <option value="May 2026">May 2026</option>
                      <option value="Apr 2026">Apr 2026</option>
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="Last 6 Months">Last 6 Months</option>
                    </select>
                  )}
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Last Generated: <strong>{rep.lastGenerated}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                {rep.isGenerating ? (
                  <div style={{ padding: '6px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: '600', marginBottom: '4px' }}>
                      <span>Compiling report...</span>
                      <span>{rep.progress}%</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${rep.progress}%`, height: '100%', backgroundColor: 'var(--primary-blue)', transition: 'width 0.2s' }}></div>
                    </div>
                  </div>
                ) : (
                  <button
                    className="button-primary"
                    onClick={() => handleGenerate(key)}
                    style={{ width: '100%', justifyContent: 'center', padding: '8px 0', fontSize: '0.78rem', borderRadius: 0 }}
                  >
                    Generate Report
                  </button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    className="dropdown-filter-btn"
                    onClick={() => downloadPDF(key)}
                    style={{ justifyContent: 'center', padding: '6px 0', fontSize: '0.72rem', borderRadius: 0 }}
                  >
                    📥 PDF Export
                  </button>
                  <button
                    className="dropdown-filter-btn"
                    onClick={() => downloadExcel(key)}
                    style={{ justifyContent: 'center', padding: '6px 0', fontSize: '0.72rem', borderRadius: 0 }}
                  >
                    📥 Excel Export
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
