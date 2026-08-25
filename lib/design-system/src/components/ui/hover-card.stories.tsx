import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

const meta = {
  title: 'Components/Hover Card',
  component: HoverCard,
  tags: ['autodocs'],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Trigger: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@nextjs</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold">@nextjs</h4>
          <p className="text-sm text-muted-foreground">
            The React Framework – created and maintained by Vercel.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Open: Story = {
  render: () => (
    <HoverCard defaultOpen>
      <HoverCardTrigger asChild>
        <Button variant="link">@nextjs</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold">@nextjs</h4>
          <p className="text-sm text-muted-foreground">
            The React Framework – created and maintained by Vercel.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
