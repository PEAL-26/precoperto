import * as Location from 'expo-location';

export type LocationResult =
  | { status: 'granted'; latitude: number; longitude: number }
  | { status: 'denied' }
  | { status: 'unavailable' };

export async function requestCurrentLocation(): Promise<LocationResult> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') return { status: 'denied' };
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      status: 'granted',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return { status: 'unavailable' };
  }
}
