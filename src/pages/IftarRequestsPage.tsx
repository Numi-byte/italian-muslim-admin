// src/pages/IftarRequestsPage.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Alert, Badge, Button, Card, EmptyState, Spinner } from "../components/ui";
import { InboxIcon } from "../components/icons";

type IftarRequestRow = {
  id: number;
  masjid_name: string;
  city: string;
  day_number: number;
  date: string;
  requester_name: string | null;
  phone: string | null;
  message?: string | null; // 👈 main field
  note?: string | null;    // 👈 fallback if RPC still uses "note"
  status: "requested" | "approved" | "rejected" | "cancelled_by_user";
  created_at: string;
};

const IftarRequestsPage: React.FC = () => {
  const [rows, setRows] = useState<IftarRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (): Promise<{
    rows: IftarRequestRow[];
    errorMsg: string | null;
  }> => {
    const { data, error } = await supabase.rpc("admin_list_iftar_requests");

    if (error) {
      console.error("Error loading iftar requests", error);
      return { rows: [], errorMsg: error.message };
    }

    const rows = (data as IftarRequestRow[]) ?? [];
    console.log("Iftar RPC rows:", rows); // 👈 see real shape in browser console
    return { rows, errorMsg: null };
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      setLoading(true);
      setError(null);

      const { rows, errorMsg } = await fetchRequests();
      if (cancelled) return;

      if (errorMsg) {
        setError(errorMsg);
        setRows([]);
      } else {
        setRows(rows);
      }

      setLoading(false);
    };

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    const { rows, errorMsg } = await fetchRequests();

    if (errorMsg) {
      setError(errorMsg);
      setRows([]);
    } else {
      setRows(rows);
    }

    setLoading(false);
  };

  const updateStatus = async (id: number, status: "approved" | "rejected") => {
    setUpdatingId(id);
    setError(null);

    const { error } = await supabase
      .from("iftar_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating iftar_requests", error);
      setError(error.message);
    } else {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    }

    setUpdatingId(null);
  };

  const pendingCount = rows.filter((r) => r.status === "requested").length;

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">Requests</span>
            {pendingCount > 0 && (
              <Badge tone="amber">{pendingCount} pending</Badge>
            )}
            {loading && <Spinner />}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void handleRefresh()}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<InboxIcon />}
              title="No iftar requests yet"
              description="When users request a sponsorship day, they'll appear here for you to approve or reject."
            />
          </div>
        ) : (
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-[760px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Day</th>
                  <th className="px-5 py-3">Masjid</th>
                  <th className="px-5 py-3">Requester</th>
                  <th className="px-5 py-3">Note</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const dateLabel = new Date(r.date).toLocaleDateString(
                    "it-IT",
                    { weekday: "short", day: "2-digit", month: "2-digit" }
                  );

                  // Show message, or note, or fallback
                  const text = r.message ?? r.note ?? "—";

                  return (
                    <tr key={r.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-3 align-middle">
                        <div className="font-semibold text-slate-900">
                          Day {r.day_number}
                        </div>
                        <div className="text-xs text-slate-400">{dateLabel}</div>
                      </td>
                      <td className="px-5 py-3 align-middle text-slate-700">
                        <div>{r.masjid_name}</div>
                        <div className="text-xs text-slate-400">{r.city}</div>
                      </td>
                      <td className="px-5 py-3 align-middle text-slate-700">
                        <div>{r.requester_name ?? "—"}</div>
                        {r.phone && (
                          <div className="text-xs text-slate-400">{r.phone}</div>
                        )}
                      </td>
                      <td className="max-w-[220px] px-5 py-3 align-middle text-slate-600">
                        {text}
                      </td>
                      <td className="px-5 py-3 align-middle">
                        {r.status === "requested" && (
                          <Badge tone="amber">Pending</Badge>
                        )}
                        {r.status === "approved" && (
                          <Badge tone="emerald">Approved</Badge>
                        )}
                        {r.status === "rejected" && (
                          <Badge tone="rose">Rejected</Badge>
                        )}
                        {r.status === "cancelled_by_user" && (
                          <Badge tone="slate">Cancelled</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="subtle"
                            disabled={updatingId === r.id}
                            onClick={() => void updateStatus(r.id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={updatingId === r.id}
                            onClick={() => void updateStatus(r.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default IftarRequestsPage;
