import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Trash2,
  RotateCcw,
  Check,
  Send,
  Timer,
  FileText,
  Layers,
  Kanban,
  Calendar,
  CheckSquare,
  Repeat,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { trashService, TrashItem } from '@/services/trashService';
import { useNotesStore } from '@/stores/useNotesStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useTasksStore } from '@/stores/useTasksStore';
import { useRoutinesStore } from '@/stores/useRoutinesStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { cn } from '@/lib/utils';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'trash' | 'telegram' | 'pomodoro';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('trash');
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation state for permanent delete
  const [itemToDeleteForever, setItemToDeleteForever] = useState<TrashItem | null>(null);
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);

  const loadTrash = useCallback(async () => {
    setIsLoadingTrash(true);
    try {
      const items = await trashService.getTrashItems();
      setTrashItems(items);
    } catch (err) {
      console.error('Failed to load trash items:', err);
    } finally {
      setIsLoadingTrash(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadTrash();
    }
  }, [isOpen, loadTrash]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const reloadRelevantStore = (tableName: string) => {
    if (tableName === 'notes') useNotesStore.getState().loadNotes();
    else if (tableName === 'canvases') useCanvasStore.getState().loadCanvases();
    else if (tableName === 'kanban_boards' || tableName === 'kanban_cards') {
      useKanbanStore.getState().loadBoards();
    } else if (tableName === 'tasks') useTasksStore.getState().loadTasks();
    else if (tableName === 'routines') useRoutinesStore.getState().loadRoutines();
    else if (tableName === 'calendar_events') useCalendarStore.getState().loadEvents();
  };

  const handleRestore = async (item: TrashItem) => {
    try {
      await trashService.restoreItem(item.tableName, item.id);
      reloadRelevantStore(item.tableName);
      showToast(`Restored "${item.title}"`);
      await loadTrash();
    } catch (err) {
      console.error('Failed to restore item:', err);
      showToast('Failed to restore item.');
    }
  };

  const handlePermanentDelete = async () => {
    if (!itemToDeleteForever) return;
    try {
      await trashService.permanentlyDeleteItem(
        itemToDeleteForever.tableName,
        itemToDeleteForever.id
      );
      showToast(`Permanently deleted "${itemToDeleteForever.title}"`);
      setItemToDeleteForever(null);
      await loadTrash();
    } catch (err) {
      console.error('Failed to permanently delete item:', err);
      showToast('Failed to delete item permanently.');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await trashService.emptyTrash();
      showToast('Trash emptied successfully.');
      setIsEmptyTrashConfirmOpen(false);
      await loadTrash();
    } catch (err) {
      console.error('Failed to empty trash:', err);
      showToast('Failed to empty trash.');
    }
  };

  const getItemIcon = (type: TrashItem['itemType']) => {
    switch (type) {
      case 'Note':
        return <FileText className="w-3.5 h-3.5 text-indigo-700" />;
      case 'Canvas':
        return <Layers className="w-3.5 h-3.5 text-purple-700" />;
      case 'Kanban Board':
      case 'Kanban Card':
        return <Kanban className="w-3.5 h-3.5 text-sky-700" />;
      case 'Task':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />;
      case 'Habit':
        return <Repeat className="w-3.5 h-3.5 text-amber-700" />;
      case 'Calendar Event':
        return <Calendar className="w-3.5 h-3.5 text-rose-700" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-secondaryGray" />;
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" showCloseButton={true}>
        <div className="flex flex-col gap-5 select-none -m-1">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-primaryDark shadow-2xs">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-primaryDark leading-tight">
                  Setting
                </h2>
                <p className="font-sans text-xs text-secondaryGray">
                  Preferences, data retention, and external integrations
                </p>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-surface rounded-xl border border-border/70 self-start">
            <button
              type="button"
              onClick={() => setActiveTab('trash')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer',
                activeTab === 'trash'
                  ? 'bg-white text-primaryDark shadow-xs'
                  : 'text-secondaryGray hover:text-primaryDark'
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Trash Bin</span>
              {trashItems.length > 0 && (
                <span className="px-1.5 py-0.2 bg-pastel-lavender-tint text-indigo-800 text-[10px] font-mono rounded-full font-bold">
                  {trashItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('telegram')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer',
                activeTab === 'telegram'
                  ? 'bg-white text-primaryDark shadow-xs'
                  : 'text-secondaryGray hover:text-primaryDark'
              )}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Bot</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pomodoro')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer',
                activeTab === 'pomodoro'
                  ? 'bg-white text-primaryDark shadow-xs'
                  : 'text-secondaryGray hover:text-primaryDark'
              )}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Focus Bar</span>
            </button>
          </div>

          {/* Tab Content: Trash Bin */}
          {activeTab === 'trash' && (
            <div className="flex flex-col gap-3 min-h-[320px]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-primaryDark">
                    Deleted Records
                  </h3>
                  <p className="font-sans text-xs text-secondaryGray">
                    Items are preserved for 30 days before being permanently deleted.
                  </p>
                </div>
                {trashItems.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEmptyTrashConfirmOpen(true)}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Empty Trash</span>
                  </Button>
                )}
              </div>

              {isLoadingTrash ? (
                <div className="flex-1 flex items-center justify-center py-12 text-secondaryGray font-sans text-xs">
                  Loading deleted items...
                </div>
              ) : trashItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 gap-2 text-center border-2 border-dashed border-border rounded-2xl bg-surface/30">
                  <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-secondaryGray shadow-2xs">
                    <Trash2 className="w-5 h-5 text-secondaryGray" />
                  </div>
                  <h4 className="font-display font-bold text-xs text-primaryDark">
                    Trash is Empty
                  </h4>
                  <p className="font-sans text-xs text-secondaryGray max-w-xs">
                    When you delete notes, canvases, cards, tasks, or habits, they will appear here
                    for 30 days.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {trashItems.map((item) => (
                    <div
                      key={`${item.tableName}_${item.id}`}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-border shadow-2xs hover:border-border-hover transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                        <div className="w-7 h-7 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                          {getItemIcon(item.itemType)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-semibold text-xs text-primaryDark truncate">
                              {item.title}
                            </span>
                            <Badge variant="outline" size="sm" className="text-[10px] shrink-0">
                              {item.itemType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-secondaryGray">
                            <span>Deleted on {formatDate(item.deletedAt)}</span>
                            <span>•</span>
                            <span className="text-amber-700 font-medium">
                              {item.daysRemaining} days left
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRestore(item)}
                          className="gap-1.5 text-xs h-7 px-2.5 cursor-pointer"
                          title="Restore item to original place"
                        >
                          <RotateCcw className="w-3 h-3 text-primaryDark" />
                          <span>Restore</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setItemToDeleteForever(item)}
                          className="text-secondaryGray hover:text-rose-600 hover:bg-rose-50 h-7 w-7 p-0 cursor-pointer"
                          title="Delete forever immediately"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Telegram Bot */}
          {activeTab === 'telegram' && (
            <div className="flex flex-col gap-4 py-2 min-h-[320px]">
              <div>
                <h3 className="font-display font-bold text-sm text-primaryDark">
                  Telegram Companion Bot
                </h3>
                <p className="font-sans text-xs text-secondaryGray">
                  Connect your bot token and chat ID to receive briefings and manage tasks.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface/70 border border-border flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pastel-lavender-tint flex items-center justify-center text-indigo-700">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-primaryDark">
                      Telegram Pairing & Sync Hub
                    </h4>
                    <p className="font-sans text-xs text-secondaryGray">
                      Generate pairing codes, configure bot credentials, and test connection.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('open-telegram-modal'));
                    }}
                    className="gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open Telegram Configuration</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Focus Bar */}
          {activeTab === 'pomodoro' && (
            <div className="flex flex-col gap-4 py-2 min-h-[320px]">
              <div>
                <h3 className="font-display font-bold text-sm text-primaryDark">
                  Pomodoro Focus Bar
                </h3>
                <p className="font-sans text-xs text-secondaryGray">
                  Customize work intervals, short breaks, and long break cycle frequency.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface/70 border border-border flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pastel-mint-tint flex items-center justify-center text-emerald-800">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-primaryDark">
                      Focus Bar Intervals & Goals
                    </h4>
                    <p className="font-sans text-xs text-secondaryGray">
                      Configure focus sessions, break lengths, and cycle targets with numerical steppers.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('open-pomodoro-settings'));
                    }}
                    className="gap-2 cursor-pointer"
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>Open Focus Bar Preferences</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal: Delete Forever Single Item */}
      <ConfirmModal
        isOpen={Boolean(itemToDeleteForever)}
        onClose={() => setItemToDeleteForever(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Item"
        description={`Are you sure you want to permanently delete "${itemToDeleteForever?.title}"? This action cannot be undone.`}
        confirmText="Delete Forever"
        variant="destructive"
      />

      {/* Confirmation Modal: Empty Entire Trash */}
      <ConfirmModal
        isOpen={isEmptyTrashConfirmOpen}
        onClose={() => setIsEmptyTrashConfirmOpen(false)}
        onConfirm={handleEmptyTrash}
        title="Empty Entire Trash Bin"
        description="Are you sure you want to permanently delete all items in the Trash Bin? All records will be removed forever."
        confirmText="Empty All Trash"
        variant="destructive"
      />
    </>
  );
};
