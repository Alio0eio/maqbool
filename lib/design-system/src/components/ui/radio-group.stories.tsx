import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';

const meta = {
  title: 'Components/Radio Group',
  component: RadioGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="remote">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="remote" id="remote" />
        <Label htmlFor="remote">Remote</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="hybrid" id="hybrid" />
        <Label htmlFor="hybrid">Hybrid</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="onsite" id="onsite" />
        <Label htmlFor="onsite">On-site</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="full-time" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="full-time" id="full-time" />
        <Label htmlFor="full-time">Full-time</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="part-time" id="part-time" />
        <Label htmlFor="part-time">Part-time</Label>
      </div>
    </RadioGroup>
  ),
};
