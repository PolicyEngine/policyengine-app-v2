import userEvent from '@testing-library/user-event';

export * from '@testing-library/react';
export { render } from './render';
export { renderWithCountry } from './renderWithCountry';
export {
  failOnUnmockedRequests,
  fetchRespondingTo,
  takeUnmockedRequests,
  UnmockedRequestError,
  unmockedFetch,
} from './unmockedRequestGuard';
export { userEvent };
