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
export declare const DEFAULT_SYSTEM_SETTINGS: SystemSettingsMap;
export declare class SettingsRepository {
    private static getClient;
    /**
     * Normalize key between camelCase and snake_case
     */
    private static toCamelCase;
    private static toSnakeCase;
    /**
     * Seed default system settings into Supabase if empty
     */
    static seedDefaults(): Promise<void>;
    /**
     * Get all system settings merged with defaults
     */
    static getAll(): Promise<SystemSettingsMap>;
    /**
     * Get single setting value by key
     */
    static get<K extends keyof SystemSettingsMap>(key: K, fallback?: SystemSettingsMap[K]): Promise<SystemSettingsMap[K]>;
    /**
     * Update or insert system settings
     */
    static update(updates: Partial<SystemSettingsMap>): Promise<SystemSettingsMap>;
}
