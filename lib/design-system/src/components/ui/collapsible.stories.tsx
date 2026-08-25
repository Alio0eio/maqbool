import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronsUpDown } from 'lucide-react';
import { Button } from './button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function CollapsibleDemo() {
      const [open, setOpen] = React.useState(false);

      return (
        <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-sm">
          <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-2">
            <span className="text-sm font-medium">
              3 more candidates in this stage
            </span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <ChevronsUpDown className="h-4 w-4" />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="flex flex-col gap-2 px-4 py-2">
            <div className="rounded-md border px-3 py-2 text-sm">Alex Rivera</div>
            <div className="rounded-md border px-3 py-2 text-sm">Sam Patel</div>
            <div className="rounded-md border px-3 py-2 text-sm">Casey Kim</div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return <CollapsibleDemo />;
  },
};
