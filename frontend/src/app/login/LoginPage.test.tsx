import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';

const mockPush = jest.fn();
const mockLogin = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('LoginPage Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email input, password input, and Sign In button', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign In/i })
    ).toBeInTheDocument();
  });

  it('displays validation error if email or password is empty on submit', async () => {
    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Please enter both email and password/i)
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login and redirects to /dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'Secret123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'user@example.com',
        'Secret123!'
      );
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error banner when login fails', async () => {
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: 'Invalid email or password',
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(
      await screen.findByText(/Invalid email or password/i)
    ).toBeInTheDocument();
  });
});
