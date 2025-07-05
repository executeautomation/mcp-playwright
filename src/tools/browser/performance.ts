
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

/**
 * Tool for performance monitoring and metrics collection
 */
export class PerformanceMonitorTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        switch (action) {
          case 'startTracing':
            await page.context().tracing.start({
              screenshots: options?.screenshots || false,
              snapshots: true
            });
            return createSuccessResponse('Performance tracing started');
            
          case 'stopTracing':
            await page.context().tracing.stop({ 
              path: options?.path || 'trace.zip' 
            });
            return createSuccessResponse('Performance tracing stopped and saved');
            
          case 'getMetrics':
            const metrics = await page.evaluate(() => {
              const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
              const paint = performance.getEntriesByType('paint');
              
              return {
                navigation: {
                  domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                  loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                  domInteractive: navigation.domInteractive - navigation.fetchStart,
                  firstByte: navigation.responseStart - navigation.requestStart,
                  dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
                  tcpConnect: navigation.connectEnd - navigation.connectStart,
                  serverResponse: navigation.responseEnd - navigation.responseStart
                },
                paint: paint.reduce((acc, entry) => {
                  acc[entry.name] = entry.startTime;
                  return acc;
                }, {}),
                memory: (performance as any).memory ? {
                  usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                  totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                  jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
                } : null
              };
            });
            
            return createSuccessResponse([
              'Performance Metrics:',
              JSON.stringify(metrics, null, 2)
            ]);
            
          case 'getCoreWebVitals':
            const webVitals = await page.evaluate(() => {
              return new Promise((resolve) => {
                const vitals = {};
                
                // Largest Contentful Paint
                new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  const lastEntry = entries[entries.length - 1];
                  (vitals as any).lcp = lastEntry.startTime;
                }).observe({ entryTypes: ['largest-contentful-paint'] });
                
                // First Input Delay
                new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  entries.forEach((entry) => {
                    (vitals as any).fid = (entry as any).processingStart - entry.startTime;
                  });
                }).observe({ entryTypes: ['first-input'] });
                
                // Cumulative Layout Shift
                let clsValue = 0;
                new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    if (!(entry as any).hadRecentInput) {
                      clsValue += (entry as any).value;
                    }
                  }
                  (vitals as any).cls = clsValue;
                }).observe({ entryTypes: ['layout-shift'] });
                
                // Wait a bit for metrics to be collected
                setTimeout(() => {
                  resolve(vitals);
                }, 2000);
              });
            });
            
            return createSuccessResponse([
              'Core Web Vitals:',
              `LCP (Largest Contentful Paint): ${(webVitals as any).lcp || 'N/A'}ms`,
              `FID (First Input Delay): ${(webVitals as any).fid || 'N/A'}ms`,
              `CLS (Cumulative Layout Shift): ${(webVitals as any).cls || 'N/A'}`,
              JSON.stringify(webVitals, null, 2)
            ]);
            
          case 'getResourceTiming':
            const resources = await page.evaluate(() => {
              return performance.getEntriesByType('resource').map(entry => {
                const resourceEntry = entry as PerformanceResourceTiming;
                return {
                  name: entry.name,
                  type: resourceEntry.initiatorType,
                  size: resourceEntry.transferSize,
                  duration: entry.duration,
                  startTime: entry.startTime,
                  domainLookup: resourceEntry.domainLookupEnd - resourceEntry.domainLookupStart,
                  tcpConnect: resourceEntry.connectEnd - resourceEntry.connectStart,
                  serverResponse: resourceEntry.responseEnd - resourceEntry.responseStart,
                  downloadTime: resourceEntry.responseEnd - resourceEntry.responseStart
                };
              });
            });
            
            return createSuccessResponse([
              `Resource Timing (${resources.length} resources):`,
              JSON.stringify(resources, null, 2)
            ]);
            
          case 'measurePageLoad':
            const startTime = Date.now();
            await page.reload({ waitUntil: 'networkidle' });
            const endTime = Date.now();
            const loadTime = endTime - startTime;
            
            return createSuccessResponse(`Page load time: ${loadTime}ms`);
            
          default:
            return createErrorResponse(`Unknown performance action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Performance monitoring failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for lighthouse-style audits
 */
export class LighthouseAuditTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        switch (action) {
          case 'basicAudit':
            const audit = await page.evaluate(() => {
              const results = {
                performance: {},
                accessibility: {},
                bestPractices: {},
                seo: {}
              };
              
              // Performance checks
              const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
              results.performance = {
                firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || null,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                score: navigation.loadEventEnd < 3000 ? 'good' : navigation.loadEventEnd < 5000 ? 'needs-improvement' : 'poor'
              };
              
              // Basic accessibility checks
              const images = document.querySelectorAll('img');
              const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
              const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
              const headingStructure = Array.from(headings).map(h => h.tagName);
              
              results.accessibility = {
                imagesWithoutAlt: imagesWithoutAlt.length,
                totalImages: images.length,
                headingStructure: headingStructure,
                hasMainLandmark: !!document.querySelector('main, [role="main"]'),
                hasSkipLink: !!document.querySelector('a[href^="#"]')
              };
              
              // SEO checks
              const title = document.title;
              const metaDescription = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content;
              const h1Count = document.querySelectorAll('h1').length;
              
              results.seo = {
                hasTitle: !!title && title.length > 0,
                titleLength: title.length,
                hasMetaDescription: !!metaDescription,
                metaDescriptionLength: metaDescription?.length || 0,
                h1Count: h1Count,
                hasViewportMeta: !!document.querySelector('meta[name="viewport"]')
              };
              
              // Best practices
              const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + location.hostname + '"])');
              const linksWithoutRel = Array.from(externalLinks).filter(link => !(link as HTMLAnchorElement).rel.includes('noopener'));
              
              results.bestPractices = {
                externalLinksWithoutNoopener: linksWithoutRel.length,
                totalExternalLinks: externalLinks.length,
                hasHttps: location.protocol === 'https:',
                hasServiceWorker: 'serviceWorker' in navigator
              };
              
              return results;
            });
            
            return createSuccessResponse([
              'Basic Lighthouse-style Audit:',
              JSON.stringify(audit, null, 2)
            ]);
            
          case 'performanceScore':
            const perfScore = await page.evaluate(() => {
              const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
              const paint = performance.getEntriesByType('paint');
              
              const metrics = {
                fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                lcp: 0, // Would need observer
                fid: 0, // Would need observer
                cls: 0, // Would need observer
                ttfb: navigation.responseStart - navigation.requestStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                loadComplete: navigation.loadEventEnd - navigation.fetchStart
              };
              
              // Simple scoring algorithm
              let score = 100;
              if (metrics.fcp > 1800) score -= 20;
              if (metrics.ttfb > 600) score -= 15;
              if (metrics.domContentLoaded > 1500) score -= 15;
              if (metrics.loadComplete > 3000) score -= 25;
              
              return {
                score: Math.max(0, score),
                metrics: metrics,
                grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F'
              };
            });
            
            return createSuccessResponse([
              `Performance Score: ${perfScore.score}/100 (Grade: ${perfScore.grade})`,
              'Metrics:',
              JSON.stringify(perfScore.metrics, null, 2)
            ]);
            
          default:
            return createErrorResponse(`Unknown audit action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Lighthouse audit failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Tool for memory and resource monitoring
 */
export class ResourceMonitorTool extends BrowserToolBase {
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      const { action, options } = args;
      
      try {
        switch (action) {
          case 'memoryUsage':
            const memoryInfo = await page.evaluate(() => {
              if (!(performance as any).memory) {
                return { error: 'Memory API not available' };
              }
              
              return {
                usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
                usedPercentage: ((performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit) * 100
              };
            });
            
            if (memoryInfo.error) {
              return createErrorResponse(memoryInfo.error);
            }
            
            return createSuccessResponse([
              'Memory Usage:',
              `Used: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
              `Total: ${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
              `Limit: ${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
              `Usage: ${memoryInfo.usedPercentage.toFixed(2)}%`
            ]);
            
          case 'networkResources':
            const networkStats = await page.evaluate(() => {
              const resources = performance.getEntriesByType('resource');
              const stats = {
                totalRequests: resources.length,
                totalSize: 0,
                byType: {},
                slowestRequests: []
              };
              
              resources.forEach(resource => {
                const resourceEntry = resource as PerformanceResourceTiming;
                stats.totalSize += resourceEntry.transferSize || 0;
                
                const type = resourceEntry.initiatorType || 'other';
                if (!stats.byType[type]) {
                  stats.byType[type] = { count: 0, size: 0 };
                }
                stats.byType[type].count++;
                stats.byType[type].size += resourceEntry.transferSize || 0;
                
                stats.slowestRequests.push({
                  name: resource.name,
                  duration: resource.duration,
                  size: resourceEntry.transferSize
                });
              });
              
              stats.slowestRequests.sort((a, b) => b.duration - a.duration);
              stats.slowestRequests = stats.slowestRequests.slice(0, 10);
              
              return stats;
            });
            
            return createSuccessResponse([
              'Network Resource Statistics:',
              `Total Requests: ${networkStats.totalRequests}`,
              `Total Size: ${(networkStats.totalSize / 1024 / 1024).toFixed(2)} MB`,
              'By Type:',
              JSON.stringify(networkStats.byType, null, 2),
              'Slowest Requests:',
              JSON.stringify(networkStats.slowestRequests, null, 2)
            ]);
            
          case 'domComplexity':
            const domStats = await page.evaluate(() => {
              const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_ELEMENT,
                null
              );
              
              let elementCount = 0;
              let maxDepth = 0;
              let currentDepth = 0;
              const tagCounts = {};
              
              let node;
              while (node = walker.nextNode()) {
                elementCount++;
                
                const tagName = node.tagName.toLowerCase();
                tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
                
                // Calculate depth
                let depth = 0;
                let parent = node.parentElement;
                while (parent) {
                  depth++;
                  parent = parent.parentElement;
                }
                maxDepth = Math.max(maxDepth, depth);
              }
              
              return {
                totalElements: elementCount,
                maxDepth: maxDepth,
                tagDistribution: tagCounts,
                complexity: elementCount > 1500 ? 'high' : elementCount > 800 ? 'medium' : 'low'
              };
            });
            
            return createSuccessResponse([
              'DOM Complexity Analysis:',
              `Total Elements: ${domStats.totalElements}`,
              `Max Depth: ${domStats.maxDepth}`,
              `Complexity: ${domStats.complexity}`,
              'Tag Distribution:',
              JSON.stringify(domStats.tagDistribution, null, 2)
            ]);
            
          default:
            return createErrorResponse(`Unknown resource monitoring action: ${action}`);
        }
      } catch (error) {
        return createErrorResponse(`Resource monitoring failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}
