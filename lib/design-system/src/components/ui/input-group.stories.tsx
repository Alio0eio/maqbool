import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search, Mail, Copy } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from './input-group';

const meta = {
  title: 'Components/Input Group',
  component: InputGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupInput placeholder="Search candidates..." />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithTrailingButton: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupInput placeholder="Invite by email" type="email" />
      <InputGroupAddon align="inline-start">
        <Mail />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton>Send</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithText: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon align="inline-start">
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="yourcompany.com" />
    </InputGroup>
  ),
};

export const WithIconButtonAddon: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupInput readOnly defaultValue="https://app.hire.io/jobs/1234" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="Copy link">
          <Copy />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const Textarea: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupTextarea placeholder="Add interview notes..." />
      <InputGroupAddon align="block-end">
        <InputGroupText>0/500</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
};
