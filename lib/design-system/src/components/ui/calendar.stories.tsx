import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from './calendar';

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Calendar mode="single" className="rounded-md border" />,
};

export const WithSelectedDate: Story = {
  render: () => {
    function InterviewDatePicker() {
      const [date, setDate] = React.useState<Date | undefined>(new Date());

      return (
        <div className="flex flex-col items-center gap-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          <p className="text-sm text-muted-foreground">
            Interview scheduled for{' '}
            {date ? date.toLocaleDateString() : 'no date selected'}
          </p>
        </div>
      );
    }

    return <InterviewDatePicker />;
  },
};
