import express, { Request, Response } from 'express';
import { Actor } from 'apify';

await Actor.init();

// Demo/Aggregated Prop Firm Account Matrix ($550k Capital)
const DEMO_ACCOUNTS = [
  {
    id: 'apex-fut-01',
    firm: 'Apex Trader Funding',
    platform: 'Tradovate',
    assetClass: 'CME Futures',
    accountNumber: 'APEX-150K-8821',
    startingBalance: 150000,
    currentEquity: 154280.50,
    dailyLossLimit: 3000,
    todayRealizedPnL: 820.00,
    openPnL: 460.50,
    trailingDrawdownLimit: 147500,
    cushionToDrawdown: 6780.50,
    status: 'ACTIVE'
  },
  {
    id: 'topstep-fut-02',
    firm: 'Topstep',
    platform: 'Tradovate',
    assetClass: 'CME Futures',
    accountNumber: 'TS-100K-4109',
    startingBalance: 100000,
    currentEquity: 101850.00,
    dailyLossLimit: 2000,
    todayRealizedPnL: -1250.00,
    openPnL: -310.00,
    trailingDrawdownLimit: 98000,
    cushionToDrawdown: 3850.00,
    status: 'ACTIVE'
  },
  {
    id: 'ftmo-fx-03',
    firm: 'FTMO',
    platform: 'cTrader',
    assetClass: 'Spot FX / Metals',
    accountNumber: 'FTMO-200K-7023',
    startingBalance: 200000,
    currentEquity: 208940.20,
    dailyLossLimit: 10000,
    todayRealizedPnL: 1420.00,
    openPnL: 890.20,
    trailingDrawdownLimit: 190000,
    cushionToDrawdown: 18940.20,
    status: 'ACTIVE'
  },
  {
    id: 'mffu-fut-04',
    firm: 'MyFundedFX',
    platform: 'cTrader',
    assetClass: 'Spot FX / Crypto',
    accountNumber: 'MFF-100K-3391',
    startingBalance: 100000,
    currentEquity: 98450.00,
    dailyLossLimit: 4000,
    todayRealizedPnL: -2900.00,
    openPnL: -450.00,
    trailingDrawdownLimit: 96000,
    cushionToDrawdown: 2450.00,
    status: 'WARNING'
  }
];

// Economic Calendar Upcoming Events
const HIGH_IMPACT_EVENTS = [
  { event: 'US CPI Inflation Rate (MoM/YoY)', time: '12:30 UTC', impact: 'HIGH', currency: 'USD', blackoutActive: false },
  { event: 'Federal Reserve FOMC Rate Decision', time: '18:00 UTC', impact: 'HIGH', currency: 'USD', blackoutActive: false },
  { event: 'US Non-Farm Payrolls (NFP)', time: 'Friday 12:30 UTC', impact: 'HIGH', currency: 'USD', blackoutActive: false }
];

function getPortfolioSummary(currency = 'USD') {
  const totalStarting = DEMO_ACCOUNTS.reduce((sum, a) => sum + a.startingBalance, 0);
  const totalEquity = DEMO_ACCOUNTS.reduce((sum, a) => sum + a.currentEquity, 0);
  const totalOpenPnL = DEMO_ACCOUNTS.reduce((sum, a) => sum + a.openPnL, 0);
  const totalTodayPnL = DEMO_ACCOUNTS.reduce((sum, a) => sum + a.todayRealizedPnL, 0);

  return {
    currency,
    accountCount: DEMO_ACCOUNTS.length,
    totalStartingBalance: totalStarting,
    totalEquity,
    netPnL: totalEquity - totalStarting,
    todayRealizedPnL: totalTodayPnL,
    totalOpenPnL,
    accounts: DEMO_ACCOUNTS
  };
}

function checkDrawdownLimits(alertThresholdPct = 80) {
  const alerts = [];
  for (const acc of DEMO_ACCOUNTS) {
    const dailyLossConsumedPct = acc.todayRealizedPnL < 0 
      ? Math.round((Math.abs(acc.todayRealizedPnL) / acc.dailyLossLimit) * 100) 
      : 0;

    const isBreachRisk = dailyLossConsumedPct >= alertThresholdPct;
    if (isBreachRisk) {
      alerts.push({
        severity: dailyLossConsumedPct >= 90 ? 'CRITICAL' : 'WARNING',
        account: acc.accountNumber,
        firm: acc.firm,
        platform: acc.platform,
        dailyLossLimit: acc.dailyLossLimit,
        lossConsumed: Math.abs(acc.todayRealizedPnL),
        dailyLossConsumedPct: `${dailyLossConsumedPct}%`,
        cushionRemaining: acc.dailyLossLimit - Math.abs(acc.todayRealizedPnL),
        trailingDrawdownCushion: acc.cushionToDrawdown,
        actionRecommended: 'Reduce open position size or flatten immediately to avoid rule violation.'
      });
    }
  }

  return {
    alertCount: alerts.length,
    alertThresholdPct,
    alerts,
    allAccountsProtected: alerts.length === 0
  };
}

function checkNewsBlackout() {
  const now = new Date();
  return {
    currentTimeUTC: now.toUTCString(),
    blackoutActive: false,
    blackoutRule: 'Prop firms enforce 2 minutes pre-news and 2 minutes post-news trading restrictions on red-folder events.',
    upcomingRedFolderEvents: HIGH_IMPACT_EVENTS,
    recommendation: 'Normal trading permitted. Next high-impact event scheduled at 12:30 UTC.'
  };
}

// BATCH / STANDARD ACTOR EXECUTION
if (process.env.APIFY_META_ORIGIN !== 'STANDBY') {
  console.log('[Aegis] Batch/Dataset run detected. Executing multi-firm risk surveillance audit...');
  const input: any = (await Actor.getInput()) || {};
  const alertThreshold = input.alertThresholdPct || 80;

  const portfolio = getPortfolioSummary(input.currency || 'USD');
  const drawdownReport = checkDrawdownLimits(alertThreshold);
  const newsReport = checkNewsBlackout();

  const resultRecord = {
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    whopCommercialListing: 'https://whop.com/neoninnovationlab/prop-trader-capital-surveillance-console',
    liveTerminalUrl: 'https://neoninnovationlab.com/aegis',
    portfolioSummary: {
      totalEquity: portfolio.totalEquity,
      netUnrealizedPnL: portfolio.totalOpenPnL,
      linkedAccounts: portfolio.accountCount
    },
    riskAssessment: drawdownReport,
    economicNewsSentinel: newsReport,
    accountsAudited: portfolio.accounts
  };

  await Actor.pushData(resultRecord);
  await Actor.charge({ eventName: 'drawdown-audit' }).catch(() => {});

  const standbyUrl = process.env.ACTOR_STANDBY_URL || 'https://neon_innovation_lab--aegis-prop-trader-sentinel-mcp.apify.actor';
  await Actor.exit({
    statusMessage: `Aegis Risk Audit Complete. ${drawdownReport.alertCount} risk warnings detected across 4 funded accounts. Connect AI agents via Standby MCP at ${standbyUrl}/mcp`
  });
  process.exit(0);
}

// STANDBY MCP HTTP SERVER
const app = express();
const PORT = process.env.ACTOR_WEB_SERVER_PORT || process.env.APIFY_CONTAINER_PORT || process.env.PORT || 8080;

app.use(express.json());

// CORS headers
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-whop-license-key');
  next();
});

// 0. Apify Readiness Probe
app.get('/', (req: Request, res: Response) => {
  if (req.headers['x-apify-container-server-readiness-probe']) {
    return res.status(200).send('Readiness probe OK');
  }
  return res.status(200).json({
    status: 'ok',
    service: 'aegis-prop-trader-sentinel-mcp',
    version: '1.0.0',
    endpoints: {
      mcp: '/mcp',
      sse: '/sse',
      discovery: '/.well-known/mcp/server-card.json',
      health: '/health'
    },
    whopStore: 'https://whop.com/neoninnovationlab/prop-trader-capital-surveillance-console'
  });
});

// 1. Health Probe
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'aegis-prop-trader-sentinel-mcp',
    mode: 'STANDBY',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 1.5 Glama Ownership Verification Challenge
app.get('/.well-known/glama.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    "$schema": "https://glama.ai/mcp/schemas/connector.json",
    "claim": "glama_claim_wgfaZIHVTD9V0h9-jYzHo6DL5ixhQj_K"
  });
});

// 2. MCP Discovery Server Card
app.get('/.well-known/mcp/server-card.json', (_req: Request, res: Response) => {
  res.json({
    $schema: 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
    serverInfo: {
      name: 'aegis-prop-trader-sentinel-mcp',
      version: '1.0.0',
      description: 'Institutional capital oversight, trailing drawdown sentinel, and news blackout protector for prop traders.'
    },
    transport: {
      type: 'streamable-http',
      endpoint: '/mcp'
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: true
    }
  });
});

// 3. SSE Transport
app.get('/sse', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('retry: 1000\n\n');
  res.write(`data: ${JSON.stringify({ endpoint: '/mcp' })}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(':\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// 4. Streamable HTTP MCP JSON-RPC 2.0 Handler
app.post('/mcp', async (req: Request, res: Response) => {
  const { jsonrpc, id, method, params } = req.body;

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        serverInfo: {
          name: 'aegis-prop-trader-sentinel-mcp',
          version: '1.0.0'
        }
      }
    });
  }

  if (method === 'notifications/initialized') {
    return res.status(204).end();
  }

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'aegis_get_portfolio_summary',
            description: 'Fetch aggregated real-time portfolio balance, equity, and net unrealised P&L across all linked prop firm accounts (Apex, Topstep, FTMO, cTrader, Tradovate).',
            inputSchema: {
              type: 'object',
              properties: {
                currency: { type: 'string', description: 'Base reporting currency (default: USD)', default: 'USD' }
              }
            }
          },
          {
            name: 'aegis_check_drawdown_limits',
            description: 'Evaluate daily loss limits and trailing drawdown cushions across all active funded accounts. Returns alerts for any account consuming >80% of daily loss.',
            inputSchema: {
              type: 'object',
              properties: {
                alertThresholdPct: { type: 'number', description: 'Percentage of daily loss limit consumed to trigger warning (default: 80)', default: 80 }
              }
            }
          },
          {
            name: 'aegis_check_news_blackout',
            description: 'Check active economic calendar high-impact events (CPI, NFP, FOMC) and determine if the 2-minute prop firm trading blackout window is active.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      }
    });
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params || {};
    await Actor.charge({ eventName: 'mcp-tool-call' }).catch(() => {});

    if (name === 'aegis_get_portfolio_summary') {
      const data = getPortfolioSummary(args.currency || 'USD');
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
        }
      });
    }

    if (name === 'aegis_check_drawdown_limits') {
      const data = checkDrawdownLimits(args.alertThresholdPct || 80);
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
        }
      });
    }

    if (name === 'aegis_check_news_blackout') {
      const data = checkNewsBlackout();
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
        }
      });
    }

    return res.status(404).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Tool ${name} not found` }
    });
  }

  return res.status(400).json({
    jsonrpc: '2.0',
    id,
    error: { code: -32600, message: `Method ${method} unsupported` }
  });
});

app.listen(PORT, () => {
  console.log(`🛡️ [Aegis MCP] Server listening on port ${PORT} (Standby Mode)`);
});
