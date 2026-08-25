import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';
import { Badge } from './badge';

const meta = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const candidates = [
  { name: 'Ada Lovelace', role: 'Senior Frontend Engineer', status: 'Interview', applied: '2026-07-12' },
  { name: 'Grace Hopper', role: 'Backend Engineer', status: 'Offer', applied: '2026-07-15' },
  { name: 'Alan Turing', role: 'ML Engineer', status: 'Screening', applied: '2026-07-20' },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of recent candidates.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Applied</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((candidate) => (
          <TableRow key={candidate.name}>
            <TableCell className="font-medium">{candidate.name}</TableCell>
            <TableCell>{candidate.role}</TableCell>
            <TableCell>
              <Badge variant="outline">{candidate.status}</Badge>
            </TableCell>
            <TableCell className="text-right">{candidate.applied}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Stage</TableHead>
          <TableHead className="text-right">Candidates</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Applied</TableCell>
          <TableCell className="text-right">128</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Screening</TableCell>
          <TableCell className="text-right">42</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Interview</TableCell>
          <TableCell className="text-right">17</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell className="text-right">187</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const SelectedRow: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell className="font-medium">Ada Lovelace</TableCell>
          <TableCell>Senior Frontend Engineer</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Grace Hopper</TableCell>
          <TableCell>Backend Engineer</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
