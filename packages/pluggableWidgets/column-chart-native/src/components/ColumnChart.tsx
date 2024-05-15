import { createElement, ReactElement, useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, Text, TextStyle, View } from "react-native";
import {
    VictoryAxis,
    VictoryBar,
    VictoryChart,
    VictoryGroup,
    VictoryStack,
    VictoryVoronoiContainer
} from "victory-native";
import { BarProps } from "victory-bar";
import { extractStyles } from "@mendix/pluggable-widgets-tools";

import { ColumnChartStyle } from "../ui/Styles";
import { SortOrderEnum } from "../../typings/ColumnChartProps";
import { Legend } from "./Legend";
import { aggregateGridPadding, mapToAxisStyle, mapToGridStyle, mapToColumnStyles } from "../utils/StyleUtils";

export interface ColumnChartProps {
    name: string;
    series: ColumnChartSeries[];
    sortOrder: SortOrderEnum;
    style: ColumnChartStyle;
    presentation: string;
    showLegend: boolean;
    showLabels: boolean;
    xAxisLabel?: string;
    yAxisLabel?: string;
    offsetY: number;
    fixLabelOverlap: boolean;
    useTooltip: boolean;
    tooltipString?: string;
    warningPrefix?: string;
}

export interface ColumnChartSeries {
    dataPoints: ColumnDataPoints;
    xFormatter?: (xValue: number | Date | string) => string;
    yFormatter?: (yValue: number | Date | string) => string;
    name?: string;
    customColumnStyle?: string;
}

export type ColumnDataPoints =
    | Array<ColumnDataPoint<number, number>>
    | Array<ColumnDataPoint<number, Date>>
    | Array<ColumnDataPoint<Date, number>>
    | Array<ColumnDataPoint<Date, Date>>
    | Array<ColumnDataPoint<string, string>>
    | Array<ColumnDataPoint<string, number>>
    | Array<ColumnDataPoint<string, Date>>
    | Array<ColumnDataPoint<number, string>>
    | Array<ColumnDataPoint<Date, string>>;

export interface ColumnDataPoint<X extends number | Date | string, Y extends number | Date | string> {
    x: X;
    y: Y;
}

export function ColumnChart({
    name,
    presentation,
    series,
    showLabels,
    xAxisLabel,
    yAxisLabel,
    offsetY,
    fixLabelOverlap,
    useTooltip,
    tooltipString,
    showLegend,
    sortOrder,
    style,
    warningPrefix
}: ColumnChartProps): ReactElement | null {
    const dataTypesResult = useMemo(() => getDataTypes(series), [series]);
    const sortedSeries = useMemo(() => {
        if (dataTypesResult === undefined || dataTypesResult instanceof Error) {
            return series;
        }
        return sortSeriesDataPoints(series, sortOrder, dataTypesResult);
    }, [sortOrder, series, dataTypesResult]);

    const [chartDimensions, setChartDimensions] = useState<{ height: number; width: number }>();

    // Column Chart user-styling may be missing for certain series. A palette is passed, any missing colours
    // fallback to a colour from the palette.
    const normalizedColumnColors: string[] = useMemo(() => {
        const columnColorPalette = style.columns?.columnColorPalette?.split(";");
        let index = 0;

        return sortedSeries.map(seriesItem => {
            const configuredStyle = !seriesItem.customColumnStyle
                ? null
                : style.columns?.customColumnStyles?.[seriesItem.customColumnStyle]?.column?.columnColor;

            if (typeof configuredStyle !== "string") {
                const columnColor = columnColorPalette?.[index] || "black";

                if (columnColorPalette) {
                    index = index + 1 === columnColorPalette.length ? 0 : index + 1;
                }

                return columnColor;
            }

            return configuredStyle;
        });
    }, [sortedSeries, style]);

    const groupedOrStacked = useMemo(() => {
        if (!dataTypesResult || dataTypesResult instanceof Error) {
            return null;
        }

        const columns = sortedSeries.map(({ customColumnStyle, dataPoints }, index) => {
            if (!dataPoints.length) {
                return null;
            }

            const seriesStyle =
                style.columns?.customColumnStyles && customColumnStyle
                    ? style.columns.customColumnStyles[customColumnStyle]
                    : undefined;

            const columnStyles = mapToColumnStyles(normalizedColumnColors[index], seriesStyle);
            return (
                <VictoryBar
                    key={index}
                    data={dataPoints}
                    width={columnStyles.width}
                    cornerRadius={columnStyles.cornerRadius}
                    style={{
                        data: {
                            ...columnStyles.column
                        },
                        labels: {
                            ...columnStyles.labels
                        }
                    }}
                    {...(showLabels
                        ? { labels: ({ datum }: { datum: BarProps["datum"] }) => datum.y || "" }
                        : undefined)}
                />
            );
        });

        if (presentation === "grouped") {
            return (
                <VictoryGroup offset={style.columns?.columnsOffset} colorScale={normalizedColumnColors}>
                    {columns}
                </VictoryGroup>
            );
        }

        return <VictoryStack colorScale={normalizedColumnColors}>{columns}</VictoryStack>;
    }, [dataTypesResult, sortedSeries, style, showLabels, normalizedColumnColors, presentation]);

    const [firstSeries] = sortedSeries;

    const axisLabelStyles = useMemo(() => getAxisLabelStyles(style, warningPrefix!), [style, warningPrefix]);

    const xAxisLabelComponent = <Text style={axisLabelStyles.xAxisLabelStyle}>{xAxisLabel}</Text>;
    const yAxisLabelComponent = <Text style={axisLabelStyles.yAxisLabelStyle}>{yAxisLabel}</Text>;

    const updateChartDimensions = useCallback(
        (event: LayoutChangeEvent) => {
            const { height, width } = event.nativeEvent.layout;
            setChartDimensions({
                height: height <= 0 ? -1 : height,
                width: width <= 0 ? -1 : width
            });
        },
        [setChartDimensions]
    );

    const useOffsetY = offsetY !== 9999; //Empty value is not allowed for Integer in widget configuration, so 9999

    return (
        <View style={style.container} testID={name}>
            {dataTypesResult instanceof Error ? (
                <Text style={style.errorMessage}>{dataTypesResult.message}</Text>
            ) : (
                <View style={style.chart}>
                    <View style={{ flex: 1 }}>
                        {axisLabelStyles.extractedYAxisLabelStyle.relativePositionGrid === "top"
                            ? yAxisLabelComponent
                            : null}
                        <View style={{ flex: 1, flexDirection: "row" }}>
                            {axisLabelStyles.extractedYAxisLabelStyle.relativePositionGrid === "left"
                                ? yAxisLabelComponent
                                : null}
                            <View onLayout={updateChartDimensions} style={{ flex: 1 }}>
                                {chartDimensions ? (
                                    <VictoryChart
                                        domainPadding={{ x: style.domain?.padding?.x, y: style.domain?.padding?.y }}
                                        /*CC: Include a pressable surface that show a tooltip with the text tooltipString */
                                        containerComponent={
                                            useTooltip ? (
                                                <VictoryVoronoiContainer
                                                    voronoiDimension="x"
                                                    labels={({ datum }) =>
                                                        `${replaceTokens(tooltipString || "", [], datum.x, datum.y)}`
                                                    }
                                                    //Add LabelComponent if style of tooltip needs to be changed
                                                />
                                            ) : undefined
                                        }
                                        // width and height can't be zero
                                        // TODO: this needs to be checked for bar chart
                                        height={chartDimensions?.height || undefined}
                                        width={chartDimensions?.width || undefined}
                                        padding={aggregateGridPadding(style.grid)}
                                        scale={
                                            dataTypesResult
                                                ? { x: getScale(dataTypesResult.x), y: getScale(dataTypesResult.y) }
                                                : undefined
                                        }
                                        style={mapToGridStyle(style.grid)}
                                    >
                                        <VictoryAxis
                                            orientation={"bottom"}
                                            style={mapToAxisStyle(style.grid, style.xAxis)}
                                            {...(firstSeries?.xFormatter
                                                ? { tickFormat: firstSeries.xFormatter }
                                                : undefined)}
                                            /*CC: Offset x-axis to a value set by user in widget.  Set y0 so set baseline to lowest value - 1. The -1 is to keep room for ticks on x-axis*/
                                            offsetY={useOffsetY ? offsetY : undefined}
                                            y0={useOffsetY ? (d: any) => d.y0 - 1 : undefined}
                                            /*CC: Added option for fixLabelOverlap */
                                            fixLabelOverlap ={fixLabelOverlap}
                                        />
                                        {useOffsetY && (
                                            <VictoryAxis /*CC: Add y=0 x-axis, without any ticks if original x-axis is offset */
                                                orientation={"bottom"}
                                                style={mapToAxisStyle(style.grid, style.xAxis0)}
                                                tickFormat={() => ""}
                                            />
                                        )}
                                        <VictoryAxis
                                        /*CC: Changed style.grid to gridY to allow for only grid on y-axis. */
                                            style={mapToAxisStyle(style.gridY, style.yAxis)}
                                            orientation={"left"}
                                            dependentAxis
                                            {...(firstSeries?.yFormatter
                                                ? { tickFormat: firstSeries.yFormatter }
                                                : undefined)}
                                        />
                                        {groupedOrStacked}
                                    </VictoryChart>
                                ) : null}
                            </View>
                            {axisLabelStyles.extractedXAxisLabelStyle.relativePositionGrid === "right"
                                ? xAxisLabelComponent
                                : null}
                        </View>
                        {axisLabelStyles.extractedXAxisLabelStyle.relativePositionGrid === "bottom"
                            ? xAxisLabelComponent
                            : null}
                    </View>
                    {showLegend ? (
                        <Legend style={style.legend} series={sortedSeries} seriesColors={normalizedColumnColors} />
                    ) : null}
                </View>
            )}
        </View>
    );
}

type DataTypeResult = { x: string; y: string };

function getDataTypes(series: ColumnChartSeries[]): DataTypeResult | Error | undefined {
    let dataTypes: DataTypeResult | undefined;

    for (const seriesItem of series) {
        const { dataPoints } = seriesItem;

        if (dataPoints.length) {
            const { x, y } = dataPoints[0];
            const xDataType = typeof x;
            const yDataType = typeof y;

            if (!dataTypes) {
                dataTypes = { x: xDataType, y: yDataType };
            } else if (dataTypes && (dataTypes.x !== xDataType || dataTypes.y !== yDataType)) {
                return new Error("Data types of data points belonging to different series aren't equal");
            }
        }
    }

    return dataTypes;
}

const getScale = (dataTypesResult: string): "linear" | "time" | undefined => {
    switch (dataTypesResult) {
        case "number":
        case "string":
            return "linear";

        case "object":
            return "time";
        default:
            return undefined;
    }
};

type AxisLabelStyle = Omit<
    TextStyle & {
        relativePositionGrid?: "bottom" | "right" | "left" | "top" | undefined;
    },
    "relativePositionGrid"
>;

type ExtractedAxisLabelStyle = Pick<
    TextStyle & {
        relativePositionGrid?: "bottom" | "right" | "left" | "top" | undefined;
    },
    "relativePositionGrid"
>;

function getAxisLabelStyles(
    style: ColumnChartStyle,
    warningPrefix: string
): {
    extractedXAxisLabelStyle: ExtractedAxisLabelStyle;
    xAxisLabelStyle: AxisLabelStyle;
    extractedYAxisLabelStyle: ExtractedAxisLabelStyle;
    yAxisLabelStyle: AxisLabelStyle;
} {
    const [extractedXAxisLabelStyle, xAxisLabelStyle] = extractStyles(style.xAxis?.label, ["relativePositionGrid"]);
    const [extractedYAxisLabelStyle, yAxisLabelStyle] = extractStyles(style.yAxis?.label, ["relativePositionGrid"]);

    validateRelativePositionGrid(extractedXAxisLabelStyle, "X", warningPrefix, "bottom", "right");
    validateRelativePositionGrid(extractedYAxisLabelStyle, "Y", warningPrefix, "top", "left");

    return {
        extractedXAxisLabelStyle,
        xAxisLabelStyle,
        extractedYAxisLabelStyle,
        yAxisLabelStyle
    };
}

function validateRelativePositionGrid(
    style: { relativePositionGrid?: string },
    axis: "X" | "Y",
    warningPrefix: string,
    ...validValues: string[]
): void {
    const position = style.relativePositionGrid;
    if (!validValues.some(value => value === position)) {
        if (position !== undefined) {
            const joinedValidValues = validValues.join(", ");
            console.warn(
                `${warningPrefix}Invalid value for ${axis} axis label style property relativePositionGrid, valid values are: ${joinedValidValues}`
            );
        }
        style.relativePositionGrid = validValues[0];
    }
}

function sortSeriesDataPoints(
    series: ColumnChartSeries[],
    sortingOrder: string,
    seriesDataType: DataTypeResult
): ColumnChartSeries[] {
    // number and date keys need to be sorted ascending otherwise the library will mis-represent them
    if (seriesDataType.x !== "string") {
        return series.map(seriesItem => {
            const { dataPoints } = seriesItem;
            const sortedDataPoints = dataPoints.sort((p1, p2) => Number(p1.x) - Number(p2.x));
            return { ...seriesItem, dataPoints: sortedDataPoints };
        });
    }

    if (seriesDataType.y !== "number") {
        return series;
    }
    if (sortingOrder === "noSort") {
        /*CC Added enum option noSort to force not sorting if x-axis is string datatype and y-axis is number (it always used ascending/descending)*/
        return series;
    }
    const keysSum: { [key: string]: number } = {};
    series.forEach(({ dataPoints }) => {
        dataPoints.forEach(({ x, y }) => {
            const key = x as string;
            if (key in keysSum) {
                keysSum[key] += Number(y);
            } else {
                keysSum[key] = Number(y);
            }
        });
    });

    return series.map(seriesItem => {
        const dataPoints = seriesItem.dataPoints as Array<ColumnDataPoint<string, number>>;
        const sortedDataPoints = Object.keys(keysSum)
            .sort((key1, key2) => {
                return sortingOrder === "descending" ? keysSum[key2] - keysSum[key1] : keysSum[key1] - keysSum[key2];
            })
            .map(key => ({
                x: key,
                y: dataPoints.find((point: ColumnDataPoint<string, number>) => point.x === key)?.y || 0
            }));

        return { ...seriesItem, dataPoints: sortedDataPoints };
    });
}

function replaceTokens(text: string, replacementStack: string[], xValue: any, yValue: any) {
    /* CC: Replace Tokens in given string, taken from https://stackoverflow.com/questions/43818516/replace-text-with-tokens-from-a-list-using-regular-expression
    Updated with typescript and changed tokens array to widget specific values */
    let tokens: { [key: string]: string | undefined } = {
        x: String(xValue),
        y: String(yValue)
    };

    const re = /{[\w]*\}/g; // match initial regex

    let result = text;
    let textTokens = text.match(re);
    replacementStack = replacementStack || [];

    textTokens &&
        textTokens.forEach(m => {
            let token = m.replace(/{|}/g, "");
            // Prevent circular replacement, token should not have already replaced
            if (replacementStack.indexOf(token) === -1) {
                // add token to replacement stack
                replacementStack.push(token);
                let replacement = tokens[token];
                if (replacement) {
                    replacement = replaceTokens(replacement, replacementStack, xValue, yValue);
                    result = result.replace(m, replacement);
                }
            }
        });

    return result;
}
