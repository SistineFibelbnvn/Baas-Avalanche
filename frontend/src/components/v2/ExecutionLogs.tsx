import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { io } from 'socket.io-client';
import { Terminal, Play, Square, Trash2, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'command';
  message: string;
  command?: string;
}

interface ExecutionLogsProps {
  autoScroll?: boolean;
}

export function ExecutionLogs({ autoScroll = true }: ExecutionLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [isRunning, setIsRunning] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Connect to real logs
  useEffect(() => {
    if (!isRunning) return;

    // Use default URL or one derived from window.location if deployed
    // Since API_URL might be different, we should probably use the same host as API
    // Assuming /logs namespace
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/logs`);

    socket.on('connect', () => {
      console.log('Connected to logs stream');
    });

    socket.on('new-log', (newLog: LogEntry) => {
      if (!isRunning) return; // double check inside callback
      setLogs(prev => [...prev, newLog].slice(-100)); // Keep last 100
    });

    return () => {
      socket.disconnect();
    };
  }, [isRunning]);

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'command':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      case 'command':
        return '$';
      default:
        return '•';
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = () => {
    const logText = logs.map(log =>
      `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(logText);
  };

  const downloadLogs = () => {
    const logText = logs.map(log =>
      `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baas-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <h4>Execution Logs</h4>
          <Badge variant={isRunning ? 'default' : 'outline'} className="ml-2">
            {isRunning ? 'Running' : 'Paused'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
            title={isRunning ? 'Pause logs' : 'Resume logs'}
          >
            {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyLogs}
            title="Copy logs"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadLogs}
            title="Download logs"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Logs Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-black/5 dark:bg-black/20 font-mono text-xs min-h-[300px] max-h-[400px]">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No logs to display
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 py-1 hover:bg-muted/30 px-2 rounded">
                <span className="text-muted-foreground flex-shrink-0">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className={cn('flex-shrink-0', getLevelColor(log.level))}>
                  {getLevelIcon(log.level)}
                </span>
                <div className="flex-1 min-w-0">
                  {log.command && (
                    <div className="text-blue-600 dark:text-blue-400 mb-1">
                      $ {log.command}
                    </div>
                  )}
                  <div className={cn('break-words', getLevelColor(log.level))}>
                    {log.message}
                  </div>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
