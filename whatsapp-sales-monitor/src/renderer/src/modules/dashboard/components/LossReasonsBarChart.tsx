import { LossReasonsResponse } from "../types";

interface LossReasonsBarChartProps {
  data: LossReasonsResponse | null;
}

export const LossReasonsBarChart = ({ data }: LossReasonsBarChartProps): JSX.Element => {
  const max = Math.max(1, ...(data?.items.map((item) => item.count) ?? [1]));

  return (
    <section className="panel">
      <h2>Loss Reasons</h2>
      <div className="bars">
        {(data?.items ?? []).map((item) => (
          <div key={item.reason} className="bar-row">
            <span className="bar-label">{item.reason}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
            <span className="bar-value">
              {item.count} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
