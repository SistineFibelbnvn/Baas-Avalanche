import { Injectable, Logger } from '@nestjs/common';
import { Avalanche } from 'avalanche';
import { ethers } from 'ethers';

@Injectable()
export class NodeStatusService {
  private readonly logger = new Logger(NodeStatusService.name);

  async fetchChainStats(rpcUrl: string, subnetName?: string) {
    let targetUrl = rpcUrl;
    let stats: any = { rpcUrl, online: false };
    const isTempId = targetUrl.includes('/subnet');

    // If it looks like a temp ID, try to resolve it FIRST before ever trying to connect
    if (isTempId || subnetName) {
      // Try resolving using Name first (most reliable)
      if (subnetName) {
        const resolvedUrl = await this.resolveRpcUrl(subnetName);
        if (resolvedUrl) {
          targetUrl = resolvedUrl;
        }
      }

      // Fallback: extract from URL if name resolution didn't work/happen
      if (targetUrl === rpcUrl && isTempId) {
        const subnetId = rpcUrl.split('/').find(s => s.startsWith('subnet'));
        if (subnetId) {
          const resolvedUrl = await this.resolveRpcUrl(subnetId);
          if (resolvedUrl) {
            targetUrl = resolvedUrl;
          }
        }
      }
    }

    // If we failed to resolve a temp ID, abort immediately to avoid error spam
    if (targetUrl.includes('/subnet') && targetUrl === rpcUrl) {
      return {
        rpcUrl: targetUrl,
        online: false,
        error: 'Chain not found (Resolution failed)',
        timestamp: new Date().toISOString()
      };
    }

    // Now try to connect (either to the original valid URL or the resolved one)
    stats = await this.tryFetchStats(targetUrl);
    if (targetUrl !== rpcUrl) {
      stats.rpcUrl = targetUrl;
    }

    return stats;
  }

  private async tryFetchStats(url: string) {
    try {
      // Pre-check: avoid ethers.js retry spam when node is offline
      if (!await this.isRpcReachable(url)) {
        return {
          rpcUrl: url,
          online: false,
          error: 'Node offline',
          timestamp: new Date().toISOString()
        };
      }

      const provider = new ethers.JsonRpcProvider(url);
      // Timeout promise to avoid long hangs
      const timeout = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const [blockNumber, feeData, network] = await Promise.race([
        Promise.all([
          provider.getBlockNumber().catch(() => null),
          provider.getFeeData().catch(() => ({ gasPrice: null })),
          provider.getNetwork().catch(() => null)
        ]),
        timeout
      ]) as any;

      return {
        blockNumber,
        gasPrice: feeData?.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
        chainId: network?.chainId ? Number(network.chainId) : null,
        rpcUrl: url,
        online: blockNumber !== null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        rpcUrl: url,
        online: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async resolveRpcUrl(identifier: string): Promise<string | null> {
    try {
      // Verify host/port from env or defaults
      const host = process.env.AVALANCHE_NODE_HOST ?? '127.0.0.1';
      const port = Number(process.env.AVALANCHE_NODE_PORT ?? '9650');
      const protocol = process.env.AVALANCHE_NODE_PROTOCOL ?? 'http';

      const response = await fetch(`${protocol}://${host}:${port}/ext/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'info.blockchains',
          params: {}
        })
      });

      if (!response.ok) return null;

      const data = await response.json();
      const blockchains = data.result?.blockchains || [];

      // Look for chain with matching alias or name (case insensitive for name?)
      // CLI names are usually preserved.
      const match = blockchains.find((bc: any) =>
        bc.name === identifier ||
        bc.alias === identifier ||
        bc.id === identifier
      );

      if (match && match.id) {
        return `${protocol}://${host}:${port}/ext/bc/${match.id}/rpc`;
      }
      return null;
    } catch (e) {
      this.logger.warn(`Failed to resolve RPC URL for ${identifier}: ${e}`);
      return null;
    }
  }

  private createClient(): Avalanche {
    const host = process.env.AVALANCHE_NODE_HOST ?? '127.0.0.1';
    const port = Number(process.env.AVALANCHE_NODE_PORT ?? '9650');
    const protocol = process.env.AVALANCHE_NODE_PROTOCOL ?? 'http';
    return new Avalanche(host, port, protocol);
  }

  private async isRpcReachable(rpcUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  async fetchDashboardStats(customRpcUrl?: string) {
    try {
      // Determine RPC URL to use
      let rpcUrl: string;
      if (customRpcUrl) {
        rpcUrl = customRpcUrl;
      } else {
        const host = process.env.AVALANCHE_NODE_HOST ?? '127.0.0.1';
        const port = Number(process.env.AVALANCHE_NODE_PORT ?? '9650');
        const protocol = process.env.AVALANCHE_NODE_PROTOCOL ?? 'http';
        rpcUrl = `${protocol}://${host}:${port}/ext/bc/C/rpc`;
      }

      // Pre-check: don't create JsonRpcProvider if node is offline (avoids ethers.js retry spam)
      if (!await this.isRpcReachable(rpcUrl)) {
        return {
          healthy: false, blockHeight: 0, tps: '0.00', totalTx: '0',
          avgBlockTime: 'N/A', peerCount: 0, nodeOffline: true,
          error: 'Avalanche node is not running. Start the node to see live data.'
        };
      }

      const status = await this.fetchStatus(customRpcUrl);

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const blockNumber = await provider.getBlockNumber();

      // Calculate Real TPS from latest block
      let realTps = "0.00";
      let realAvgBlockTime = "2.0s";
      let txCount = 0;

      try {
        const block = await provider.getBlock(blockNumber);
        if (block) {
          txCount = block.transactions.length;
          // Try to get previous block for time diff
          if (blockNumber > 0) {
            const prevBlock = await provider.getBlock(blockNumber - 1);
            if (prevBlock) {
              const timeDiff = Number(block.timestamp) - Number(prevBlock.timestamp);
              if (timeDiff > 0) {
                realTps = (txCount / timeDiff).toFixed(2);
                realAvgBlockTime = `${timeDiff.toFixed(1)}s`;
              }
            }
          }
        }
      } catch (e) {
        // Ignore specific block fetch errors
      }

      // 3. Fetch Peer Count (Info API)
      let peerCount = 0;
      try {
        // Construct Base URL from RPC URL (remove path)
        // Default local: http://127.0.0.1:9650/ext/bc/C/rpc -> http://127.0.0.1:9650
        const urlObj = new URL(rpcUrl);
        const baseUrl = `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}`;
        peerCount = await this.getPeerCount(baseUrl);
      } catch (e) {
        // Ignore peer count errors
      }

      return {
        ...status,
        blockHeight: blockNumber,
        rpcUrl,
        tps: realTps,
        totalTx: `${blockNumber}`,
        avgBlockTime: realAvgBlockTime,
        peerCount: peerCount,
        gasPrice: '0.00' // Removed dependency on status.gasPrice
      };
    } catch (error: any) {
      // Only log if it's not a connection refused error or a 503 proxy error (to reduce spam)
      const isOfflineError = error?.code === 'ECONNREFUSED' || error?.message?.includes('status code 503') || error?.error?.message?.includes('status code 503');
      if (!isOfflineError) {
        this.logger.error("Failed to fetch dashboard stats", error);
      }

      // Return user-friendly response when node is not running
      return {
        healthy: false,
        blockHeight: 0,
        tps: '0.00',
        totalTx: '0',
        avgBlockTime: 'N/A',
        peerCount: 0,
        nodeOffline: true,
        error: isOfflineError
          ? 'Avalanche node is not running. Start the node to see live data.'
          : String(error)
      };
    }
  }

  private async getPeerCount(baseUrl: string): Promise<number> {
    try {
      const response = await fetch(`${baseUrl}/ext/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'info.peers'
        })
      });
      const data = await response.json();
      return data.result?.peers?.length || 0;
    } catch (e) {
      return 0;
    }
  }

  async fetchRecentBlocks(customRpcUrl?: string, limit: number = 5) {
    try {
      // Determine RPC URL to use
      let rpcUrl: string;
      if (customRpcUrl) {
        rpcUrl = customRpcUrl;
      } else {
        const host = process.env.AVALANCHE_NODE_HOST ?? '127.0.0.1';
        const port = Number(process.env.AVALANCHE_NODE_PORT ?? '9650');
        const protocol = process.env.AVALANCHE_NODE_PROTOCOL ?? 'http';
        rpcUrl = `${protocol}://${host}:${port}/ext/bc/C/rpc`;
      }

      // Pre-check: don't create JsonRpcProvider if node is offline
      if (!await this.isRpcReachable(rpcUrl)) {
        return [];
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const currentBlock = await provider.getBlockNumber();

      const blocks = [];
      // Fetch specifically the last 'limit' blocks
      for (let i = 0; i < limit; i++) {
        const blockNum = currentBlock - i;
        if (blockNum < 0) break;
        blocks.push(provider.getBlock(blockNum));
      }

      const results = await Promise.all(blocks);

      return results.map(b => {
        if (!b) return null;

        let ts = Number(b.timestamp);
        // Heuristic: If timestamp is small (seconds), convert to ms. 
        // 10000000000 is year 2286, so anything less is seconds.
        if (ts < 10000000000) ts *= 1000;

        return {
          height: b.number,
          hash: b.hash,
          validator: b.miner,
          transactions: b.transactions.length,
          size: (b as any).size ? `${Number((b as any).size).toLocaleString()} bytes` : 'N/A',
          timestamp: new Date(ts).toLocaleString()
        };
      }).filter(Boolean);

    } catch (error: any) {
      // Only log if it's not a connection refused error or a 503 proxy error (to reduce spam)
      const isOfflineError = error?.code === 'ECONNREFUSED' || error?.message?.includes('status code 503') || error?.error?.message?.includes('status code 503');
      if (!isOfflineError) {
        this.logger.error("Failed to fetch recent blocks", error);
      }
      return [];
    }
  }

  async fetchRecentTransactions(customRpcUrl?: string, limit: number = 20) {
    try {
      let rpcUrl: string;
      if (customRpcUrl) {
        rpcUrl = customRpcUrl;
      } else {
        const host = process.env.AVALANCHE_NODE_HOST ?? '127.0.0.1';
        const port = Number(process.env.AVALANCHE_NODE_PORT ?? '9650');
        const protocol = process.env.AVALANCHE_NODE_PROTOCOL ?? 'http';
        rpcUrl = `${protocol}://${host}:${port}/ext/bc/C/rpc`;
      }

      // Pre-check: avoid ethers.js retry spam
      if (!await this.isRpcReachable(rpcUrl)) {
        return [];
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const currentBlock = await provider.getBlockNumber();

      const txs: any[] = [];
      let blockNum = currentBlock;
      let blocksChecked = 0;

      // Scan up to 50 blocks or until we find 'limit' txs
      while (txs.length < limit && blocksChecked < 50 && blockNum >= 0) {
        try {
          const block = await provider.getBlock(blockNum, true);
          if (block && block.transactions) {
            const blockTxs = [...block.transactions].reverse(); // Latest first

            for (const tx of blockTxs) {
              let t: any = tx;

              // If tx is a string (hash), fetch the full transaction
              if (typeof tx === 'string') {
                try {
                  const fullTx = await provider.getTransaction(tx);
                  if (fullTx) t = fullTx;
                  else continue;
                } catch (e) { continue; }
              }

              if (!t || !t.hash) continue;

              txs.push({
                hash: t.hash,
                from: t.from,
                to: t.to,
                value: t.value ? ethers.formatEther(t.value) : '0',
                block: block.number,
                timestamp: new Date(Number(block.timestamp) * 1000).toLocaleString()
              });
              if (txs.length >= limit) break;
            }
          }
        } catch (e) {
          // Skip block fetch errors
        }
        blockNum--;
        blocksChecked++;
      }

      return txs;
    } catch (e) {
      this.logger.error("Failed to fetch recent transactions", e);
      return [];
    }
  }

  async fetchStatus(customRpcUrl?: string) {
    // If custom RPC URL provided, fetch status using that chain
    if (customRpcUrl) {
      // Pre-check reachability
      if (!await this.isRpcReachable(customRpcUrl)) {
        return {
          healthy: false, rpcUrl: customRpcUrl, nodeOffline: true,
          error: 'Node is not reachable.', timestamp: new Date().toISOString(),
        };
      }
      try {
        const provider = new ethers.JsonRpcProvider(customRpcUrl);
        const [blockNumber, network] = await Promise.all([
          provider.getBlockNumber().catch(() => null),
          provider.getNetwork().catch(() => null)
        ]);

        return {
          version: 'Custom Network',
          nodeId: null,
          networkId: network ? Number(network.chainId) : null,
          networkName: 'Custom L1',
          peerCount: null,
          healthy: blockNumber !== null,
          blockHeight: blockNumber,
          rpcUrl: customRpcUrl,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          healthy: false, rpcUrl: customRpcUrl, nodeOffline: true,
          error: String(error), timestamp: new Date().toISOString(),
        };
      }
    }

    // Default: Use Primary Network — check reachability first
    const host = process.env.AVALANCHE_NODE_HOST ?? '127.0.0.1';
    const port = Number(process.env.AVALANCHE_NODE_PORT ?? '9650');
    const protocol = process.env.AVALANCHE_NODE_PROTOCOL ?? 'http';
    const baseRpcUrl = `${protocol}://${host}:${port}/ext/bc/C/rpc`;

    if (!await this.isRpcReachable(baseRpcUrl)) {
      return {
        version: null, nodeId: null, networkId: null, networkName: 'Unknown',
        peerCount: 0, healthy: false, nodeOffline: true,
        error: 'Avalanche node is not running on port 9650',
        timestamp: new Date().toISOString(),
      };
    }
    const client = this.createClient();
    const info = client.Info();
    const health = client.Health();

    try {
      const [versionRes, networkId, networkName, nodeId, peersRes, healthStatus] = await Promise.all([
        info.getNodeVersion().catch(() => null),
        info.getNetworkID().catch(() => null),
        info.getNetworkName().catch(() => null),
        info.getNodeID().catch(() => null),
        info.peers().catch(() => null),
        health.health().catch(() => null),
      ]);

      const peerCount = Array.isArray(peersRes) ? peersRes.length : (peersRes as any)?.peers?.length ?? null;

      return {
        version: (versionRes as any)?.version ?? versionRes ?? null,
        nodeId: nodeId ?? null,
        networkId: networkId ?? null,
        networkName: networkName ?? null,
        peerCount,
        healthy: healthStatus ? !!healthStatus.healthy : null,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      // Silently return offline status
      return {
        version: null, nodeId: null, networkId: null, networkName: 'Unknown',
        peerCount: 0, healthy: false, nodeOffline: true,
        error: 'Avalanche node is offline',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

