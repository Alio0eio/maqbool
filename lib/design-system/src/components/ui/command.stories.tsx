import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar as CalendarIcon, Search, Smile, User } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';

const meta = {
  title: 'Components/Command',
  component: Command,
  tags: ['autodocs'],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="w-full max-w-md rounded-lg border shadow-md">
      <CommandInput placeholder="Search candidates, jobs, or actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <CalendarIcon />
            <span>Schedule interview</span>
          </CommandItem>
          <CommandItem>
            <Search />
            <span>Search candidates</span>
          </CommandItem>
          <CommandItem>
            <Smile />
            <span>Leave feedback</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem>
            <User />
            <span>Profile</span>
            <CommandShortcut>&#8984;P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
