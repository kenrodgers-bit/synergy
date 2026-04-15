import { useDeferredValue, useState } from "react";
import api from "../api/api";
import ChartPanel from "../components/ChartPanel";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import {
  calculateCollectionPreview,
  formatCurrency,
  formatDate,
  formatDateInput,
  formatNumber,
  titleCase
} from "../utils/formatters";

const defaultCollectionForm = {
  clientId: "",
  date: new Date().toISOString().slice(0, 10),
  materialType: "Mixed paper",
  weightKg: 0,
  buyingPricePerKg: 0,
  transportCost: 0,
  loadingCost: 0,
  miscellaneousCost: 0,
  notes: "",
  collectedById: ""
};

export default function CollectionsPage() {
  const { clients, collections, settings, users, refreshAll } = useAppData();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: "",
    clientType: "all",
    startDate: "",
    endDate: ""
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultCollectionForm);
  const [message, setMessage] = useState("");
  const deferredSearch = useDeferredValue(filters.search);

  const filteredCollections = collections.filter((collection) => {
    const searchMatches =
      !deferredSearch ||
      [collection.clientName, collection.clientType, collection.collectedByName]
        .join(" ")
        .toLowerCase()
        .includes(deferredSearch.toLowerCase());

    if (!searchMatches) {
      return false;
    }

    if (filters.clientType !== "all" && collection.clientType !== filters.clientType) {
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

  const preview = calculateCollectionPreview({
    ...form,
    recyclerPricePerKg: settings?.recyclerPricePerKg
  });

  function openCreateModal() {
    setEditingId(null);
    setForm(defaultCollectionForm);
    setModalOpen(true);
    setMessage("");
  }

  function openEditModal(collection) {
    setEditingId(collection._id);
    setForm({
      clientId: collection.client?._id || collection.client,
      date: formatDateInput(collection.date),
      materialType: collection.materialType || "Mixed paper",
      weightKg: collection.weightKg,
      buyingPricePerKg: collection.buyingPricePerKg,
      transportCost: collection.logistics?.transportCost || 0,
      loadingCost: collection.logistics?.loadingCost || 0,
      miscellaneousCost: collection.logistics?.miscellaneousCost || 0,
      notes: collection.notes || "",
      collectedById: collection.collectedBy?._id || collection.collectedBy || ""
    });
    setModalOpen(true);
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      if (editingId) {
        await api.put(`/collections/${editingId}`, form);
      } else {
        await api.post("/collections", form);
      }

      setModalOpen(false);
      await refreshAll();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Could not save collection.");
    }
  }

  async function handleDelete(collectionId) {
    if (!window.confirm("Delete this collection record?")) {
      return;
    }

    await api.delete(`/collections/${collectionId}`);
    await refreshAll();
  }

  return (
    <div className="page-stack">
      <ChartPanel
        title="Collection tracking"
        subtitle="Record each pickup, logistics cost, revenue, and net profit."
        actions={
          <button className="primary-button" type="button" onClick={openCreateModal}>
            Record collection
          </button>
        }
      >
        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="Search by client or collector"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <select value={filters.clientType} onChange={(event) => setFilters((current) => ({ ...current, clientType: event.target.value }))}>
            <option value="all">All client types</option>
            <option value="school">Schools</option>
            <option value="office">Offices</option>
            <option value="home">Homes</option>
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
          <div className="tag success">Recycler price: {formatCurrency(settings?.recyclerPricePerKg || 28)}</div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Weight</th>
                <th>Buying price</th>
                <th>Total cost</th>
                <th>Revenue</th>
                <th>Logistics</th>
                <th>Net profit</th>
                <th>Collected by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.map((collection) => (
                <tr key={collection._id}>
                  <td>{formatDate(collection.date)}</td>
                  <td>
                    <strong>{collection.clientName}</strong>
                    <div className="cell-meta">{titleCase(collection.clientType)}</div>
                  </td>
                  <td>{formatNumber(collection.weightKg)} kg</td>
                  <td>{formatCurrency(collection.buyingPricePerKg)}</td>
                  <td>{formatCurrency(collection.totalCostPaid)}</td>
                  <td>{formatCurrency(collection.revenue)}</td>
                  <td>{formatCurrency(collection.logisticsTotal)}</td>
                  <td>{formatCurrency(collection.netProfit)}</td>
                  <td>{collection.collectedByName}</td>
                  <td>
                    {user.role !== "collection-agent" ? (
                      <div className="table-actions">
                        <button className="ghost-button" type="button" onClick={() => openEditModal(collection)}>
                          Edit
                        </button>
                        <button className="ghost-button danger" type="button" onClick={() => handleDelete(collection._id)}>
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="cell-meta">View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartPanel>

      {modalOpen ? (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal__header">
              <h3>{editingId ? "Edit collection" : "Record collection"}</h3>
              <button className="ghost-button" type="button" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>

            <form className="modal__content" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Client
                  <select
                    value={form.clientId}
                    onChange={(event) => {
                      const selectedClient = clients.find((client) => client._id === event.target.value);
                      setForm((current) => ({
                        ...current,
                        clientId: event.target.value,
                        buyingPricePerKg: selectedClient?.agreedBuyingPricePerKg ?? current.buyingPricePerKg
                      }));
                    }}
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
                </label>
                <label>
                  Material type
                  <input
                    value={form.materialType}
                    onChange={(event) => setForm((current) => ({ ...current, materialType: event.target.value }))}
                  />
                </label>
                <label>
                  Weight collected (kg)
                  <input
                    type="number"
                    min="0"
                    value={form.weightKg}
                    onChange={(event) => setForm((current) => ({ ...current, weightKg: event.target.value }))}
                  />
                </label>
                <label>
                  Buying price per kg
                  <input
                    type="number"
                    min="0"
                    value={form.buyingPricePerKg}
                    onChange={(event) => setForm((current) => ({ ...current, buyingPricePerKg: event.target.value }))}
                  />
                </label>
                {user.role !== "collection-agent" ? (
                  <label>
                    Collected by
                    <select value={form.collectedById} onChange={(event) => setForm((current) => ({ ...current, collectedById: event.target.value }))}>
                      <option value="">Use my account</option>
                      {users.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label>
                  Transport cost
                  <input
                    type="number"
                    min="0"
                    value={form.transportCost}
                    onChange={(event) => setForm((current) => ({ ...current, transportCost: event.target.value }))}
                  />
                </label>
                <label>
                  Loading cost
                  <input
                    type="number"
                    min="0"
                    value={form.loadingCost}
                    onChange={(event) => setForm((current) => ({ ...current, loadingCost: event.target.value }))}
                  />
                </label>
                <label>
                  Miscellaneous cost
                  <input
                    type="number"
                    min="0"
                    value={form.miscellaneousCost}
                    onChange={(event) => setForm((current) => ({ ...current, miscellaneousCost: event.target.value }))}
                  />
                </label>
              </div>

              <label>
                Notes
                <textarea value={form.notes} rows="4" onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>

              <section className="summary-box">
                <h4>Financial preview</h4>
                <div className="summary-box__grid">
                  <div>
                    <span>Total cost to supplier</span>
                    <strong>{formatCurrency(preview.totalCostPaid)}</strong>
                  </div>
                  <div>
                    <span>Revenue</span>
                    <strong>{formatCurrency(preview.revenue)}</strong>
                  </div>
                  <div>
                    <span>Logistics total</span>
                    <strong>{formatCurrency(preview.logisticsTotal)}</strong>
                  </div>
                  <div>
                    <span>Net profit</span>
                    <strong>{formatCurrency(preview.netProfit)}</strong>
                  </div>
                </div>
              </section>

              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingId ? "Save collection" : "Create record"}
                </button>
                {message ? <p className="form-message error">{message}</p> : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
