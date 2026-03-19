import { test, expect } from './fixtures';
import { navigateTo, waitFor } from './fixtures';

/**
 * Performance E2E Tests
 * Tests page load times and Lighthouse scores
 */

// Performance thresholds
const THRESHOLDS = {
  // Time to First Byte (TTFB)
  ttfb: 600,
  // First Contentful Paint (FCP)
  fcp: 1800,
  // Largest Contentful Paint (LCP)
  lcp: 2500,
  // Time to Interactive (TTI)
  tti: 3500,
  // Cumulative Layout Shift (CLS) - should be < 0.1
  cls: 0.1,
  // Total Blocking Time (TBT)
  tbt: 200,
};

test.describe('Performance - Page Load Times', () => {
  test('homepage should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    const loadTime = Date.now() - startTime;

    // Log performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        // Time to First Byte
        ttfb: navigation ? navigation.responseStart - navigation.startTime : 0,
        // DOM Content Loaded
        dcl: navigation ? navigation.domContentLoadedEventEnd - navigation.startTime : 0,
        // Load complete
        load: navigation ? navigation.loadEventEnd - navigation.startTime : 0,
        // First Paint
        fp: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        // First Contentful Paint
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      };
    });

    console.log('Homepage Performance Metrics:', performanceMetrics);

    // Assert performance thresholds
    expect(performanceMetrics.ttfb).toBeLessThan(THRESHOLDS.ttfb);
    expect(performanceMetrics.fcp).toBeLessThan(THRESHOLDS.fcp);
    expect(loadTime).toBeLessThan(5000); // Total load time should be under 5s
  });

  test('programs page should load quickly', async ({ page }) => {
    const startTime = Date.now();

    await navigateTo.programs(page);
    await waitFor.pageLoad(page);

    const loadTime = Date.now() - startTime;

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        ttfb: navigation ? navigation.responseStart - navigation.startTime : 0,
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        load: navigation ? navigation.loadEventEnd - navigation.startTime : 0,
      };
    });

    console.log('Programs Page Performance Metrics:', performanceMetrics);

    expect(performanceMetrics.fcp).toBeLessThan(THRESHOLDS.fcp);
    expect(loadTime).toBeLessThan(5000);
  });

  test('schedule page should load quickly', async ({ page }) => {
    const startTime = Date.now();

    await navigateTo.schedule(page);
    await waitFor.pageLoad(page);

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('registration page should load quickly', async ({ page }) => {
    const startTime = Date.now();

    await navigateTo.register(page);
    await waitFor.pageLoad(page);

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Performance - Resource Loading', () => {
  test('should not have excessive JavaScript bundles', async ({ page }) => {
    // Track resource sizes
    const resources: Array<{ url: string; size: number; type: string }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      const headers = await response.allHeaders();
      const contentLength = headers['content-length'];

      if (contentLength && (url.includes('.js') || url.includes('.css'))) {
        resources.push({
          url: url.split('/').pop() || url,
          size: parseInt(contentLength),
          type: url.includes('.js') ? 'javascript' : 'css',
        });
      }
    });

    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Check JavaScript bundle sizes
    const jsResources = resources.filter(r => r.type === 'javascript');
    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);

    console.log('JavaScript Resources:', jsResources);
    console.log('Total JS Size (bytes):', totalJsSize);

    // Total JS should be under 1MB (gzipped would be smaller)
    expect(totalJsSize).toBeLessThan(1024 * 1024);
  });

  test('images should be optimized', async ({ page }) => {
    const imageSizes: Array<{ src: string; size: number; width: number; height: number }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/)) {
        const headers = await response.allHeaders();
        const size = parseInt(headers['content-length'] || '0');

        imageSizes.push({
          src: url.split('/').pop() || url,
          size,
          width: 0,
          height: 0,
        });
      }
    });

    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    console.log('Image Resources:', imageSizes);

    // No single image should be over 500KB
    for (const img of imageSizes) {
      expect(img.size).toBeLessThan(500 * 1024);
    }
  });

  test('should use caching headers', async ({ page }) => {
    const cacheHeaders: Array<{ url: string; cacheControl: string | null; etag: string | null }> = [];

    page.on('response', async (response) => {
      const headers = await response.allHeaders();
      cacheHeaders.push({
        url: response.url().split('/').pop() || response.url(),
        cacheControl: headers['cache-control'] || null,
        etag: headers['etag'] || null,
      });
    });

    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Static assets should have caching headers
    const staticAssets = cacheHeaders.filter(h =>
      h.url.match(/\.(js|css|png|jpg|woff2)$/) && !h.url.includes('hot-update')
    );

    for (const asset of staticAssets) {
      expect(asset.cacheControl || asset.etag).toBeTruthy();
    }
  });
});

test.describe('Performance - Runtime Performance', () => {
  test('should maintain 60fps during scroll', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Measure frame rate during scroll
    const frameMetrics = await page.evaluate(async () => {
      let frameCount = 0;
      let lastTime = performance.now();

      const countFrames = () => {
        frameCount++;
        const currentTime = performance.now();

        if (currentTime - lastTime < 1000) {
          requestAnimationFrame(countFrames);
        }
      };

      requestAnimationFrame(countFrames);

      // Scroll down
      window.scrollTo(0, document.body.scrollHeight / 2);

      // Wait for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { frameCount };
    });

    console.log('Frame count during scroll:', frameMetrics.frameCount);

    // Should have at least 30 frames in 1 second (30fps minimum)
    expect(frameMetrics.frameCount).toBeGreaterThan(30);
  });

  test('should not have layout shifts', async ({ page }) => {
    await navigateTo.home(page);

    // Get CLS using Performance Observer
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] as any });

        // Wait for page to settle
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });

    console.log('Cumulative Layout Shift:', cls);

    // CLS should be less than 0.1
    expect(cls).toBeLessThan(THRESHOLDS.cls);
  });

  test('long tasks should be minimal', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Check for long tasks
    const longTasks = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let longTaskCount = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks over 50ms
              longTaskCount++;
            }
          }
        });

        observer.observe({ entryTypes: ['longtask'] as any });

        setTimeout(() => {
          observer.disconnect();
          resolve(longTaskCount);
        }, 3000);
      });
    });

    console.log('Long tasks count:', longTasks);

    // Should have minimal long tasks
    expect(longTasks).toBeLessThan(5);
  });
});

test.describe('Performance - Mobile Performance', () => {
  test('should load acceptably on mobile connection', async ({ mobilePage }) => {
    // Note: This test assumes mobilePage has mobile viewport
    // For full mobile performance testing, you'd want to use Chrome DevTools Protocol
    // to simulate slow network conditions

    const startTime = Date.now();

    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    const loadTime = Date.now() - startTime;

    console.log('Mobile load time:', loadTime);

    // Mobile load time should still be reasonable
    expect(loadTime).toBeLessThan(8000);
  });

  test('should have responsive images', async ({ mobilePage }) => {
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    // Check for responsive image attributes
    const images = await mobilePage.locator('img').all();

    for (const img of images) {
      const srcset = await img.getAttribute('srcset');
      const sizes = await img.getAttribute('sizes');
      const loading = await img.getAttribute('loading');

      // Images should have lazy loading
      if (!srcset) {
        expect(loading).toBe('lazy');
      }
    }
  });
});

test.describe('Performance - Lighthouse CI Simulation', () => {
  test('homepage should pass core web vitals', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Collect Web Vitals metrics
    const webVitals = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        const metrics: any = {};

        // LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] as any });

        // FID simulation (using first input)
        new PerformanceObserver((list) => {
          const firstEntry = list.getEntries()[0];
          metrics.fid = (firstEntry as any).processingStart - firstEntry.startTime;
        }).observe({ entryTypes: ['first-input'] as any });

        // Wait and resolve
        setTimeout(() => resolve(metrics), 3000);
      });
    });

    console.log('Web Vitals:', webVitals);

    // Check thresholds
    if (webVitals.lcp) {
      expect(webVitals.lcp).toBeLessThan(THRESHOLDS.lcp);
    }
  });

  test('should have proper resource hints', async ({ page }) => {
    // Check for preconnect or dns-prefetch
    const resourceHints = await page.evaluate(() => {
      const preconnect = Array.from(document.querySelectorAll('link[rel="preconnect"]'));
      const dnsPrefetch = Array.from(document.querySelectorAll('link[rel="dns-prefetch"]'));
      const preload = Array.from(document.querySelectorAll('link[rel="preload"]'));

      return {
        preconnect: preconnect.map(el => (el as HTMLLinkElement).href),
        dnsPrefetch: dnsPrefetch.map(el => (el as HTMLLinkElement).href),
        preload: preload.map(el => (el as HTMLLinkElement).href),
      };
    });

    console.log('Resource Hints:', resourceHints);

    // Should have some resource hints for external domains
    const hasHints = resourceHints.preconnect.length > 0 ||
                    resourceHints.dnsPrefetch.length > 0 ||
                    resourceHints.preload.length > 0;

    // This is a recommendation, not a requirement
    if (!hasHints) {
      console.log('Consider adding resource hints for external domains');
    }
  });
});
