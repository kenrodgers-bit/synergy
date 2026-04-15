import { useDeferredValue, useState } from "react";
import api from "../api/api";
import ChartPanel from "../components/ChartPanel";
import StatCard from "../components/StatCard";
import { useAppData } from "../context/AppDataContext";
import {
  exportRowsToExcel,
  exportRowsToPdf,
  formatCurrency,
  formatDate,
  formatNumber,
  titleCase
} from "../utils/formatters";

const defaultReminderForm = {
  clientId: "",
  title: "",
  note: "",
  dueDate: "",
  frequency: "one-time",
  status: "pending",
  assignedTo: ""
};

export default function ReportsPage() {
  const { collections, clients, analytics, reminders, users, refreshAll } = useAppData();
  const [filters, setFilters] = useState({
    search: "",
    clientType: "all",
    status: "all",
    startDate: "",
    endDate: ""
  });
  const [reminderForm, setReminderForm] = useState(defaultReminderForm);
  const [message, setMessage] = useState("");
  const deferredSearch = useDeferredValue(filters.search);

  const filteredCollections = collections.filter((collection) => {
    const client = clients.find(
      (item) => item._id === (collection.client?._id || collection.client)
    );

    const searchMatches =
      !deferredSearch ||
      [collection.clientName, collection.collectedByName, client?.location]
        .join(" ")
        .toLowerCase()
        .includes(deferredSearch.toLowerCase());

    if (!searchMatches) {
      return false;
    }

    if (filters.clientType !== "all" && collection.clientType !== filters.clientType) {
      return false;
    }

    if (filters.status !== "all" && client?.status !== filters.status) {
      return false;
    }

    if (filters.startDate && new Date(collection.date) < new Date(filters.startDate)) {
      return false;
    }

    if (filters.endDate && new Date(collection.date) > new Date(filters.endDate)) {
      return false;
    }

    return true;
  });

  const filteredTotals = filteredCollections.reduce(
    (accumulator, item) => ({
      kilograms: accumulator.kilograms + Number(item.weightKg || 0),
      revenue: accumulator.revenue + Number(item.revenue || 0),
      cost: accumulator.cost + Number(item.totalCostPaid || 0),
      profit: accumulator.profit + Number(item.netProfit || 0)
    }),
    { kilograms: 0, revenue: 0, cost: 0, profit: 0 }
  );

  async function exportExcel() {
    await exportRowsToExcel(
      filteredCollections.map((item) => ({
        Date: formatDate(item.date),
        Client: item.clientName,
        Type: titleCase(item.clientType),
        "Weight (kg)": item.weightKg,
        "Buying Price (KES/kg)": item.buyingPricePerKg,
        "Supplier Cost (KES)": item.totalCostPaid,
        "Revenue (KES)": item.revenue,
        "Net Profit (KES)": item.netProfit
      })),
      "synergy-report.xlsx",
      "Collections"
    );
  }

  async function exportPdf() {
    await exportRowsToPdf({
      title: "Synergy Collection Report",
      fileName: "synergy-report.pdf",
      columns: [
        { header: "Date", key: "date" },
        { header: "Client", key: "client" },
        { header: "Type", key: "type" },
        { header: "Weight", key: "weight" },
        { header: "Revenue", key: "revenue" },
        { header: "Profit", key: "profit" }
      ],
      rows: filteredCollections.map((item) => ({
        date: formatDate(item.date),
        client: item.clientName,
        type: titleCase(item.clientType),
        weight: `${formatNumber(item.weightKg)} kg`,
        revenue: formatCurrency(item.revenue),
        profit: formatCurrency(item.netProfit)
      }))
    });
  }

  async function handleCreateReminder(event) {
    event.preventDefault();
    setMessage("");

    try {
      await api.post("/reminders", reminderForm);
      setReminderForm(defaultReminderForm);
      setMessage("Reminder created.");
      await refreshAll();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Could not create reminder.");
    }
  }

  async function handleReminderStatus(reminderId, status) {
    await api.put(`/reminders/${reminderId}`, { status });
    await refreshAll();
  }

  return (
    <div className="page-stack">
      <ChartPanel
        title="Reports and exports"
        subtitle="Filter by supplier type, date range, and status, then export Excel or PDF reports."
        actions={
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={exportExcel}>
              Export Excel
            </button>
            <button className="primary-button" type="button" onClick={exportPdf}>
              Export PDF
            </button>
          </div>
        }
      >
        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="Search by client or location"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <select value={filters.clientType} onChange={(event) => setFilters((current) => ({ ...current, clientType: event.target.value }))}>
            <option value="all">All client types</option>
            <option value="school">Schools</option>
            <option value="office">Offices</option>
            <option value="home">Homes</option>
          </select>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="all">All client statuses</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="inactive">Inactive</option>
          </select>
          <label className="filter-inline">
            From
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
            />
          </label>
          <label className="filter-inline">
            To
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
            />
          </label>
        </div>

        <div className="stats-grid">
          <StatCard label="Filtered kilograms" value={filteredTotals.kilograms} type="weight" />
          <StatCard label="Filtered revenue" value={filteredTotals.revenue} type="currency" />
          <StatCard label="Filtered supplier cost" value={filteredTotals.cost} type="currency" />
          <StatCard label="Filtered net profit" value={filteredTotals.profit} type="currency" />
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Location</th>
                <th>Weight</th>
                <th>Supplier cost</th>
                <th>Revenue</th>
                <th>Net profit</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.map((collection) => {
                const client = clients.find((item) => item._id === (collection.client?._id || collection.client));
                return (
                  <tr key={collection._id}>
                    <td>{formatDate(collection.date)}</td>
                    <td>{collection.clientName}</td>
                    <td>{client?.location || "-"}</td>
                    <td>{formatNumber(collection.weightKg)} kg</td>
                    <td>{formatCurrency(collection.totalCostPaid)}</td>
                    <td>{formatCurrency(collection.revenue)}</td>
                    <td>{formatCurrency(collection.netProfit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartPanel>

      <div className="grid-2">
        <ChartPanel title="Top suppliers by output" subtitle="Overall ranking from client performance analytics">
          <div className="stack-list">
            {(analytics?.clientPerformance || []).slice(0, 8).map((client) => (
              <article className="list-card" key={client.clientId}>
                <div>
                  <strong>{client.clientName}</strong>
                  <span>
                    {titleCase(client.clientType)} · {client.location}
                  </span>
                </div>
                <div className="list-card__metric">
                  <strong>{formatNumber(client.totalKg)} kg</strong>
                  <span>{formatCurrency(client.totalProfit)}</span>
                </div>
              </article>
            ))}
          </div>
        </ChartPanel>

        <ChartPanel title="Collection reminders" subtitle="Create reminders and update their status">
          <form className="modal__section" onSubmit={handleCreateReminder}>
            <div className="form-grid">
              <label>
                Client
                <select value={reminderForm.clientId} onChange={(event) => setReminderForm((current) => ({ ...current, clientId: event.target.value }))}>
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Assigned to
                <select value={reminderForm.assignedTo} onChange={(event) => setReminderForm((current) => ({ ...current, assignedTo: event.target.value }))}>
                  <option value="">Auto assign</option>
                  {users.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Title
                <input value={reminderForm.title} onChange={(event) => setReminderForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label>
                Due date
                <input type="date" value={reminderForm.dueDate} onChange={(event) => setReminderForm((current) => ({ ...current, dueDate: event.target.value }))} />
              </label>
              <label>
                Frequency
                <select value={reminderForm.frequency} onChange={(event) => setReminderForm((current) => ({ ...current, frequency: event.target.value }))}>
                  <option value="one-time">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            </div>
            <label>
              Note
              <textarea value={reminderForm.note} rows="3" onChange={(event) => setReminderForm((current) => ({ ...current, note: event.target.value }))} />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit">
                Create reminder
              </button>
              {message ? <p className="form-message">{message}</p> : null}
            </div>
          </form>

          <div className="stack-list">
            {reminders.map((reminder) => (
              <article className="list-card" key={reminder._id}>
                <div>
                  <strong>{reminder.title}</strong>
                  <span>
                    {reminder.client?.name} · {formatDate(reminder.dueDate)}
                  </span>
                </div>
                <select value={reminder.status} onChange={(event) => handleReminderStatus(reminder._id, event.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="skipped">Skipped</option>
                </select>
              </article>
            ))}
          </div>
        </ChartPanel>
      </div>
    </div>
  );
}
