import '@mantine/core/styles.css';

import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { store } from './store';
import { theme } from './theme';

export default function App() {
  return (
    <Provider store={store}>
      <MantineProvider theme={theme}>
        <Router />
      </MantineProvider>
    </Provider>
  );
}
