import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import api from "../api/api";
import ChartPanel from "../components/ChartPanel";
import DocumentCanvas from "../components/DocumentCanvas";
import { useAppData } from "../context/AppDataContext";
import { exportElementToPdf, titleCase } from "../utils/formatters";

const defaultDocumentValues = {
  referenceNumber: "SYN-001",
  materialType: "Mixed paper",
  startDate: "",
  endDate: "",
  estimatedWasteOutput: "Medium - 20 to 50 kg",
  remarks: ""
};

export default function DocumentsPage() {
  const { templates, clients, collections, settings, refreshAll } = useAppData();
  const [selectedSlug, setSelectedSlug] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [templateForm, setTemplateForm] = useState(null);
  const [documentValues, setDocumentValues] = useState(defaultDocumentValues);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const documentRef = useRef(null);

  useEffect(() => {
    if (templates.length && !selectedSlug) {
      setSelectedSlug(templates[0].slug);
    }
  }, [templates, selectedSlug]);

  const selectedTemplate = templates.find((template) => template.slug === selectedSlug) || null;
  const selectedClient = clients.find((client) => client._id === selectedClientId) || clients[0] || null;
  const clientCollections = collections.filter(
    (collection) => collection.client?._id === selectedClient?._id || collection.client === selectedClient?._id
  );
  const selectedCollection =
    clientCollections.find((collection) => collection._id === selectedCollectionId) || clientCollections[0] || null;

  useEffect(() => {
    if (selectedTemplate) {
      setTemplateForm({
        name: selectedTemplate.name,
        description: selectedTemplate.description || "",
        title: selectedTemplate.title,
        subtitle: selectedTemplate.subtitle || "",
        intro: selectedTemplate.intro || "",
        sections: selectedTemplate.sections || [],
        footer: selectedTemplate.footer || "",
        signatureLabels: selectedTemplate.signatureLabels || []
      });
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedClient && !selectedClientId) {
      setSelectedClientId(selectedClient._id);
    }
  }, [selectedClient, selectedClientId]);

  useEffect(() => {
    if (selectedCollection && !selectedCollectionId) {
      setSelectedCollectionId(selectedCollection._id);
    }
  }, [selectedCollection, selectedCollectionId]);

  const handlePrint = useReactToPrint({
    contentRef: documentRef,
    documentTitle: selectedTemplate?.name || "synergy-document"
  });

  async function handleSaveTemplate(event) {
    event.preventDefault();
    if (!selectedTemplate || !templateForm) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await api.put(`/documents/templates/${selectedTemplate.slug}`, templateForm);
      setMessage("Template saved.");
      await refreshAll();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Could not save template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadPdf() {
    if (documentRef.current && selectedTemplate) {
      await exportElementToPdf(documentRef.current, `${selectedTemplate.slug}.pdf`);
    }
  }

  if (!selectedTemplate || !templateForm) {
    return <div className="screen-center">Loading templates...</div>;
  }

  return (
    <div className="page-stack">
      <ChartPanel title="Document management" subtitle="Edit templates, preview branded documents, print, and export PDF">
        <div className="document-workspace">
          <div className="document-sidebar">
            <label>
              Document template
              <select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)}>
                {templates.map((template) => (
                  <option key={template.slug} value={template.slug}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Client / school
              <select
                value={selectedClientId}
                onChange={(event) => {
                  setSelectedClientId(event.target.value);
                  setSelectedCollectionId("");
                }}
              >
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Collection record source
              <select value={selectedCollectionId} onChange={(event) => setSelectedCollectionId(event.target.value)}>
                <option value="">Use latest collection</option>
                {clientCollections.map((collection) => (
                  <option key={collection._id} value={collection._id}>
                    {titleCase(collection.materialType)} · {new Date(collection.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Reference number
              <input
                value={documentValues.referenceNumber}
                onChange={(event) => setDocumentValues((current) => ({ ...current, referenceNumber: event.target.value }))}
              />
            </label>
            <label>
              Material type
              <input
                value={documentValues.materialType}
                onChange={(event) => setDocumentValues((current) => ({ ...current, materialType: event.target.value }))}
              />
            </label>
            <label>
              Start date
              <input
                type="date"
                value={documentValues.startDate}
                onChange={(event) => setDocumentValues((current) => ({ ...current, startDate: event.target.value }))}
              />
            </label>
            <label>
              End date
              <input
                type="date"
                value={documentValues.endDate}
                onChange={(event) => setDocumentValues((current) => ({ ...current, endDate: event.target.value }))}
              />
            </label>
            <label>
              Estimated output
              <select
                value={documentValues.estimatedWasteOutput}
                onChange={(event) =>
                  setDocumentValues((current) => ({ ...current, estimatedWasteOutput: event.target.value }))
                }
              >
                <option value="Low - 1 to 20 kg">Low - 1 to 20 kg</option>
                <option value="Medium - 20 to 50 kg">Medium - 20 to 50 kg</option>
                <option value="High - 50 kg and above">High - 50 kg and above</option>
              </select>
            </label>

            <div className="document-actions">
              <button className="primary-button" type="button" onClick={handlePrint}>
                Print preview
              </button>
              <button className="secondary-button" type="button" onClick={handleDownloadPdf}>
                Download PDF
              </button>
            </div>
          </div>

          <form className="document-editor" onSubmit={handleSaveTemplate}>
            <div className="form-grid">
              <label>
                Template name
                <input
                  value={templateForm.name}
                  onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Description
                <input
                  value={templateForm.description}
                  onChange={(event) => setTemplateForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <label>
                Title
                <input
                  value={templateForm.title}
                  onChange={(event) => setTemplateForm((current) => ({ ...current, title: event.target.value }))}
                />
              </label>
              <label>
                Subtitle
                <input
                  value={templateForm.subtitle}
                  onChange={(event) => setTemplateForm((current) => ({ ...current, subtitle: event.target.value }))}
                />
              </label>
            </div>

            <label>
              Intro
              <textarea
                rows="4"
                value={templateForm.intro}
                onChange={(event) => setTemplateForm((current) => ({ ...current, intro: event.target.value }))}
              />
            </label>

            <div className="stack-list">
              {templateForm.sections.map((section, index) => (
                <div className="section-card" key={`${section.heading}-${index}`}>
                  <div className="form-grid">
                    <label>
                      Section heading
                      <input
                        value={section.heading}
                        onChange={(event) =>
                          setTemplateForm((current) => ({
                            ...current,
                            sections: current.sections.map((item, sectionIndex) =>
                              sectionIndex === index ? { ...item, heading: event.target.value } : item
                            )
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Section body
                    <textarea
                      rows="5"
                      value={section.body}
                      onChange={(event) =>
                        setTemplateForm((current) => ({
                          ...current,
                          sections: current.sections.map((item, sectionIndex) =>
                            sectionIndex === index ? { ...item, body: event.target.value } : item
                          )
                        }))
                      }
                    />
                  </label>
                  <button
                    className="ghost-button danger"
                    type="button"
                    onClick={() =>
                      setTemplateForm((current) => ({
                        ...current,
                        sections: current.sections.filter((_, sectionIndex) => sectionIndex !== index)
                      }))
                    }
                  >
                    Remove section
                  </button>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setTemplateForm((current) => ({
                    ...current,
                    sections: [...current.sections, { heading: "New Section", body: "Add content here." }]
                  }))
                }
              >
                Add section
              </button>
            </div>

            <label>
              Footer
              <textarea
                rows="3"
                value={templateForm.footer}
                onChange={(event) => setTemplateForm((current) => ({ ...current, footer: event.target.value }))}
              />
            </label>

            <label>
              Signature labels
              <input
                value={templateForm.signatureLabels.join(", ")}
                onChange={(event) =>
                  setTemplateForm((current) => ({
                    ...current,
                    signatureLabels: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  }))
                }
              />
            </label>

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save template"}
              </button>
              {message ? <p className="form-message">{message}</p> : null}
            </div>
          </form>
        </div>
      </ChartPanel>

      <ChartPanel title="Print preview" subtitle="Auto-filled with current client and collection details">
        <div className="document-preview">
          <DocumentCanvas
            ref={documentRef}
            template={templateForm}
            client={selectedClient}
            collection={selectedCollection}
            settings={settings}
            documentValues={documentValues}
          />
        </div>
      </ChartPanel>
    </div>
  );
}
