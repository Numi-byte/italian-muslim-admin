// src/pages/IftarRequestsPage.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-100">
          Iftar sponsorship requests
        </h2>
        <p className="text-xs text-slate-400">
          One accepted sponsor per day. Approve or reject user requests.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 text-xs text-red-200 px-3 py-2">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden text-xs">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-slate-200 font-medium">Requests</span>
          {loading ? (
            <span className="text-slate-400">Loading…</span>
          ) : (
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="text-[11px] px-2 py-1 rounded-full border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
            >
              Refresh
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="p-4 text-slate-400">
            No iftar requests yet. When users request a sponsorship day, they
            will appear here.
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-900/80 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Day
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Masjid
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Requester
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Note
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const dateLabel = new Date(r.date).toLocaleDateString(
                    "it-IT",
                    { weekday: "short", day: "2-digit", month: "2-digit" }
                  );

                  // 👇 Show message, or note, or fallback
                  const text = r.message ?? r.note ?? "—";

                  return (
                    <tr key={r.id} className="border-t border-slate-800">
                      <td className="px-3 py-2 align-middle text-slate-100">
                        <div className="font-semibold">
                          Day {r.day_number}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {dateLabel}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle text-slate-200">
                        <div>{r.masjid_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {r.city}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle text-slate-200">
                        <div>{r.requester_name ?? "—"}</div>
                        <div className="text-[11px] text-slate-400">
                          {r.phone ?? ""}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle text-slate-300">
                        {text}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        {r.status === "requested" && (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-medium">
                            Pending
                          </span>
                        )}
                        {r.status === "approved" && (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-500 text-emerald-950 font-medium">
                            Approved
                          </span>
                        )}
                        {r.status === "rejected" && (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-700 text-slate-50 font-medium">
                            Rejected
                          </span>
                        )}
                        {r.status === "cancelled_by_user" && (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-600 text-slate-50 font-medium">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={updatingId === r.id}
                            onClick={() => void updateStatus(r.id, "approved")}
                            className="px-2 py-1 rounded-full text-[11px] border border-emerald-500/60 bg-emerald-500/10 text-emerald-200 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === r.id}
                            onClick={() => void updateStatus(r.id, "rejected")}
                            className="px-2 py-1 rounded-full text-[11px] border border-red-500/60 bg-red-500/10 text-red-200 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default IftarRequestsPage;
