import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('axios', () => ({
  post: jest.fn(),
}));

test('renders login page', () => {
  render(<App />);
  const titleElement = screen.getByText(/welcome to annimemo/i);
  expect(titleElement).toBeInTheDocument();
});
