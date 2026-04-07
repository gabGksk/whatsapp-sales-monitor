import { ConversionFunnelResponse } from "../types";

interface ConversionFunnelChartProps {
  data: ConversionFunnelResponse | null;
}

export const ConversionFunnelChart = ({ data }: ConversionFunnelChartProps): JSX.Element => {
  const max = Math.max(1, ...(data?.stages.map((stage) => stage.count) ?? [1]));

  return (
    <section className="panel">
      <h2>Conversion Funnel</h2>
      <div className="funnel">
        {(data?.stages ?? []).map((stage) => (
          <div key={stage.stage} className="funnel-stage">
            <div
              className="funnel-bar"
              style={{ width: `${Math.max(12, (stage.count / max) * 100)}%` }}
            />
            <span className="funnel-label">
              {stage.stage} - {stage.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
