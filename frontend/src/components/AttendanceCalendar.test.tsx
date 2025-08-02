import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AttendanceCalendar from './AttendanceCalendar';

// Mocking fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ attendance: [] }),
  })
);

// Mocking localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
    removeItem(key: string) {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AttendanceCalendar', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    (fetch as jest.Mock).mockClear();
    localStorage.clear();
    // Set a fake token for a logged-in user
    const fakeToken = "header." + btoa(JSON.stringify({ userId: 'test-user-id' })) + ".signature";
    localStorage.setItem('token', fakeToken);
  });

  it('renders days of the week when logged in', async () => {
    // Use `act` to handle state updates from useEffect
    await act(async () => {
      render(<AttendanceCalendar onMonthChange={() => {}} />);
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('renders nothing when not logged in', async () => {
    localStorage.clear(); // Ensure no user is logged in
    
    const { container } = render(<AttendanceCalendar onMonthChange={() => {}} />);

    // The component should render null, so the container should be empty
    expect(container.firstChild).toBeNull();
  });
}); 