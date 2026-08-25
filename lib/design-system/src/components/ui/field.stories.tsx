import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
} from './field';
import { Input } from './input';
import { Checkbox } from './checkbox';

const meta = {
  title: 'Components/Field',
  component: Field,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal', 'responsive'],
    },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <FieldSet className="w-96">
      <FieldLegend>Candidate details</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="full-name">Full name</FieldLabel>
          <Input id="full-name" placeholder="Ada Lovelace" />
          <FieldDescription>As it appears on your resume.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="ada@example.com" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal" className="w-96">
      <FieldLabel htmlFor="newsletter">Subscribe to updates</FieldLabel>
      <Checkbox id="newsletter" />
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field className="w-96" data-invalid="true">
      <FieldLabel htmlFor="phone">Phone number</FieldLabel>
      <Input id="phone" placeholder="+1 (555) 000-0000" aria-invalid />
      <FieldError errors={[{ message: 'Enter a valid phone number.' }]} />
    </Field>
  ),
};

export const WithSeparator: Story = {
  render: () => (
    <div className="w-96">
      <Field>
        <FieldLabel htmlFor="sso">Continue with SSO</FieldLabel>
        <Input id="sso" placeholder="you@company.com" />
      </Field>
      <FieldSeparator>Or</FieldSeparator>
      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input id="password" type="password" />
      </Field>
    </div>
  ),
};

export const CardStyleLabel: Story = {
  render: () => (
    <div className="w-96">
      <FieldLabel htmlFor="plan-basic">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Basic plan</FieldTitle>
            <FieldDescription>
              Up to 5 job postings per month.
            </FieldDescription>
          </FieldContent>
          <Checkbox id="plan-basic" />
        </Field>
      </FieldLabel>
    </div>
  ),
};
