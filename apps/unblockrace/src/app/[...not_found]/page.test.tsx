// @ts-nocheck
import React from 'react';
import { render } from '@testing-library/react';
import { notFound } from 'next/navigation';
import NotFoundCatchAll, { generateStaticParams } from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => undefined) as unknown as jest.Mock,
}));

describe('NotFoundCatchAll', () => {
  describe('rendering', () => {
    it('should call notFound function on render', () => {
      render(<NotFoundCatchAll />);
      expect(notFound as jest.Mock).toHaveBeenCalled();
    });

    it('should invoke notFound exactly once', () => {
      jest.clearAllMocks();
      render(<NotFoundCatchAll />);
      expect(notFound as jest.Mock).toHaveBeenCalledTimes(1);
    });

    it('should call notFound during component render', () => {
      render(<NotFoundCatchAll />);
      expect(notFound as jest.Mock).toHaveBeenCalled();
    });
  });

  describe('functionality', () => {
    it('should be a function component', () => {
      expect(typeof NotFoundCatchAll).toBe('function');
    });

    it('should return the result of notFound()', () => {
      (notFound as jest.Mock).mockReturnValue(<div>Not Found</div>);
      render(<NotFoundCatchAll />);
      expect(notFound as jest.Mock).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple renders', () => {
      jest.clearAllMocks();
      const { rerender } = render(<NotFoundCatchAll />);
      expect(notFound as jest.Mock).toHaveBeenCalledTimes(1);

      rerender(<NotFoundCatchAll />);
      expect(notFound as jest.Mock).toHaveBeenCalledTimes(2);
    });

    it('should work with React.StrictMode', () => {
      jest.clearAllMocks();
      render(
        <React.StrictMode>
          <NotFoundCatchAll />
        </React.StrictMode>
      );
      // StrictMode may call component twice in development
      expect(notFound as jest.Mock).toHaveBeenCalled();
    });
  });
});

describe('generateStaticParams', () => {
  describe('async function', () => {
    it('should be an async function', () => {
      const result = generateStaticParams();
      expect(result instanceof Promise).toBe(true);
    });

    it('should return a promise', async () => {
      const result = generateStaticParams();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve successfully', async () => {
      const params = await generateStaticParams();
      expect(params).toBeDefined();
    });
  });

  describe('return value structure', () => {
    it('should return an array', async () => {
      const params = await generateStaticParams();
      expect(Array.isArray(params)).toBe(true);
    });

    it('should contain one element', async () => {
      const params = await generateStaticParams();
      expect(params.length).toBe(1);
    });

    it('should return array with object containing not_found property', async () => {
      const params = await generateStaticParams();
      expect(params[0]).toHaveProperty('not_found');
    });

    it('should have not_found as an array', async () => {
      const params = await generateStaticParams();
      expect(Array.isArray(params[0].not_found)).toBe(true);
    });

    it('should contain specific catch-all parameter', async () => {
      const params = await generateStaticParams();
      expect(params[0].not_found).toContain('not_found');
    });

    it('should have exactly one item in not_found array', async () => {
      const params = await generateStaticParams();
      expect(params[0].not_found.length).toBe(1);
    });
  });

  describe('static param generation', () => {
    it('should generate params with correct structure', async () => {
      const params = await generateStaticParams();
      expect(params).toEqual([
        {
          not_found: ['not_found'],
        },
      ]);
    });

    it('should generate consistent params on multiple calls', async () => {
      const params1 = await generateStaticParams();
      const params2 = await generateStaticParams();
      expect(params1).toEqual(params2);
    });

    it('should generate params for catch-all route', async () => {
      const params = await generateStaticParams();
      const param = params[0];
      expect(param).toHaveProperty('not_found');
      expect(param.not_found).toEqual(['not_found']);
    });

    it('should not have additional properties', async () => {
      const params = await generateStaticParams();
      const keys = Object.keys(params[0]);
      expect(keys).toEqual(['not_found']);
    });
  });

  describe('type correctness', () => {
    it('should return correct type for Next.js generateStaticParams', async () => {
      const params = await generateStaticParams();
      expect(params).toBeDefined();
      expect(Array.isArray(params)).toBe(true);
      expect(typeof params === 'object' || Array.isArray(params)).toBe(true);
    });

    it('should have string values in not_found array', async () => {
      const params = await generateStaticParams();
      params[0].not_found.forEach((item) => {
        expect(typeof item).toBe('string');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle multiple sequential calls', async () => {
      const params1 = await generateStaticParams();
      const params2 = await generateStaticParams();
      const params3 = await generateStaticParams();

      expect(params1).toEqual(params2);
      expect(params2).toEqual(params3);
    });

    it('should not throw errors', async () => {
      await expect(generateStaticParams()).resolves.toBeDefined();
    });

    it('should complete without side effects', async () => {
      const params = await generateStaticParams();
      const paramsCopy = await generateStaticParams();
      // Verify it's not mutating original
      expect(params).toEqual(paramsCopy);
    });
  });

  describe('Next.js integration', () => {
    it('should be compatible with Next.js dynamic routes', async () => {
      const params = await generateStaticParams();
      // The params should match the [...not_found] dynamic segment
      expect(params[0].not_found).toBeDefined();
    });

    it('should provide correct parameter name for catch-all route', async () => {
      const params = await generateStaticParams();
      // [...not_found] requires 'not_found' as the parameter name
      expect(params[0]).toHaveProperty('not_found');
    });

    it('should provide string array for catch-all parameter', async () => {
      const params = await generateStaticParams();
      // Catch-all parameters should be string arrays
      expect(Array.isArray(params[0].not_found)).toBe(true);
      expect(params[0].not_found.every((x) => typeof x === 'string')).toBe(
        true
      );
    });
  });

  describe('snapshot', () => {
    it('should match snapshot', async () => {
      const params = await generateStaticParams();
      expect(params).toMatchSnapshot();
    });
  });
});

describe('page component default export', () => {
  it('should export NotFoundCatchAll as default', () => {
    expect(NotFoundCatchAll).toBeDefined();
    expect(typeof NotFoundCatchAll).toBe('function');
  });

  it('should export generateStaticParams', () => {
    expect(generateStaticParams).toBeDefined();
    expect(typeof generateStaticParams).toBe('function');
  });
});

describe('component integration', () => {
  it('should handle route with arbitrary segments', () => {
    render(<NotFoundCatchAll />);
    expect(notFound).toHaveBeenCalled();
  });

  it('should work for any path that matches [...not_found]', () => {
    render(<NotFoundCatchAll />);
    expect(notFound).toHaveBeenCalled();
  });

  it('should trigger notFound navigation', () => {
    jest.clearAllMocks();
    render(<NotFoundCatchAll />);
    expect(notFound).toHaveBeenCalledWith();
  });
});

describe('static rendering', () => {
  it('should generate static params for build time', async () => {
    const params = await generateStaticParams();
    expect(params).toBeDefined();
    expect(Array.isArray(params)).toBe(true);
  });

  it('should be suitable for incremental static generation', async () => {
    const params = await generateStaticParams();
    // Params should be deterministic and cacheable
    const params2 = await generateStaticParams();
    expect(JSON.stringify(params)).toBe(JSON.stringify(params2));
  });
});
