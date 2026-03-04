"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const vmOptions = [
  { label: "Subnet-EVM (mặc định)", value: "subnet-evm" },
  { label: "Custom-VM", value: "custom-vm" },
];

const networkOptions = [
  { label: "Local", value: "LOCAL" },
  { label: "Devnet", value: "DEVNET" },
  { label: "Testnet", value: "TESTNET" },
  { label: "Mainnet", value: "MAINNET" },
];

export function SubnetWizard({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [name, setName] = useState("");
  const [vmType, setVmType] = useState(vmOptions[0].value);
  const [network, setNetwork] = useState(networkOptions[0].value);
  const [config, setConfig] = useState(
    JSON.stringify(
      {
        gasConfig: {
          targetBlockRate: 2,
          minBaseFee: 25000000000,
          targetGas: 150000000,
        },
        allocation: [
          {
            address: "0xdef15ed3c25a1ce3b1b6a9d4da4acd3ffeedcafe",
            balance: "0x8ac7230489e80000",
          },
        ],
      },
      null,
      2,
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      let parsedConfig: Record<string, unknown> | undefined = undefined;
      try {
        parsedConfig = config ? JSON.parse(config) : undefined;
      } catch {
        setMessage("Cấu hình JSON không hợp lệ.");
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${API_BASE}/subnets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          vmType,
          network,
          config: parsedConfig,
        }),
      });
      if (!res.ok) throw new Error("Tạo subnet thất bại");

      setName("");
      setMessage("Đã bắt đầu tạo subnet, vui lòng theo dõi danh sách bên dưới.");
      onCreated?.();
      window.dispatchEvent(new CustomEvent("subnet-created"));
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
          Subnet Wizard
        </p>
        <h3 className="text-2xl font-semibold text-white">
          Khởi tạo blockchain Avalanche Layer-1
        </h3>
        <p className="text-slate-300">
          Nhập thông số cơ bản, chọn môi trường triển khai. Hệ thống sẽ mô phỏng
          avalanche-cli và ghi lại log vận hành.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Tên Subnet
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base focus:border-teal-400 focus:outline-none"
            placeholder="Ví dụ: AVXU-Subnet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Loại VM
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base focus:border-teal-400 focus:outline-none"
              value={vmType}
              onChange={(e) => setVmType(e.target.value)}
            >
              {vmOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Network mục tiêu
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base focus:border-teal-400 focus:outline-none"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
            >
              {networkOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Cấu hình JSON (gas, allocation…)
          <textarea
            className="h-48 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-mono text-slate-200 focus:border-teal-400 focus:outline-none"
            value={config}
            onChange={(e) => setConfig(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-teal-100 disabled:opacity-60"
          >
            {submitting ? "Đang khởi tạo..." : "Tạo subnet"}
          </button>
          {message && <span className="text-sm text-slate-300">{message}</span>}
        </div>
      </form>
    </div>
  );
}

