"use client";
import { useEffect } from 'react';

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend Window interface to include our custom property
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface Window {
    triggerPWAInstall?: () => Promise<boolean>;
  }
}

export default function PWARegistration() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          // Check if there's an existing registration
          const existing = await navigator.serviceWorker.getRegistration();
          if (existing?.active) {
            // Update existing service worker
            existing.update().catch(console.error);
          } else {
            // Register new service worker
            await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
              updateViaCache: 'none'
            });
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      });

      // Handle service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Optional: Show update notification to user
        if (window.confirm('New version available! Reload to update?')) {
          window.location.reload();
        }
      });
    }

    // Handle PWA installation prompt
    let deferredPrompt: BeforeInstallPromptEvent | null = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Dispatch event for UI to show install button
      window.dispatchEvent(new CustomEvent('pwaInstallable'));
    });

    // Handle app installed event
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      // Dispatch event for UI to hide install button
      window.dispatchEvent(new CustomEvent('pwaInstalled'));
    });

    // Handle offline/online status
    const handleOnline = () => {
      document.body.classList.remove('offline');
      // Attempt to revalidate cached data
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'ONLINE_SYNC' });
      }
    };

    const handleOffline = () => {
      document.body.classList.add('offline');
    };

    // Set initial offline status
    if (!navigator.onLine) handleOffline();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Expose PWA install prompt for other components
    window.triggerPWAInstall = async () => {
      if (!deferredPrompt) return false;
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      return outcome === 'accepted';
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      delete window.triggerPWAInstall;
    };
  }, []);

  return null; // This component doesn't render anything
} 