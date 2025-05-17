// services/geocode.ts
import * as Location from 'expo-location';

export async function getAddressFromCoords(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    // build a simple formatted address
    const parts = [
      place.name,        // e.g. building name/POI
      place.street,      // street
      place.city,        // city
      place.region,      // state/region
      place.country,     // country
    ].filter(Boolean);
    return parts.join(', ');
  } catch {
    return ''; // or throw / return null if you prefer
  }
}
