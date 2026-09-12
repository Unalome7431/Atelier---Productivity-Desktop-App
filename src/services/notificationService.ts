import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

class NotificationService {
  private isTauriAvailable = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  private permissionGranted: boolean | null = null;

  async requestPermission(): Promise<boolean> {
    if (this.isTauriAvailable) {
      try {
        let granted = await isPermissionGranted();
        if (!granted) {
          const permission = await requestPermission();
          granted = permission === 'granted';
        }
        this.permissionGranted = granted;
        return granted;
      } catch {
        // Fall through to browser notification check
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          this.permissionGranted = true;
          return true;
        }
        if (Notification.permission !== 'denied') {
          const res = await Notification.requestPermission();
          this.permissionGranted = res === 'granted';
          return this.permissionGranted;
        }
      } catch {
        // Ignored
      }
    }

    return false;
  }

  async send(title: string, body: string): Promise<void> {
    if (this.isTauriAvailable) {
      try {
        let granted = this.permissionGranted;
        if (granted === null) {
          granted = await this.requestPermission();
        }
        if (granted) {
          sendNotification({ title, body });
          return;
        }
      } catch {
        // Fall through
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      } catch {
        // Suppress browser notification errors
      }
    }
  }

  async notifyCycleComplete(
    mode: 'focus' | 'shortBreak' | 'longBreak',
    taskTitle?: string
  ): Promise<void> {
    if (mode === 'focus') {
      const title = '✦ Focus Session Complete';
      const body = taskTitle
        ? `Great focus! You completed your session on "${taskTitle}". Time for a rest.`
        : 'Focus session complete. Time for a well-deserved short break!';
      await this.send(title, body);
    } else if (mode === 'shortBreak') {
      await this.send(
        '✦ Break Complete',
        'Break time is over. Ready to jump back into your deep work session?'
      );
    } else if (mode === 'longBreak') {
      await this.send(
        '✦ Long Break Complete',
        'Fully refreshed! Ready for your next deep focus block.'
      );
    }
  }
}

export const notificationService = new NotificationService();
