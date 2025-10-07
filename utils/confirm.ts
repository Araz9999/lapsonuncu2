import { Alert, Platform } from 'react-native';

export async function confirm(message: string, title?: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      const composed = title ? `${title}\n\n${message}` : message;
      // eslint-disable-next-line no-alert
      const ok = window.confirm(composed);
      return ok;
    } catch (e) {
      console.log('confirm fallback error', e);
      return true;
    }
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title ?? '',
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'OK', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
