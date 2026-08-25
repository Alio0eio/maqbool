import type { Meta, StoryObj } from '@storybook/react-vite';
import { Briefcase, LayoutDashboard, Settings, Users } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar';

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const navItems = [
  { title: 'Dashboard', icon: LayoutDashboard, isActive: true },
  { title: 'Jobs', icon: Briefcase, isActive: false },
  { title: 'Candidates', icon: Users, isActive: false },
  { title: 'Settings', icon: Settings, isActive: false },
];

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="px-2 py-1.5 text-sm font-semibold">
            Recruitment Platform
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton isActive={item.isActive}>
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="px-2 py-1.5 text-xs text-sidebar-foreground/70">
            v1.0.0
          </div>
        </SidebarFooter>
      </Sidebar>
      <main className="flex flex-1 flex-col gap-4 p-6">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back — here&apos;s a snapshot of your hiring pipeline.
        </p>
      </main>
    </SidebarProvider>
  ),
};
