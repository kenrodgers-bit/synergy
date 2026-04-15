import { forwardRef } from "react";
import SynergyMark from "./SynergyMark";
import {
  formatCurrency,
  formatDate,
  paymentModelLabel,
  renderTemplateText,
  titleCase
} from "../utils/formatters";

function buildDocumentTokens({ client, collection, settings, values }) {
  return {
    client: {
      name: client?.name || "Selected client",
      clientType: titleCase(client?.clientType || "school"),
      location: client?.location || settings?.location || "Kenya",
      contactPerson: client?.contactPerson || "-",
      phoneNumber: client?.phoneNumber || "-",
      email: client?.email || "-",
      notes: client?.notes || "-",
      status: titleCase(client?.status || "prospect"),
      collectionFrequency: titleCase(client?.collectionFrequency || "monthly"),
      agreedBuyingPricePerKg: client?.agreedBuyingPricePerKg ?? 0,
      paymentModelLabel: paymentModelLabel(client?.paymentModel || "free-supply")
    },
    collection: {
      date: formatDate(collection?.date || values?.date || new Date()),
      collectedByName: collection?.collectedByName || values?.collectorName || settings?.preparedBy || "Synergy Team",
      weightKg: collection?.weightKg ?? values?.weightKg ?? 0,
      buyingPricePerKg: collection?.buyingPricePerKg ?? client?.agreedBuyingPricePerKg ?? 0,
      totalCostPaid: formatCurrency(collection?.totalCostPaid ?? values?.totalCostPaid ?? 0),
      netProfit: formatCurrency(collection?.netProfit ?? values?.netProfit ?? 0),
      notes: collection?.notes || values?.remarks || "-",
      materialType: collection?.materialType || values?.materialType || "Mixed paper"
    },
    settings: {
      companyName: settings?.companyName || "Synergy",
      recyclerPricePerKg: settings?.recyclerPricePerKg ?? 28,
      preparedBy: settings?.preparedBy || "Rodgers",
      contactEmail: settings?.contactEmail || "+254795577637",
      whatsappNumber: settings?.whatsappNumber || "+254795577637",
      phoneNumber: settings?.phoneNumber || "+254140205383",
      location: settings?.location || "Meru Town",
      logoText: settings?.logoText || "Synergy Turning waste into value"
    },
    document: {
      referenceNumber: values?.referenceNumber || "SYN-001",
      materialType: values?.materialType || collection?.materialType || "Mixed paper",
      startDate: values?.startDate ? formatDate(values.startDate) : "-",
      endDate: values?.endDate ? formatDate(values.endDate) : "-",
      estimatedWasteOutput: values?.estimatedWasteOutput || client?.estimatedWasteOutput || "Medium - 20 to 50 kg"
    }
  };
}

function DetailList({ rows }) {
  return (
    <div className="document-grid">
      {rows.map((row) => (
        <div key={row.label} className="document-grid__item">
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

const DocumentCanvas = forwardRef(function DocumentCanvas(
  { template, client, collection, settings, documentValues },
  ref
) {
  if (!template) {
    return (
      <div className="document-sheet document-sheet--empty" ref={ref}>
        Select a template to preview the document.
      </div>
    );
  }

  const tokens = buildDocumentTokens({
    client,
    collection,
    settings,
    values: documentValues
  });

  const commonDetails = [
    { label: "Client", value: tokens.client.name },
    { label: "Type", value: tokens.client.clientType },
    { label: "Location", value: tokens.client.location },
    { label: "Date", value: tokens.collection.date }
  ];

  return (
    <div className="document-sheet" ref={ref}>
      <header className="document-sheet__header">
        <SynergyMark subtitle={tokens.settings.logoText.replace(/^Synergy\s*/i, "").trim() || "Turning waste into value"} />
        <div className="document-sheet__meta">
          <span>{settings?.location || "Meru Town"}</span>
          <span>{settings?.contactEmail || "+254795577637"}</span>
          <span>{settings?.phoneNumber || "+254140205383"}</span>
        </div>
      </header>

      <section className="document-sheet__hero">
        <p className="eyebrow">Synergy Document Suite</p>
        <h2>{renderTemplateText(template.title, tokens)}</h2>
        <p>{renderTemplateText(template.subtitle, tokens)}</p>
      </section>

      <DetailList rows={commonDetails} />

      {template.slug === "collection-record" ? (
        <DetailList
          rows={[
            { label: "Material", value: tokens.document.materialType },
            { label: "Quantity", value: `${tokens.collection.weightKg} kg` },
            { label: "Buying Price", value: `KES ${tokens.collection.buyingPricePerKg}/kg` },
            { label: "Total Cost Paid", value: tokens.collection.totalCostPaid }
          ]}
        />
      ) : null}

      {template.slug === "registration-form" ? (
        <DetailList
          rows={[
            { label: "Contact Person", value: tokens.client.contactPerson },
            { label: "Phone", value: tokens.client.phoneNumber },
            { label: "Email", value: tokens.client.email },
            { label: "Estimated Output", value: tokens.document.estimatedWasteOutput }
          ]}
        />
      ) : null}

      {template.slug === "partnership-agreement" ? (
        <DetailList
          rows={[
            { label: "Contact Person", value: tokens.client.contactPerson },
            { label: "Buying Price", value: `KES ${tokens.client.agreedBuyingPricePerKg}/kg` },
            { label: "Payment Model", value: tokens.client.paymentModelLabel },
            { label: "Schedule", value: tokens.client.collectionFrequency }
          ]}
        />
      ) : null}

      <p className="document-sheet__intro">{renderTemplateText(template.intro, tokens)}</p>

      <div className="document-sections">
        {template.sections?.map((section) => (
          <section className="document-section" key={section.heading}>
            <h3>{renderTemplateText(section.heading, tokens)}</h3>
            {renderTemplateText(section.body, tokens)
              .split("\n")
              .filter(Boolean)
              .map((line) => (
                <p key={line}>{line}</p>
              ))}
          </section>
        ))}
      </div>

      <footer className="document-sheet__footer">
        <p>{renderTemplateText(template.footer, tokens)}</p>
        <div className="signature-grid">
          {(template.signatureLabels || []).map((label) => (
            <div className="signature-card" key={label}>
              <span>{label}</span>
              <div />
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
});

export default DocumentCanvas;
