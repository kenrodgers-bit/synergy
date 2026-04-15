const DEFAULT_RECYCLER_PRICE = 28;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundCurrency(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

function determinePaymentModel(price) {
  const normalized = toNumber(price);

  if (normalized === 0) {
    return "free-supply";
  }

  if (normalized === 5 || normalized === 7) {
    return "paid-per-kg";
  }

  return "custom-negotiated";
}

function calculateCollectionFinancials(input = {}) {
  const weightKg = toNumber(input.weightKg);
  const buyingPricePerKg = toNumber(input.buyingPricePerKg);
  const recyclerPricePerKg = toNumber(input.recyclerPricePerKg, DEFAULT_RECYCLER_PRICE);
  const transportCost = toNumber(input.transportCost);
  const loadingCost = toNumber(input.loadingCost);
  const miscellaneousCost = toNumber(input.miscellaneousCost);

  const totalCostPaid = roundCurrency(weightKg * buyingPricePerKg);
  const revenue = roundCurrency(weightKg * recyclerPricePerKg);
  const logisticsTotal = roundCurrency(transportCost + loadingCost + miscellaneousCost);
  const grossProfit = roundCurrency(revenue - totalCostPaid);
  const netProfit = roundCurrency(revenue - totalCostPaid - logisticsTotal);

  return {
    weightKg,
    buyingPricePerKg,
    recyclerPricePerKg,
    totalCostPaid,
    revenue,
    logistics: {
      transportCost: roundCurrency(transportCost),
      loadingCost: roundCurrency(loadingCost),
      miscellaneousCost: roundCurrency(miscellaneousCost)
    },
    logisticsTotal,
    grossProfit,
    netProfit
  };
}

function classifyOutput(totalKg) {
  const normalized = toNumber(totalKg);

  if (normalized >= 150) {
    return "high-output";
  }

  if (normalized > 0 && normalized < 40) {
    return "low-output";
  }

  return "active-supplier";
}

module.exports = {
  DEFAULT_RECYCLER_PRICE,
  calculateCollectionFinancials,
  classifyOutput,
  determinePaymentModel,
  roundCurrency,
  toNumber
};

