import React from 'react';
import { render, screen } from '@testing-library/react';

let mockProjectsData: unknown[] = [];

jest.mock('@/data/projectsData', () => {
  return {
    __esModule: true,
    get default() {
      return mockProjectsData;
    },
  };
});

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
}));

jest.mock('@bubblyclouds-app/blog/components/Card', () => ({
  __esModule: true,
  default: ({
    title,
    description,
    imgSrc,
    href,
  }: {
    title: string;
    description: string;
    imgSrc?: string;
    href?: string;
  }) => (
    <div data-testid={`card-${title}`}>
      <h3>{title}</h3>
      <p>{description}</p>
      {imgSrc && (
        <img src={imgSrc} alt={title} data-testid={`card-image-${title}`} />
      )}
      {href && (
        <a href={href} data-testid={`card-link-${title}`}>
          View Project
        </a>
      )}
    </div>
  ),
}));

import Projects from './page';

describe('Projects Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectsData = [];
  });

  it('should render projects page heading', () => {
    render(<Projects />);

    expect(
      screen.getByRole('heading', { name: /projects/i })
    ).toBeInTheDocument();
  });

  it('should display descriptive introduction text', () => {
    render(<Projects />);

    expect(
      screen.getByText(
        /This page lists my side projects worked on in my own time/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/I have more on the way soon!/)
    ).toBeInTheDocument();
  });

  it('should include link to about page', () => {
    render(<Projects />);

    expect(screen.getByTestId('link-/about')).toBeInTheDocument();
  });

  it('should render all projects from projectsData', () => {
    const mockProjects = [
      {
        title: 'Project One',
        description: 'Description one',
        imgSrc: '/image1.png',
        href: 'https://example.com/one',
      },
      {
        title: 'Project Two',
        description: 'Description two',
        imgSrc: '/image2.png',
        href: 'https://example.com/two',
      },
    ];

    mockProjectsData = mockProjects;

    render(<Projects />);

    expect(screen.getByTestId('card-Project One')).toBeInTheDocument();
    expect(screen.getByTestId('card-Project Two')).toBeInTheDocument();
  });

  it('should render correct number of project cards', () => {
    const mockProjects = Array.from({ length: 5 }, (_, i) => ({
      title: `Project ${i + 1}`,
      description: `Description ${i + 1}`,
      imgSrc: `/image${i + 1}.png`,
      href: `https://example.com/${i + 1}`,
    }));

    mockProjectsData = mockProjects;

    render(<Projects />);

    const cards = screen.getAllByTestId(/card-Project/);
    expect(cards).toHaveLength(5);
  });

  it('should handle empty projects list', () => {
    render(<Projects />);

    expect(
      screen.getByRole('heading', { name: /projects/i })
    ).toBeInTheDocument();
    const cards = screen.queryAllByTestId(/card-/);
    expect(cards).toHaveLength(0);
  });

  it('should pass project data to Card component', () => {
    const mockProject = {
      title: 'Test Project',
      description: 'Test Description',
      imgSrc: '/test.png',
      href: 'https://test.com',
    };

    mockProjectsData = [mockProject];

    render(<Projects />);

    const card = screen.getByTestId('card-Test Project');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should handle projects without href', () => {
    const mockProject = {
      title: 'No Link Project',
      description: 'This project has no link',
      imgSrc: '/image.png',
    };

    mockProjectsData = [mockProject];

    render(<Projects />);

    const card = screen.getByTestId('card-No Link Project');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('This project has no link')).toBeInTheDocument();
  });

  it('should handle projects without images', () => {
    const mockProject = {
      title: 'No Image Project',
      description: 'This project has no image',
      href: 'https://example.com',
    };

    mockProjectsData = [mockProject];

    render(<Projects />);

    const card = screen.getByTestId('card-No Image Project');
    expect(card).toBeInTheDocument();
    expect(
      screen.queryByTestId('card-image-No Image Project')
    ).not.toBeInTheDocument();
  });

  it('should display project images with correct src', () => {
    const mockProjects = [
      {
        title: 'Project with Image',
        description: 'Test',
        imgSrc: '/my-image.png',
        href: 'https://example.com',
      },
    ];

    mockProjectsData = mockProjects;

    render(<Projects />);

    const image = screen.getByTestId('card-image-Project with Image');
    expect(image).toHaveAttribute('src', '/my-image.png');
  });

  it('should display project links with correct href', () => {
    const mockProjects = [
      {
        title: 'Linked Project',
        description: 'Test',
        imgSrc: '/image.png',
        href: 'https://linked-project.com',
      },
    ];

    mockProjectsData = mockProjects;

    render(<Projects />);

    const link = screen.getByTestId('card-link-Linked Project');
    expect(link).toHaveAttribute('href', 'https://linked-project.com');
  });

  it('should have proper page structure with divider', () => {
    const { container } = render(<Projects />);

    const divider = container.querySelector('.divide-y');
    expect(divider).toBeInTheDocument();
  });

  it('should have container with proper grid layout', () => {
    const { container } = render(<Projects />);

    const gridContainer = container.querySelector('.flex.flex-wrap');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should have correct page title in heading', () => {
    render(<Projects />);

    const heading = screen.getByRole('heading', { name: 'Projects' });
    expect(heading).toHaveClass('text-3xl');
    expect(heading).toHaveClass('font-extrabold');
  });

  it('should have proper typography and spacing styles', () => {
    const { container } = render(<Projects />);

    const spaceContainer = container.querySelector('.space-y-2');
    expect(spaceContainer).toBeInTheDocument();
  });

  it('should use correct styling for about link', () => {
    render(<Projects />);

    const aboutLink = screen.getByTestId('link-/about');
    expect(aboutLink).toHaveClass('text-primary-500');
    expect(aboutLink).toHaveClass('hover:text-primary-600');
  });

  it('should use unique key for each card', () => {
    const mockProjects = [
      {
        title: 'Project A',
        description: 'Desc A',
        imgSrc: '/a.png',
        href: 'https://a.com',
      },
      {
        title: 'Project B',
        description: 'Desc B',
        imgSrc: '/b.png',
        href: 'https://b.com',
      },
      {
        title: 'Project C',
        description: 'Desc C',
        imgSrc: '/c.png',
        href: 'https://c.com',
      },
    ];

    mockProjectsData = mockProjects;

    render(<Projects />);

    const cardsA = screen.getAllByTestId('card-Project A');
    const cardsB = screen.getAllByTestId('card-Project B');
    const cardsC = screen.getAllByTestId('card-Project C');

    expect(cardsA).toHaveLength(1);
    expect(cardsB).toHaveLength(1);
    expect(cardsC).toHaveLength(1);
  });

  it('should have metadata with correct title', async () => {
    const { metadata } = await import('./page');
    expect(metadata.title).toBe('Projects');
  });

  it('should have metadata with correct description', async () => {
    const { metadata } = await import('./page');
    expect(metadata.description).toBe('My projects');
  });

  it('should render projects with long descriptions', () => {
    const longDescription =
      'This is a very long project description that spans multiple lines and contains detailed information about what the project does. '.repeat(
        3
      );

    const mockProjects = [
      {
        title: 'Complex Project',
        description: longDescription,
        imgSrc: '/image.png',
        href: 'https://example.com',
      },
    ];

    mockProjectsData = mockProjects;

    render(<Projects />);

    expect(
      screen.getByText(new RegExp(longDescription.substring(0, 50)))
    ).toBeInTheDocument();
  });

  it('should handle special characters in project titles', () => {
    const mockProjects = [
      {
        title: 'Project & Co. (Version 2.0)',
        description: 'Test',
        imgSrc: '/image.png',
        href: 'https://example.com',
      },
    ];

    mockProjectsData = mockProjects;

    render(<Projects />);

    expect(
      screen.getByTestId('card-Project & Co. (Version 2.0)')
    ).toBeInTheDocument();
  });

  it('should not import projectsData directly without mock', () => {
    const mockProjects = [
      {
        title: 'Mocked Project',
        description: 'This should be mocked',
      },
    ];

    mockProjectsData = mockProjects;

    render(<Projects />);

    expect(screen.getByTestId('card-Mocked Project')).toBeInTheDocument();
  });
});
