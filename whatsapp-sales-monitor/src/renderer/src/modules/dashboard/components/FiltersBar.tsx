import { ChangeEvent } from "react";
import { DashboardFilters } from "../types";

interface FiltersBarProps {
  filters: DashboardFilters;
  sellerOptions: Array<{ sellerId: string; sellerName: string }>;
  onChange: (next: DashboardFilters) => void;
}

export const FiltersBar = ({
  filters,
  sellerOptions,
  onChange,
}: FiltersBarProps): JSX.Element => {
  const update = (key: keyof DashboardFilters) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ ...filters, [key]: event.target.value });
  };

  return (
    <section className="panel filters-bar">
      <label>
        From
        <input type="date" value={filters.from} onChange={update("from")} />
      </label>
      <label>
        To
        <input type="date" value={filters.to} onChange={update("to")} />
      </label>
      <label>
        Seller
        <select value={filters.sellerId} onChange={update("sellerId")}>
          <option value="">All sellers</option>
          {sellerOptions.map((seller) => (
            <option key={seller.sellerId} value={seller.sellerId}>
              {seller.sellerName}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
};
