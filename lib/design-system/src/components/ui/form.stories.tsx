import type { Meta, StoryObj } from '@storybook/react-vite';
import { useForm } from 'react-hook-form';
import { Button } from './button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';

const meta = {
  title: 'Components/Form',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type ProfileFormValues = {
  username: string;
};

export const Default: Story = {
  render: () => {
    function ProfileForm() {
      const form = useForm<ProfileFormValues>({
        defaultValues: { username: '' },
      });

      function onSubmit(values: ProfileFormValues) {
        // eslint-disable-next-line no-console
        console.log(values);
      }

      return (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full max-w-sm space-y-6"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="jordan.lee" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the name recruiters will see on your candidate
                    profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save changes</Button>
          </form>
        </Form>
      );
    }

    return <ProfileForm />;
  },
};
