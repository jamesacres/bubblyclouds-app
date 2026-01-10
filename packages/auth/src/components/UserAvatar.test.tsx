import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from './UserAvatar';
import type { UserProfile } from '@bubblyclouds-app/types/userProfile';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

jest.mock('react-feather', () => ({
  User: ({ className, style }: any) => (
    <div data-testid="user-icon" className={className} style={style} />
  ),
}));

describe('UserAvatar', () => {
  const mockUser: UserProfile = {
    sub: 'test-user-id',
    name: 'John Doe',
    given_name: 'John',
    family_name: 'Doe',
    picture: 'https://example.com/avatar.jpg',
  };

  const mockUserNoPicture: UserProfile = {
    sub: 'test-user-id-2',
    name: 'Jane Smith',
    given_name: 'Jane',
    family_name: 'Smith',
  };

  describe('rendering with picture', () => {
    it('should render user image when picture is provided', () => {
      render(<UserAvatar user={mockUser} size={64} />);
      const image = screen.getByAltText('John Doe') as HTMLImageElement;
      expect(image).toBeInTheDocument();
    });

    it('should display correct image URL', () => {
      render(<UserAvatar user={mockUser} size={64} />);
      const image = screen.getByAltText('John Doe') as HTMLImageElement;
      expect(image.src).toBe('https://example.com/avatar.jpg');
    });

    it('should use user name as alt text', () => {
      render(<UserAvatar user={mockUser} size={64} />);
      const image = screen.getByAltText('John Doe');
      expect(image).toBeInTheDocument();
    });

    it('should set correct width and height for image', () => {
      render(<UserAvatar user={mockUser} size={64} />);
      const image = screen.getByAltText('John Doe') as HTMLImageElement;
      expect(image.width).toBe(64);
      expect(image.height).toBe(64);
    });

    it('should have rounded-full class on image', () => {
      render(<UserAvatar user={mockUser} size={64} />);
      const image = screen.getByAltText('John Doe');
      expect(image).toHaveClass('overflow-hidden');
      expect(image).toHaveClass('rounded-full');
    });

    it('should set correct size when no ring is shown', () => {
      render(<UserAvatar user={mockUser} size={32} />);
      const image = screen.getByAltText('John Doe') as HTMLImageElement;
      expect(image.width).toBe(32);
      expect(image.height).toBe(32);
    });
  });

  describe('rendering without picture', () => {
    it('should render fallback icon when picture is not provided', () => {
      render(<UserAvatar user={mockUserNoPicture} size={64} />);
      const icon = screen.getByTestId('user-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should render div with theme color as background', () => {
      const { container } = render(
        <UserAvatar user={mockUserNoPicture} size={64} />
      );
      const div = container.querySelector('.bg-theme-primary');
      expect(div).toBeInTheDocument();
    });

    it('should render user icon with correct styling', () => {
      render(<UserAvatar user={mockUserNoPicture} size={64} />);
      const icon = screen.getByTestId('user-icon');
      expect(icon).toHaveClass('text-white');
    });

    it('should center icon properly', () => {
      const { container } = render(
        <UserAvatar user={mockUserNoPicture} size={64} />
      );
      const div = container.querySelector('.bg-theme-primary');
      expect(div).toHaveClass('flex');
      expect(div).toHaveClass('items-center');
      expect(div).toHaveClass('justify-center');
    });

    it('should have rounded-full class on fallback container', () => {
      const { container } = render(
        <UserAvatar user={mockUserNoPicture} size={64} />
      );
      const div = container.querySelector('.bg-theme-primary');
      expect(div).toHaveClass('rounded-full');
    });

    it('should set correct icon size based on avatar size', () => {
      const { rerender } = render(
        <UserAvatar user={mockUserNoPicture} size={64} />
      );
      let icon = screen.getByTestId('user-icon');
      expect(icon).toHaveStyle({ height: '38.4px', width: '38.4px' });

      rerender(<UserAvatar user={mockUserNoPicture} size={32} />);
      icon = screen.getByTestId('user-icon');
      expect(icon).toHaveStyle({ height: '19.2px', width: '19.2px' });
    });

    it('should set correct container dimensions', () => {
      const { container } = render(
        <UserAvatar user={mockUserNoPicture} size={64} />
      );
      const div = container.querySelector(
        '.bg-theme-primary'
      ) as HTMLDivElement;
      expect(div.style.height).toBe('64px');
      expect(div.style.width).toBe('64px');
    });
  });

  describe('ring variant rendering', () => {
    it('should render ring container when showRing is true', () => {
      const { container } = render(
        <UserAvatar user={mockUser} size={64} showRing={true} />
      );
      const ringDiv = container.querySelector('.bg-gradient-to-r');
      expect(ringDiv).toBeInTheDocument();
    });

    it('should have gradient background for ring', () => {
      const { container } = render(
        <UserAvatar user={mockUser} size={64} showRing={true} />
      );
      const ringDiv = container.querySelector('.bg-gradient-to-r');
      expect(ringDiv).toHaveClass('from-blue-500');
      expect(ringDiv).toHaveClass('via-red-500');
      expect(ringDiv).toHaveClass('via-yellow-500');
      expect(ringDiv).toHaveClass('to-green-500');
    });

    it('should have correct ring dimensions with padding', () => {
      const { container } = render(
        <UserAvatar user={mockUser} size={64} showRing={true} />
      );
      const ringDiv = container.querySelector(
        '.bg-gradient-to-r'
      ) as HTMLDivElement;
      expect(ringDiv.style.height).toBe('68px');
      expect(ringDiv.style.width).toBe('68px');
    });

    it('should have rounded-full class on ring', () => {
      const { container } = render(
        <UserAvatar user={mockUser} size={64} showRing={true} />
      );
      const ringDiv = container.querySelector('.bg-gradient-to-r');
      expect(ringDiv).toHaveClass('rounded-full');
    });

    it('should have padding on ring', () => {
      const { container } = render(
        <UserAvatar user={mockUser} size={64} showRing={true} />
      );
      const ringDiv = container.querySelector('.bg-gradient-to-r');
      expect(ringDiv).toHaveClass('p-0.5');
    });

    it('should render inner container with dark mode background', () => {
      const { container } = render(
        <UserAvatar user={mockUser} size={64} showRing={true} />
      );
      const innerDiv = container.querySelector('.bg-white');
      expect(innerDiv).toBeInTheDocument();
      expect(innerDiv).toHaveClass('dark:bg-gray-800');
    });

    it('should center content in ring', () => {
      const { container } = render(
        <UserAvatar user={mockUser} size={64} showRing={true} />
      );
      const innerDiv = container.querySelector('.bg-white');
      expect(innerDiv).toHaveClass('flex');
      expect(innerDiv).toHaveClass('items-center');
      expect(innerDiv).toHaveClass('justify-center');
    });

    it('should have rounded-full on inner container', () => {
      const { container } = render(
        <UserAvatar user={mockUser} size={64} showRing={true} />
      );
      const innerDiv = container.querySelector('.bg-white');
      expect(innerDiv).toHaveClass('rounded-full');
    });

    it('should have padding on inner container', () => {
      const { container } = render(
        <UserAvatar user={mockUser} size={64} showRing={true} />
      );
      const innerDiv = container.querySelector('.bg-white');
      expect(innerDiv).toHaveClass('p-0.5');
    });

    it('should render image with reduced size inside ring', () => {
      render(<UserAvatar user={mockUser} size={64} showRing={true} />);
      const image = screen.getByAltText('John Doe') as HTMLImageElement;
      expect(image.width).toBe(60);
      expect(image.height).toBe(60);
    });

    it('should render fallback icon with reduced size inside ring', () => {
      render(<UserAvatar user={mockUserNoPicture} size={64} showRing={true} />);
      const icon = screen.getByTestId('user-icon');
      expect(icon).toHaveStyle({ height: '36px', width: '36px' });
    });
  });

  describe('sizing', () => {
    it('should handle small size correctly', () => {
      render(<UserAvatar user={mockUser} size={24} />);
      const image = screen.getByAltText('John Doe') as HTMLImageElement;
      expect(image.width).toBe(24);
      expect(image.height).toBe(24);
    });

    it('should handle medium size correctly', () => {
      render(<UserAvatar user={mockUser} size={48} />);
      const image = screen.getByAltText('John Doe') as HTMLImageElement;
      expect(image.width).toBe(48);
      expect(image.height).toBe(48);
    });

    it('should handle large size correctly', () => {
      render(<UserAvatar user={mockUser} size={128} />);
      const image = screen.getByAltText('John Doe') as HTMLImageElement;
      expect(image.width).toBe(128);
      expect(image.height).toBe(128);
    });

    it('should scale icon size proportionally with avatar size', () => {
      const { rerender } = render(
        <UserAvatar user={mockUserNoPicture} size={100} />
      );
      let icon = screen.getByTestId('user-icon');
      expect(icon).toHaveStyle({ height: '60px', width: '60px' });

      rerender(<UserAvatar user={mockUserNoPicture} size={50} />);
      icon = screen.getByTestId('user-icon');
      expect(icon).toHaveStyle({ height: '30px', width: '30px' });
    });
  });

  describe('default props', () => {
    it('should not show ring by default', () => {
      const { container } = render(<UserAvatar user={mockUser} size={64} />);
      const ringDiv = container.querySelector('.bg-gradient-to-r');
      expect(ringDiv).not.toBeInTheDocument();
    });

    it('should render image directly without ring wrapper by default', () => {
      render(<UserAvatar user={mockUser} size={64} />);
      const image = screen.getByAltText('John Doe');
      expect(image).toBeInTheDocument();
    });

    it('should use default alt text when no ring', () => {
      render(<UserAvatar user={mockUser} size={64} />);
      const image = screen.getByAltText('John Doe');
      expect(image).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty name gracefully', () => {
      const userWithoutName: UserProfile = {
        sub: 'test-id',
        picture: 'https://example.com/avatar.jpg',
      };
      render(<UserAvatar user={userWithoutName} size={64} />);
      const image = screen.getByAltText('user');
      expect(image).toBeInTheDocument();
    });

    it('should use "user" as fallback alt text when name is empty', () => {
      const userWithoutName: UserProfile = {
        sub: 'test-id',
        picture: 'https://example.com/avatar.jpg',
      };
      render(<UserAvatar user={userWithoutName} size={64} />);
      const image = screen.getByAltText('user');
      expect(image).toBeInTheDocument();
    });

    it('should handle zero size gracefully', () => {
      render(<UserAvatar user={mockUser} size={0} />);
      const image = screen.getByAltText('John Doe') as HTMLImageElement;
      expect(image.width).toBe(0);
      expect(image.height).toBe(0);
    });

    it('should handle very large size', () => {
      render(<UserAvatar user={mockUser} size={1024} />);
      const image = screen.getByAltText('John Doe') as HTMLImageElement;
      expect(image.width).toBe(1024);
      expect(image.height).toBe(1024);
    });
  });

  describe('accessibility', () => {
    it('should provide alt text for images', () => {
      render(<UserAvatar user={mockUser} size={64} />);
      const image = screen.getByAltText('John Doe');
      expect(image).toBeInTheDocument();
    });

    it('should use semantic alt text with user name', () => {
      render(<UserAvatar user={mockUser} size={64} />);
      const image = screen.getByAltText('John Doe');
      expect(image.getAttribute('alt')).toBe('John Doe');
    });

    it('should render fallback icon when picture unavailable', () => {
      render(<UserAvatar user={mockUserNoPicture} size={64} />);
      const icon = screen.getByTestId('user-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('prop variations', () => {
    it('should accept showRing as optional prop', () => {
      const { container } = render(
        <UserAvatar user={mockUser} size={64} showRing={false} />
      );
      const ringDiv = container.querySelector('.bg-gradient-to-r');
      expect(ringDiv).not.toBeInTheDocument();
    });

    it('should render correctly with all props', () => {
      render(<UserAvatar user={mockUser} size={64} showRing={true} />);
      expect(screen.getByAltText('John Doe')).toBeInTheDocument();
    });

    it('should handle different user profiles consistently', () => {
      const users = [
        {
          sub: '1',
          name: 'User One',
          picture: 'https://example.com/1.jpg',
        },
        {
          sub: '2',
          name: 'User Two',
          picture: 'https://example.com/2.jpg',
        },
        {
          sub: '3',
          name: 'User Three',
        },
      ];

      users.forEach((user) => {
        const { unmount } = render(<UserAvatar user={user} size={64} />);
        if (user.picture) {
          expect(screen.getByAltText(user.name || 'user')).toBeInTheDocument();
        } else {
          expect(screen.getByTestId('user-icon')).toBeInTheDocument();
        }
        unmount();
      });
    });
  });
});
