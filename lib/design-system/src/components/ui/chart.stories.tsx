import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from './chart';

const meta = {
  title: 'Components/Chart',
  component: ChartContainer,
  tags: ['autodocs'],
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const chartData = [
  { month: 'January', applications: 186, hires: 12 },
  { month: 'February', applications: 205, hires: 18 },
  { month: 'March', applications: 237, hires: 15 },
  { month: 'April', applications: 173, hires: 9 },
  { month: 'May', applications: 209, hires: 21 },
  { month: 'June', applications: 264, hires: 24 },
];

const chartConfig = {
  applications: {
    label: 'Applications',
    color: 'hsl(var(--chart-1))',
  },
  hires: {
    label: 'Hires',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export const Default: Story = {
  args: { config: chartConfig, children: <></> },
  render: () => (
    <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-2xl">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value: string) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="applications" fill="var(--color-applications)" radius={4} />
        <Bar dataKey="hires" fill="var(--color-hires)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};
