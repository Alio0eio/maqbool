import type { Meta, StoryObj } from '@storybook/react-vite';
import { FolderOpen, SearchX, Users } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from './empty';
import { Button } from './button';

const meta = {
  title: 'Components/Empty',
  component: Empty,
  tags: ['autodocs'],
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpen />
        </EmptyMedia>
        <EmptyTitle>No projects yet</EmptyTitle>
        <EmptyDescription>
          Get started by creating your first project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Create project</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const NoSearchResults: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription>
          Try adjusting your filters or search term.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const NoCandidates: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>No candidates in this pipeline</EmptyTitle>
        <EmptyDescription>
          Invite candidates or import a list to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button variant="outline">Import candidates</Button>
          <Button>Add candidate</Button>
        </div>
      </EmptyContent>
    </Empty>
  ),
};

export const DefaultMedia: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <FolderOpen className="size-10 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>Nothing here</EmptyTitle>
        <EmptyDescription>
          This uses the default (non-boxed) media variant.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};
