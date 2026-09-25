import * as Location from 'expo-location';

export type LocationResult =
  | { status: 'granted'; latitude: number; longitude: number }
  | { status: 'denied' }
  | { status: 'unavailable' };

export interface Coordinates {
  latitude: number;
  longitude: number;
}

let lastKnownLocation: Coordinates | null = null;

export function getLastKnownLocation(): Coordinates | null {
  return lastKnownLocation;
}

export function setLastKnownLocation(coordinates: Coordinates | null) {
  lastKnownLocation = coordinates;
}

export async function requestCurrentLocation(): Promise<LocationResult> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') return { status: 'denied' };
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    setLastKnownLocation(coordinates);
    return { status: 'granted', ...coordinates };
  } catch {
    return { status: 'unavailable' };
  }
}
