import { ResponseTimeResponse } from "../types";

interface ResponseTimePanelProps {
  data: ResponseTimeResponse | null;
}

export const ResponseTimePanel = ({ data }: ResponseTimePanelProps): JSX.Element => {
  return (
    <section className="panel">
      <h2>Response Time</h2>
      <p>
        Avg: <strong>{data?.summary.averageFirstResponseMinutes ?? 0} min</strong> | P50:{" "}
        <strong>{data?.summary.p50FirstResponseMinutes ?? 0} min</strong> | P90:{" "}
        <strong>{data?.summary.p90FirstResponseMinutes ?? 0} min</strong>
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Avg First Response</th>
          </tr>
        </thead>
        <tbody>
          {(data?.bySeller ?? []).map((row) => (
            <tr key={row.sellerId}>
              <td>{row.sellerName}</td>
              <td>{row.averageFirstResponseMinutes} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
