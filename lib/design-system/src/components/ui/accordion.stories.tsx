import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { type: 'single' },
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is the recruitment platform?</AccordionTrigger>
        <AccordionContent>
          It&apos;s an end-to-end hiring tool that lets your team post jobs,
          track candidates through every stage of the pipeline, and
          collaborate on interview feedback in one place.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          How long does it take to publish a job posting?
        </AccordionTrigger>
        <AccordionContent>
          Most teams publish their first job in under five minutes. Fill in
          the role details, choose a pipeline template, and share the public
          link with candidates.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I invite other hiring managers?</AccordionTrigger>
        <AccordionContent>
          Yes. You can invite unlimited teammates as reviewers or hiring
          managers and control what each person can see or edit per job.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
