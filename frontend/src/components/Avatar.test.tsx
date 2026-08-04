import React from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';
import { AvatarStack } from './AvatarStack';

describe('Avatar and AvatarStack Components (Step UI.6)', () => {
  describe('Avatar', () => {
    it('renders initials derived from existing name field correctly', () => {
      const { rerender } = render(<Avatar name="Alice Member" />);
      expect(screen.getByText('AM')).toBeInTheDocument();

      rerender(<Avatar name="Bob" />);
      expect(screen.getByText('BO')).toBeInTheDocument();

      rerender(<Avatar name="Charlie Delta Echo" />);
      expect(screen.getByText('CE')).toBeInTheDocument();
    });

    it('renders circular shape and title attribute with fallback initials', () => {
      render(<Avatar name="Alice Smith" title="alice@example.com" size="lg" />);
      const avatarEl = screen.getByText('AS');
      expect(avatarEl).toHaveClass('rounded-full');
      expect(avatarEl).toHaveAttribute('title', 'alice@example.com');
    });
  });

  describe('AvatarStack', () => {
    it('renders overlapping avatars and "+N" overflow indicator correctly when members exceed max', () => {
      const members = [
        { id: '1', name: 'Alice Smith' },
        { id: '2', name: 'Bob Jones' },
        { id: '3', name: 'Charlie Brown' },
        { id: '4', name: 'David White' },
        { id: '5', name: 'Eve Black' },
        { id: '6', name: 'Frank Green' },
      ];

      render(<AvatarStack members={members} max={3} />);

      // First 3 should be visible
      expect(screen.getByText('AS')).toBeInTheDocument();
      expect(screen.getByText('BJ')).toBeInTheDocument();
      expect(screen.getByText('CB')).toBeInTheDocument();

      // Overflow indicator should show +3 (6 - 3 = 3)
      expect(screen.getByText('+3')).toBeInTheDocument();
    });

    it('updates dynamically when team members are added or removed (not a stale snapshot)', () => {
      const initialMembers = [
        { id: '1', name: 'Alice Smith' },
        { id: '2', name: 'Bob Jones' },
      ];

      const { rerender } = render(<AvatarStack members={initialMembers} max={4} />);

      expect(screen.getByText('AS')).toBeInTheDocument();
      expect(screen.getByText('BJ')).toBeInTheDocument();
      expect(screen.queryByText('+1')).not.toBeInTheDocument();

      // Add members dynamically
      const updatedMembers = [
        ...initialMembers,
        { id: '3', name: 'Charlie Brown' },
        { id: '4', name: 'David White' },
        { id: '5', name: 'Eve Black' },
      ];

      rerender(<AvatarStack members={updatedMembers} max={4} />);

      expect(screen.getByText('CB')).toBeInTheDocument();
      expect(screen.getByText('DW')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument(); // 5 - 4 = 1 overflow
    });
  });
});
