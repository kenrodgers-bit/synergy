import { useEffect, useRef, useState } from "react";
import { ClipboardPen, Download, FileText, LayoutDashboard, Plus, Receipt, School, Trash2 } from "lucide-react";

const KEYS = { schools: "syn_schools", collections: "syn_collections", payouts: "syn_payouts" };
const RATE = 28;
const seedSchools = [
  { id: "s1", name: "Nkubu Boys High School", location: "Nkubu", addedDate: "2025-04-01" },
  { id: "s2", name: "Meru School", location: "Meru Town", addedDate: "2025-04-05" },
  { id: "s3", name: "St. Theresa Girls", location: "Chogoria", addedDate: "2025-04-10" }
];
const seedCollections = [
  { id: "c1", schoolId: "s1", kg: 48, date: "2025-04-03", paid: true, payoutId: "p1" },
  { id: "c2", schoolId: "s2", kg: 35, date: "2025-04-06", paid: true, payoutId: "p1" },
  { id: "c3", schoolId: "s3", kg: 22, date: "2025-04-11", paid: false, payoutId: null },
  { id: "c4", schoolId: "s1", kg: 61, date: "2025-04-13", paid: false, payoutId: null }
];
const seedPayouts = [{ id: "p1", date: "2025-04-08", kg: 83, amount: 83 * RATE, note: "First pickup" }];

const formatMoney = (value) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value || 0);

const read = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage issues
  }
};

function downloadHtml(name, html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SynergyAdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [schools, setSchools] = useState(() => read(KEYS.schools, seedSchools));
  const [collections, setCollections] = useState(() => read(KEYS.collections, seedCollections));
  const [payouts, setPayouts] = useState(() => read(KEYS.payouts, seedPayouts));

  useEffect(() => write(KEYS.schools, schools), [schools]);
  useEffect(() => write(KEYS.collections, collections), [collections]);
  useEffect(() => write(KEYS.payouts, payouts), [payouts]);

  const totalKg = collections.reduce((sum, item) => sum + Number(item.kg || 0), 0);
  const unpaid = collections.filter((item) => !item.paid);
  const unpaidKg = unpaid.reduce((sum, item) => sum + Number(item.kg || 0), 0);
  const tabs = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["schools", "Schools", School],
    ["logger", "Log Collection", ClipboardPen],
    ["payouts", "Payouts", Receipt],
    ["docs", "Documents", FileText]
  ];

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroBlock}>
          <img alt="Synergy logo" src="/synergy-logo.png" style={styles.logo} />
          <div>
            <p style={styles.eyebrow}>Synergy Admin Tool</p>
            <h2 style={styles.title}>School outreach, collection logging, payout tracking, and print-ready docs</h2>
            <p style={styles.copy}>This page adds the lightweight admin workflow from your `synergy-admin.jsx` file inside the main dashboard.</p>
          </div>
        </div>
        <div style={styles.heroCard}>
          <span style={styles.kicker}>Recycler rate</span>
          <strong style={styles.big}>{formatMoney(RATE)}/kg</strong>
          <span style={styles.copy}>Outstanding balance: {formatMoney(unpaidKg * RATE)}</span>
        </div>
      </section>

      <div style={styles.tabRow}>
        {tabs.map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setTab(id)} style={{ ...styles.tab, ...(tab === id ? styles.tabActive : {}) }}>
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === "dashboard" ? <Dashboard schools={schools} collections={collections} totalKg={totalKg} unpaidKg={unpaidKg} /> : null}
      {tab === "schools" ? <Schools schools={schools} setSchools={setSchools} collections={collections} /> : null}
      {tab === "logger" ? <Logger schools={schools} collections={collections} setCollections={setCollections} /> : null}
      {tab === "payouts" ? <Payouts collections={collections} payouts={payouts} setCollections={setCollections} setPayouts={setPayouts} /> : null}
      {tab === "docs" ? <Docs schools={schools} /> : null}
    </div>
  );
}

function Dashboard({ schools, collections, totalKg, unpaidKg }) {
  const ranked = schools
    .map((school) => ({
      ...school,
      totalKg: collections.filter((item) => item.schoolId === school.id).reduce((sum, item) => sum + Number(item.kg || 0), 0)
    }))
    .sort((a, b) => b.totalKg - a.totalKg)
    .slice(0, 5);
  const recent = [...collections].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div style={styles.stack}>
      <div style={styles.grid}>
        <Stat label="Total collected" value={`${totalKg.toFixed(1)} kg`} note="All time" />
        <Stat label="Projected revenue" value={formatMoney(totalKg * RATE)} note="At recycler rate" />
        <Stat label="Schools tracked" value={schools.length} note="Local admin list" />
        <Stat label="Outstanding" value={formatMoney(unpaidKg * RATE)} note={`${unpaidKg} kg pending`} />
      </div>
      <Card title="Top schools by volume">
        {ranked.map((school) => (
          <div key={school.id} style={styles.listItem}>
            <div>
              <strong>{school.name}</strong>
              <div style={styles.meta}>{school.location || "No location set"}</div>
            </div>
            <strong style={styles.green}>{school.totalKg} kg</strong>
          </div>
        ))}
      </Card>
      <Card title="Recent collections">
        {recent.map((item) => {
          const school = schools.find((entry) => entry.id === item.schoolId);
          return (
            <div key={item.id} style={styles.listItem}>
              <div>
                <strong>{school?.name || "Unknown school"}</strong>
                <div style={styles.meta}>{item.date}</div>
              </div>
              <div style={styles.rightMeta}>
                <strong style={styles.green}>{item.kg} kg</strong>
                <span style={item.paid ? styles.good : styles.warn}>{item.paid ? "Paid" : "Pending"}</span>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function Schools({ schools, setSchools, collections }) {
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ name: "", location: "" });
  const selected = schools.find((school) => school.id === selectedId);
  const history = selected ? collections.filter((item) => item.schoolId === selected.id) : [];

  const addSchool = () => {
    if (!form.name.trim()) return;
    setSchools((current) => [...current, { id: `s${Date.now()}`, name: form.name.trim(), location: form.location.trim(), addedDate: new Date().toISOString().split("T")[0] }]);
    setForm({ name: "", location: "" });
  };

  const removeSchool = (id) => {
    if (!window.confirm("Remove this school?")) return;
    setSchools((current) => current.filter((school) => school.id !== id));
    if (selectedId === id) setSelectedId("");
  };

  return (
    <div style={styles.stack}>
      <Card title="Add school">
        <div style={styles.formGrid}>
          <input style={styles.input} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="School name" />
          <input style={styles.input} value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
        </div>
        <button type="button" style={styles.primary} onClick={addSchool}><Plus size={15} />Add school</button>
      </Card>
      <Card title={`Schools (${schools.length})`}>
        {schools.map((school) => (
          <button key={school.id} type="button" onClick={() => setSelectedId(selectedId === school.id ? "" : school.id)} style={{ ...styles.selectRow, ...(selectedId === school.id ? styles.selectRowActive : {}) }}>
            <div>
              <strong>{school.name}</strong>
              <div style={styles.meta}>{school.location || "No location"} | Added {school.addedDate}</div>
            </div>
            <div style={styles.rightMeta}>
              <strong style={styles.green}>{collections.filter((item) => item.schoolId === school.id).reduce((sum, item) => sum + Number(item.kg || 0), 0)} kg</strong>
              <span onClick={(event) => { event.stopPropagation(); removeSchool(school.id); }} style={styles.iconOnly}><Trash2 size={15} /></span>
            </div>
          </button>
        ))}
      </Card>
      {selected ? (
        <Card title={`${selected.name} collection history`}>
          {history.length ? history.map((item) => (
            <div key={item.id} style={styles.listItem}>
              <div>
                <strong>{item.kg} kg collected</strong>
                <div style={styles.meta}>{item.date}</div>
              </div>
              <span style={item.paid ? styles.good : styles.warn}>{item.paid ? "Paid" : "Pending"}</span>
            </div>
          )) : <p style={styles.copy}>No collections recorded for this school yet.</p>}
        </Card>
      ) : null}
    </div>
  );
}

function Logger({ schools, collections, setCollections }) {
  const [form, setForm] = useState({
    schoolId: schools[0]?.id || "",
    kg: "",
    date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    if (form.schoolId || !schools[0]?.id) return;
    setForm((current) => ({ ...current, schoolId: schools[0].id }));
  }, [form.schoolId, schools]);

  const addCollection = () => {
    if (!form.schoolId || !form.kg) return;
    setCollections((current) => [
      { id: `c${Date.now()}`, schoolId: form.schoolId, kg: Number(form.kg), date: form.date, paid: false, payoutId: null },
      ...current
    ]);
    setForm((current) => ({ ...current, kg: "" }));
  };

  const removeCollection = (id) => {
    if (!window.confirm("Delete this collection?")) return;
    setCollections((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div style={styles.stack}>
      <Card title="Log collection">
        <div style={styles.formGrid}>
          <select style={styles.input} value={form.schoolId} onChange={(event) => setForm((current) => ({ ...current, schoolId: event.target.value }))}>
            <option value="">Select school</option>
            {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
          </select>
          <input style={styles.input} type="number" min="0" step="0.1" value={form.kg} onChange={(event) => setForm((current) => ({ ...current, kg: event.target.value }))} placeholder="Weight in kg" />
          <input style={styles.input} type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
        </div>
        <button type="button" style={styles.primary} onClick={addCollection}><Plus size={15} />Add collection</button>
      </Card>
      <Card title="Collection log">
        {collections.map((item) => {
          const school = schools.find((entry) => entry.id === item.schoolId);
          return (
            <div key={item.id} style={styles.listItem}>
              <div>
                <strong>{school?.name || "Unknown school"}</strong>
                <div style={styles.meta}>{item.date} | {item.kg} kg | {formatMoney(item.kg * RATE)}</div>
              </div>
              <div style={styles.rightMeta}>
                <span style={item.paid ? styles.good : styles.warn}>{item.paid ? "Paid" : "Pending"}</span>
                <span onClick={() => removeCollection(item.id)} style={styles.iconOnly}><Trash2 size={15} /></span>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function Payouts({ collections, payouts, setCollections, setPayouts }) {
  const [note, setNote] = useState("");
  const unpaid = collections.filter((item) => !item.paid);
  const unpaidKg = unpaid.reduce((sum, item) => sum + Number(item.kg || 0), 0);
  const unpaidAmount = unpaidKg * RATE;

  const recordPayout = () => {
    if (!unpaid.length) return;
    const payout = { id: `p${Date.now()}`, date: new Date().toISOString().split("T")[0], kg: unpaidKg, amount: unpaidAmount, note: note.trim() };
    setPayouts((current) => [payout, ...current]);
    setCollections((current) => current.map((item) => item.paid ? item : { ...item, paid: true, payoutId: payout.id }));
    setNote("");
  };

  return (
    <div style={styles.stack}>
      <Card title="Outstanding payout">
        <div style={styles.payoutCard}>
          <div>
            <span style={styles.kicker}>Current unpaid balance</span>
            <strong style={styles.big}>{formatMoney(unpaidAmount)}</strong>
            <div style={styles.meta}>{unpaidKg} kg across {unpaid.length} collections</div>
          </div>
          <div style={styles.payoutForm}>
            <input style={styles.input} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Pickup note" />
            <button type="button" style={styles.primary} onClick={recordPayout}><Receipt size={15} />Record payout</button>
          </div>
        </div>
      </Card>
      <Card title="Payout history">
        {payouts.map((item) => (
          <div key={item.id} style={styles.listItem}>
            <div>
              <strong>{item.note || "Pickup payout"}</strong>
              <div style={styles.meta}>{item.date} | {item.kg} kg</div>
            </div>
            <strong style={styles.green}>{formatMoney(item.amount)}</strong>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Docs({ schools }) {
  const [schoolId, setSchoolId] = useState("");
  const frameRef = useRef(null);
  const school = schools.find((item) => item.id === schoolId);
  const docs = [
    ["proposal", "School Proposal", "Synergy_School_Proposal.html"],
    ["registration", "Registration Form", "Synergy_Registration_Form.html"],
    ["collection", "Collection Record", "Synergy_Collection_Record.html"],
    ["agreement", "Partnership Agreement", "Synergy_Partnership_Agreement.html"]
  ];

  const preview = (type) => {
    if (!frameRef.current) return;
    frameRef.current.srcdoc = getDocumentHtml(type, school);
  };

  return (
    <div style={styles.stack}>
      <Card title="Document generator">
        <select style={styles.input} value={schoolId} onChange={(event) => setSchoolId(event.target.value)}>
          <option value="">Blank document</option>
          {schools.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <div style={styles.docGrid}>
          {docs.map(([id, label, filename]) => (
            <div key={id} style={styles.docItem}>
              <div>
                <strong>{label}</strong>
                <div style={styles.meta}>Preview in-app or download as HTML for print to PDF.</div>
              </div>
              <div style={styles.actionRow}>
                <button type="button" style={styles.secondary} onClick={() => preview(id)}>Preview</button>
                <button type="button" style={styles.primary} onClick={() => downloadHtml(filename, getDocumentHtml(id, school))}><Download size={15} />Download</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Preview">
        <iframe ref={frameRef} title="Synergy document preview" style={styles.preview} />
      </Card>
    </div>
  );
}

function getDocumentHtml(type, school) {
  const schoolName = school?.name || "[School Name]";
  const location = school?.location || "Meru Town";
  const today = new Intl.DateTimeFormat("en-KE", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
  const logoUrl = `${window.location.origin}/synergy-logo.png`;
  const body = {
    collection: `<h1>Synergy Collection Record Form</h1><p>Client/School: <strong>${schoolName}</strong></p><p>Date: <strong>${today}</strong></p><p>Type of material: Waste paper</p><p>Quantity in kg: ____________________</p><p>Remarks: ______________________________________________________</p>`,
    agreement: `<h1>Synergy Partnership Agreement</h1><p>This agreement is entered between Synergy and <strong>${schoolName}</strong> in <strong>${location}</strong>.</p><p>Contact person: ____________________</p><p>Agreed terms: Waste paper collection and recycling support.</p><p>Buying price arrangement: Negotiated per client.</p>`,
    registration: `<h1>Synergy Registration Form</h1><p>Name: <strong>${schoolName}</strong></p><p>Institution/client type: School</p><p>Location: <strong>${location}</strong></p><p>Phone: ____________________</p><p>Email: ____________________</p><p>Estimated waste output: ____________________</p><p>Status: ____________________</p>`,
    proposal: `<h1>Synergy School Proposal</h1><p>Prepared for <strong>${schoolName}</strong> on <strong>${today}</strong>.</p><p>Synergy collects waste paper from schools, offices, and homes to create cleaner spaces and reliable recycling partnerships.</p><h2>Benefits</h2><ul><li>Clean spaces</li><li>Easy pickup</li><li>Structured service</li><li>Reliable collection</li></ul><p>Prepared by Synergy: ____________________</p>`
  };

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Synergy document</title><style>body{font-family:Arial,sans-serif;max-width:820px;margin:0 auto;padding:40px;color:#1e2d28;line-height:1.6}header{display:flex;gap:16px;align-items:center;border-bottom:3px solid #61b545;padding-bottom:18px;margin-bottom:24px}img{width:72px;height:72px;object-fit:contain}h1,h2{color:#0e5f40;margin-bottom:10px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:36px}.signatures div{border-top:1px solid #0e5f40;padding-top:8px}@media print{body{padding:18px}}</style></head><body><header><img src="${logoUrl}" alt="Synergy logo" /><div><div style="font-size:24px;font-weight:800;letter-spacing:.04em;color:#0e5f40;">SYNERGY</div><div style="font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#496c5c;">Waste Paper Initiative</div><div style="font-size:12px;color:#496c5c;margin-top:6px;">Turning waste into value | Meru Town | ${today}</div></div></header>${body[type]}<div class="signatures"><div>Client / School Signature</div><div>Synergy Representative</div></div></body></html>`;
}

function Card({ title, children }) {
  return <section style={styles.card}><h3 style={styles.cardTitle}>{title}</h3>{children}</section>;
}

function Stat({ label, value, note }) {
  return <div style={styles.stat}><span style={styles.kicker}>{label}</span><strong style={styles.statValue}>{value}</strong><span style={styles.meta}>{note}</span></div>;
}

const styles = {
  page: { background: "linear-gradient(180deg, #09130f 0%, #11231a 100%)", color: "#eef8f1", borderRadius: 28, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,.22)" },
  hero: { display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 18 },
  heroBlock: { display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 760 },
  logo: { width: 76, height: 76, objectFit: "contain", borderRadius: 18, background: "rgba(255,255,255,.96)", padding: 6 },
  eyebrow: { margin: 0, textTransform: "uppercase", letterSpacing: ".16em", fontSize: ".75rem", color: "#8be271", fontWeight: 700 },
  title: { margin: "8px 0 10px", fontSize: "clamp(1.55rem, 3vw, 2.3rem)", lineHeight: 1.1 },
  copy: { margin: 0, color: "#b2d0bf", lineHeight: 1.6 },
  heroCard: { minWidth: 220, background: "rgba(123,210,82,.09)", border: "1px solid rgba(123,210,82,.18)", borderRadius: 18, padding: 18, display: "grid", gap: 6 },
  kicker: { textTransform: "uppercase", letterSpacing: ".14em", fontSize: ".74rem", color: "#92d59a" },
  big: { fontSize: "1.5rem" },
  tabRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 },
  tab: { display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#eef8f1", borderRadius: 999, padding: "10px 16px", cursor: "pointer" },
  tabActive: { background: "linear-gradient(135deg, #7bcc46 0%, #129160 100%)", borderColor: "transparent" },
  stack: { display: "grid", gap: 16 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  stat: { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, padding: 16, display: "grid", gap: 8 },
  statValue: { fontSize: "1.45rem" },
  card: { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 22, padding: 18 },
  cardTitle: { marginTop: 0, marginBottom: 14 },
  listItem: { display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.08)" },
  meta: { color: "#a9c6b3", fontSize: ".92rem", lineHeight: 1.6 },
  rightMeta: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  green: { color: "#8be271" },
  good: { background: "rgba(98,205,116,.16)", color: "#8be271", borderRadius: 999, padding: "5px 10px", fontSize: ".82rem" },
  warn: { background: "rgba(255,197,92,.16)", color: "#ffd26d", borderRadius: 999, padding: "5px 10px", fontSize: ".82rem" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 },
  input: { width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(3,14,9,.58)", color: "#eef8f1", padding: "12px 14px" },
  primary: { display: "inline-flex", alignItems: "center", gap: 8, border: "none", borderRadius: 999, background: "linear-gradient(135deg, #7bcc46 0%, #129160 100%)", color: "#fff", padding: "11px 18px", cursor: "pointer" },
  secondary: { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "#eef8f1", padding: "11px 16px", cursor: "pointer" },
  selectRow: { width: "100%", border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", color: "#eef8f1", borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" },
  selectRowActive: { borderColor: "rgba(123,210,82,.35)", background: "rgba(123,210,82,.1)" },
  iconOnly: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)" },
  payoutCard: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-end", flexWrap: "wrap" },
  payoutForm: { display: "grid", gap: 10, minWidth: 260 },
  docGrid: { display: "grid", gap: 12, marginTop: 14 },
  docItem: { display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", padding: 16, borderRadius: 16, background: "rgba(255,255,255,.04)" },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  preview: { width: "100%", minHeight: 720, borderRadius: 18, border: "1px solid rgba(255,255,255,.1)", background: "#fff" }
};
