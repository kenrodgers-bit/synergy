const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-KE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

export function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

export function formatDate(value, options = {}) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options
  });
}

export function formatDateInput(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function titleCase(value) {
  return String(value || "")
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function paymentModelLabel(value) {
  const labels = {
    "free-supply": "Free supply",
    "paid-per-kg": "Paid per kg",
    "custom-negotiated": "Custom negotiated"
  };

  return labels[value] || titleCase(value);
}

export function roleLabel(value) {
  const labels = {
    "super-admin": "Super Admin",
    admin: "Admin",
    "collection-agent": "Collection Agent"
  };

  return labels[value] || titleCase(value);
}

export function paymentCategory(price) {
  const numeric = Number(price || 0);

  if (numeric === 0) {
    return "free";
  }

  if (numeric === 5) {
    return "5";
  }

  if (numeric === 7) {
    return "7";
  }

  return "custom";
}

export function calculateCollectionPreview(values = {}) {
  const weightKg = Number(values.weightKg || 0);
  const buyingPricePerKg = Number(values.buyingPricePerKg || 0);
  const recyclerPricePerKg = Number(values.recyclerPricePerKg || 28);
  const transportCost = Number(values.transportCost || 0);
  const loadingCost = Number(values.loadingCost || 0);
  const miscellaneousCost = Number(values.miscellaneousCost || 0);
  const totalCostPaid = weightKg * buyingPricePerKg;
  const revenue = weightKg * recyclerPricePerKg;
  const logisticsTotal = transportCost + loadingCost + miscellaneousCost;
  const netProfit = revenue - totalCostPaid - logisticsTotal;

  return {
    totalCostPaid,
    revenue,
    logisticsTotal,
    netProfit
  };
}

function lookupTokenValue(tokens, path) {
  return path.split(".").reduce((result, key) => {
    if (result === undefined || result === null) {
      return "";
    }

    return result[key];
  }, tokens);
}

export function renderTemplateText(templateText, tokens) {
  return String(templateText || "").replace(/{{\s*([^}]+)\s*}}/g, (_, rawPath) => {
    const value = lookupTokenValue(tokens, rawPath.trim());
    return value === undefined || value === null || value === "" ? "-" : String(value);
  });
}

export async function exportElementToPdf(element, fileName) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#f7fbf4"
  });
  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imageHeight = (canvas.height * pageWidth) / canvas.width;

  pdf.addImage(imageData, "PNG", 0, 0, pageWidth, imageHeight);
  pdf.save(fileName);
}

export async function exportRowsToExcel(rows, fileName, sheetName = "Report") {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

export async function exportRowsToPdf({ title, columns, rows, fileName }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF("p", "mm", "a4");
  pdf.setFontSize(16);
  pdf.text(title, 14, 18);

  autoTable(pdf, {
    startY: 24,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => row[column.key] ?? "")),
    styles: {
      fontSize: 9
    },
    headStyles: {
      fillColor: [33, 97, 70]
    }
  });

  pdf.save(fileName);
}
