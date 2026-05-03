import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: true
  });

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookie-consent');
    if (!hasAccepted) {
      setIsVisible(true);
      // Trigger animation after mount
      setTimeout(() => setIsAnimating(true), 100);
    }
  }, []);

  // Measure height and update body padding/variable
  useEffect(() => {
    if (isVisible && bannerRef.current) {
      const height = bannerRef.current.offsetHeight;
      document.body.style.setProperty('--cookie-banner-height', `${height}px`);
      
      // Add transition to body padding
      document.body.style.transition = 'padding-top 0.5s ease-out';
      
      if (isAnimating) {
        document.body.style.paddingTop = `${height}px`;
      } else {
        document.body.style.paddingTop = '0px';
      }
    } else {
      document.body.style.removeProperty('--cookie-banner-height');
      document.body.style.paddingTop = '0px';
    }
    
    return () => {
      document.body.style.removeProperty('--cookie-banner-height');
      document.body.style.paddingTop = '0px';
      document.body.style.transition = '';
    };
  }, [isVisible, isAnimating]);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true
    }));
    setIsVisible(false);
    // Fire event so lead capture popup can respond
    window.dispatchEvent(new CustomEvent('mydojo:cookieAccepted'));
  };

  const handleDeclineAll = () => {
    localStorage.setItem('cookie-consent', 'false');
    localStorage.setItem('cookie-preferences', JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false
    }));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
    setShowPreferences(false);
    setIsVisible(false);
  };

  return (
    <>
      {isVisible && (
        <div 
          ref={bannerRef}
          className={cn(
            "fixed top-0 left-0 right-0 z-[9999] bg-white border-b border-gray-200 shadow-sm w-full transition-transform duration-500 ease-out",
            isAnimating ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <div className="container mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 min-h-[44px]">
            <p className="text-xs md:text-sm text-gray-600 text-center sm:text-left">
              We use cookies to improve your experience. <Link href="/privacy-policy"><span className="underline cursor-pointer hover:text-black">Privacy Policy</span></Link>
            </p>
            
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="text-xs h-8 px-3 text-gray-500 hover:text-black"
              >
                <Settings className="h-3 w-3 mr-1" /> Preferences
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDeclineAll}
                className="text-xs h-8 px-3 border-gray-300"
              >
                Decline
              </Button>
              <Button 
                size="sm"
                onClick={handleAcceptAll}
                className="text-xs h-8 px-3 bg-primary hover:bg-primary/90 text-white"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-[425px] z-[10000]">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-xl">Cookie Preferences</DialogTitle>
            <DialogDescription>
              Manage your cookie settings. Essential cookies are always required for the website to function.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="essential" className="font-bold">Essential Cookies</Label>
                <span className="text-xs text-gray-500">Required for basic site functionality.</span>
              </div>
              <Switch id="essential" checked={true} disabled />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="analytics" className="font-bold">Analytics Cookies</Label>
                <span className="text-xs text-gray-500">Help us understand how you use our site.</span>
              </div>
              <Switch 
                id="analytics" 
                checked={preferences.analytics} 
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))} 
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="marketing" className="font-bold">Marketing Cookies</Label>
                <span className="text-xs text-gray-500">Used to deliver relevant advertisements.</span>
              </div>
              <Switch 
                id="marketing" 
                checked={preferences.marketing} 
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreferences(false)}>Cancel</Button>
            <Button onClick={handleSavePreferences} className="bg-primary text-white">Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
