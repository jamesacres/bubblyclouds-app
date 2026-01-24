import React from 'react';
import { render, screen } from '@testing-library/react';
import Terms from './page';

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

describe('Terms Page', () => {
  describe('Page rendering', () => {
    it('should render the container with correct styling', () => {
      const { container } = render(<Terms />);
      const mainContainer = container.querySelector('.container');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('mx-auto', 'my-10', 'max-w-xl');
    });

    it('should render the main heading', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Bubbly Clouds Terms of Service/i })
      ).toBeInTheDocument();
    });

    it('should render last updated date', () => {
      render(<Terms />);
      expect(screen.getByText(/Last Updated: 2024-05-25/i)).toBeInTheDocument();
    });
  });

  describe('Apple App Store reference', () => {
    it('should render Apple terms reference', () => {
      render(<Terms />);
      expect(
        screen.getByText(
          /If the app we developed is downloaded from Apple App Store/i
        )
      ).toBeInTheDocument();
    });

    it('should render Apple EULA link', () => {
      render(<Terms />);
      const appleLink = screen.getByRole('link', {
        name: /https:\/\/www\.apple\.com\/legal\/internet-services\/itunes\/dev\/stdeula\//,
      });
      expect(appleLink).toHaveAttribute(
        'href',
        'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
      );
    });
  });

  describe('Definitions section', () => {
    it('should define "We" or "Bubbly Clouds"', () => {
      render(<Terms />);
      expect(
        screen.getByText(
          /refers to James Acres and the collection of services/i
        )
      ).toBeInTheDocument();
    });

    it('should define "You"', () => {
      render(<Terms />);
      expect(
        screen.getByText(
          /refers to any user\(s\) and customer\(s\) of our services/i
        )
      ).toBeInTheDocument();
    });

    it('should mention UK Legislation', () => {
      render(<Terms />);
      expect(
        screen.getByText(/you also agree to abide by all UK Legislation/i)
      ).toBeInTheDocument();
    });
  });

  describe('Section headings', () => {
    it('should render Contract section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Contract/i })
      ).toBeInTheDocument();
    });

    it('should render Payment section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Payment/i })
      ).toBeInTheDocument();
    });

    it('should render Your Personal Information section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Your Personal Information/i })
      ).toBeInTheDocument();
    });

    it('should render Acceptable Use section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Acceptable Use/i })
      ).toBeInTheDocument();
    });

    it('should render Uptime, Data and Security section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Uptime, Data and Security/i })
      ).toBeInTheDocument();
    });

    it('should render Support section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Support/i })
      ).toBeInTheDocument();
    });

    it('should render External Links and Services section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /External Links and Services/i })
      ).toBeInTheDocument();
    });

    it('should render Your data protection rights section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Your data protection rights/i })
      ).toBeInTheDocument();
    });

    it('should render Refunds section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Refunds/i })
      ).toBeInTheDocument();
    });

    it('should render Enforcement section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Enforcement of these terms/i })
      ).toBeInTheDocument();
    });

    it('should render Amendments section', () => {
      render(<Terms />);
      expect(
        screen.getByRole('heading', { name: /Amendments to this document/i })
      ).toBeInTheDocument();
    });
  });

  describe('Contract terms', () => {
    it('should mention subscription auto-renewal', () => {
      render(<Terms />);
      expect(
        screen.getByText(
          /it will automatically renew at the end of the time period/i
        )
      ).toBeInTheDocument();
    });

    it('should mention account termination process', () => {
      render(<Terms />);
      expect(
        screen.getByText(
          /submitting a support request to support@bubblyclouds.com/i
        )
      ).toBeInTheDocument();
    });

    it('should mention termination notice period', () => {
      render(<Terms />);
      expect(
        screen.getByText(/at least 7 days before the end of your contract/i)
      ).toBeInTheDocument();
    });
  });

  describe('Payment terms', () => {
    it('should mention free services availability', () => {
      render(<Terms />);
      expect(
        screen.getByText(/Many of our services are available for free/i)
      ).toBeInTheDocument();
    });

    it('should mention payment methods', () => {
      render(<Terms />);
      expect(
        screen.getByText(/PayPal or Credit\/Debit card payment via Stripe/i)
      ).toBeInTheDocument();
    });

    it('should mention chargeback administration fee', () => {
      render(<Terms />);
      expect(
        screen.getByText(/£20 administration charge/i)
      ).toBeInTheDocument();
    });
  });

  describe('Privacy Policy links', () => {
    it('should render Privacy Policy links', () => {
      render(<Terms />);
      const privacyLinks = screen.getAllByRole('link', {
        name: /Privacy Policy/i,
      });
      expect(privacyLinks.length).toBeGreaterThanOrEqual(2);
      privacyLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', 'privacy');
      });
    });
  });

  describe('Support information', () => {
    it('should mention support email', () => {
      render(<Terms />);
      const supportEmails = screen.getAllByText(/support@bubblyclouds.com/i);
      expect(supportEmails.length).toBeGreaterThan(0);
    });

    it('should mention 24 hour response aim', () => {
      render(<Terms />);
      expect(
        screen.getByText(
          /We aim to respond to support requests within 24 hours/i
        )
      ).toBeInTheDocument();
    });

    it('should mention no phone support', () => {
      render(<Terms />);
      expect(
        screen.getByText(/We do not provide phone support/i)
      ).toBeInTheDocument();
    });
  });

  describe('Refund policy', () => {
    it('should mention 30-day money back guarantee', () => {
      render(<Terms />);
      expect(
        screen.getByText(/30-Day Money Back Guarantee Period/i)
      ).toBeInTheDocument();
    });

    it('should mention domain registration non-refundable', () => {
      render(<Terms />);
      expect(
        screen.getByText(
          /Domain Registration or Domain Transfer Charges will not be refunded/i
        )
      ).toBeInTheDocument();
    });

    it('should mention no early termination refunds', () => {
      render(<Terms />);
      expect(
        screen.getByText(/We do not offer refunds for ending contracts early/i)
      ).toBeInTheDocument();
    });
  });

  describe('External links', () => {
    it('should render UK legislation link', () => {
      render(<Terms />);
      const ukLink = screen.getByRole('link', {
        name: /http:\/\/www\.legislation\.gov\.uk\//,
      });
      expect(ukLink).toHaveAttribute('href', 'http://www.legislation.gov.uk/');
      expect(ukLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Lists and structure', () => {
    it('should contain unordered lists', () => {
      const { container } = render(<Terms />);
      const lists = container.querySelectorAll('ul');
      expect(lists.length).toBeGreaterThan(10);
    });

    it('should have list items with correct styling', () => {
      const { container } = render(<Terms />);
      const firstList = container.querySelector('ul');
      expect(firstList).toHaveClass('my-8', 'list-inside', 'list-disc');
    });

    it('should have list items with spacing', () => {
      const { container } = render(<Terms />);
      const listItems = container.querySelectorAll('li');
      listItems.forEach((item) => {
        expect(item).toHaveClass('my-8');
      });
    });
  });

  describe('GDPR compliance', () => {
    it('should mention GDPR compliance', () => {
      render(<Terms />);
      expect(
        screen.getByText(/EU General Data Protection Regulation \(GDPR\)/i)
      ).toBeInTheDocument();
    });

    it('should mention data export capability', () => {
      render(<Terms />);
      expect(
        screen.getByText(
          /You can request to be sent an export of the personal information/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Horizontal rules', () => {
    it('should contain horizontal rules for section separation', () => {
      const { container } = render(<Terms />);
      const hrs = container.querySelectorAll('hr');
      expect(hrs.length).toBeGreaterThan(0);
      hrs.forEach((hr) => {
        expect(hr).toHaveClass('mt-4');
      });
    });
  });

  describe('Component structure', () => {
    it('should be a function component', () => {
      expect(typeof Terms).toBe('function');
    });

    it('should render without crashing', () => {
      expect(() => render(<Terms />)).not.toThrow();
    });

    it('should have main container', () => {
      const { container } = render(<Terms />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('should have h1 heading with correct styling', () => {
      const { container } = render(<Terms />);
      const h1 = container.querySelector('h1');
      expect(h1).toHaveClass('mt-4', 'text-lg');
    });

    it('should have h3 headings with correct styling', () => {
      const { container } = render(<Terms />);
      const h3s = container.querySelectorAll('h3');
      h3s.forEach((h3) => {
        expect(h3).toHaveClass('mt-4', 'text-lg');
      });
    });

    it('should have paragraphs with spacing', () => {
      const { container } = render(<Terms />);
      const paragraphs = container.querySelectorAll('p.my-8');
      expect(paragraphs.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Terms />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(10);
    });

    it('should have descriptive link text', () => {
      render(<Terms />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });
  });

  describe('Content validation', () => {
    it('should contain all expected terms sections', () => {
      const { container } = render(<Terms />);
      expect(container.textContent).toContain('Contract');
      expect(container.textContent).toContain('Payment');
      expect(container.textContent).toContain('Personal Information');
      expect(container.textContent).toContain('Acceptable Use');
      expect(container.textContent).toContain('Uptime');
      expect(container.textContent).toContain('Support');
      expect(container.textContent).toContain('Refunds');
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(<Terms />);
      expect(container).toMatchSnapshot();
    });
  });
});
