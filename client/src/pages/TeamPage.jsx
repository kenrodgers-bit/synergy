import { useState } from "react";
import api from "../api/api";
import ChartPanel from "../components/ChartPanel";
import { useAppData } from "../context/AppDataContext";
import { roleLabel } from "../utils/formatters";

const defaultUserForm = {
  name: "",
  email: "",
  password: "",
  phoneNumber: "",
  role: "collection-agent"
};

export default function TeamPage() {
  const { users, refreshAll } = useAppData();
  const [form, setForm] = useState(defaultUserForm);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      await api.post("/users", form);
      setForm(defaultUserForm);
      setMessage("Team member added.");
      await refreshAll();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Could not add team member.");
    }
  }

  async function handleDelete(userId) {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    await api.delete(`/users/${userId}`);
    await refreshAll();
  }

  return (
    <div className="page-stack">
      <ChartPanel title="Staff roles" subtitle="Super Admin can manage the Synergy internal team">
        <form className="modal__section" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Name
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
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
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <label>
              Phone number
              <input value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                <option value="super-admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="collection-agent">Collection Agent</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              Add team member
            </button>
            {message ? <p className="form-message">{message}</p> : null}
          </div>
        </form>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((member) => (
                <tr key={member._id}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{roleLabel(member.role)}</td>
                  <td>{member.phoneNumber || "-"}</td>
                  <td>
                    <button className="ghost-button danger" type="button" onClick={() => handleDelete(member._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartPanel>
    </div>
  );
}
