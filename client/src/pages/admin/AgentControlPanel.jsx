import { useState, useEffect } from 'react';
import { FaShieldAlt, FaToggleOn, FaToggleOff, FaHistory } from 'react-icons/fa';
import toast from 'react-hot-toast';
import GlassCard from '../../components/ui/GlassCard';
import api from '../../services/api';

const AgentControlPanel = () => {
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, logsRes] = await Promise.all([
        api.get('/agents'),
        api.get('/agents/executions')
      ]);
      setAgents(agentsRes.data.agents || []);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      toast.error('Failed to load agent metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAgent = async (agentId) => {
    try {
      const { data } = await api.put(`/agents/${agentId}/toggle`);
      toast.success(`${data.agent.name} is now ${data.agent.status}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to toggle agent state.');
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black font-display text-white tracking-tight flex items-center gap-2">
          <FaShieldAlt className="text-primary-500" /> AI Agents Ecosystem Control
        </h1>
        <p className="text-gray-400 text-xs font-semibold mt-1">Configure status parameters and audit run telemetry logs.</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Registry List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">🤖 Active Agent Registries ({agents.length})</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <GlassCard key={agent._id} hoverable={false} className="border-white/5 bg-dark-900/40 p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-bold text-sm">{agent.name}</h4>
                      <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">ID: {agent.agentId} • v{agent.version}</p>
                    </div>
                    <button
                      onClick={() => handleToggleAgent(agent.agentId)}
                      className="text-xl text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
                    >
                      {agent.enabled ? <FaToggleOn className="text-green-500" /> : <FaToggleOff className="text-gray-500" />}
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 font-medium leading-relaxed">{agent.description}</p>

                  <div className="pt-3.5 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-bold uppercase">
                    <div>
                      <p className="text-gray-500">Avg Latency</p>
                      <p className="text-white text-xs font-bold mt-0.5">{agent.stats?.avgLatency || 0} ms</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Executions</p>
                      <p className="text-white text-xs font-bold mt-0.5">{agent.stats?.executionCount || 0}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Audit Logs Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FaHistory className="text-gray-400" /> Telemetry Execution Logs
            </h3>

            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
              {logs.map((log) => (
                <GlassCard key={log._id} hoverable={false} className="border-white/5 bg-dark-900/40 p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">{log.agentId}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      log.status === 'success' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/25' 
                        : 'bg-red-500/10 text-red-400 border-red-500/25'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-gray-400 font-medium">{log.resultSummary}</p>
                  <div className="flex justify-between items-center text-[9px] text-gray-600 font-bold uppercase">
                    <span>{log.latency} ms</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentControlPanel;
