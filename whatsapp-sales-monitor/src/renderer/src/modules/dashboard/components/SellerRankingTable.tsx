import { SellersRankingResponse } from "../types";

interface SellerRankingTableProps {
  data: SellersRankingResponse | null;
}

export const SellerRankingTable = ({ data }: SellerRankingTableProps): JSX.Element => {
  return (
    <section className="panel">
      <h2>Seller Ranking</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Leads</th>
            <th>Conversion %</th>
            <th>Avg Score</th>
            <th>Avg Response</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((item) => (
            <tr key={item.sellerId}>
              <td>{item.sellerName}</td>
              <td>{item.leadsHandled}</td>
              <td>{item.conversionRate}%</td>
              <td>{item.averageScore}</td>
              <td>{item.averageResponseMinutes} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
