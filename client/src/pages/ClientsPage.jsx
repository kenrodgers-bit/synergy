import { useDeferredValue, useState } from "react";
import api from "../api/api";
import ChartPanel from "../components/ChartPanel";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  paymentCategory,
  paymentModelLabel,
  titleCase
} from "../utils/formatters";

const defaultClientForm = {
  name: "",
  contactPerson: "",
  phoneNumber: "",
  email: "",
  location: "",
  clientType: "school",
  status: "prospect",
  agreedBuyingPricePerKg: 0,
  paymentModel: "free-supply",
  notes: "",
  tags: [],
  collectionFrequency: "monthly",
  estimatedWasteOutput: "Medium - 20 to 50 kg",
  assignedAgent: "",
  initialNegotiationNote: ""
};

function guessPaymentModel(price) {
  const numeric = Number(price || 0);

  if (numeric === 0) {
    return "free-supply";
  }

  if (numeric === 5 || numeric === 7) {
    return "paid-per-kg";
  }

  return "custom-negotiated";
}

export default function ClientsPage() {
  const { clients, analytics, users, refreshAll } = useAppData();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    clientType: "all",
    status: "all",
    paymentCategory: "all",
    sort: "top-output"
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultClientForm);
  const [historyClient, setHistoryClient] = useState(null);
  const [historyForm, setHistoryForm] = useState({ note: "", price: 0 });
  const [message, setMessage] = useState("");
  const deferredSearch = useDeferredValue(search);

  const performanceMap = Object.fromEntries(
    (analytics?.clientPerformance || []).map((client) => [String(client.clientId), client])
  );

  const filteredClients = [...clients]
    .filter((client) => {
      const searchMatches =
        !deferredSearch ||
        [client.name, client.contactPerson, client.location]
          .join(" ")
          .toLowerCase()
          .includes(deferredSearch.toLowerCase());

      if (!searchMatches) {
        return false;
      }

      if (filters.clientType !== "all" && client.clientType !== filters.clientType) {
        return false;
      }

      if (filters.status !== "all" && client.status !== filters.status) {
        return false;
      }

      if (filters.paymentCategory !== "all" && paymentCategory(client.agreedBuyingPricePerKg) !== filters.paymentCategory) {
        return false;
      }

      if (filters.sort === "active-only" && client.status !== "active") {
        return false;
      }

      return true;
    })
    .sort((left, right) => {
      const leftPerformance = performanceMap[String(left._id)] || {};
      const rightPerformance = performanceMap[String(right._id)] || {};

      if (filters.sort === "name") {
        return left.name.localeCompare(right.name);
      }

      return (rightPerformance.totalKg || 0) - (leftPerformance.totalKg || 0);
    });

  function openCreateModal() {
    setEditingId(null);
    setForm(defaultClientForm);
    setModalOpen(true);
    setMessage("");
  }

  function openEditModal(client) {
    setEditingId(client._id);
    setForm({
      name: client.name,
      contactPerson: client.contactPerson,
      phoneNumber: client.phoneNumber,
      email: client.email || "",
      location: client.location,
      clientType: client.clientType,
      status: client.status,
      agreedBuyingPricePerKg: client.agreedBuyingPricePerKg,
      paymentModel: client.paymentModel,
      notes: client.notes || "",
      tags: client.tags || [],
      collectionFrequency: client.collectionFrequency || "monthly",
      estimatedWasteOutput: client.estimatedWasteOutput || "Medium - 20 to 50 kg",
      assignedAgent: client.assignedAgent?._id || client.assignedAgent || "",
      initialNegotiationNote: ""
    });
    setModalOpen(true);
    setMessage("");
  }

  async function handleSaveClient(event) {
    event.preventDefault();
    setMessage("");

    try {
      const payload = {
        ...form,
        paymentModel: form.paymentModel || guessPaymentModel(form.agreedBuyingPricePerKg)
      };

      if (editingId) {
        await api.put(`/clients/${editingId}`, payload);
      } else {
        await api.post("/clients", payload);
      }

      setModalOpen(false);
      await refreshAll();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Could not save client.");
    }
  }

  async function handleDeleteClient(clientId) {
    if (!window.confirm("Delete this client?")) {
      return;
    }

    await api.delete(`/clients/${clientId}`);
    await refreshAll();
  }

  async function handleHistorySubmit(event) {
    event.preventDefault();

    if (!historyClient) {
      return;
    }

    try {
      await api.post(`/clients/${historyClient._id}/history`, historyForm);
      setHistoryForm({ note: "", price: historyClient.agreedBuyingPricePerKg || 0 });
      await refreshAll();
      setHistoryClient(
        clients.find((item) => item._id === historyClient._id) || historyClient
      );
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Could not save negotiation history.");
    }
  }

  return (
    <div className="page-stack">
      <ChartPanel
        title="Client management"
        subtitle="Manage suppliers, negotiated buying prices, payment models, notes, and assignment."
        actions={
          user.role !== "collection-agent" ? (
            <button className="primary-button" type="button" onClick={openCreateModal}>
              Add client
            </button>
          ) : null
        }
      >
        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="Search clients, contacts, or locations"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={filters.clientType} onChange={(event) => setFilters((current) => ({ ...current, clientType: event.target.value }))}>
            <option value="all">All types</option>
            <option value="school">Schools</option>
            <option value="office">Offices</option>
            <option value="home">Homes</option>
          </select>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filters.paymentCategory}
            onChange={(event) => setFilters((current) => ({ ...current, paymentCategory: event.target.value }))}
          >
            <option value="all">All payment categories</option>
            <option value="free">Free supply</option>
            <option value="5">KES 5/kg</option>
            <option value="7">KES 7/kg</option>
            <option value="custom">Custom</option>
          </select>
          <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
            <option value="top-output">Top output</option>
            <option value="name">Alphabetical</option>
            <option value="active-only">Active only</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Status</th>
                <th>Location</th>
                <th>Price/kg</th>
                <th>Total output</th>
                <th>Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const performance = performanceMap[String(client._id)] || {};
                return (
                  <tr key={client._id}>
                    <td>
                      <strong>{client.name}</strong>
                      <div className="cell-meta">{client.contactPerson}</div>
                    </td>
                    <td>{titleCase(client.clientType)}</td>
                    <td>
                      <span className={`tag ${client.status === "active" ? "success" : client.status === "prospect" ? "warning" : "neutral"}`}>
                        {titleCase(client.status)}
                      </span>
                    </td>
                    <td>{client.location}</td>
                    <td>
                      {formatCurrency(client.agreedBuyingPricePerKg)}
                      <div className="cell-meta">{paymentModelLabel(client.paymentModel)}</div>
                    </td>
                    <td>{formatNumber(performance.totalKg || 0)} kg</td>
                    <td>{client.assignedAgent?.name || "-"}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => {
                            setHistoryClient(client);
                            setHistoryForm({
                              note: "",
                              price: client.agreedBuyingPricePerKg || 0
                            });
                          }}
                        >
                          History
                        </button>
                        {user.role !== "collection-agent" ? (
                          <>
                            <button className="ghost-button" type="button" onClick={() => openEditModal(client)}>
                              Edit
                            </button>
                            <button className="ghost-button danger" type="button" onClick={() => handleDeleteClient(client._id)}>
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartPanel>

      {modalOpen ? (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal__header">
              <h3>{editingId ? "Edit client" : "Add client"}</h3>
              <button className="ghost-button" type="button" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>

            <form className="modal__content" onSubmit={handleSaveClient}>
              <div className="form-grid">
                <label>
                  Client name
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label>
                  Contact person
                  <input
                    value={form.contactPerson}
                    onChange={(event) => setForm((current) => ({ ...current, contactPerson: event.target.value }))}
                  />
                </label>
                <label>
                  Phone number
                  <input
                    value={form.phoneNumber}
                    onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>
                <label>
                  Location
                  <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
                </label>
                <label>
                  Client type
                  <select value={form.clientType} onChange={(event) => setForm((current) => ({ ...current, clientType: event.target.value }))}>
                    <option value="school">School</option>
                    <option value="office">Office</option>
                    <option value="home">Home</option>
                  </select>
                </label>
                <label>
                  Status
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                    <option value="active">Active</option>
                    <option value="prospect">Prospect</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label>
                  Buying price per kg
                  <input
                    type="number"
                    min="0"
                    value={form.agreedBuyingPricePerKg}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        agreedBuyingPricePerKg: event.target.value,
                        paymentModel: guessPaymentModel(event.target.value)
                      }))
                    }
                  />
                </label>
                <label>
                  Payment model
                  <select value={form.paymentModel} onChange={(event) => setForm((current) => ({ ...current, paymentModel: event.target.value }))}>
                    <option value="free-supply">Free supply</option>
                    <option value="paid-per-kg">Paid per kg</option>
                    <option value="custom-negotiated">Custom negotiated</option>
                  </select>
                </label>
                <label>
                  Collection frequency
                  <select
                    value={form.collectionFrequency}
                    onChange={(event) => setForm((current) => ({ ...current, collectionFrequency: event.target.value }))}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="on-demand">On-demand</option>
                  </select>
                </label>
                <label>
                  Estimated output
                  <select
                    value={form.estimatedWasteOutput}
                    onChange={(event) => setForm((current) => ({ ...current, estimatedWasteOutput: event.target.value }))}
                  >
                    <option value="Low - 1 to 20 kg">Low - 1 to 20 kg</option>
                    <option value="Medium - 20 to 50 kg">Medium - 20 to 50 kg</option>
                    <option value="High - 50 kg and above">High - 50 kg and above</option>
                  </select>
                </label>
                <label>
                  Assigned collection agent
                  <select value={form.assignedAgent} onChange={(event) => setForm((current) => ({ ...current, assignedAgent: event.target.value }))}>
                    <option value="">Unassigned</option>
                    {users
                      .filter((item) => item.role === "collection-agent")
                      .map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <label>
                Tags
                <div className="checkbox-row">
                  {["active-supplier", "low-output", "high-output", "pending-agreement"].map((tag) => (
                    <label className="checkbox-chip" key={tag}>
                      <input
                        checked={form.tags.includes(tag)}
                        type="checkbox"
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            tags: event.target.checked
                              ? [...current.tags, tag]
                              : current.tags.filter((item) => item !== tag)
                          }))
                        }
                      />
                      {titleCase(tag)}
                    </label>
                  ))}
                </div>
              </label>

              <label>
                Notes
                <textarea value={form.notes} rows="4" onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>

              {!editingId ? (
                <label>
                  Initial negotiation note
                  <textarea
                    value={form.initialNegotiationNote}
                    rows="3"
                    onChange={(event) => setForm((current) => ({ ...current, initialNegotiationNote: event.target.value }))}
                  />
                </label>
              ) : null}

              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingId ? "Save changes" : "Create client"}
                </button>
                {message ? <p className="form-message error">{message}</p> : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {historyClient ? (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal__header">
              <h3>{historyClient.name} negotiation history</h3>
              <button className="ghost-button" type="button" onClick={() => setHistoryClient(null)}>
                Close
              </button>
            </div>

            <div className="modal__content">
              <div className="stack-list">
                {(historyClient.negotiationHistory || []).map((entry, index) => (
                  <article className="list-card" key={`${entry.date}-${index}`}>
                    <div>
                      <strong>{formatDate(entry.date)}</strong>
                      <span>{entry.note}</span>
                    </div>
                    <div className="list-card__metric">
                      <strong>{formatCurrency(entry.price)}</strong>
                    </div>
                  </article>
                ))}
              </div>

              {user.role !== "collection-agent" ? (
                <form className="modal__section" onSubmit={handleHistorySubmit}>
                  <h4>Add negotiation note</h4>
                  <label>
                    Note
                    <textarea rows="3" value={historyForm.note} onChange={(event) => setHistoryForm((current) => ({ ...current, note: event.target.value }))} />
                  </label>
                  <label>
                    Price at this stage
                    <input
                      type="number"
                      min="0"
                      value={historyForm.price}
                      onChange={(event) => setHistoryForm((current) => ({ ...current, price: event.target.value }))}
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    Save note
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
