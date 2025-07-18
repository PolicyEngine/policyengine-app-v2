import Plot from 'react-plotly.js';
import { Stack, Text } from '@mantine/core';
import { Parameter } from '@/types/parameter';
import { ValueIntervalCollection } from '@/types/valueInterval';

interface PolicyParameterSelectorHistoricalValuesProps {
  param: Parameter;
  baseValues: ValueIntervalCollection;
  reformValues?: ValueIntervalCollection;
}

interface ParameterOverTimeChartProps {
  param: Parameter;
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
  // const { baseMap, reformMap, parameter, policy, metadata } = props;
  // const mobile = useMobile();
  // const windowHeight = useWindowHeight();

  // const paramChartWidth = useContext(ParamChartWidthContext);

  // Extend the last value to 2099 so that the line appears to extend to +inf in
  // the chart
  const extendForDisplay = (x, y) => {
    x.push('2099-12-31');
    y.push(y[y.length - 1]);
  };

  const x = baseValuesCollection.getAllStartDates();
  const y = baseValuesCollection.getAllValues();
  extendForDisplay(x, y);

  const reformedX = reformValuesCollection ? reformValuesCollection.getAllStartDates() : [];
  const reformedY = reformValuesCollection ? reformValuesCollection.getAllValues() : [];
  if (reformValuesCollection) extendForDisplay(reformedX, reformedY);

  let xaxisValues = reformedX ? x.concat(reformedX) : x;
  xaxisValues = xaxisValues.filter((e) => e !== '0000-01-01' && e < '2099-12-31');

  // xaxisValues.push(defaultStartDate);
  // This value is used for preventing the chart from expanding
  // beyond 10 years past the current date for policy changes
  // defined until "forever" (i.e., 2100-12-31)
  // xaxisValues.push(defaultPOTEndDate);
  const yaxisValues = reformedY ? y.concat(reformedY) : y;
  // const xaxisFormat = getPlotlyAxisFormat("date", xaxisValues);
  // const yaxisFormat = getPlotlyAxisFormat(param.unit, yaxisValues);

  // const customData = y.map((value) => formatVariableValue(param, value, 2));
  /*
  const reformedCustomData = reformedY.map((value) =>
    formatVariableValue(param, value, 2),
  );
  */

  return (
    <>
      <Plot
        data={[
          reformValuesCollection && {
            x: reformedX,
            y: reformedY.map((y) => +y),
            type: 'line',
            mode: 'lines+markers',
            line: {
              shape: 'hv',
              dash: 'dot',
            },
            /*
            marker: {
              color: style.colors.BLUE,
            },
            */
            // name: getReformPolicyLabel(policy),
            // customdata: reformedCustomData,
            hovertemplate: '%{x|%b, %Y}: %{customdata}<extra></extra>',
          },
          {
            x: x,
            y: y.map((y) => +y),
            type: 'line',
            mode: 'lines+markers',
            line: {
              shape: 'hv',
            },
            /*
            marker: {
              color: !reformValuesCollection
                ? style.colors.DARK_GRAY
                : style.colors.MEDIUM_LIGHT_GRAY,
            },
            */
            name: 'Current law',
            // customdata: customData,
            hovertemplate: '%{x|%b, %Y}: %{customdata}<extra></extra>',
          },
        ].filter((x) => x)}
        layout={{
          // xaxis: { ...xaxisFormat },
          // yaxis: { ...yaxisFormat },
          legend: {
            // Position above the plot
            y: 1.2,
            orientation: 'h',
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
