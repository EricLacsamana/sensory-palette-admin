'use client';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import Skeleton from 'react-loading-skeleton';

import type { BarSeriesConfig, HighchartsModule } from '@/types/chart';
import { initializeHighchartsModules } from '@/utils/highcharts';
import buildSeriesData from '@/utils/highcharts/series-builder';

export interface GenericHorizontalBarChartRef {
	readonly series: Highcharts.Series[];
	readonly chart: Highcharts.Chart | null;
}

interface GenericHorizontalBarChartProps<
	TMap extends Record<string, unknown[]>,
> {
	id: string;
	data: TMap;
	series: (
		s: <K extends keyof TMap>(
			config: BarSeriesConfig<TMap, K>,
		) => BarSeriesConfig<TMap, K>,
	) => unknown;
	height?: number | string;
	width?: number | string;
	options?: Highcharts.Options;
	modules?: HighchartsModule[];
	callback?: (chart: Highcharts.Chart) => void;
	limit?: number;
	sortByKey?: string;
	sortOrder?: 'asc' | 'desc';
}

const GenericHorizontalBarChartInner = <TMap extends Record<string, any>>(
	{
		id,
		data,
		series: renderSeries,
		height,
		width,
		modules = [],
		limit,
		sortByKey,
		sortOrder,
		callback,
	}: GenericHorizontalBarChartProps<TMap>,
	ref: React.ForwardedRef<GenericHorizontalBarChartRef>,
) => {
	const internalRef = useRef<HighchartsReact.RefObject>(null);
	const [isModulesReady, setIsModulesReady] = useState(false);

	useImperativeHandle(
		ref,
		() => ({
			get chart() {
				return internalRef.current?.chart || null;
			},
			get series() {
				return internalRef.current?.chart?.series || [];
			},
		}),
		[],
	);

	useEffect(() => {
		initializeHighchartsModules(Highcharts, modules).finally(() =>
			setIsModulesReady(true),
		);
	}, [modules]);

	const { categories, series, xAxisType, yAxisType } = useMemo(() => {
		const seriesConfigs: BarSeriesConfig<TMap, any>[] = [];

		renderSeries((config) => {
			seriesConfigs.push(config);
			return config;
		});

		return buildSeriesData(data, seriesConfigs, {
			limit,
			sortByKey,
			sortOrder,
		});
	}, [data, renderSeries, sortOrder, limit, sortByKey]);

	const hasData = series.length > 0;

	const options: Highcharts.Options = useMemo(
		() => ({
			chart: {
				backgroundColor: 'transparent',
				spacingLeft: hasData ? 40 : 0,
				spacingRight: 0,
				type: 'bar',
				zooming: { type: 'y' },
				...(height && { height }),
				...(width && { width }),
			},
			credits: { enabled: false },
			legend: { enabled: false },
			series: series,
			title: { text: undefined },
			xAxis: {
				categories: categories,
				labels: {
					align: 'left',
					distance: 50,
					enabled: hasData,
					reserveSpace: hasData,
					style: { color: '#000000', fontSize: '12px' },
				},
				lineWidth: 0,
				plotLines: (categories?.length ? categories : [])
					.slice(0, -1)
					.map((_, i) => ({
						color: '#E5E7EB',
						value: i + 0.5,
						width: 1,
						zIndex: 3,
					})),
				tickLength: 0,
				type: xAxisType,
				visible: hasData,
			},
			yAxis: {
				gridLineWidth: 0,
				labels: { enabled: false },
				lineWidth: 0,
				title: { text: undefined },
				type: yAxisType,
				visible: false,
			},
		}),
		[series, xAxisType, yAxisType, categories, height, width, hasData],
	);

	if (!isModulesReady) {
		return <Skeleton height={height || 300} width={width || '100%'} />;
	}

	return (
		<div className="highcharts-light" id={id}>
			<HighchartsReact
				callback={callback}
				highcharts={Highcharts}
				options={options}
				ref={internalRef}
			/>
		</div>
	);
};

export const GenericHorizontalBarChart = forwardRef(
	GenericHorizontalBarChartInner,
) as unknown as <TMap extends Record<string, any>>(
	props: GenericHorizontalBarChartProps<TMap> & {
		ref?: React.ForwardedRef<GenericHorizontalBarChartRef>;
	},
) => React.ReactElement;

export default GenericHorizontalBarChart;
