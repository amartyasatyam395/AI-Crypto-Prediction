import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, BrainCircuit, ChevronDown, CircleHelp, Clock3, Coins, Gauge, RefreshCw, Search, ShieldCheck, Sparkles, TrendingUp, WalletCards } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const API = import.meta.env.VITE_API_URL || '';
const fmt = (n) => n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 4 });
const money = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fallback = [
  { symbol:'BTC/USDT', name:'Bitcoin', ticker:'BTC', last:0, change_pct:null }, { symbol:'ETH/USDT', name:'Ethereum', ticker:'ETH', last:0, change_pct:null },
  { symbol:'BNB/USDT', name:'BNB', ticker:'BNB', last:0, change_pct:null }, { symbol:'SOL/USDT', name:'Solana', ticker:'SOL', last:0, change_pct:null },
  { symbol:'XRP/USDT', name:'XRP', ticker:'XRP', last:0, change_pct:null }, { symbol:'ADA/USDT', name:'Cardano', ticker:'ADA', last:0, change_pct:null },
  { symbol:'DOGE/USDT', name:'Dogecoin', ticker:'DOGE', last:0, change_pct:null }, { symbol:'AVAX/USDT', name:'Avalanche', ticker:'AVAX', last:0, change_pct:null },
];

export default function App() {
  const [markets, setMarkets] = useState(fallback); const [selected, setSelected] = useState('BTC/USDT');
  const [prediction, setPrediction] = useState(null); const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false); const [training, setTraining] = useState(false);
  const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [tab, setTab] = useState('Overview');
  const active = markets.find(m => m.symbol === selected) || fallback[0];
  async function loadMarkets() { try { const r = await fetch(`${API}/api/markets`); if (!r.ok) throw new Error('Market API unavailable'); const d = await r.json(); setMarkets(d.markets.map(m => ({...m, ticker:m.symbol.split('/')[0], name:m.name || m.symbol.split('/')[0]}))); } catch { /* Keep shell usable while backend is offline. */ } }
  async function loadCoin(symbol=selected) {
    setLoading(true); setError(''); setPrediction(null);
    try {
      const [mr, pr] = await Promise.all([fetch(`${API}/api/market/${symbol.replace('/', '-')}`), fetch(`${API}/api/predict/${symbol.replace('/', '-')}`)]);
      if (!mr.ok) { const d=await mr.json(); throw new Error(d.detail || 'Could not load market data'); }
      const md=await mr.json(); setCandles(md.candles || []);
      if (pr.ok) setPrediction(await pr.json()); else { const d=await pr.json(); setError(d.detail || 'Train a model to generate a forecast.'); }
    } catch(e) { setError(e.message || 'Backend connection failed.'); setCandles([]); }
    finally { setLoading(false); }
  }
  async function train() {
    setTraining(true); setError('');
    try { const r=await fetch(`${API}/api/train/${selected.replace('/', '-')}`, {method:'POST'}); const d=await r.json(); if(!r.ok) throw new Error(d.detail || 'Training failed'); await loadCoin(selected); }
    catch(e) { setError(e.message); } finally { setTraining(false); }
  }
  useEffect(() => { loadMarkets(); }, []);
  useEffect(() => { loadCoin(selected); }, [selected]);
  const chartData = useMemo(() => candles.map(c => ({...c, label:new Date(c.time*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})), [candles]);
  const filtered = markets.filter(m => `${m.name} ${m.ticker} ${m.symbol}`.toLowerCase().includes(query.toLowerCase()));
  const change = active.change_pct;
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><BrainCircuit size={22}/></div><span>Crypto<span className="brand-accent">AI</span></span></div>
      <div className="side-label">WORKSPACE</div><button className={`nav-item ${tab==='Overview'?'active':''}`} onClick={()=>setTab('Overview')}><Gauge size={17}/> Overview</button><button className={`nav-item ${tab==='Markets'?'active':''}`} onClick={()=>setTab('Markets')}><Coins size={17}/> Markets</button><button className={`nav-item ${tab==='Predictions'?'active':''}`} onClick={()=>setTab('Predictions')}><Sparkles size={17}/> AI Predictions</button><button className={`nav-item ${tab==='Performance'?'active':''}`} onClick={()=>setTab('Performance')}><BarChart3 size={17}/> Model performance</button>
      <div className="sidebar-bottom"><div className="status-card"><div className="status-dot"/><div><b>Prediction engine</b><small>Local API connection</small></div></div><div className="sidebar-foot"><ShieldCheck size={14}/> Research mode · No live trades</div></div>
    </aside>
    <main className="main"><header className="topbar"><div><div className="eyebrow">MARKET INTELLIGENCE / 24H FORECAST</div><h1>Crypto dashboard</h1></div><div className="top-actions"><div className="live-pill"><span/> Market data</div><button className="icon-btn" onClick={()=>{loadMarkets();loadCoin();}} title="Refresh"><RefreshCw size={17}/></button><div className="avatar">CA</div></div></header>
      <section className="welcome-row"><div><p className="muted">{new Date().toLocaleDateString([], {weekday:'long',month:'long',day:'numeric',year:'numeric'})}</p><h2>Market overview <span className="spark">✦</span></h2><p className="muted">Track digital assets and explore machine-learning forecasts.</p></div><div className="time-chip"><Clock3 size={15}/> 24-hour prediction horizon</div></section>
      <section className="stat-grid"><Stat icon={<Activity/>} label="Tracked assets" value={markets.length} foot="Supported USDT markets"/><Stat icon={<Sparkles/>} label="Forecast horizon" value="24H" foot="Next 24 hourly candles"/><Stat icon={<BrainCircuit/>} label="Prediction model" value="JS Boosting" foot="Per-asset trained model"/><Stat icon={<ShieldCheck/>} label="Trading mode" value="Analysis" foot="No orders are placed"/></section>
      <div className="content-grid"><section className="panel chart-panel"><div className="panel-head"><div><div className="eyebrow">ASSET PERFORMANCE</div><h3>{active.ticker || selected.split('/')[0]} <span className="pair">/ USDT</span></h3></div><div className="chart-tools"><button className="range active">1D</button><button className="range">1W</button><button className="range">1M</button><button className="icon-btn" onClick={()=>loadCoin()}><RefreshCw size={15}/></button></div></div>
        <div className="price-line"><div className="big-price">{active.last ? money(active.last) : (candles.length ? money(candles.at(-1).close) : '—')}</div><div className={`change ${Number(change)>=0?'positive':'negative'}`}>{change==null?'Live exchange quote unavailable':`${Number(change)>=0?'+':''}${Number(change).toFixed(2)}% 24h`}</div></div>
        <div className="chart-wrap">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c7cff" stopOpacity={0.28}/><stop offset="100%" stopColor="#6c7cff" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#20283a" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="label" tick={{fill:'#7e8aa4',fontSize:11}} axisLine={false} tickLine={false} minTickGap={40}/><YAxis domain={['auto','auto']} orientation="right" tick={{fill:'#7e8aa4',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>Number(v).toLocaleString()}/><Tooltip contentStyle={{background:'#111827',border:'1px solid #29344b',borderRadius:10,color:'#fff'}} formatter={v=>money(v)}/><Area type="monotone" dataKey="close" stroke="#8290ff" strokeWidth={2} fill="url(#chartFill)"/></AreaChart></ResponsiveContainer> : <div className="empty-chart"><div className="chart-icon"><TrendingUp size={25}/></div><b>{loading?'Loading market data…':'Connect the backend to load live candles'}</b><span>Hourly price history will appear here.</span></div>}</div>
        <div className="chart-legend"><span><i className="legend-dot"/> Hourly closing price</span><span>Source: Binance public market data</span></div>
      </section>
      <section className="panel prediction-panel"><div className="panel-head"><div><div className="eyebrow">MACHINE LEARNING</div><h3>AI forecast</h3></div><div className="ai-badge"><Sparkles size={13}/> JS Boosting</div></div>
        {prediction ? <><div className="forecast-label">Predicted price in 24 hours</div><div className="forecast-price">{money(prediction.predicted_price)}</div><div className={`signal ${prediction.direction}`}><span className="signal-dot"/>{prediction.direction.toUpperCase()} <b>{prediction.predicted_return_pct>=0?'+':''}{prediction.predicted_return_pct.toFixed(2)}%</b></div><div className="range-box"><div><small>Estimated lower range</small><b>{money(prediction.range_low)}</b></div><div><small>Estimated upper range</small><b>{money(prediction.range_high)}</b></div></div><div className="model-note"><CircleHelp size={14}/><span>{prediction.interval_note}</span></div><div className="asof">Forecast based on candle: {new Date(prediction.as_of).toLocaleString()}</div></> : <div className="forecast-empty"><div className="ai-orb"><BrainCircuit size={26}/></div><b>{loading?'Analysing market data…':'No trained forecast yet'}</b><p>{error || 'Train a JavaScript gradient-boosting model for this asset to generate a 24-hour forecast.'}</p><button className="primary-btn" onClick={train} disabled={training || loading}>{training?'Training model…':'Train model & predict'} <Sparkles size={15}/></button></div>}
      </section></div>
      {error && <div className="notice"><CircleHelp size={16}/><span>{error}</span></div>}
      <section className="panel markets-panel"><div className="panel-head market-heading"><div><div className="eyebrow">EXPLORE THE MARKET</div><h3>Watchlist <span className="count">{markets.length} assets</span></h3></div><div className="search-box"><Search size={15}/><input placeholder="Search assets..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
        <div className="table-scroll"><table><thead><tr><th>ASSET</th><th>MARKET</th><th>LAST PRICE</th><th>24H CHANGE</th><th>MODEL</th><th></th></tr></thead><tbody>{filtered.map(m=><tr key={m.symbol} className={selected===m.symbol?'selected-row':''} onClick={()=>setSelected(m.symbol)}><td><div className="asset-cell"><div className="coin-icon">{m.ticker?.slice(0,1)}</div><div><b>{m.name}</b><small>{m.ticker}</small></div></div></td><td className="mono">{m.symbol}</td><td className="mono">{m.last?money(m.last):'—'}</td><td className={Number(m.change_pct)>=0?'positive':'negative'}>{m.change_pct==null?'—':`${Number(m.change_pct)>=0?'+':''}${Number(m.change_pct).toFixed(2)}%`}</td><td><span className="model-status">{m.error?'Unavailable':'On demand'}</span></td><td><button className="row-arrow" onClick={e=>{e.stopPropagation();setSelected(m.symbol)}}><ArrowUpRight size={16}/></button></td></tr>)}</tbody></table></div>
      </section>
      <footer><span>CryptoAI Predictor <b>v1.0.0</b></span><span>For research and education only · Not financial advice</span></footer>
    </main>
  </div>;
}
function Stat({icon,label,value,foot}) { return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span></div><strong>{value}</strong><small>{foot}</small></div>; }
