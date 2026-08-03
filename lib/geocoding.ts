export type PlaceSuggestion = { label: string; latitude?: number; longitude?: number; timezone?: string };
export interface GeocodingProvider { suggest(query: string): Promise<PlaceSuggestion[]> }
export const geocodingProvider: GeocodingProvider | null = null;
