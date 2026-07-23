/**
 * Chef Analytics - Lightweight privacy-focused analytics tracker
 * ~3KB gzipped | No cookies | GDPR-compliant
 *
 * Automatically tracks:
 * - Page views
 * - Session duration
 * - Anonymous visitor identification
 *
 * Usage: Just include this script in your HTML
 * <script async src="/chef-analytics.js"></script>
 */
(function() {
  'use strict';

  // Configuration - will be injected during build
  var ANALYTICS_ENDPOINT = window.CHEF_ANALYTICS_ENDPOINT || 'https://chef.convex.site/analytics/track';
  var PROJECT_ID = window.CHEF_PROJECT_ID; // Injected during deployment
  var DEPLOYMENT_URL = window.location.origin;

  // Skip if no project ID configured, or if the deploy-time placeholder was never
  // substituted (e.g. running in the live sandbox preview rather than a real
  // deployment). Sending events with an unresolved placeholder just wastes requests.
  if (!PROJECT_ID || PROJECT_ID.indexOf('{{') !== -1) {
    console.warn('[Chef Analytics] No PROJECT_ID configured - analytics disabled');
    return;
  }

  // Session timeout (30 minutes of inactivity)
  var SESSION_TIMEOUT = 30 * 60 * 1000;

  /**
   * Generate or retrieve anonymous visitor ID
   * Stored in localStorage for cross-session tracking
   */
  function getVisitorId() {
    try {
      var key = 'chef_visitor_id';
      var id = localStorage.getItem(key);
      if (!id) {
        id = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(key, id);
      }
      return id;
    } catch (e) {
      // Fallback if localStorage is unavailable
      return 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }

  /**
   * Generate or retrieve session ID
   * Stored in sessionStorage, expires after 30 min of inactivity
   */
  function getSessionId() {
    try {
      var key = 'chef_session';
      var stored = sessionStorage.getItem(key);

      if (stored) {
        var data = JSON.parse(stored);
        var timeSinceActivity = Date.now() - data.lastActivity;

        if (timeSinceActivity < SESSION_TIMEOUT) {
          // Update activity timestamp
          data.lastActivity = Date.now();
          sessionStorage.setItem(key, JSON.stringify(data));
          return data.id;
        }
      }

      // Create new session
      var id = 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(key, JSON.stringify({
        id: id,
        lastActivity: Date.now()
      }));
      return id;
    } catch (e) {
      // Fallback if sessionStorage is unavailable
      return 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }

  /**
   * Send analytics event to server
   */
  function track(eventType, data) {
    var payload = {
      chatId: PROJECT_ID,
      deploymentUrl: DEPLOYMENT_URL,
      eventType: eventType,
      timestamp: Date.now(),
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      screenWidth: window.screen ? window.screen.width : undefined,
      screenHeight: window.screen ? window.screen.height : undefined,
      language: navigator.language || undefined,
      userAgent: navigator.userAgent || undefined
    };

    // Merge additional data
    if (data) {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          payload[key] = data[key];
        }
      }
    }

    // Use sendBeacon for reliability (works even when page unloads)
    var success = false;
    if (navigator.sendBeacon) {
      try {
        success = navigator.sendBeacon(
          ANALYTICS_ENDPOINT,
          JSON.stringify(payload)
        );
      } catch (e) {
        console.warn('[Chef Analytics] sendBeacon failed:', e);
      }
    }

    // Fallback to fetch if sendBeacon not available or failed
    if (!success) {
      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {
        // Fail silently - analytics shouldn't break the user experience
      });
    }
  }

  /**
   * Track initial page view
   */
  function trackPageView() {
    var loadTime;

    // Try to get page load time
    if (window.performance && window.performance.timing) {
      var timing = window.performance.timing;
      if (timing.loadEventEnd && timing.navigationStart) {
        loadTime = timing.loadEventEnd - timing.navigationStart;
      }
    }

    track('pageview', { loadTime: loadTime });
  }

  /**
   * Track session end when page becomes hidden
   */
  function setupVisibilityTracking() {
    var pageShownAt = Date.now();

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        track('session_end', {
          duration: Date.now() - pageShownAt
        });
      } else if (document.visibilityState === 'visible') {
        pageShownAt = Date.now();
      }
    }

    if (typeof document.addEventListener !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
  }

  /**
   * Track outbound link clicks
   */
  function setupOutboundLinkTracking() {
    if (typeof document.addEventListener === 'undefined') return;

    document.addEventListener('click', function(e) {
      // Find closest anchor element
      var target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      // Check if it's an outbound link
      if (target && target.href && target.hostname !== window.location.hostname) {
        track('custom_event', {
          eventName: 'outbound_click',
          eventData: {
            url: target.href,
            text: (target.textContent || '').trim().substring(0, 100)
          }
        });
      }
    });
  }

  /**
   * Initialize analytics
   */
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Track page view
    trackPageView();

    // Setup additional tracking
    setupVisibilityTracking();
    setupOutboundLinkTracking();

    // Expose custom event tracking API
    window.chefAnalytics = {
      track: function(eventName, properties) {
        track('custom_event', {
          eventName: eventName,
          eventData: properties || {}
        });
      }
    };
  }

  // Start initialization
  init();
})();
