import type { Meta, StoryObj } from '@storybook/react-vite';
import { useToast } from '../../hooks/use-toast';
import { Button } from './button';
import { Toaster } from './toaster';

const meta = {
  title: 'Components/Toaster',
  component: Toaster,
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToasterDemo() {
  const { toast } = useToast();

  return (
    <>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: 'Scheduled: Catch up',
            description: 'Friday, February 10, 2023 at 5:57 PM',
          })
        }
      >
        Show toast
      </Button>
      <Toaster />
    </>
  );
}

export const Default: Story = {
  render: () => <ToasterDemo />,
};
