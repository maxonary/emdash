import { useEffect, useState } from 'react';
import { approvalStore } from '../lib/approvalStore';

export function useTaskApprovalPending(taskId: string): boolean {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => approvalStore.subscribe(taskId, setWaiting), [taskId]);

  return waiting;
}
