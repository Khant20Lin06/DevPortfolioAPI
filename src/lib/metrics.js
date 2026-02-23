const counters = new Map();
const gauges = new Map();

const latencyStats = {
  count: 0,
  total: 0,
  p95Window: [],
};

export const incrementMetric = (name, value = 1) => {
  counters.set(name, (counters.get(name) ?? 0) + value);
};

export const setGauge = (name, value) => {
  gauges.set(name, value);
};

export const observeLatency = (ms) => {
  latencyStats.count += 1;
  latencyStats.total += ms;
  latencyStats.p95Window.push(ms);

  if (latencyStats.p95Window.length > 2000) {
    latencyStats.p95Window.shift();
  }
};

const percentile = (arr, p) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
};

export const getMetricsSnapshot = () => ({
  counters: Object.fromEntries(counters.entries()),
  gauges: Object.fromEntries(gauges.entries()),
  latency: {
    count: latencyStats.count,
    avgMs: latencyStats.count > 0 ? latencyStats.total / latencyStats.count : 0,
    p95Ms: percentile(latencyStats.p95Window, 95),
  },
});