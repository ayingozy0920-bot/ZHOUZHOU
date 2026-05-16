import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Log {
  type: 'chat' | 'models';
  status: number | 'error';
  url: string;
  timestamp: string;
  error?: string;
  model?: string;
}

export default function ApiConsole({ settings }: { settings: any }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error('Failed to fetch logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const latestLog = logs[0];
  const status = !settings.apiKey ? '未配置' : (latestLog?.status === 'error' ? '异常' : '正常');

  return (
    <div className="p-4 bg-slate-800 rounded-xl text-slate-200 space-y-4">
      <h2 className="text-lg font-bold">API 控制台</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-700 rounded-lg">
          <div className="text-xs text-slate-400">连接状态</div>
          <div className="flex items-center gap-2 mt-1">
            {status === '正常' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
            <span className="font-medium">{status}</span>
          </div>
        </div>
        <div className="p-3 bg-slate-700 rounded-lg">
          <div className="text-xs text-slate-400">API 余额</div>
          <div className="mt-1 font-medium">不支持查询</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">最近调用日志</h3>
          <button onClick={fetchLogs} className="p-1 hover:bg-slate-600 rounded">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
          {logs.map((log, i) => (
            <div key={i} className="p-2 bg-slate-900 rounded border border-slate-700">
              <div className="flex justify-between">
                <span className={log.status === 'error' ? 'text-red-400' : 'text-green-400'}>
                  {log.type.toUpperCase()} - {log.status}
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="truncate text-slate-400 mt-1">{log.url}</div>
              {log.error && <div className="text-red-500 mt-1">{log.error}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
