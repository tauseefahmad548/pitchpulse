import React, { useState, useEffect } from 'react';
import { ActionItem, DecisionMilestone, SalesAnalysisResult } from '../types';
import { 
  Database, 
  X, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Settings, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles, 
  Link2,
  Calendar,
  User,
  ShieldCheck,
  Building,
  ArrowRight
} from 'lucide-react';

interface CrmSyncConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: SalesAnalysisResult;
  actionItems: ActionItem[];
  decisionMilestones: DecisionMilestone[];
  onSyncSuccess?: () => void;
}

export const CrmSyncConfigModal: React.FC<CrmSyncConfigModalProps> = ({
  isOpen,
  onClose,
  call,
  actionItems,
  decisionMilestones,
  onSyncSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'config' | 'history'>('sync');
  const [selectedProvider, setSelectedProvider] = useState<'salesforce' | 'hubspot'>('salesforce');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState('OPP-8921');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(
    actionItems.map((a) => a.id)
  );
  const [syncStageUpdate, setSyncStageUpdate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Configuration state
  const [crmConfig, setCrmConfig] = useState<any>(null);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  // Sync selected task IDs when action items update
  useEffect(() => {
    setSelectedTaskIds(actionItems.map((a) => a.id));
  }, [actionItems]);

  // Fetch current CRM config on modal open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/crm/config')
        .then((res) => res.json())
        .then((data) => {
          setCrmConfig(data);
          if (data.activeProvider) setSelectedProvider(data.activeProvider);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExecuteSync = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSyncResult(null);

    const itemsToSync = actionItems.filter((item) => selectedTaskIds.includes(item.id));

    try {
      const response = await fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          opportunityId: selectedOpportunityId,
          callTitle: call.callTitle,
          actionItems: itemsToSync,
          decisionMilestones: syncStageUpdate ? decisionMilestones : [],
        }),
      });

      if (!response.ok) {
        throw new Error(`CRM API sync failed with status ${response.status}`);
      }

      const data = await response.json();
      setSyncResult(data);
      if (onSyncSuccess) onSyncSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sync with CRM.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await fetch('/api/crm/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeProvider: selectedProvider,
          sandboxMode,
          autoSyncOnCallEnd: autoSync,
        }),
      });
      alert('CRM configuration updated successfully.');
    } catch (e) {
      alert('Could not update CRM configuration.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                CRM Integration & Action Items Sync
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full font-mono">
                  Mock API Live
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Push call action items and deal milestones directly into Salesforce or HubSpot.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-4 font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sync'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Sync Action Items ({actionItems.length})
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Connection & Field Mappings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Sync History & Audit Log
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: SYNC ACTION ITEMS */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* Target CRM and Opportunity selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target CRM Platform</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('salesforce')}
                      className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                        selectedProvider === 'salesforce'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-600 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>Salesforce</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('hubspot')}
                      className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                        selectedProvider === 'hubspot'
                          ? 'bg-orange-950/80 text-orange-300 border-orange-600 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>HubSpot</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target CRM Opportunity / Deal</label>
                  <select
                    value={selectedOpportunityId}
                    onChange={(e) => setSelectedOpportunityId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="OPP-8921">
                      OPP-8921: Nexus Financial - Enterprise Modernization ($145k)
                    </option>
                    <option value="OPP-4102">
                      OPP-4102: Apex Growth Logistics - CRM Replacement ($68k)
                    </option>
                    <option value="OPP-7749">
                      OPP-7749: CloudMetrics Global - 3-Year License ($320k)
                    </option>
                  </select>
                </div>
              </div>

              {/* Items to Sync checklist */}
              <div>
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-semibold text-slate-200">
                    Select Action Items to Push to {selectedProvider === 'salesforce' ? 'Salesforce Tasks' : 'HubSpot Tasks'}:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTaskIds(actionItems.map((a) => a.id))}
                      className="text-indigo-400 hover:text-indigo-300 text-[11px] cursor-pointer"
                    >
                      Select All ({actionItems.length})
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => setSelectedTaskIds([])}
                      className="text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {actionItems.map((item) => {
                    const isSelected = selectedTaskIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleTaskSelection(item.id)}
                        className={`p-3 rounded-lg border text-xs flex items-start gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-slate-900/90 border-indigo-500/80 text-slate-200'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-200">{item.title}</div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span>Assignee: <strong className="text-slate-300">{item.assigneeName || item.assignee}</strong></span>
                            <span>•</span>
                            <span>Due: <strong className="text-slate-300">{item.dueDate || 'TBD'}</strong></span>
                            <span>•</span>
                            <span className="font-mono text-indigo-400">{item.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deal Stage & Milestone Sync Option */}
              <div className="flex items-center gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                <input
                  type="checkbox"
                  id="syncStage"
                  checked={syncStageUpdate}
                  onChange={(e) => setSyncStageUpdate(e.target.checked)}
                  className="rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                />
                <label htmlFor="syncStage" className="cursor-pointer select-none">
                  Also update <strong>Opportunity Deal Stage</strong> & attach {decisionMilestones.length} decision milestones as Opportunity History records.
                </label>
              </div>

              {/* Success Result Box */}
              {syncResult && (
                <div className="bg-emerald-950/40 border border-emerald-600/60 rounded-xl p-4 text-xs space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Sync Completed Successfully!
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Batch #{syncResult.batchId}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-sans">
                    {syncResult.auditMessage}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-emerald-900/60">
                    <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                      Created CRM Task Objects:
                    </div>
                    {syncResult.records.map((rec: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-950/80 px-2.5 py-1 rounded font-mono">
                        <span className="text-slate-300 truncate max-w-[280px]">
                          {rec.subject}
                        </span>
                        <a
                          href={rec.crmUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                        >
                          {rec.id} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONFIGURATION & FIELD MAPPINGS */}
          {activeTab === 'config' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-indigo-400" />
                    Connected CRM Instance
                  </span>
                  <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CONNECTED (OAuth 2.0)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-400">
                  <div>
                    <span className="text-slate-500 block">Connected User:</span>
                    <strong className="text-slate-200">sarah.jenkins@enterprise.com</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Instance URL:</span>
                    <strong className="text-slate-200 font-mono text-[11px]">
                      {selectedProvider === 'salesforce' ? 'https://na140.lightning.force.com' : 'https://app.hubspot.com/contacts/8291482'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Field Mapping Matrix */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-slate-200 block">
                  Field Mapping Matrix ({selectedProvider === 'salesforce' ? 'Salesforce Task Object' : 'HubSpot Engagement Object'})
                </span>

                <div className="divide-y divide-slate-800/80 text-[11px] font-mono">
                  <div className="py-2 flex items-center justify-between text-slate-400">
                    <span>PitchPulse Action Item Title</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-indigo-300 font-bold">
                      {selectedProvider === 'salesforce' ? 'Task.Subject' : 'hs_task_body'}
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between text-slate-400">
                    <span>Due Date</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-indigo-300 font-bold">
                      {selectedProvider === 'salesforce' ? 'Task.ActivityDate' : 'hs_timestamp'}
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between text-slate-400">
                    <span>Assignee (Rep / Buyer)</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-indigo-300 font-bold">
                      {selectedProvider === 'salesforce' ? 'Task.OwnerId' : 'hubspot_owner_id'}
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between text-slate-400">
                    <span>Source Quote Citation</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-indigo-300 font-bold">
                      {selectedProvider === 'salesforce' ? 'Task.Description' : 'hs_task_subject'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="rounded text-indigo-600 accent-indigo-500"
                  />
                  <span>Automatically trigger CRM sync when a sales call recording completes analysis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={sandboxMode}
                    onChange={(e) => setSandboxMode(e.target.checked)}
                    className="rounded text-indigo-600 accent-indigo-500"
                  />
                  <span>Route sync requests to Sandbox / Staging CRM instance</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOG & HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3 text-xs">
              <span className="font-semibold text-slate-300 block">Recent CRM Synchronization Batches</span>
              <div className="bg-slate-950/60 rounded-xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
                <div className="p-3 flex items-center justify-between bg-slate-900/60 text-slate-400 text-[11px] font-mono">
                  <span>Batch ID</span>
                  <span>Opportunity</span>
                  <span>Tasks</span>
                  <span>Status</span>
                </div>
                {(crmConfig?.syncHistory || []).map((h: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-900/40 font-mono">
                    <span className="text-indigo-400 font-bold">{h.batchId}</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{h.opportunityName}</span>
                    <span className="text-slate-400">{h.tasksCreated} tasks</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded text-[10px] border border-emerald-800">
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <div className="text-xs text-slate-400">
            Destination: <strong className="text-slate-200 capitalize">{selectedProvider}</strong> ({selectedTaskIds.length} tasks selected)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'sync' && (
              <button
                onClick={handleExecuteSync}
                disabled={isSubmitting || selectedTaskIds.length === 0}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Syncing with {selectedProvider === 'salesforce' ? 'Salesforce' : 'HubSpot'}...
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    Push to {selectedProvider === 'salesforce' ? 'Salesforce' : 'HubSpot'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
