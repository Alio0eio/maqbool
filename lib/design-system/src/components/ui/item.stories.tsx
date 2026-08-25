import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Image as ImageIcon, MoreVertical } from 'lucide-react';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
} from './item';
import { Button } from './button';

const meta = {
  title: 'Components/Item',
  component: Item,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'muted'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ItemGroup className="w-96">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <FileText />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Resume_Ada_Lovelace.pdf</ItemTitle>
          <ItemDescription>Uploaded 2 days ago &middot; 340 KB</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreVertical />
          </Button>
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item variant="outline">
        <ItemMedia variant="icon">
          <FileText />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Cover_Letter.pdf</ItemTitle>
          <ItemDescription>Uploaded 2 days ago &middot; 88 KB</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreVertical />
          </Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  ),
};

export const MutedVariant: Story = {
  render: () => (
    <Item variant="muted" className="w-96">
      <ItemMedia variant="icon">
        <ImageIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Portfolio screenshot.png</ItemTitle>
        <ItemDescription>Attached by candidate</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <Item variant="outline" size="sm" className="w-96">
      <ItemMedia variant="icon">
        <FileText />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Offer_Letter.docx</ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button variant="ghost" size="sm">
          Download
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const ImageMedia: Story = {
  render: () => (
    <Item variant="outline" className="w-96">
      <ItemMedia variant="image">
        <img
          src="https://i.pravatar.cc/80"
          alt="Candidate avatar"
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Grace Hopper</ItemTitle>
        <ItemDescription>Backend Engineer &middot; Applied Jul 15</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithHeaderAndFooter: Story = {
  render: () => (
    <Item variant="outline" className="w-96">
      <ItemHeader>
        <ItemTitle>Interview scheduled</ItemTitle>
        <ItemDescription>Today</ItemDescription>
      </ItemHeader>
      <ItemContent>
        <ItemDescription>
          Onsite interview with the engineering team at 2:00 PM.
        </ItemDescription>
      </ItemContent>
      <ItemFooter>
        <Button variant="outline" size="sm">
          Reschedule
        </Button>
        <Button size="sm">Confirm</Button>
      </ItemFooter>
    </Item>
  ),
};
