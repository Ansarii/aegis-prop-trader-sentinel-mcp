# Aegis Prop Trader Drawdown & Risk Sentinel (MCP Server)

[![Apify Actor](https://img.shields.io/badge/Apify-Actor-orange?style=for-the-badge&logo=apify)](https://apify.com/neon_innovation_lab/aegis-prop-trader-sentinel-mcp)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Standard-blue?style=for-the-badge)](https://modelcontextprotocol.io)
[![Whop Store](https://img.shields.io/badge/Whop-Store-purple?style=for-the-badge)](https://whop.com/neoninnovationlab/prop-trader-capital-surveillance-console)

**Aegis Terminal** is an institutional-grade, non-custodial capital surveillance, trailing drawdown monitor, and economic news blackout sentinel engineered specifically for funded futures and forex prop traders operating across **Apex Trader Funding**, **Topstep**, **FTMO**, and **MyFundedFX**.

Funded trader evaluations are aggressively forfeited due to two fatal pitfalls: (1) violating intraday trailing maximum drawdown limits during peak volatility, and (2) holding positions through high-impact economic calendar events (CPI, FOMC, NFP) during mandatory prop firm blackout windows. 

Aegis solves this by aggregating multi-firm equity in real time and exposing automated risk surveillance tools to **Claude Desktop**, **Cursor IDE**, **Windsurf**, **ChatGPT**, and automated algorithmic workflows.

---

## 🚀 Live Links & Production Consoles
- **Interactive Web Terminal**: [https://neoninnovationlab.com/aegis](https://neoninnovationlab.com/aegis)
- **Whop Discover Marketplace ($19.99/mo)**: [https://whop.com/neoninnovationlab/prop-trader-capital-surveillance-console](https://whop.com/neoninnovationlab/prop-trader-capital-surveillance-console)
- **Direct Support & Enterprise Retainers**: `hello@neoninnovationlab.com`

---

## 🛠️ MCP Tools Included

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `aegis_get_portfolio_summary` | `currency: "USD"` | Returns aggregated equity, balance, today's realized P&L, and open floating P&L across all linked CME Tradovate and Spotware cTrader accounts. |
| `aegis_check_drawdown_limits` | `alertThresholdPct: 80` | Evaluates daily loss limits and trailing drawdown cushions. Triggers warning alerts when an account consumes >= 80% of its permitted daily loss buffer. |
| `aegis_check_news_blackout` | *(none)* | Scans active economic calendar events (CPI, FOMC, NFP) and checks if the strict 2-minute pre/post-news trading restriction window is active. |

---

## ⚡ Integration Architectures: 3-Tier Enterprise Funnel

Aegis Terminal operates across a validated 3-tier monetization and workflow hierarchy:

### Tier 1: Standby Model Context Protocol (AI Agents)
Connect your AI trading assistant (Claude Desktop, Cursor, Windsurf) to execute zero-latency surveillance over Streamable HTTP or SSE:

#### Claude Desktop Configuration (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "aegis-sentinel": {
      "url": "https://neon_innovation_lab--aegis-prop-trader-sentinel-mcp.apify.actor/mcp"
    }
  }
}
```

### Tier 2: Automated Risk Desks & Workflows (n8n, Make & Clay)
Prop trading syndicates, prop desks, and algorithmic traders can audit portfolios programmatically via cURL or automated n8n webhook nodes:

```bash
curl -X POST "https://api.apify.com/v2/acts/neon_innovation_lab~aegis-prop-trader-sentinel-mcp/run-sync-get-dataset-items?token=YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "full_surveillance_audit",
    "alertThresholdPct": 75,
    "currency": "USD"
  }'
```

#### Sample Surveillance JSON Output:
```json
{
  "status": "COMPLETED",
  "timestamp": "2026-09-16T03:45:00.000Z",
  "portfolioSummary": {
    "totalEquity": 563520.70,
    "netUnrealizedPnL": 590.70,
    "linkedAccounts": 4
  },
  "riskAssessment": {
    "alertCount": 1,
    "alerts": [
      {
        "severity": "WARNING",
        "account": "MFF-100K-3391",
        "firm": "MyFundedFX",
        "platform": "cTrader",
        "dailyLossLimit": 4000,
        "dailyLossConsumedPct": "73%",
        "trailingDrawdownCushion": 2450.00,
        "actionRecommended": "Reduce open position size or flatten immediately to avoid rule violation."
      }
    ],
    "allAccountsProtected": false
  },
  "economicNewsSentinel": {
    "blackoutActive": false,
    "recommendation": "Normal trading permitted. Next high-impact event (US CPI) at 12:30 UTC."
  }
}
```

### Tier 3: Institutional Prop Risk Infrastructure ($5,000–$25,000 Retainers)
For proprietary trading firms, multi-manager hedge funds, and prop syndicates requiring dedicated on-premise risk gateways, low-latency CME FIX surveillance, and multi-broker API routing. Inquire directly via **`hello@neoninnovationlab.com`**.

---

## 🔒 100% Non-Custodial & Read-Only Guarantee
Aegis Terminal strictly integrates through read-only surveillance APIs (CME Tradovate REST and Spotware cTrader Port 5036 JSON TLS). The engine possesses **zero trade execution privileges** and cannot place, alter, or cancel orders on your accounts. Your capital remains 100% sovereign.
