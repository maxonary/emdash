import { parsePtyId } from '@shared/ptyId';

type Listener = (waiting: boolean) => void;

class ApprovalStore {
  private listeners = new Map<string, Set<Listener>>();
  private waitingByTask = new Map<string, boolean>();
  private subscribed = false;

  private ensureSubscribed() {
    if (this.subscribed) return;
    this.subscribed = true;

    const api: any = (window as any).electronAPI;
    api?.onPtyApprovalRequired?.((info: { id: string }) => {
      const rawId = String(info?.id || '');
      const taskId = parsePtyId(rawId)?.suffix || rawId;
      if (!taskId) return;
      this.setWaiting(taskId, true);
    });

    api?.onPtyApprovalCleared?.((info: { id: string }) => {
      const rawId = String(info?.id || '');
      const taskId = parsePtyId(rawId)?.suffix || rawId;
      if (!taskId) return;
      this.setWaiting(taskId, false);
    });
  }

  private setWaiting(taskId: string, waiting: boolean) {
    const prev = this.waitingByTask.get(taskId) || false;
    if (prev === waiting) return;
    this.waitingByTask.set(taskId, waiting);
    const listeners = this.listeners.get(taskId);
    if (!listeners) return;
    for (const fn of listeners) {
      try {
        fn(waiting);
      } catch {}
    }
  }

  subscribe(taskId: string, fn: Listener): () => void {
    this.ensureSubscribed();
    const set = this.listeners.get(taskId) || new Set<Listener>();
    set.add(fn);
    this.listeners.set(taskId, set);

    try {
      fn(this.waitingByTask.get(taskId) || false);
    } catch {}

    return () => {
      const listeners = this.listeners.get(taskId);
      if (!listeners) return;
      listeners.delete(fn);
      if (listeners.size === 0) this.listeners.delete(taskId);
    };
  }
}

export const approvalStore = new ApprovalStore();
