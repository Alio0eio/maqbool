import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Senior Frontend Engineer</CardTitle>
        <CardDescription>Remote &middot; Full-time &middot; Engineering</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          We&apos;re looking for a senior frontend engineer to help build our
          candidate-facing product experience. 5+ years of React experience
          and a strong eye for design required.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline">View details</Button>
        <Button>Apply now</Button>
      </CardFooter>
    </Card>
  ),
};

export const CandidateProfile: Story = {
  render: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Jordan Lee</CardTitle>
        <CardDescription>Applied for Product Designer</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Experience</span>
          <span>6 years</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Location</span>
          <span>Austin, TX</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Stage</span>
          <span>Interview scheduled</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="secondary">Reject</Button>
        <Button>Advance to offer</Button>
      </CardFooter>
    </Card>
  ),
};
