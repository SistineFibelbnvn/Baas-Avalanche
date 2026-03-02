"use client";

import {
  BarChart3,
  Box,
  Globe,
  LayoutDashboard,
  Settings,
  Shield,
  Wallet,
  Activity,
  FileCode,
  Zap,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "#", icon: LayoutDashboard, id: "dashboard" },
  { name: "Subnets", href: "#subnets", icon: Box, id: "subnets" },
  { name: "Validators", href: "#validators", icon: Shield, id: "validators" },
  { name: "Contracts", href: "#contracts", icon: FileCode, id: "contracts" },
  { name: "Monitoring", href: "#monitoring", icon: Activity, id: "monitoring" },
  { name: "Benchmark", href: "#benchmark", icon: Zap, id: "benchmark" },
];

const secondaryNav = [
  { name: "Settings", href: "#settings", icon: Settings, id: "settings" },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface ConsoleSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ConsoleSidebar({ activeTab, onTabChange }: ConsoleSidebarProps) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-800 bg-slate-900 px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center gap-3 font-bold text-xl text-white">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="block">AVXU</span>
            <span className="text-xs font-normal text-slate-500">BaaS Console</span>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <div className="text-xs font-semibold leading-6 text-slate-500 uppercase tracking-wider mb-2">
              Main
            </div>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={classNames(
                      activeTab === item.id
                        ? "bg-blue-600/10 text-blue-400 border-blue-500"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white border-transparent",
                      "group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 w-full text-left border-l-2 transition-all"
                    )}
                  >
                    <item.icon
                      className={classNames(
                        activeTab === item.id ? "text-blue-400" : "text-slate-500 group-hover:text-white",
                        "h-5 w-5 shrink-0 transition-colors"
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{item.name}</span>
                    {activeTab === item.id && (
                      <ChevronRight className="h-4 w-4 text-blue-400" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </li>

          <li className="mt-auto">
            <div className="text-xs font-semibold leading-6 text-slate-500 uppercase tracking-wider mb-2">
              System
            </div>
            <ul role="list" className="-mx-2 space-y-1">
              {secondaryNav.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={classNames(
                      activeTab === item.id
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                      "group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 w-full text-left transition-all"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}

