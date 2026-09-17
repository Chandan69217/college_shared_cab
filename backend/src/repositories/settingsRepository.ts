import { getSupabaseClient } from '../database/supabaseClient';

export interface SystemSettingsMap {
  serviceRadiusKm: number;
  cancellationBufferHours: number;
  requireAdminKycApproval: boolean;
  enableDynamicQrReplayProtection: boolean;
  emergencySosBroadcast: boolean;
  defaultVehicleCapacity: number;
  concurrencyBookingLockTimeoutSec: number;
  maintenanceMode: boolean;
  supportPhone: string;
  supportEmail: string;
  allowRoundTripBooking: boolean;
  [key: string]: any;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsMap = {
  serviceRadiusKm: 10.0,
  cancellationBufferHours: 2,
  requireAdminKycApproval: true,
  enableDynamicQrReplayProtection: true,
  emergencySosBroadcast: true,
  defaultVehicleCapacity: 6,
  concurrencyBookingLockTimeoutSec: 15,
  maintenanceMode: false,
  supportPhone: '+91 98765 43210',
  supportEmail: 'transport-support@college.edu',
  allowRoundTripBooking: true,
};

export class SettingsRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized.');
    return client;
  }

  /**
   * Normalize key between camelCase and snake_case
   */
  private static toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Seed default system settings into Supabase if empty
   */
  public static async seedDefaults(): Promise<void> {
    try {
      const client = this.getClient();
      const { count } = await client.from('system_settings').select('id', { count: 'exact', head: true });
      if (count === 0) {
        const rows = Object.entries(DEFAULT_SYSTEM_SETTINGS).map(([key, value]) => ({
          key: this.toSnakeCase(key),
          value: { val: value },
          description: `System configuration parameter for ${key}`,
          updated_at: new Date().toISOString(),
        }));
        await client.from('system_settings').insert(rows);
      }
    } catch (err) {
      console.warn('Could not seed system settings defaults:', err);
    }
  }

  /**
   * Get all system settings merged with defaults
   */
  public static async getAll(): Promise<SystemSettingsMap> {
    const client = this.getClient();
    const { data, error } = await client.from('system_settings').select('*');
    if (error) {
      console.error('Error fetching system settings:', error);
      return { ...DEFAULT_SYSTEM_SETTINGS };
    }

    if (!data || data.length === 0) {
      await this.seedDefaults();
      return { ...DEFAULT_SYSTEM_SETTINGS };
    }

    const merged: SystemSettingsMap = { ...DEFAULT_SYSTEM_SETTINGS };
    for (const row of data) {
      const camelKey = this.toCamelCase(row.key);
      const val = row.value && typeof row.value === 'object' && 'val' in row.value ? row.value.val : row.value;
      if (val !== undefined && val !== null) {
        merged[camelKey] = val;
      }
    }
    return merged;
  }

  /**
   * Get single setting value by key
   */
  public static async get<K extends keyof SystemSettingsMap>(
    key: K,
    fallback?: SystemSettingsMap[K]
  ): Promise<SystemSettingsMap[K]> {
    try {
      const client = this.getClient();
      const snakeKey = this.toSnakeCase(String(key));
      const { data, error } = await client
        .from('system_settings')
        .select('value')
        .eq('key', snakeKey)
        .maybeSingle();

      if (error || !data) {
        return fallback !== undefined ? fallback : DEFAULT_SYSTEM_SETTINGS[key];
      }

      const val = data.value && typeof data.value === 'object' && 'val' in data.value ? data.value.val : data.value;
      return val !== undefined && val !== null ? val : (fallback ?? DEFAULT_SYSTEM_SETTINGS[key]);
    } catch {
      return fallback !== undefined ? fallback : DEFAULT_SYSTEM_SETTINGS[key];
    }
  }

  /**
   * Update or insert system settings
   */
  public static async update(updates: Partial<SystemSettingsMap>): Promise<SystemSettingsMap> {
    const client = this.getClient();
    const rows = Object.entries(updates).map(([key, value]) => ({
      key: this.toSnakeCase(key),
      value: { val: value },
      updated_at: new Date().toISOString(),
    }));

    for (const row of rows) {
      const { error } = await client
        .from('system_settings')
        .upsert(row, { onConflict: 'key' });
      if (error) {
        throw new Error(`Failed to update setting ${row.key}: ${error.message}`);
      }
    }

    return this.getAll();
  }
}
