import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Device } from '@capacitor/device';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Service to handle Capacitor native functionality
 */
export class CapacitorService {
  private static instance: CapacitorService;
  private isNative: boolean;

  private constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  public static getInstance(): CapacitorService {
    if (!CapacitorService.instance) {
      CapacitorService.instance = new CapacitorService();
    }
    return CapacitorService.instance;
  }

  /**
   * Initialize Capacitor functionality
   */
  public async initialize(): Promise<void> {
    if (!this.isNative) return;

    // Set up app lifecycle listeners
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    App.addListener('backButton', () => {
      console.log('Back button pressed');
    });

    // Set up status bar
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      // If we're on iOS, make the status bar overlay the content
      const info = await Device.getInfo();
      if (info.platform === 'ios') {
        await StatusBar.setOverlaysWebView({ overlay: true });
      }
    } catch (error) {
      console.error('Error setting up status bar', error);
    }

    // Hide splash screen with fade
    try {
      await SplashScreen.hide({
        fadeOutDuration: 500
      });
    } catch (error) {
      console.error('Error hiding splash screen', error);
    }
  }

  /**
   * Schedule a local notification for workout reminders
   */
  public async scheduleWorkoutReminder(title: string, body: string, scheduleTime: Date): Promise<void> {
    if (!this.isNative) return;

    try {
      // Request permission first
      const permResult = await LocalNotifications.requestPermissions();
      if (!permResult.display) {
        console.log('Notification permission not granted');
        return;
      }

      const options: ScheduleOptions = {
        notifications: [
          {
            id: new Date().getTime(),
            title,
            body,
            schedule: { at: scheduleTime },
            sound: 'bell-sound.mp3',
            actionTypeId: 'WORKOUT_REMINDER',
            extra: {
              type: 'workout_reminder'
            }
          }
        ]
      };

      await LocalNotifications.schedule(options);
    } catch (error) {
      console.error('Error scheduling notification', error);
    }
  }

  /**
   * Check if the app is running on a native platform
   */
  public isNativePlatform(): boolean {
    return this.isNative;
  }

  /**
   * Get device information
   */
  public async getDeviceInfo() {
    if (!this.isNative) return null;
    return Device.getInfo();
  }
}

// Export a singleton instance
export const capacitorService = CapacitorService.getInstance();
