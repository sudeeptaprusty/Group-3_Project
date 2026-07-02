const express = require('express');
const router = express.Router();
const { dbQuery } = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // 1. Gather live platform metrics from DB for context
    const settledTxns = await dbQuery.all(`
      SELECT transaction_type, amount 
      FROM transactions 
      WHERE status = 'SETTLED' OR status = 'SUCCESS'
    `);
    
    let inflowSum = 0;
    let outflowSum = 0;
    
    settledTxns.forEach(t => {
      const type = t.transaction_type;
      const amount = t.amount / 10000000; // to Cr
      if (type === 'PURCHASE' || type === 'SIP_AUTO' || type === 'SWITCH_IN') {
        inflowSum += amount;
      } else if (type === 'REDEMPTION' || type === 'SWITCH_OUT') {
        outflowSum += amount;
      }
    });
    
    const netFlowSum = inflowSum - outflowSum;
    
    const sipSchedules = await dbQuery.all(`SELECT status, created_at, updated_at FROM sip_schedules`);
    const activeSips = sipSchedules.filter(s => s.status === 'ACTIVE').length;
    
    // Assume current month is June 2026 for consistency with dashboard data
    const newSips = sipSchedules.filter(s => {
      const start = new Date(s.created_at);
      return start.getMonth() === 5 && start.getFullYear() === 2026;
    }).length;
    
    const cancelledSips = sipSchedules.filter(s => {
      if (s.status !== 'CANCELLED' && s.status !== 'COMPLETED') return false;
      const end = new Date(s.updated_at);
      return end.getMonth() === 5 && end.getFullYear() === 2026;
    }).length;
    
    const stoppageRatio = activeSips + cancelledSips > 0 
      ? (cancelledSips / (activeSips + cancelledSips)) * 100 
      : 0;

    const complianceAlerts = await dbQuery.all(`SELECT status FROM compliance_alerts`);
    const openAlerts = complianceAlerts.filter(a => a.status === 'OPEN').length;

    const funds = await dbQuery.all(`SELECT fund_name, category, aum_crores FROM funds`);
    const fundsList = funds.map(f => `${f.fund_name} (${f.category}): AUM ₹${f.aum_crores} Cr`).join(', ');

    // 2. Prepare Context Prompt
    const platformContext = `
You are "FiNAI", an advanced AI Portfolio and Asset Allocation Advisor.
You are running as a helpful conversational agent inside the "FinTrend Analytic Platform".
Here is the current live state of the platform:
- Total AUM (Net Flow): ₹${netFlowSum.toFixed(2)} Cr
- MTD Inflow: ₹${inflowSum.toFixed(2)} Cr
- MTD Outflow: ₹${outflowSum.toFixed(2)} Cr
- Active SIP Mandate Accounts: ${activeSips}
- New SIP Registrations (this month): ${newSips}
- SIP Cancellations (this month): ${cancelledSips}
- SIP Stoppage Ratio: ${stoppageRatio.toFixed(2)}%
- Open Compliance/AML Alerts: ${openAlerts}
- Active Fund Schemes: ${fundsList}
- Daily Growth: +0.29%
- Monthly Growth: +4.71%
- Yearly Growth: +18.5%
- Portfolio Beta: 0.92 (Benchmark: 1.00)
- Sharpe Ratio: 1.85 (Optimized)
- Liquidity Coverage Ratio: 95% (Target >90%)
- Recommended Allocation for new ₹500 Cr mandate: 40% Large Cap, 30% Hybrid, 20% Debt, 10% Small Cap.
- Top Performing Fund: FinVista Bluechip Fund (Return YTD: 21.6%)

Answer the user's questions about the platform, asset allocation, portfolio metrics, returns, churn risk, and transactions.
Be professional, concise, accurate, and speak with the voice of a senior fund manager or portfolio advisor.
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      // Use real Gemini API via SDK
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Convert history format to Gemini format
      const contents = [
        { role: 'user', parts: [{ text: platformContext }] },
        { role: 'model', parts: [{ text: 'Understood. I will act as FiNAI and answer all questions using the live platform metrics provided.' }] }
      ];

      history.forEach(item => {
        contents.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      });

      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const generatedText = response.text();

      return res.status(200).json({
        answer: generatedText,
        source: 'gemini'
      });
    } else {
      // FALLBACK: Dynamic Simulated AI Responses based on the query and DB metrics
      const q = message.toLowerCase().trim();
      let answer = '';

      if (q === 'hello' || q === 'hi' || q === 'hii' || q === 'hey') {
        const intros = [
          `Hello! I am FiNAI, your AI Allocation Assistant. I can help analyze your ₹${netFlowSum.toFixed(2)} Cr portfolio and explain risk management strategies. How can I help you today?`,
          `Welcome! I am FiNAI. Currently, our total platform AUM stands at ₹${netFlowSum.toFixed(2)} Cr with a Sharpe ratio of 1.85. Ask me anything about fund performances or allocations!`,
          `Greetings! I am FiNAI. I can run stress tests, compare asset classes, or examine active SIP metrics. What is on your mind?`
        ];
        answer = intros[Math.floor(Math.random() * intros.length)];
      } else if (q.includes('why') || q.includes('reason') || q.includes('allocate') || q.includes('recommend')) {
        const reasons = [
          `I recommended the 40% Large Cap, 30% Hybrid, 20% Debt, and 10% Small Cap mix because of our stable inflows (₹${inflowSum.toFixed(2)} Cr MTD) and a highly resilient 95% Liquidity Coverage Ratio. This preserves capital while capturing market upside.`,
          `The rationale behind our asset mix is optimization: with a portfolio beta of 0.92, we cushion the portfolio. The 30% Hybrid and 20% Debt shield against volatility, while the 10% Small Cap captures rapid expansion.`,
          `We balance safety and yield. The heavy Large Cap (40%) and Hybrid (30%) weighting is driven by volatile market indicators, while keeping our Sharpe Ratio at a strong 1.85.`
        ];
        answer = reasons[Math.floor(Math.random() * reasons.length)];
      } else if (q.includes('compare') || q.includes('current')) {
        answer = `Compared to the baseline allocation (55% Large Cap, 25% Hybrid, 15% Debt, 5% Small Cap), the proposed mix shifts capital to hybrid and small-cap assets. This increases the Sharpe Ratio from 1.65 to 1.85 and reduces overall portfolio beta to 0.92, providing superior risk-adjusted returns.`;
      } else if (q.includes('downturn') || q.includes('market') || q.includes('stress')) {
        answer = `During a simulated 10% market correction downturn, the proposed allocation is projected to decline by only 3.8% (compared to 5.4% for the standard benchmark) because of our robust 20% Debt shield and the flexibility of our 30% Hybrid allocation.`;
      } else if (q.includes('aum') || q.includes('total aum') || q.includes('assets') || q.includes('collection')) {
        const aums = [
          `Our current Total platform AUM is ₹${netFlowSum.toFixed(2)} Cr (Net Flow MTD) with total inflows of ₹${inflowSum.toFixed(2)} Cr and outflows of ₹${outflowSum.toFixed(2)} Cr. Daily growth is +0.29% and yearly growth stands at +18.5%.`,
          `The platform's Net AUM is ₹${netFlowSum.toFixed(2)} Cr. Our monthly growth rate is +4.71% and yearly growth is +18.5%, outperforming the baseline projections.`,
          `We are managing ₹${netFlowSum.toFixed(2)} Cr in Net AUM. MTD Inflows of ₹${inflowSum.toFixed(2)} Cr have significantly outpaced Outflows of ₹${outflowSum.toFixed(2)} Cr, driving steady MoM growth of +4.71%.`
        ];
        answer = aums[Math.floor(Math.random() * aums.length)];
      } else if (q.includes('sip') || q.includes('stoppage') || q.includes('cancel')) {
        answer = `We currently have ${activeSips} active SIP accounts, with ${newSips} new registrations and ${cancelledSips} cancellations this month. The SIP Stoppage Ratio is at ${stoppageRatio.toFixed(2)}%, which suggests we should monitor retention closely.`;
      } else if (q.includes('compliance') || q.includes('alert') || q.includes('aml')) {
        answer = `There are currently ${openAlerts} open AML/compliance alerts in the pipeline. We have flagged high-value transactions above the ₹30 Cr threshold for audit verification.`;
      } else if (q.includes('fund') || q.includes('scheme') || q.includes('perform')) {
        answer = `Our top-performing fund is the FinVista Bluechip Fund (YTD Return: 21.6%), followed by other options like the Apex Mid Cap Opportunities Fund. Active fund schemes currently include: ${fundsList}.`;
      } else {
        const genericRes = [
          `Interesting question! Speaking of that, our Net AUM stands at ₹${netFlowSum.toFixed(2)} Cr with a beta of 0.92. Let me know if you would like me to compile a risk report or simulate an allocation scenario.`,
          `As FiNAI, I recommend checking our current Sharpe Ratio of 1.85. Can I help you with any details on our active ${activeSips} SIP accounts or fund performance?`,
          `Under current parameters, our platform YTD return is outperforming NIFTY 50 by an Alpha of 2.76%. How can I help you optimize this further?`
        ];
        answer = genericRes[Math.floor(Math.random() * genericRes.length)];
      }

      return res.status(200).json({
        answer,
        source: 'simulated'
      });
    }
  } catch (err) {
    console.error('[AI CHAT ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
