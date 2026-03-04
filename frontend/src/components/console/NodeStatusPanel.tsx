"use client";

import { useEffect, useState } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { api } from "@/lib/api";

type NodeStatus = {
  version: string | null;
  nodeId: string | null;
  networkId: number | null;
  networkName: string | null;
  peerCount: number | null;
  healthy: boolean | null;
  timestamp: string;
};

export function NodeStatusPanel() {
  const { selectedNetwork } = useNetwork();
  const [status, setStatus] = useState<NodeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.node.status(selectedNetwork?.rpcUrl);

        if ((data as any).error) {
          throw new Error((data as any).error);
        }

        setStatus({
          version: data.version ?? null,
          nodeId: (data as any).nodeId ?? null,
          networkId: (data as any).networkId ?? null,
          networkName: (data as any).networkName ?? null,
          peerCount: (data as any).peerCount ?? null,
          healthy: data.healthy,
          timestamp: (data as any).timestamp ?? new Date().toISOString(),
        });
      } catch (err) {
        // If it's the primary network, connection refused often means node is off.
        // If it's a subnet, it might mean subnet is not running.
        const msg = (err as Error).message;
        setError(msg === 'Failed to fetch' ? 'Connection failed' : msg);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10_000);
    return () => clearInterval(interval);
  }, [selectedNetwork]);

  if (loading) {
    return <p className="text-sm text-slate-400">Checking node...</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-300">
        {error} – check `AVALANCHE_NODE_*` in backend/.env.
      </p>
    );
  }

  if (!status) {
    return <p className="text-sm text-slate-400">No node data available.</p>;
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-black/50 p-4 text-sm text-slate-200">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold text-white">Version: {status.version ?? "?"}</span>
        <span
          className={`rounded-full px-3 py-0.5 text-xs ${status.healthy ? "bg-green-400/20 text-green-200" : "bg-red-400/20 text-red-200"
            }`}
        >
          {status.healthy ? "Healthy" : "Unhealthy"}
        </span>
      </div>
      <div className="mt-3 space-y-1 text-xs text-slate-300">
        <p>Node ID: {status.nodeId ?? "Unknown"}</p>
        <p>
          Network: {status.networkName ?? status.networkId ?? "N/A"} – Peers:{" "}
          {status.peerCount ?? "?"}
        </p>
        <p>Updated: {new Date(status.timestamp).toLocaleString("en-US")}</p>
      </div>
    </div>
  );
}

