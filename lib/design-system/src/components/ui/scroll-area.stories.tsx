import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from './scroll-area';
import { Separator } from './separator';

const meta = {
  title: 'Components/Scroll Area',
  component: ScrollArea,
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const candidates = Array.from({ length: 15 }, (_, i) => `Candidate ${i + 1}`);

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-72 w-64 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Candidates</h4>
        {candidates.map((name) => (
          <div key={name}>
            <div className="text-sm py-2">{name}</div>
            <Separator className="my-0" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const HorizontalTags: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max gap-3 p-4">
        {[
          'React',
          'TypeScript',
          'Node.js',
          'GraphQL',
          'PostgreSQL',
          'Docker',
          'AWS',
          'Kubernetes',
        ].map((tag) => (
          <div
            key={tag}
            className="flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-medium"
          >
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
