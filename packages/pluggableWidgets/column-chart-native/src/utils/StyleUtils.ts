import { VictoryChartProps } from "victory-chart";
import { VictoryAxisCommonProps, VictoryCommonProps } from "victory-core";
import { VictoryBarProps } from "victory-bar";
import { VictoryTooltipProps } from "victory-tooltip";
import { ColumnChartAxisStyle, ColumnChartGridStyle, ColumnChartStyle, ColumnChartTooltipStyle } from "../ui/Styles";

export function mapToGridStyle(
    gridStyle?: ColumnChartGridStyle
): Pick<NonNullable<VictoryChartProps["style"]>, "background"> {
    return {
        background: {
            fill: gridStyle?.backgroundColor
        }
    };
}

/* CC: Add VictoryTooltip style options */
export function mapToTooltipStyle(tooltipStyle?: ColumnChartTooltipStyle): VictoryTooltipProps {
    return {
        style: {
            fill: tooltipStyle?.tooltipStyle.fill ?? "black"
        },
        flyoutStyle: {
            stroke: tooltipStyle?.flyoutStyle.stroke ?? "black",
            fill: tooltipStyle?.flyoutStyle.fill ?? "lightgrey",
            strokeWidth: tooltipStyle?.flyoutStyle.strokeWidth ?? 2
        },
        flyoutPadding: {
            top: tooltipStyle?.flyoutPadding.top ?? 5,
            bottom: tooltipStyle?.flyoutPadding.bottom ?? 5,
            left: tooltipStyle?.flyoutPadding.left ?? 5,
            right: tooltipStyle?.flyoutPadding.right ?? 5
        }
    };
}

export function mapToAxisStyle<T extends "X" | "Y">(
    gridStyle?: ColumnChartGridStyle,
    axisStyle?: ColumnChartAxisStyle<T>
): Pick<NonNullable<VictoryAxisCommonProps["style"]>, "axis" | "grid" | "tickLabels"> {
    return {
        axis: {
            stroke: axisStyle?.lineColor,
            strokeDasharray: axisStyle?.dashArray,
            strokeWidth: axisStyle?.width
        },
        grid: {
            stroke: gridStyle?.lineColor,
            strokeDasharray: gridStyle?.dashArray,
            strokeWidth: gridStyle?.width
        },
        tickLabels: {
            fill: axisStyle?.color,
            fontFamily: axisStyle?.fontFamily,
            fontSize: axisStyle?.fontSize,
            fontStyle: axisStyle?.fontStyle,
            fontWeight: axisStyle?.fontWeight
        }
    };
}

function mapToColumnStyle(
    fallbackColor: string,
    style?: NonNullable<NonNullable<ColumnChartStyle["columns"]>["customColumnStyles"]>["key"]
): NonNullable<VictoryBarProps["style"]>["data"] {
    return {
        fill: style?.column?.columnColor ?? fallbackColor
    };
}

function mapToColumnLabelStyle(
    fallbackColor: string,
    style?: NonNullable<NonNullable<ColumnChartStyle["columns"]>["customColumnStyles"]>["key"]
): NonNullable<VictoryBarProps["style"]>["labels"] {
    const fill = style?.column?.columnColor ?? fallbackColor;

    return {
        fill,
        fontSize: style?.label?.fontSize,
        fontFamily: style?.label?.fontFamily,
        fontStyle: style?.label?.fontStyle,
        fontWeight: style?.label?.fontWeight
    };
}

export function mapToColumnStyles(
    fallbackColor: string,
    style?: NonNullable<NonNullable<ColumnChartStyle["columns"]>["customColumnStyles"]>["key"]
) {
    return {
        column: mapToColumnStyle(fallbackColor, style),
        labels: mapToColumnLabelStyle(fallbackColor, style),
        cornerRadius: style?.column?.ending,
        width: style?.column?.width
    };
}

export function aggregateGridPadding(gridStyle?: ColumnChartGridStyle): VictoryCommonProps["padding"] {
    if (!gridStyle) {
        return;
    }

    const { padding, paddingHorizontal, paddingVertical, paddingTop, paddingRight, paddingBottom, paddingLeft } =
        gridStyle;

    const defaultGridPadding = {
        bottom: 30,
        left: 30,
        right: 10,
        top: 10
    };

    return {
        top: paddingTop ?? paddingVertical ?? padding ?? defaultGridPadding.top,
        right: paddingRight ?? paddingHorizontal ?? padding ?? defaultGridPadding.right,
        bottom: paddingBottom ?? paddingVertical ?? padding ?? defaultGridPadding.bottom,
        left: paddingLeft ?? paddingHorizontal ?? padding ?? defaultGridPadding.left
    };
}
