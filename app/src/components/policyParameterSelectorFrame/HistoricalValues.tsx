import Plot from 'react-plotly.js';
import { Stack, Text } from '@mantine/core';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { CHART_COLORS } from '@/constants/chartColors';
import {
  extendForDisplay,
  filterValidChartDates,
  getAllChartDates,
  getChartBoundaryDates,
} from '@/utils/chartDateUtils';
import {
  formatParameterValue,
  getPlotlyAxisFormat,
} from '@/utils/chartValueUtils';

interface PolicyParameterSelectorHistoricalValuesProps {
  param: ParameterMetadata;
  baseValues: ValueIntervalCollection;
  reformValues?: ValueIntervalCollection;
}

interface ParameterOverTimeChartProps {
  param: ParameterMetadata;
  baseValuesCollection: ValueIntervalCollection;
  reformValuesCollection?: ValueIntervalCollection;
}

export default function PolicyParameterSelectorHistoricalValues(
  props: PolicyParameterSelectorHistoricalValuesProps
) {
  const { param, baseValues = new ValueIntervalCollection(), reformValues } = props;

  return (
    <Stack>
      <Text fw={700}>Historical values</Text>
      <Text>{param.label} over time</Text>
      <ParameterOverTimeChart
        param={param}
        baseValuesCollection={baseValues}
        reformValuesCollection={reformValues}
      />
    </Stack>
  );
}

/*
import { ChartLogo } from "../../../api/charts";
import {
  getPlotlyAxisFormat,
  formatVariableValue,
} from "../../../api/variables";
import useMobile from "../../../layout/Responsive";
import style from "../../../style";
import { plotLayoutFont } from "pages/policy/output/utils";
import { localeCode } from "lang/format";
import { defaultPOTEndDate, defaultStartDate } from "../../../data/constants";
import { useWindowHeight } from "../../../hooks/useWindow";
import { useContext } from "react";
import { ParamChartWidthContext } from "./ParameterEditor";
*/

/**
 *
 * @param {object} policy the policy object
 * @returns the reform policy label
 */
/*
function getReformPolicyLabel(policy) {
  if (policy.reform.label) return policy.reform.label;
  const urlParams = new URLSearchParams(window.location.search);
  const reformPolicyId = urlParams.get("reform");
  return reformPolicyId ? `Policy #${reformPolicyId}` : "reform";
}
  */

export function ParameterOverTimeChart(props: ParameterOverTimeChartProps) {
  const { param, baseValuesCollection, reformValuesCollection } = props;

  // Step 1: Get base data and make a copy to avoid mutations
  const x = [...baseValuesCollection.getAllStartDates()];
  const y = [...baseValuesCollection.getAllValues()];

  // Step 2: Extend for display (adds 2099-12-31 to show visual infinity)
  extendForDisplay(x, y);

  // Step 3: Get reform data (if exists) and make a copy
  const reformedX = reformValuesCollection
    ? [...reformValuesCollection.getAllStartDates()]
    : [];
  const reformedY = reformValuesCollection
    ? [...reformValuesCollection.getAllValues()]
    : [];

  if (reformValuesCollection) {
    extendForDisplay(reformedX, reformedY);
  }

  // Step 4: Calculate x-axis values for formatting
  let xaxisValues = getAllChartDates(x, reformedX);
  xaxisValues = filterValidChartDates(xaxisValues);

  // Step 5: Add boundary dates to control chart window
  const { minDate, maxDate } = getChartBoundaryDates();
  xaxisValues.push(minDate);
  xaxisValues.push(maxDate);

  // Step 6: Calculate y-axis values
  const yaxisValues = reformValuesCollection
    ? [...y, ...reformedY]
    : y;

  // Step 7: Calculate axis formats
  const xaxisFormat = getPlotlyAxisFormat('date', xaxisValues);
  const yaxisFormat = getPlotlyAxisFormat(param.unit || '', yaxisValues);

  // Step 8: Format custom data for hover tooltips
  const customData = y.map((value) =>
    formatParameterValue(value, param.unit, { decimalPlaces: 2 })
  );

  const reformedCustomData = reformedY.map((value) =>
    formatParameterValue(value, param.unit, { decimalPlaces: 2 })
  );

  // TODO: Typing on Plotly is not good; improve the typing here
  return (
    <>
      <Plot
        data={[
          ...(reformValuesCollection
            ? [
                {
                  x: reformedX,
                  y: reformedY.map((y) => +y),
                  type: 'line' as any,
                  mode: 'lines+markers' as any,
                  line: {
                    shape: 'hv' as any,
                    dash: 'dot' as any,
                    color: CHART_COLORS.REFORM_LINE,
                  },
                  marker: {
                    color: CHART_COLORS.REFORM_LINE,
                    size: CHART_COLORS.MARKER_SIZE,
                  },
                  name: 'Reform',
                  customdata: reformedCustomData,
                  hovertemplate: '%{x|%b, %Y}: %{customdata}<extra></extra>',
                },
              ]
            : []),
          {
            x,
            y: y.map((y) => +y),
            type: 'line' as any,
            mode: 'lines+markers' as any,
            line: {
              shape: 'hv' as any,
              color: reformValuesCollection
                ? CHART_COLORS.BASE_LINE_WITH_REFORM
                : CHART_COLORS.BASE_LINE_ALONE,
            },
            marker: {
              color: reformValuesCollection
                ? CHART_COLORS.BASE_LINE_WITH_REFORM
                : CHART_COLORS.BASE_LINE_ALONE,
              size: CHART_COLORS.MARKER_SIZE,
            },
            name: 'Current law',
            customdata: customData,
            hovertemplate: '%{x|%b, %Y}: %{customdata}<extra></extra>',
          },
        ].filter((x) => x)}
        layout={{
          xaxis: xaxisFormat,
          yaxis: yaxisFormat,
          legend: {
            // Position above the plot
            y: 1.2,
            orientation: 'h' as any,
          },
          // ...ChartLogo,
          /*
          margin: {
            t: mobile && 80,
            r: mobile && 50,
            l: mobile && 50,
            b: mobile && 30,
          },
          */
          // ...plotLayoutFont,
          title: {
            // text: `${parameter.label} over time`,
            xanchor: 'left',
            // x: mobile ? 0.05 : 0.04,
          },
          // dragmode: mobile ? false : "zoom",
          // width: paramChartWidth,
        }}
        // Note that plotly does not dynamically resize inside flexbox
        /*
        style={{
          height: mobile ? 0.5 * windowHeight : 400,
        }}
          */
        config={{
          displayModeBar: false,
          responsive: true,
          // locale: localeCode(metadata.countryId),
        }}
      />
    </>
  );
}
