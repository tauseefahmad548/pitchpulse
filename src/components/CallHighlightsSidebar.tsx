import React, { useState } from 'react';
import { ActionItem, DecisionMilestone, SalesAnalysisResult } from '../types';
import { 
  CheckSquare, 
  Square, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Flag, 
  CheckCircle2, 
  AlertCircle, 
  X,
  ExternalLink,
  Layers,
  Database,
  RefreshCw,
  Settings
} from 'lucide-react';
import { CrmSyncConfigModal } from './CrmSyncConfigModal';

interface CallHighlightsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  call: SalesAnalysisResult;
  onSeek: (seconds: number) => void;
}

export const CallHighlightsSidebar: React.FC<CallHighlightsSidebarProps> = ({
  isOpen,
  onToggle,
  call,
  onSeek,
}) => {
  // Local state for items so user can toggle checkboxes and add new tasks
  const [actionItems, setActionItems] = useState<ActionItem[]>(call.actionItems || []);
  const [decisionMilestones, setDecisionMilestones] = useState<DecisionMilestone[]>(call.decisionMilestones || []);
  const [activeTab, setActiveTab] = useState<'actions' | 'milestones'>('actions');
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [selectedCrm, setSelectedCrm] = useState<'Salesforce' | 'HubSpot' | 'Linear'>('Salesforce');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<'Sales Rep' | 'Prospect' | 'Technical Team'>('Sales Rep');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newTaskDue, setNewTaskDue] = useState('Tomorrow EOD');

  // Keep synced if call changes
  React.useEffect(() => {
    setActionItems(call.actionItems || []);
    setDecisionMilestones(call.decisionMilestones || []);
  }, [call.id, call.actionItems, call.decisionMilestones]);

  const toggleComplete = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = actionItems.filter((i) => i.completed).length;
  const progressPercent = actionItems.length > 0 ? Math.round((completedCount / actionItems.length) * 100) : 0;

  // Add task handler
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newItem: ActionItem = {
      id: `task-custom-${Date.now()}`,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      assigneeName: newTaskAssignee === 'Sales Rep' ? call.repName : call.prospectContact,
      dueDate: newTaskDue,
      timestamp: '00:00',
      timestampSeconds: 0,
      completed: false,
      priority: newTaskPriority,
      sourceQuote: 'Added manually by sales coach / rep',
    };

    setActionItems((prev) => [newItem, ...prev]);
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  // Copy checklist as Markdown
  const handleCopyMarkdown = () => {
    const text = `# Call Highlights: ${call.callTitle}
**Company:** ${call.prospectCompany} | **Date:** ${call.callDate}

## Action Items Checklist
${actionItems
  .map(
    (item) =>
      `- [${item.completed ? 'x' : ' '}] **${item.title}** (Assignee: ${item.assigneeName || item.assignee}, Due: ${item.dueDate || 'TBD'}, Priority: ${item.priority}) [${item.timestamp}]`
  )
  .join('\n')}

## Decision Milestones
${decisionMilestones
  .map(
    (m) =>
      `- **${m.milestone}** (${m.stage}) - [${m.status}] @ ${m.timestamp}\n  Evidence: "${m.evidence}"`
  )
  .join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Type', 'Title / Milestone', 'Assignee', 'Due Date / Stage', 'Status', 'Timestamp', 'Quote / Evidence'];
    const rows = [
      ...actionItems.map((a) => [
        'Action Item',
        `"${a.title.replace(/"/g, '""')}"`,
        a.assigneeName || a.assignee,
        a.dueDate || '',
        a.completed ? 'Completed' : 'Pending',
        a.timestamp,
        `"${a.sourceQuote.replace(/"/g, '""')}"`,
      ]),
      ...decisionMilestones.map((m) => [
        'Decision Milestone',
        `"${m.milestone.replace(/"/g, '""')}"`,
        'Deal Team',
        m.stage,
        m.status,
        m.timestamp,
        `"${m.evidence.replace(/"/g, '""')}"`,
      ]),
    ];

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Call_Highlights_${call.prospectCompany.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Execute CRM Sync via server API
  const handleCrmSync = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedCrm.toLowerCase().includes('hubspot') ? 'hubspot' : 'salesforce',
          opportunityId: 'OPP-8921',
          callTitle: call.callTitle,
          actionItems,
          decisionMilestones,
        }),
      });
      if (res.ok) {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 4000);
      } else {
        setSyncStatus('idle');
      }
    } catch (e) {
      setSyncStatus('idle');
    }
  };

  return (
    <>
      {/* Tab toggle handle on screen edge when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-0 top-1/3 -translate-y-1/2 z-40 bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-l-xl shadow-2xl shadow-indigo-600/40 flex flex-col items-center gap-1.5 transition-transform hover:-translate-x-1 cursor-pointer border-y border-l border-indigo-400/50"
          title="Open Call Highlights & Action Items Sidebar"
        >
          <CheckSquare className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">
            Highlights ({actionItems.length})
          </span>
          {actionItems.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
              {actionItems.filter(i => !i.completed).length}
            </span>
          )}
        </button>
      )}

      {/* Docked / Slide-out Sidebar Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-96 bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Call Highlights & Action Items
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                {call.prospectCompany}
              </p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Action Items Checklist Progress Bar */}
        <div className="px-4 py-2.5 bg-slate-900/30 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Progress:</span>
            <span className="font-mono font-bold text-slate-200">
              {completedCount} of {actionItems.length} Done ({progressPercent}%)
            </span>
          </div>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tab switchers: Action Items vs Decision Milestones */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs shrink-0 px-2 pt-1">
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-2 px-3 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'actions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Action Checklist ({actionItems.length})
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex-1 py-2 px-3 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'milestones'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            Milestones ({decisionMilestones.length})
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* TAB 1: ACTION ITEMS CHECKLIST */}
          {activeTab === 'actions' && (
            <div className="space-y-3">
              {actionItems.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No action items extracted yet. Click below to add one!
                </div>
              ) : (
                actionItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                      item.completed
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-65'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    {/* Item Top: Checkbox, Title, and Priority */}
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => toggleComplete(item.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                      >
                        {item.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span
                          className={`font-semibold text-slate-200 leading-snug block ${
                            item.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {item.title}
                        </span>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px]">
                          {/* Assignee badge */}
                          <span
                            className={`px-1.5 py-0.5 rounded font-medium ${
                              item.assignee === 'Sales Rep'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {item.assigneeName || item.assignee}
                          </span>

                          {/* Due Date */}
                          {item.dueDate && (
                            <span className="text-slate-400 flex items-center gap-1 font-mono">
                              <Calendar className="w-2.5 h-2.5 text-slate-500" />
                              {item.dueDate}
                            </span>
                          )}

                          {/* Priority badge */}
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                              item.priority === 'High'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : item.priority === 'Medium'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.priority}
                          </span>

                          {/* Audio jump pill */}
                          {item.timestampSeconds > 0 && (
                            <button
                              onClick={() => onSeek(item.timestampSeconds)}
                              className="ml-auto text-indigo-400 hover:text-indigo-200 flex items-center gap-1 font-mono cursor-pointer"
                              title="Listen to agreed moment"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              {item.timestamp}
                            </button>
                          )}
                        </div>

                        {/* Source quote citation */}
                        {item.sourceQuote && (
                          <div className="mt-2 text-[11px] text-slate-400 italic bg-slate-950/70 p-2 rounded border border-slate-800/80">
                            "{item.sourceQuote}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Add Custom Item Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                Add Action Item
              </button>
            </div>
          )}

          {/* TAB 2: DECISION MILESTONES */}
          {activeTab === 'milestones' && (
            <div className="space-y-3">
              {decisionMilestones.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          m.status === 'Achieved'
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                            : m.status === 'In Progress'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                      />
                      <h4 className="font-semibold text-slate-200">{m.milestone}</h4>
                    </div>

                    <button
                      onClick={() => onSeek(m.timestampSeconds)}
                      className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800 cursor-pointer shrink-0"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      {m.timestamp}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {m.stage}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                        m.status === 'Achieved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : m.status === 'In Progress'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-950/70 p-2 rounded border border-slate-800">
                    <strong className="text-slate-300">Evidence: </strong>"{m.evidence}"
                  </div>

                  <div className="text-[11px] text-indigo-300 flex items-center gap-1">
                    <span className="text-slate-400">Next requirement:</span> {m.nextStepRequirement}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CRM SYNC & EXPORT FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 space-y-3 shrink-0">
          {/* CRM Destination Picker & 1-Click Sync */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCrm}
              onChange={(e) => setSelectedCrm(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Salesforce">Salesforce</option>
              <option value="HubSpot">HubSpot</option>
              <option value="Linear">Linear / Asana</option>
            </select>

            <button
              onClick={handleCrmSync}
              disabled={syncStatus === 'syncing'}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Syncing to {selectedCrm}...
                </>
              ) : syncStatus === 'synced' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  Synced to {selectedCrm}!
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  Sync to {selectedCrm}
                </>
              )}
            </button>

            <button
              onClick={() => setShowCrmModal(true)}
              title="Configure CRM Field Mappings, Target Deal & History"
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Export Options (Markdown / CSV) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Tasks'}
            </button>

            <button
              onClick={handleExportCSV}
              className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Export CSV
            </button>
          </div>
        </div>
      </aside>

      {/* Quick Add Custom Action Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add New Action Item
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Task Description</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Follow up on custom API contract terms"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Sales Rep">Sales Rep ({call.repName})</option>
                    <option value="Prospect">Prospect ({call.prospectContact})</option>
                    <option value="Technical Team">Technical Team</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Due Date / Target</label>
                <input
                  type="text"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  placeholder="e.g. Thursday 2 PM ET"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRM Sync Configuration Modal */}
      <CrmSyncConfigModal
        isOpen={showCrmModal}
        onClose={() => setShowCrmModal(false)}
        call={call}
        actionItems={actionItems}
        decisionMilestones={decisionMilestones}
        onSyncSuccess={() => {
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus('idle'), 4000);
        }}
      />
    </>
  );
};
