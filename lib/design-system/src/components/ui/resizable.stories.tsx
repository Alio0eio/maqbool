import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable';

const meta = {
  title: 'Components/Resizable',
  component: ResizablePanelGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { direction: 'horizontal' },
  render: () => (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-64 w-full max-w-2xl rounded-lg border"
    >
      <ResizablePanel defaultSize={35}>
        <div className="flex h-full items-center justify-center border-r p-6">
          <span className="text-sm font-medium text-muted-foreground">
            Candidate list
          </span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={65}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm font-medium text-muted-foreground">
            Candidate details
          </span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
