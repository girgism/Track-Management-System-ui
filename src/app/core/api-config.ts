import { InjectionToken } from '@angular/core';

/**
 * Base URL of the Track Management API (no trailing slash).
 * Matches the "https" profile in the API's launchSettings.json. Change it here if your port differs.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://localhost:7074',
});
