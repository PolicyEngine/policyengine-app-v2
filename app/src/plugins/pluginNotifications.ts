/**
 * Plugin Notification Helpers
 *
 * Provides toast/notification functionality for plugin errors and status messages.
 *
 * Note: This is a simple implementation that logs to console.
 * To upgrade to visual toasts, install @mantine/notifications and update this file.
 */

export interface PluginNotification {
  id: string;
  type: 'error' | 'success' | 'info';
  pluginName: string;
  message: string;
  timestamp: number;
}

/** Store for active notifications (can be subscribed to by UI components) */
const notificationListeners = new Set<(notification: PluginNotification) => void>();

/** Subscribe to notification events */
export function subscribeToNotifications(
  listener: (notification: PluginNotification) => void
): () => void {
  notificationListeners.add(listener);
  return () => notificationListeners.delete(listener);
}

/** Emit a notification to all listeners */
function emitNotification(notification: PluginNotification): void {
  for (const listener of notificationListeners) {
    try {
      listener(notification);
    } catch (error) {
      console.error('[PluginNotifications] Listener error:', error);
    }
  }
}

/** Generate a unique notification ID */
function generateId(): string {
  return `plugin-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Show an error toast for a plugin.
 *
 * @param pluginName Display name of the plugin
 * @param message Error message to display
 */
export function showPluginErrorToast(pluginName: string, message: string): void {
  const notification: PluginNotification = {
    id: generateId(),
    type: 'error',
    pluginName,
    message,
    timestamp: Date.now(),
  };

  // Log to console
  console.error(`[Plugin Error: ${pluginName}] ${message}`);

  // Emit to listeners (for UI components to display)
  emitNotification(notification);
}

/**
 * Show a success toast for a plugin.
 *
 * @param pluginName Display name of the plugin
 * @param message Success message to display
 */
export function showPluginSuccessToast(pluginName: string, message: string): void {
  const notification: PluginNotification = {
    id: generateId(),
    type: 'success',
    pluginName,
    message,
    timestamp: Date.now(),
  };

  // Log to console
  console.info(`[Plugin: ${pluginName}] ${message}`);

  // Emit to listeners
  emitNotification(notification);
}

/**
 * Show an info toast for a plugin.
 *
 * @param pluginName Display name of the plugin
 * @param message Info message to display
 */
export function showPluginInfoToast(pluginName: string, message: string): void {
  const notification: PluginNotification = {
    id: generateId(),
    type: 'info',
    pluginName,
    message,
    timestamp: Date.now(),
  };

  // Log to console
  console.info(`[Plugin: ${pluginName}] ${message}`);

  // Emit to listeners
  emitNotification(notification);
}
