import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../api/api";
import ChartPanel from "../components/ChartPanel";
import StatCard from "../components/StatCard";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate, formatNumber, paymentModelLabel, titleCase } from "../utils/formatters";

const defaultSettingsForm = {
  companyName: "Synergy",
  recyclerPricePerKg: 28,
  preparedBy: "Rodgers",
  location: "Meru Town",
  contactEmail: "+254795577637",
  phoneNumber: "+254140205383",
  whatsappNumber: "+254795577637"
};

export default function DashboardPage() {
  const { analytics, settings, loading, error, refreshAll } = useAppData();
  const { user } = useAuth();
  const [settingsForm, setSettingsForm] = useState(defaultSettingsForm);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        companyName: settings.companyName || "Synergy",
        recyclerPricePerKg: settings.recyclerPricePerKg ?? 28,
        preparedBy: settings.preparedBy || "Rodgers",
        location: settings.location || "Meru Town",
        contactEmail: settings.contactEmail || "+254795577637",
        phoneNumber: settings.phoneNumber || "+254140205383",
        whatsappNumber: settings.whatsappNumber || "+254795577637"
      });
    }
  }, [settings]);

  async function handleSettingsSubmit(event) {
    event.preventDefault();
    setSavingSettings(true);
    setMessage("");

    try {
      await api.put("/settings/global", settingsForm);
      setMessage("Global recycler price and contact settings updated.");
      await refreshAll();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Could not update settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  if (loading && !analytics) {
    return <div className="screen-center">Loading dashboard...</div>;
  }

  if (!analytics) {
    return <div className="empty-state">{error || "Dashboard data is not available yet."}</div>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel--dashboard">
        <div>
          <p className="eyebrow">Operations Snapshot</p>
          <h2>Track negotiated buying prices, output, and profit from one place.</h2>
          <p>
            Synergy calculates revenue from the recycler price, subtracts client-specific paper cost plus logistics,
            and keeps the profit picture visible every day.
          </p>
        </div>
        <div className="hero-panel__metrics">
          <div>
            <span>Recycler price</span>
            <strong>{formatCurrency(analytics.stats.recyclerPricePerKg)}</strong>
          </div>
          <div>
            <span>Weekly profit</span>
            <strong>{formatCurrency(analytics.summary.weeklyProfit)}</strong>
          </div>
          <div>
            <span>Monthly profit</span>
            <strong>{formatCurrency(analytics.summary.monthlyProfit)}</strong>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Total clients" value={analytics.stats.totalClients} />
        <StatCard label="Active schools" value={analytics.stats.activeSchools} />
        <StatCard label="Active offices" value={analytics.stats.activeOffices} />
        <StatCard label="Active homes" value={analytics.stats.activeHomes} />
        <StatCard label="Total kilograms" value={analytics.stats.totalKilograms} type="weight" />
        <StatCard label="Total revenue" value={analytics.stats.totalRevenue} type="currency" />
        <StatCard label="Supplier costs" value={analytics.stats.totalCosts} type="currency" />
        <StatCard label="Net profit" value={analytics.stats.totalNetProfit} type="currency" />
      </section>

      <section className="grid-2">
        <ChartPanel title="Weight collected over time" subtitle="Daily collection output">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe8d7" />
                <XAxis dataKey="date" stroke="#6a7c6a" />
                <YAxis stroke="#6a7c6a" />
                <Tooltip />
                <Line type="monotone" dataKey="weightKg" stroke="#216146" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Revenue and profit" subtitle="Revenue versus net profit">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe8d7" />
                <XAxis dataKey="date" stroke="#6a7c6a" />
                <YAxis stroke="#6a7c6a" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#1d8f5c" strokeWidth={3} />
                <Line type="monotone" dataKey="netProfit" stroke="#0f3d28" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </section>

      <section className="grid-2">
        <ChartPanel title="Top suppliers" subtitle="Ranked by total kilograms supplied">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.topSuppliers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe8d7" />
                <XAxis dataKey="clientName" tick={false} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalKg" fill="#216146" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Client performance monitoring" subtitle="Recent top output and supply model">
          <div className="stack-list">
            {analytics.topSuppliers.map((client) => (
              <article className="list-card" key={client.clientId}>
                <div>
                  <strong>{client.clientName}</strong>
                  <span>
                    {titleCase(client.clientType)} · {paymentModelLabel(client.paymentModel)}
                  </span>
                </div>
                <div className="list-card__metric">
                  <strong>{formatNumber(client.totalKg)} kg</strong>
                  <span>{formatCurrency(client.totalProfit)} profit</span>
                </div>
              </article>
            ))}
          </div>
        </ChartPanel>
      </section>

      <section className="grid-3">
        <ChartPanel title="Recent collections" subtitle="Latest pickup activity">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Weight</th>
                  <th>Net profit</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentCollections.map((item) => (
                  <tr key={item._id}>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.clientName}</td>
                    <td>{formatNumber(item.weightKg)} kg</td>
                    <td>{formatCurrency(item.netProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartPanel>

        <ChartPanel title="Inactive clients" subtitle="Clients that have not supplied recently">
          <div className="stack-list">
            {analytics.inactiveClients.length ? (
              analytics.inactiveClients.map((client) => (
                <article className="list-card" key={client.clientId}>
                  <div>
                    <strong>{client.clientName}</strong>
                    <span>{client.location}</span>
                  </div>
                  <div className="tag neutral">{titleCase(client.status)}</div>
                </article>
              ))
            ) : (
              <p className="muted-text">No inactive clients in the current data set.</p>
            )}
          </div>
        </ChartPanel>

        <ChartPanel title="Prospects" subtitle="Pipeline clients waiting for activation">
          <div className="stack-list">
            {analytics.prospectClients.length ? (
              analytics.prospectClients.map((client) => (
                <article className="list-card" key={client._id}>
                  <div>
                    <strong>{client.name}</strong>
                    <span>{client.location}</span>
                  </div>
                  <div className="tag warning">Prospect</div>
                </article>
              ))
            ) : (
              <p className="muted-text">No prospect clients right now.</p>
            )}
          </div>
        </ChartPanel>
      </section>

      <section className="grid-2">
        <ChartPanel title="Collection reminders" subtitle="Upcoming reminders and field follow-ups">
          <div className="stack-list">
            {analytics.reminders.map((reminder) => (
              <article className="list-card" key={reminder._id}>
                <div>
                  <strong>{reminder.title}</strong>
                  <span>
                    {reminder.client?.name} · {formatDate(reminder.dueDate)}
                  </span>
                </div>
                <div className={`tag ${reminder.status === "pending" ? "success" : "neutral"}`}>
                  {titleCase(reminder.status)}
                </div>
              </article>
            ))}
          </div>
        </ChartPanel>

        <ChartPanel
          title={user.role === "collection-agent" ? "Assigned view" : "New inquiries"}
          subtitle={
            user.role === "collection-agent"
              ? "Collection agents only see assigned client activity."
              : "Fresh website leads and pickup requests."
          }
        >
          {user.role === "collection-agent" ? (
            <div className="empty-state compact">
              Assigned clients, collections, and reminders are filtered automatically based on your account.
            </div>
          ) : (
            <div className="stack-list">
              {analytics.inquiries.map((inquiry) => (
                <article className="list-card" key={inquiry._id}>
                  <div>
                    <strong>{inquiry.organizationName}</strong>
                    <span>
                      {titleCase(inquiry.organizationType)} · {titleCase(inquiry.inquiryType)}
                    </span>
                  </div>
                  <div className="tag neutral">{titleCase(inquiry.status)}</div>
                </article>
              ))}
            </div>
          )}
        </ChartPanel>
      </section>

      {user.role !== "collection-agent" ? (
        <ChartPanel title="Global business settings" subtitle="Edit recycler price and contact details">
          <form className="settings-form" onSubmit={handleSettingsSubmit}>
            <div className="form-grid">
              <label>
                Company name
                <input
                  value={settingsForm.companyName}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, companyName: event.target.value }))}
                />
              </label>
              <label>
                Recycler price per kg
                <input
                  type="number"
                  min="0"
                  value={settingsForm.recyclerPricePerKg}
                  onChange={(event) =>
                    setSettingsForm((current) => ({ ...current, recyclerPricePerKg: event.target.value }))
                  }
                />
              </label>
              <label>
                Prepared by
                <input
                  value={settingsForm.preparedBy}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, preparedBy: event.target.value }))}
                />
              </label>
              <label>
                Location
                <input
                  value={settingsForm.location}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, location: event.target.value }))}
                />
              </label>
              <label>
                Contact email / primary contact
                <input
                  type="text"
                  value={settingsForm.contactEmail}
                  onChange={(event) =>
                    setSettingsForm((current) => ({ ...current, contactEmail: event.target.value }))
                  }
                />
              </label>
              <label>
                Phone number
                <input
                  value={settingsForm.phoneNumber}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                />
              </label>
              <label>
                WhatsApp number
                <input
                  value={settingsForm.whatsappNumber}
                  onChange={(event) =>
                    setSettingsForm((current) => ({ ...current, whatsappNumber: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={savingSettings}>
                {savingSettings ? "Saving..." : "Save settings"}
              </button>
              {message ? <p className="form-message">{message}</p> : null}
            </div>
          </form>
        </ChartPanel>
      ) : null}
    </div>
  );
}
