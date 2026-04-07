import { ActiveAlertsResponse } from "../types";

interface ActiveAlertsWidgetProps {
  data: ActiveAlertsResponse | null;
}

const timeOpen = (openedAt: string): string => {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export const ActiveAlertsWidget = ({ data }: ActiveAlertsWidgetProps): JSX.Element => {
  return (
    <section className="panel">
      <h2>Active Alerts</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Priority</th>
            <th>Type</th>
            <th>Seller</th>
            <th>Conversation</th>
            <th>Risk</th>
            <th>Open</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).slice(0, 20).map((item) => (
            <tr key={item.id}>
              <td>
                <span className={`priority priority-${item.priority}`}>{item.priority}</span>
              </td>
              <td title={item.description}>{item.title}</td>
              <td>{item.sellerName}</td>
              <td>{item.conversationId ?? "-"}</td>
              <td>{item.riskScore}</td>
              <td>{timeOpen(item.openedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
