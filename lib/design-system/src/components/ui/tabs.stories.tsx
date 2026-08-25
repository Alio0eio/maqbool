import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="resume">Resume</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <p className="text-sm text-muted-foreground">
          Candidate profile details, contact info, and application source.
        </p>
      </TabsContent>
      <TabsContent value="resume">
        <p className="text-sm text-muted-foreground">
          Uploaded resume and parsed skills go here.
        </p>
      </TabsContent>
      <TabsContent value="notes">
        <p className="text-sm text-muted-foreground">
          Interviewer notes and feedback for this candidate.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="archived" disabled>
          Archived
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <p className="text-sm text-muted-foreground">
          Showing active job postings.
        </p>
      </TabsContent>
      <TabsContent value="archived">
        <p className="text-sm text-muted-foreground">
          Archived postings are hidden by default.
        </p>
      </TabsContent>
    </Tabs>
  ),
};
