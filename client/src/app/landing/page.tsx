import HeroSection from '@/components/landing/HeroSection';
import QuickActions from '@/components/landing/QuickActions';
import HowItWorks from '@/components/landing/HowItWorks';
import RecentItems from '@/components/landing/RecentItems';
import FeatureHighlight from '@/components/landing/FeatureHighlight';
import CallToAction from '@/components/landing/CallToAction';
import Footer from '@/components/landing/Footer';
import DemoOne from '@/components/ui/demo';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <HeroSection />
      <QuickActions />
      <HowItWorks />
      <RecentItems />
      <FeatureHighlight />
      <CallToAction />
      <section
        id="contact"
        className="relative overflow-hidden border-y border-white/[0.06] bg-[radial-gradient(circle_at_20%_20%,rgba(10,102,194,0.22),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(11,120,229,0.14),transparent_35%),#05070d] px-6 py-16 md:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <DemoOne />
        </div>
      </section>
      <Footer />
    </main>
  );
}
