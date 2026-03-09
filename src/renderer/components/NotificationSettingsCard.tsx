import React, { useEffect, useState } from 'react';
import { Switch } from './ui/switch';

const NotificationSettingsCard: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [sound, setSound] = useState(true);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.electronAPI.getSettings();
        if (result.success && result.settings) {
          const en = Boolean(result.settings.notifications?.enabled ?? true);
          const snd = Boolean(result.settings.notifications?.sound ?? true);
          const approval = Boolean(result.settings.notifications?.approvalRequired ?? false);
          setEnabled(en);
          setSound(snd);
          setApprovalRequired(approval);
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
      setLoading(false);
    })();
  }, []);

  const updateEnabled = async (next: boolean) => {
    setEnabled(next);
    void import('../lib/telemetryClient').then(({ captureTelemetry }) => {
      captureTelemetry('notification_settings_changed', { enabled: next, sound });
    });
    try {
      await window.electronAPI.updateSettings({
        notifications: { enabled: next, sound, approvalRequired },
      });
    } catch (error) {
      console.error('Failed to update notification enabled setting:', error);
    }
  };

  const updateSound = async (next: boolean) => {
    setSound(next);
    void import('../lib/telemetryClient').then(({ captureTelemetry }) => {
      captureTelemetry('notification_settings_changed', { enabled, sound: next });
    });
    try {
      await window.electronAPI.updateSettings({
        notifications: { enabled, sound: next, approvalRequired },
      });
    } catch (error) {
      console.error('Failed to update notification sound setting:', error);
    }
  };

  const updateApprovalRequired = async (next: boolean) => {
    setApprovalRequired(next);
    void import('../lib/telemetryClient').then(({ captureTelemetry }) => {
      captureTelemetry('notification_settings_changed', {
        enabled,
        sound,
        approval_required: next,
      });
    });
    try {
      await window.electronAPI.updateSettings({
        notifications: { enabled, sound, approvalRequired: next },
      });
    } catch (error) {
      console.error('Failed to update approval notification setting:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="text-sm font-medium text-foreground">Notifications</p>
          <p className="text-sm text-muted-foreground">
            Get notified when agents complete tasks.
          </p>
        </div>
        <Switch checked={enabled} disabled={loading} onCheckedChange={updateEnabled} />
      </div>
      <div className="ml-4 flex items-center justify-between gap-4 border-l border-border/60 pl-4">
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="text-sm font-medium text-foreground">Approval Requests</p>
          <p className="text-sm text-muted-foreground">
            Get notified when agents are waiting for approval.
          </p>
        </div>
        <Switch
          checked={approvalRequired}
          disabled={loading || !enabled}
          onCheckedChange={updateApprovalRequired}
        />
      </div>
    </div>
  );
};

export default NotificationSettingsCard;
