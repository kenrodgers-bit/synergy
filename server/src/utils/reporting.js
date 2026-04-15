const { classifyOutput, roundCurrency, toNumber } = require("./calculations");

function formatDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function daysBetween(olderDate, newerDate = new Date()) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor((new Date(newerDate) - new Date(olderDate)) / oneDay);
}

function buildTrendData(collections) {
  const trendMap = collections.reduce((map, item) => {
    const key = formatDateKey(item.date);

    if (!map.has(key)) {
      map.set(key, {
        date: key,
        weightKg: 0,
        revenue: 0,
        netProfit: 0
      });
    }

    const bucket = map.get(key);
    bucket.weightKg += toNumber(item.weightKg);
    bucket.revenue += toNumber(item.revenue);
    bucket.netProfit += toNumber(item.netProfit);
    return map;
  }, new Map());

  return [...trendMap.values()]
    .map((item) => ({
      ...item,
      weightKg: roundCurrency(item.weightKg),
      revenue: roundCurrency(item.revenue),
      netProfit: roundCurrency(item.netProfit)
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function buildAnalytics({ clients = [], collections = [], reminders = [], inquiries = [], settings = {} }) {
  const now = new Date();
  const totals = collections.reduce(
    (accumulator, item) => {
      accumulator.totalKilograms += toNumber(item.weightKg);
      accumulator.totalRevenue += toNumber(item.revenue);
      accumulator.totalCosts += toNumber(item.totalCostPaid);
      accumulator.totalNetProfit += toNumber(item.netProfit);
      return accumulator;
    },
    {
      totalKilograms: 0,
      totalRevenue: 0,
      totalCosts: 0,
      totalNetProfit: 0
    }
  );

  const clientMetricsMap = new Map();

  collections.forEach((item) => {
    const clientId = String(item.client?._id || item.client || item.clientId || item.clientName);
    const existing = clientMetricsMap.get(clientId) || {
      clientId,
      clientName: item.clientName,
      clientType: item.clientType,
      totalKg: 0,
      totalProfit: 0,
      collections: 0,
      lastCollectionAt: null
    };

    existing.totalKg += toNumber(item.weightKg);
    existing.totalProfit += toNumber(item.netProfit);
    existing.collections += 1;

    if (!existing.lastCollectionAt || new Date(item.date) > new Date(existing.lastCollectionAt)) {
      existing.lastCollectionAt = item.date;
    }

    clientMetricsMap.set(clientId, existing);
  });

  const clientPerformance = clients
    .map((client) => {
      const metric = clientMetricsMap.get(String(client._id)) || {
        totalKg: 0,
        totalProfit: 0,
        collections: 0,
        lastCollectionAt: client.lastCollectionAt || null
      };

      const outputTag = classifyOutput(metric.totalKg);
      const isInactive =
        client.status !== "prospect" &&
        (!metric.lastCollectionAt || daysBetween(metric.lastCollectionAt, now) > 30);

      return {
        clientId: client._id,
        clientName: client.name,
        clientType: client.clientType,
        status: client.status,
        location: client.location,
        totalKg: roundCurrency(metric.totalKg),
        totalProfit: roundCurrency(metric.totalProfit),
        collections: metric.collections,
        lastCollectionAt: metric.lastCollectionAt,
        outputTag,
        isInactive,
        paymentModel: client.paymentModel,
        agreedBuyingPricePerKg: client.agreedBuyingPricePerKg
      };
    })
    .sort((a, b) => b.totalKg - a.totalKg);

  const last7Days = collections.filter((item) => daysBetween(item.date, now) <= 7);
  const last30Days = collections.filter((item) => daysBetween(item.date, now) <= 30);
  const todayCollections = collections.filter((item) => formatDateKey(item.date) === formatDateKey(now));

  const activeClients = clients.filter((client) => client.status === "active");

  return {
    stats: {
      totalClients: clients.length,
      activeSchools: activeClients.filter((client) => client.clientType === "school").length,
      activeOffices: activeClients.filter((client) => client.clientType === "office").length,
      activeHomes: activeClients.filter((client) => client.clientType === "home").length,
      totalKilograms: roundCurrency(totals.totalKilograms),
      totalRevenue: roundCurrency(totals.totalRevenue),
      totalCosts: roundCurrency(totals.totalCosts),
      totalNetProfit: roundCurrency(totals.totalNetProfit),
      recyclerPricePerKg: toNumber(settings.recyclerPricePerKg, 28)
    },
    summary: {
      dailyProfit: roundCurrency(todayCollections.reduce((sum, item) => sum + toNumber(item.netProfit), 0)),
      weeklyProfit: roundCurrency(last7Days.reduce((sum, item) => sum + toNumber(item.netProfit), 0)),
      monthlyProfit: roundCurrency(last30Days.reduce((sum, item) => sum + toNumber(item.netProfit), 0))
    },
    recentCollections: [...collections]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8),
    topSuppliers: clientPerformance.slice(0, 6),
    inactiveClients: clientPerformance.filter((client) => client.isInactive).slice(0, 8),
    prospectClients: clients.filter((client) => client.status === "prospect").slice(0, 8),
    clientPerformance,
    trend: buildTrendData(collections),
    reminders: [...reminders].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 8),
    inquiries: [...inquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8)
  };
}

module.exports = { buildAnalytics };

