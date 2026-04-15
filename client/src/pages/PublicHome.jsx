import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, Phone, School, Building2, House } from "lucide-react";
import api from "../api/api";
import SynergyMark from "../components/SynergyMark";

const serviceGroups = [
  { icon: School, title: "Schools", copy: "Structured term, monthly, or bi-weekly paper collection for institutions." },
  { icon: Building2, title: "Offices", copy: "Reliable pickup for printed paper, archives, cartons, and office waste streams." },
  { icon: House, title: "Homes", copy: "Easy neighborhood pickups for households that want cleaner spaces." }
];

export default function PublicHome() {
  const [publicSettings, setPublicSettings] = useState({
    companyName: "Synergy",
    location: "Meru Town",
    contactEmail: "+254795577637",
    phoneNumber: "+254140205383",
    whatsappNumber: "+254795577637",
    logoText: "Synergy Turning waste into value"
  });
  const [form, setForm] = useState({
    name: "",
    organizationName: "",
    organizationType: "school",
    inquiryType: "pickup-request",
    phoneNumber: "",
    email: "",
    location: "",
    estimatedWasteOutput: "Medium - 20 to 50 kg",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/settings/public")
      .then(({ data }) => {
        setPublicSettings((current) => ({
          ...current,
          ...data
        }));
      })
      .catch(() => {});
  }, []);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await api.post("/inquiries/public", form);
      setMessage("Your inquiry has been received. Synergy will follow up shortly.");
      setForm({
        name: "",
        organizationName: "",
        organizationType: "school",
        inquiryType: "pickup-request",
        phoneNumber: "",
        email: "",
        location: "",
        estimatedWasteOutput: "Medium - 20 to 50 kg",
        message: ""
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "We could not send your inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const whatsappUrl = `https://wa.me/${String(publicSettings.whatsappNumber || "").replace(/\D/g, "")}`;
  const brandingSubtitle = String(publicSettings.logoText || "")
    .replace(/^Synergy\s*/i, "")
    .trim();
  const contactDescriptor = String(publicSettings.contactEmail || "").includes("@")
    ? publicSettings.contactEmail
    : `Primary contact: ${publicSettings.contactEmail}`;

  return (
    <div className="public-page">
      <a className="whatsapp-fab" href={whatsappUrl} target="_blank" rel="noreferrer">
        WhatsApp
      </a>

      <header className="public-header">
        <SynergyMark subtitle={brandingSubtitle || "Turning waste into value"} />
        <nav>
          <a href="#services">Services</a>
          <a href="#benefits">Benefits</a>
          <a href="#contact">Contact</a>
          <Link to="/login">Staff Login</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero__visual" aria-hidden="true">
          <div className="paper-stack paper-stack--one" />
          <div className="paper-stack paper-stack--two" />
          <div className="paper-stream" />
        </div>
        <motion.div
          className="hero__content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="eyebrow">Waste Paper Collection Across Kenya</p>
          <h1>{publicSettings.companyName} keeps schools, offices, and homes clean with reliable paper pickup.</h1>
          <p>
            We collect waste paper, handle transport, create structured partnerships, and turn loose paper waste into
            a consistent recycling flow.
          </p>
          <div className="hero__actions">
            <a className="primary-button" href="#contact">
              Request pickup
            </a>
            <a className="secondary-button" href="#services">
              Learn more
            </a>
          </div>
        </motion.div>
      </section>

      <section className="support-band">
        <div>
          <span>What we do</span>
          <strong>We collect waste paper from schools, offices, and homes.</strong>
        </div>
        <div>
          <span>What you get</span>
          <strong>Clean spaces, easy pickup, structured service, and reliable collection.</strong>
        </div>
      </section>

      <section className="public-section" id="services">
        <div className="section-heading">
          <p className="eyebrow">Services</p>
          <h2>One structured collection system for every supplier type.</h2>
        </div>
        <div className="service-grid">
          {serviceGroups.map((item) => {
            const Icon = item.icon;
            return (
              <article className="service-block" key={item.title}>
                <Icon size={26} />
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="public-section public-section--split">
        <div className="section-heading">
          <p className="eyebrow">About Synergy</p>
          <h2>A professional green-and-white service built for practical waste paper recovery.</h2>
          <p>
            Synergy coordinates collection points, schedules pickups, records quantities, and manages responsible
            recycling delivery with a workflow that is simple for non-technical clients.
          </p>
        </div>
        <div className="feature-list">
          {[
            "Clear collection schedules for institutions and households",
            "Reliable transport and aggregation handled by Synergy",
            "Professional forms, agreements, and record keeping",
            "A service model that supports long-term partnerships"
          ].map((item) => (
            <div className="feature-list__item" key={item}>
              <Leaf size={18} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="public-section" id="benefits">
        <div className="section-heading">
          <p className="eyebrow">Benefits</p>
          <h2>Cleaner compounds and easier logistics without extra work for your team.</h2>
        </div>
        <div className="benefits-strip">
          {["Clean spaces", "Easy pickup", "Structured service", "Reliable collection"].map((benefit) => (
            <div key={benefit}>{benefit}</div>
          ))}
        </div>
      </section>

      <section className="public-section public-section--contact" id="contact">
        <div className="section-heading">
          <p className="eyebrow">Partnership Inquiry</p>
          <h2>Request pickup, request partnership, or ask for more information.</h2>
          <p>Tell us whether you are a school, office, or home and we will follow up with the right next step.</p>
          <a className="contact-link" href={`tel:${publicSettings.phoneNumber}`}>
            <Phone size={18} /> {publicSettings.phoneNumber}
          </a>
          <p className="muted-text">{publicSettings.location}</p>
          <p className="muted-text">{contactDescriptor}</p>
        </div>

        <form className="inquiry-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Your name
              <input name="name" value={form.name} onChange={updateField} required />
            </label>
            <label>
              School / office / home name
              <input name="organizationName" value={form.organizationName} onChange={updateField} required />
            </label>
            <label>
              You are a
              <select name="organizationType" value={form.organizationType} onChange={updateField}>
                <option value="school">School</option>
                <option value="office">Office</option>
                <option value="home">Home</option>
              </select>
            </label>
            <label>
              Request type
              <select name="inquiryType" value={form.inquiryType} onChange={updateField}>
                <option value="pickup-request">Request pickup</option>
                <option value="partnership-request">Request partnership</option>
                <option value="general-inquiry">General inquiry</option>
              </select>
            </label>
            <label>
              Phone number
              <input name="phoneNumber" value={form.phoneNumber} onChange={updateField} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={updateField} />
            </label>
            <label>
              Location
              <input name="location" value={form.location} onChange={updateField} required />
            </label>
            <label>
              Estimated output
              <select name="estimatedWasteOutput" value={form.estimatedWasteOutput} onChange={updateField}>
                <option value="Low - 1 to 20 kg">Low - 1 to 20 kg</option>
                <option value="Medium - 20 to 50 kg">Medium - 20 to 50 kg</option>
                <option value="High - 50 kg and above">High - 50 kg and above</option>
              </select>
            </label>
          </div>

          <label>
            Message
            <textarea name="message" rows="5" value={form.message} onChange={updateField} />
          </label>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Submit inquiry"}
            <ArrowRight size={18} />
          </button>

          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </section>
    </div>
  );
}
