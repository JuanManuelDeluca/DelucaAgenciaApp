import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AgencyEvent } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Deluca Agencia',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  return true;
}

export async function scheduleEventNotification(event: AgencyEvent): Promise<void> {
  const trigger = new Date(event.eventDate);
  trigger.setHours(9, 0, 0, 0);

  if (trigger <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: event.id,
    content: {
      title: event.type === 'birthday' ? '🎂 Cumpleaños' : event.type === 'match' ? '🏀 Partido' : '📌 Recordatorio',
      body: event.title,
      data: { eventId: event.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
  });
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function scheduleAllEvents(events: AgencyEvent[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const event of events) {
    await scheduleEventNotification(event);
  }
}
