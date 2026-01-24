import React from 'react';
import { render, screen } from '@testing-library/react';
import Privacy from './page';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

describe('Privacy Page', () => {
  describe('Page rendering', () => {
    it('should render the container with correct styling', () => {
      const { container } = render(<Privacy />);
      const mainContainer = container.querySelector('.container');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('mx-auto', 'my-10', 'max-w-xl');
    });

    it('should render the main heading', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', { name: /Bubbly Clouds Privacy Policy/i })
      ).toBeInTheDocument();
    });

    it('should render last updated date', () => {
      render(<Privacy />);
      expect(screen.getByText(/Last Updated: 2024-05-25/i)).toBeInTheDocument();
    });
  });

  describe('Introduction section', () => {
    it('should render agreement statement', () => {
      render(<Privacy />);
      expect(
        screen.getByText(
          /By using our Services, you agree that Bubbly Clouds can use your personal data/i
        )
      ).toBeInTheDocument();
    });

    it('should render DPO contact information', () => {
      render(<Privacy />);
      expect(
        screen.getByText(
          /You can contact our Data Protection Officer, James Acres/i
        )
      ).toBeInTheDocument();
    });

    it('should render contact email', () => {
      render(<Privacy />);
      const contactTexts = screen.getAllByText(/support@bubblyclouds.com/i);
      expect(contactTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Definitions', () => {
    it('should define "We" or "Bubbly Clouds"', () => {
      render(<Privacy />);
      expect(
        screen.getByText(
          /refers to James Acres and the collection of services/i
        )
      ).toBeInTheDocument();
    });

    it('should define "You"', () => {
      render(<Privacy />);
      expect(
        screen.getByText(
          /refers to any user\(s\) and customer\(s\) of our services/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Section headings', () => {
    it('should render "Who does the Privacy Policy apply to?" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', {
          name: /Who does the Privacy Policy apply to\?/i,
        })
      ).toBeInTheDocument();
    });

    it('should render "Roles and Responsibilities" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', { name: /Roles and Responsibilities/i })
      ).toBeInTheDocument();
    });

    it('should render "What Type of Personal Data" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', {
          name: /What Type of Personal Data Do We Collect about You\?/i,
        })
      ).toBeInTheDocument();
    });

    it('should render "When will we contact you?" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', { name: /When will we contact you\?/i })
      ).toBeInTheDocument();
    });

    it('should render "Data Retention Policy" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', { name: /Data Retention Policy/i })
      ).toBeInTheDocument();
    });

    it('should render "Managing Your Data" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', { name: /Managing Your Data/i })
      ).toBeInTheDocument();
    });

    it('should render "Security and Integrity" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', {
          name: /Security and Integrity of your Personal Data/i,
        })
      ).toBeInTheDocument();
    });

    it('should render "Third Parties" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', { name: /Third Parties/i })
      ).toBeInTheDocument();
    });

    it('should render "Cookies" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', { name: /Cookies/i })
      ).toBeInTheDocument();
    });

    it('should render "Sensitive Information" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', { name: /Sensitive Information/i })
      ).toBeInTheDocument();
    });

    it('should render "Children\'s Online Privacy Protection" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', {
          name: /Children's Online Privacy Protection/i,
        })
      ).toBeInTheDocument();
    });

    it('should render "Amendments" section', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', { name: /Amendments to this document/i })
      ).toBeInTheDocument();
    });
  });

  describe('Responsibilities subsections', () => {
    it('should render Bubbly Clouds Responsibilities', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', {
          level: 5,
          name: /Bubbly Clouds Responsibilities/i,
        })
      ).toBeInTheDocument();
    });

    it('should render Customer Responsibilities', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', {
          level: 5,
          name: /Customer Responsibilities/i,
        })
      ).toBeInTheDocument();
    });
  });

  describe('Data types table', () => {
    it('should render data types table', () => {
      const { container } = render(<Privacy />);
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass(
        'table-auto',
        'border-separate',
        'border-spacing-8'
      );
    });

    it('should have table headers', () => {
      const { container } = render(<Privacy />);
      const table = container.querySelector('table');
      expect(table?.querySelector('th')).toHaveTextContent(
        /Type of Personal Data/i
      );
      expect(
        screen.getByText(/Purpose\(s\) for Processing/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Legal Basis for Processing/i)
      ).toBeInTheDocument();
    });

    it('should list Identity Data', () => {
      render(<Privacy />);
      expect(screen.getByText(/Identity Data/i)).toBeInTheDocument();
    });

    it('should list Contact Data', () => {
      render(<Privacy />);
      expect(screen.getByText(/Contact Data/i)).toBeInTheDocument();
    });

    it('should list Financial Data', () => {
      render(<Privacy />);
      expect(screen.getByText(/Financial Data/i)).toBeInTheDocument();
    });

    it('should list Marketing and Communications Data', () => {
      render(<Privacy />);
      expect(
        screen.getByText(/Marketing and Communications Data/i)
      ).toBeInTheDocument();
    });

    it('should list Transaction Data', () => {
      render(<Privacy />);
      expect(screen.getByText(/Transaction Data/i)).toBeInTheDocument();
    });

    it('should list Technical Data', () => {
      render(<Privacy />);
      expect(screen.getByText(/Technical Data/i)).toBeInTheDocument();
    });

    it('should list Usage Data', () => {
      render(<Privacy />);
      expect(screen.getByText(/Usage Data/i)).toBeInTheDocument();
    });
  });

  describe('Terms of Service links', () => {
    it('should render Terms of Service links', () => {
      render(<Privacy />);
      const termsLinks = screen.getAllByRole('link', {
        name: /Terms of Service|Terms of Use/i,
      });
      expect(termsLinks.length).toBeGreaterThanOrEqual(1);
      termsLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', 'terms');
      });
    });

    it('should render Privacy Policy self-references', () => {
      render(<Privacy />);
      const privacyLinks = screen.getAllByRole('link', {
        name: /Privacy Policy/i,
      });
      expect(privacyLinks.length).toBeGreaterThanOrEqual(1);
      privacyLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', 'privacy');
      });
    });
  });

  describe('Data breach notification', () => {
    it('should mention 72-hour breach notification', () => {
      render(<Privacy />);
      expect(
        screen.getByText(
          /Within 72 hours of becoming aware of a personal data breach/i
        )
      ).toBeInTheDocument();
    });

    it('should mention ICO notification', () => {
      render(<Privacy />);
      expect(screen.getByText(/notify the UK's ICO/i)).toBeInTheDocument();
    });
  });

  describe('Data retention', () => {
    it('should mention customer data retention', () => {
      render(<Privacy />);
      expect(
        screen.getByText(/on termination of contract/i)
      ).toBeInTheDocument();
    });

    it('should mention backup retention', () => {
      render(<Privacy />);
      expect(
        screen.getByText(/We keep backups to help us to restore/i)
      ).toBeInTheDocument();
    });

    it('should mention financial records retention', () => {
      render(<Privacy />);
      expect(
        screen.getByText(/We must legally keep financial records for 6 years/i)
      ).toBeInTheDocument();
    });
  });

  describe('User data rights', () => {
    it('should mention access and rectify rights', () => {
      render(<Privacy />);
      expect(
        screen.getByText(
          /You can access and rectify the majority of your personal information/i
        )
      ).toBeInTheDocument();
    });

    it('should mention data export and portability', () => {
      render(<Privacy />);
      expect(
        screen.getByText(
          /We can generate a report to provide your account data in JSON format/i
        )
      ).toBeInTheDocument();
    });

    it('should mention erasure rights', () => {
      render(<Privacy />);
      expect(
        screen.getByText(
          /We will respond to all requests to erase data within one month/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Security measures', () => {
    it('should mention encryption', () => {
      render(<Privacy />);
      expect(
        screen.getByText(
          /Your personal information will be transmitted over an secure encrypted connection/i
        )
      ).toBeInTheDocument();
    });

    it('should mention web application firewalls', () => {
      render(<Privacy />);
      expect(
        screen.getByText(/We use web application firewalls/i)
      ).toBeInTheDocument();
    });

    it('should mention 2 factor authentication', () => {
      render(<Privacy />);
      expect(
        screen.getByText(/we use 2 factor on all services which support it/i)
      ).toBeInTheDocument();
    });

    it('should mention UK data location', () => {
      render(<Privacy />);
      expect(
        screen.getByText(/All our databases are located in the UK/i)
      ).toBeInTheDocument();
    });
  });

  describe('Third party services', () => {
    it('should mention Stripe', () => {
      render(<Privacy />);
      expect(screen.getByText(/Stripe/i)).toBeInTheDocument();
    });

    it('should mention PayPal', () => {
      render(<Privacy />);
      expect(screen.getByText(/PayPal/i)).toBeInTheDocument();
    });
  });

  describe('Cookies section', () => {
    it('should have essential cookies subsection', () => {
      render(<Privacy />);
      expect(
        screen.getByRole('heading', {
          level: 5,
          name: /Essential; i.e. required to make the website work/i,
        })
      ).toBeInTheDocument();
    });

    it('should have non-essential cookies subsection', () => {
      render(<Privacy />);
      const headings = screen.getAllByRole('heading', { level: 5 });
      const nonEssentialHeading = headings.find((h) =>
        h.textContent?.includes('Non-essential')
      );
      expect(nonEssentialHeading).toBeInTheDocument();
    });

    it('should mention Google Analytics', () => {
      render(<Privacy />);
      expect(screen.getAllByText(/Google Analytics/i).length).toBeGreaterThan(
        0
      );
    });

    it('should render Google Analytics link', () => {
      render(<Privacy />);
      const gaLink = screen.getByRole('link', {
        name: /Google privacy site/i,
      });
      expect(gaLink).toHaveAttribute(
        'href',
        'https://support.google.com/analytics/answer/6004245'
      );
      expect(gaLink).toHaveAttribute('target', '_blank');
    });

    it('should mention IP Anonymization', () => {
      render(<Privacy />);
      const ipLink = screen.getByRole('link', { name: /IP Anonymization/i });
      expect(ipLink).toHaveAttribute(
        'href',
        'https://support.google.com/analytics/answer/2763052'
      );
    });
  });

  describe("Children's privacy", () => {
    it('should mention age restriction of 13 years', () => {
      render(<Privacy />);
      expect(
        screen.getByText(/If you are under thirteen \(13\) years of age/i)
      ).toBeInTheDocument();
    });

    it("should prohibit collecting children's data", () => {
      render(<Privacy />);
      expect(
        screen.getByText(
          /you must not intentionally collect or maintain the data of anyone under thirteen/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Horizontal rules', () => {
    it('should contain horizontal rules for section separation', () => {
      const { container } = render(<Privacy />);
      const hrs = container.querySelectorAll('hr');
      expect(hrs.length).toBeGreaterThan(5);
      hrs.forEach((hr) => {
        expect(hr).toHaveClass('my-8');
      });
    });
  });

  describe('Component structure', () => {
    it('should be a function component', () => {
      expect(typeof Privacy).toBe('function');
    });

    it('should render without crashing', () => {
      expect(() => render(<Privacy />)).not.toThrow();
    });

    it('should have main container', () => {
      const { container } = render(<Privacy />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('should have h1 heading with correct styling', () => {
      const { container } = render(<Privacy />);
      const h1 = container.querySelector('h1');
      expect(h1).toHaveClass('mt-4', 'text-lg');
    });

    it('should have paragraphs with spacing', () => {
      const { container } = render(<Privacy />);
      const paragraphs = container.querySelectorAll('p.my-8');
      expect(paragraphs.length).toBeGreaterThan(20);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Privacy />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(10);
    });

    it('should have descriptive link text', () => {
      render(<Privacy />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('should have table with proper structure', () => {
      const { container } = render(<Privacy />);
      const table = container.querySelector('table');
      expect(table?.querySelector('thead')).toBeInTheDocument();
      expect(table?.querySelector('tbody')).toBeInTheDocument();
    });
  });

  describe('Content validation', () => {
    it('should contain all expected privacy sections', () => {
      const { container } = render(<Privacy />);
      expect(container.textContent).toContain('Data Protection Officer');
      expect(container.textContent).toContain('Roles and Responsibilities');
      expect(container.textContent).toContain('Personal Data');
      expect(container.textContent).toContain('Data Retention');
      expect(container.textContent).toContain('Managing Your Data');
      expect(container.textContent).toContain('Security');
      expect(container.textContent).toContain('Cookies');
    });

    it('should contain GDPR-related content', () => {
      const { container } = render(<Privacy />);
      expect(container.textContent).toContain('data controller');
      expect(container.textContent).toContain('data processor');
      expect(container.textContent).toContain('legal basis');
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(<Privacy />);
      expect(container).toMatchSnapshot();
    });
  });
});
