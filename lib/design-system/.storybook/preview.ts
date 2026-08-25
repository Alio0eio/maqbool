import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/styles.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'background',
      values: [
        { name: 'background', value: 'hsl(240 100% 99%)' },
        { name: 'dark', value: 'hsl(222 45% 10%)' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
