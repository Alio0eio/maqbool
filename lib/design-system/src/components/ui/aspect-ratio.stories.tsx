import type { Meta, StoryObj } from '@storybook/react-vite';
import { AspectRatio } from './aspect-ratio';

const meta = {
  title: 'Components/Aspect Ratio',
  component: AspectRatio,
  tags: ['autodocs'],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <AspectRatio ratio={16 / 9} className="flex items-center justify-center rounded-md bg-muted">
        <span className="text-sm text-muted-foreground">16 / 9</span>
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-48">
      <AspectRatio ratio={1} className="flex items-center justify-center rounded-md bg-muted">
        <span className="text-sm text-muted-foreground">1 / 1</span>
      </AspectRatio>
    </div>
  ),
};
