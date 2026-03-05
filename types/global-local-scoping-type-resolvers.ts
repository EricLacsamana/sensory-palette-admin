import type {
    DataSortingOptionsObject,
    PointOptionsObject,
    SeriesBarOptions,
    SeriesFunnelOptions,
    SeriesLineOptions,
    SeriesSankeyOptions,
} from 'highcharts';

import type { HIGHCHARTS_MODULES } from '@/constants/highcharts';

/**
 * Represents an available Highcharts module from the defined constants.
 */
export type HighchartsModule = (typeof HIGHCHARTS_MODULES)[number];

/* -------------------------------------------------------------------------- */
/* UTILITY TYPES (Recursive Key Helpers)                                      */
/* -------------------------------------------------------------------------- */

/**
 * Extracts the element type from an array. If not an array, returns the type itself.
 */
type Unarray<T> = T extends Array<infer U> ? U : T;

/**
 * Valid data point formats accepted by Highcharts for plotting.
 */
export type ProjectedPoint =
    | number
    | [unknown, number | null]
    | PointOptionsObject
    | null;

/**
 * Recursively extracts deeply nested object keys and joins them with dot notation (e.g., 'user.address.street').
 * Helps in providing strict typing for string paths based on an object's shape.
 */
export type LeafKeyOf<T> =
    NonNullable<T> extends object
        ? {
              [K in keyof NonNullable<T> &
                  string]: NonNullable<T>[K] extends infer C
                  ? NonNullable<C> extends any[]
                      ? `${K}` | `${K}.${LeafKeyOf<NonNullable<C>[number]>}`
                      : NonNullable<C> extends object
                        ? `${K}` | `${K}.${LeafKeyOf<NonNullable<C>>}`
                        : `${K}`
                  : never;
          }[keyof NonNullable<T> & string]
        : never;

/**
 * Maps all keys of a Record/Map to include a prefix based on the map's key.
 * Yields paths like 'datasetName.nested.property'.
 */
type GlobalMapKeys<TMap> = {
    [K in keyof TMap & string]: `${K}.${LeafKeyOf<Unarray<TMap[K]>> & string}`;
}[keyof TMap & string];

/* -------------------------------------------------------------------------- */
/* REUSABLE KEY RESOLVERS (To keep logic DRY)                                 */
/* -------------------------------------------------------------------------- */

/**
 * Resolves to the specific leaf keys of TMap[K] if K is provided.
 * Falls back to global map keys (prefixed) if K is undefined.
 */
type ResolvedKey<
    TMap extends { [K in keyof TMap]: unknown[] },
    K extends keyof TMap | undefined,
> = K extends keyof TMap ? LeafKeyOf<Unarray<TMap[K]>> : GlobalMapKeys<TMap>;

/**
 * Resolves to the specific leaf keys of TMap[K] if K is provided.
 * Falls back to a generic `string` if K is undefined.
 * Useful for specialized charts (like Sankey/Funnel) that don't need strict global mapping fallback.
 */
type ResolvedStringKey<
    TMap extends { [K in keyof TMap]: unknown[] },
    K extends keyof TMap | undefined,
> = K extends keyof TMap ? LeafKeyOf<Unarray<TMap[K]>> : string;

/* -------------------------------------------------------------------------- */
/* CORE CONFIGURATION TYPES                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The Base Configuration applied to standard series types.
 * Conditionally validates data paths based on the provided generic map and key.
 */
export type BaseSeriesConfig<
    TMap extends { [K in keyof TMap]: unknown[] },
    K extends keyof TMap | undefined,
    TAllowedIds extends string = string, // Added Generic here
> = {
    id?: string;
    /** The dataset key used for the series */
    dataKey?: K;
    /** The key used for determining labels */
    labelKey?: ResolvedKey<TMap, K>;
    /** The key(s) indicating numerical values to plot */
    valueKey: ResolvedKey<TMap, K> | ResolvedKey<TMap, K>[];
    /** The key to group data sets by */
    groupByKey?: ResolvedKey<TMap, K>;
    /** The key utilized for data joining/merging operations */
    joinByKey?: ResolvedKey<TMap, K>;
    /** Determines if this series is linked to a main series (e.g., for toggling visibility) */
    linkedToMain?: boolean;
    /** Determines if this series is linked to a main series (e.g., for toggling visibility) */
    linkedTo?: TAllowedIds; // Assigned generic here
    /** Whether the series points should be colored by their group */
    colorByGroup?: boolean;
    /** Display name of the series */
    name?: string;
};

// ==========================================
// 4. EXTENDED CONFIGURATIONS
// ==========================================

/**
 * Configuration for Line charts.
 */
export type MultilineSeriesConfig<
    TMap extends { [K in keyof TMap]: unknown[] },
    K extends keyof TMap | undefined = undefined,
    TAllowedIds extends string = string, // Passed through
> = BaseSeriesConfig<TMap, K, TAllowedIds> & {
    /** Highcharts-specific line options */
    options?: Partial<SeriesLineOptions>;
    dataSorting?: Partial<DataSortingOptionsObject>;
};

/**
 * Configuration for Bar charts.
 */
export type BarSeriesConfig<
    TMap extends { [K in keyof TMap]: unknown[] },
    K extends keyof TMap | undefined,
    TAllowedIds extends string = string, // Passed through
> = BaseSeriesConfig<TMap, K, TAllowedIds> & {
    /** Highcharts-specific bar options */
    options?: Partial<SeriesBarOptions>;
    dataSorting?: Partial<DataSortingOptionsObject>;
};

/**
 * Configuration for Sankey diagrams.
 * Removes the standard `valueKey` in favor of flow-based routing keys.
 */
export type SankeySeriesConfig<
    TMap extends { [K in keyof TMap]: unknown[] },
    K extends keyof TMap | undefined,
    TAllowedIds extends string = string, // Passed through
> = Omit<BaseSeriesConfig<TMap, K, TAllowedIds>, 'valueKey'> & {
    /** Highcharts-specific sankey options */
    options?: Partial<SeriesSankeyOptions>;

    // 1. The Core Sankey Keys
    /** Key designating flow weight */
    weightKey: ResolvedStringKey<TMap, K>;
    /** Key designating node source */
    sourceKey?: ResolvedStringKey<TMap, K>;
    /** Key designating node target */
    targetKey?: ResolvedStringKey<TMap, K>;

    // 2. Extra Keys Array (e.g., for pulling extra data into tooltips)
    /** Keys mapped to display names */
    nameKeys?: ResolvedStringKey<TMap, K>[];

    // 3. Totally Dynamic Mapping Object (Rename keys on the fly)
    /** Defines custom runtime mapping */
    mapping?: Record<string, ResolvedStringKey<TMap, K>>;
};

/**
 * Configuration for Funnel charts.
 * Overrides the base `valueKey` so it can ONLY be a single string (not an array),
 * because a funnel stage represents one metric at a time.
 */
export type FunnelSeriesConfig<
    TMap extends { [K in keyof TMap]: unknown[] },
    K extends keyof TMap | undefined,
    TAllowedIds extends string = string, // Passed through
> = Omit<BaseSeriesConfig<TMap, K, TAllowedIds>, 'valueKey'> & {
    // Note: Kept 'bar' to preserve original logic, though this binds to Funnel options.
    type: 'bar';
    /** Highcharts-specific funnel options */
    options?: Partial<SeriesFunnelOptions>;

    /** A tightened valueKey mapped to exactly one string/leaf path */
    valueKey: ResolvedStringKey<TMap, K>;
};

export type ChartSeriesConfig<
    TMap extends { [K in keyof TMap]: unknown[] },
    K extends keyof TMap | undefined = undefined,
    TAllowedIds extends string = string, // Passed through
> =
    | MultilineSeriesConfig<TMap, K, TAllowedIds>
    | BarSeriesConfig<TMap, K, TAllowedIds>
    | SankeySeriesConfig<TMap, K, TAllowedIds>
    | FunnelSeriesConfig<TMap, K, TAllowedIds>;
