import { RecentConversationsResponse } from "../types";

interface RecentConversationsTableProps {
  data: RecentConversationsResponse | null;
}

export const RecentConversationsTable = ({
  data,
}: RecentConversationsTableProps): JSX.Element => {
  return (
    <section className="panel">
      <h2>Recent Conversations</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Contact</th>
            <th>Last Message</th>
            <th>Outcome</th>
            <th>Reason</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((item) => (
            <tr key={item.conversationId}>
              <td>{item.sellerName}</td>
              <td>{item.contactId}</td>
              <td>{item.lastMessageText || "-"}</td>
              <td>{item.outcome}</td>
              <td>{item.lostReason ?? "-"}</td>
              <td>{new Date(item.lastMessageAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
