"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type SubnetOperation = {
  id: string;
  type: string;
  status: string;
  log: string | null;
  createdAt: string;
  completedAt?: string | null;
};

type Subnet = {
  id: string;
  name: string;
  vmType: string;
  network: string;
  status: string;
  chainId?: string | null;
  subnetId?: string | null;
  rpcUrl?: string | null;
  createdAt: string;
  operations?: SubnetOperation[];
};

export function SubnetDashboard() {
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [selected, setSelected] = useState<Subnet | null>(null);
  const [operations, setOperations] = useState<SubnetOperation[]>([]);
  const [loadingOps, setLoadingOps] = useState(false);

  const fetchSubnets = useCallback(async () => {
    const res = await fetch(`${API_BASE}/subnets`);
    const data = await res.json();
    setSubnets(data);
  }, []);

  useEffect(() => {
    fetchSubnets();
  }, [fetchSubnets]);

  useEffect(() => {
    const handler = () => fetchSubnets();
    window.addEventListener("subnet-created", handler);
    return () => window.removeEventListener("subnet-created", handler);
  }, [fetchSubnets]);

  const openSubnet = async (subnet: Subnet) => {
    setSelected(subnet);
    setLoadingOps(true);
    try {
      const res = await fetch(`${API_BASE}/subnets/${subnet.id}/operations`);
      setOperations(await res.json());
    } catch (error) {
      console.error(error);
      setOperations([]);
    } finally {
      setLoadingOps(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
          Subnet Control Center
        </p>
        <h3 className="text-2xl font-semibold text-white">Danh sách subnet</h3>
        <p className="text-slate-300">
          Theo dõi trạng thái deploy, chain ID, endpoint RPC và log chi tiết từng bước.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {subnets.map((subnet) => (
          <button
            key={subnet.id}
            onClick={() => openSubnet(subnet)}
            className="flex w-full flex-col rounded-2xl border border-white/5 bg-black/30 px-4 py-3 text-left text-sm text-white transition hover:border-teal-400/60"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-semibold">{subnet.name}</span>
              <span className="rounded-full border border-white/20 px-3 py-0.5 text-xs uppercase tracking-widest text-slate-300">
                {subnet.vmType}
              </span>
              <span className="rounded-full border border-white/20 px-3 py-0.5 text-xs uppercase tracking-widest text-slate-300">
                {subnet.network}
              </span>
              <span
                className={`rounded-full px-3 py-0.5 text-xs ${subnet.status === "RUNNING"
                    ? "bg-green-400/20 text-green-200"
                    : subnet.status === "FAILED"
                      ? "bg-red-400/20 text-red-200"
                      : "bg-slate-500/20 text-slate-200"
                  }`}
              >
                {subnet.status}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-300">
              Chain ID: {subnet.chainId ?? "Đang cập nhật"} · RPC:{" "}
              {subnet.rpcUrl ?? "chưa sẵn sàng"}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Tạo lúc {new Date(subnet.createdAt).toLocaleString("vi-VN")}
            </div>
          </button>
        ))}
        {subnets.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-slate-300">
            Chưa có subnet nào. Hãy dùng wizard bên trên để tạo subnet đầu tiên.
          </div>
        )}
      </div>

      {selected && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-semibold text-white">{selected.name}</h4>
            <span className="text-xs text-slate-400">ID: {selected.id}</span>
          </div>
          <div className="mt-3 text-sm text-slate-300">
            RPC: <span className="text-white">{selected.rpcUrl ?? "—"}</span>
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold text-white">Log vận hành</p>
            {loadingOps ? (
              <p className="text-sm text-slate-400">Đang tải log...</p>
            ) : (
              <pre className="mt-3 max-h-64 overflow-auto rounded-xl border border-white/5 bg-black/60 p-4 text-xs text-slate-200">
                {operations.length === 0
                  ? "Chưa có log."
                  : operations
                    .map((op) => `# ${op.type} (${op.status})\n${op.log ?? ""}`)
                    .join("\n\n")}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

