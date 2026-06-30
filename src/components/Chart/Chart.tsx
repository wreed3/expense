import React from 'react';
import ChartBar from './ChartBar';
import './Chart.css';

export interface DataPoint {
  label: string;
  value: number;
}

interface ChartProps {
  dataPoints: DataPoint[];
}

const Chart: React.FC<ChartProps> = ({ dataPoints }) => {
  const dataPointValues = dataPoints.map((dataPoint) => dataPoint.value);
  const totalMaximum = Math.max(...dataPointValues);

  return (
    <div className='chart'>
      {dataPoints.map((dataPoint) => (
        <ChartBar
          key={dataPoint.label}
          value={dataPoint.value}
          maxValue={totalMaximum}
          label={dataPoint.label}
        />
      ))}
    </div>
  );
};

export default Chart;