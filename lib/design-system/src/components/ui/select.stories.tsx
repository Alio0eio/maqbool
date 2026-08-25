import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="frontend">Frontend Engineer</SelectItem>
        <SelectItem value="backend">Backend Engineer</SelectItem>
        <SelectItem value="fullstack">Full-stack Engineer</SelectItem>
        <SelectItem value="designer">Product Designer</SelectItem>
        <SelectItem value="recruiter">Technical Recruiter</SelectItem>
      </SelectContent>
    </Select>
  ),
};
