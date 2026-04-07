import HeroSection from '@/components/landing/HeroSection';
import QuickActions from '@/components/landing/QuickActions';
import StatsBar from '@/components/landing/StatsBar';
import HowItWorks from '@/components/landing/HowItWorks';
import RecentItems from '@/components/landing/RecentItems';
import FeatureHighlight from '@/components/landing/FeatureHighlight';
import CallToAction from '@/components/landing/CallToAction';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <HeroSection />
      <StatsBar />
      <QuickActions />
      <HowItWorks />
      <RecentItems />
      <FeatureHighlight />
      <CallToAction />
      <Footer />
    </main>
  );
}
