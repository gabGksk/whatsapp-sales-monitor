import { DashboardOverview } from "../types";

interface KpiCardsProps {
  overview: DashboardOverview | null;
}

const fmt = (value: number, suffix = ""): string => `${value.toLocaleString()}${suffix}`;

export const KpiCards = ({ overview }: KpiCardsProps): JSX.Element => {
  if (!overview) {
    return <section className="kpi-grid">Loading overview...</section>;
  }

  const cards = [
    { label: "Total Leads", value: fmt(overview.totalLeads) },
    { label: "Converted Leads", value: fmt(overview.convertedLeads) },
    { label: "Lost Leads", value: fmt(overview.lostLeads) },
    { label: "Conversion Rate", value: fmt(overview.conversionRate, "%") },
    { label: "Avg Seller Score", value: fmt(overview.averageSellerScore) },
    {
      label: "Avg First Response",
      value: fmt(overview.averageFirstResponseMinutes, " min"),
    },
  ];

  return (
    <section className="kpi-grid">
      {cards.map((card) => (
        <article className="panel kpi-card" key={card.label}>
          <h3>{card.label}</h3>
          <p>{card.value}</p>
        </article>
      ))}
    </section>
  );
};
