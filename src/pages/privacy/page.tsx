import { Link } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import SeoHead from "@/components/feature/SeoHead";
import SITE_URL from "@/lib/siteUrl";

const LAST_UPDATED = "June 28, 2026";
const COMPANY = "TruckDriverJobs.co";
const CONTACT_EMAIL = "privacy@truckdriverjobs.co";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title="Privacy Policy | TruckDriverJobs.co"
        description="Privacy Policy for TruckDriverJobs.co - how we collect, use, and protect your personal information."
        canonicalUrl={`${SITE_URL}/privacy`}
      />
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">
            <i className="ri-arrow-left-line" /> Back to Home
          </Link>
          <h1 className="font-heading text-3xl font-bold text-brand-text mt-4">Privacy Policy</h1>
          <p className="mt-2 text-sm text-brand-text-secondary">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-brand-text-secondary leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              {COMPANY} ("we," "us," or "our") operates the website TruckDriverJobs.co (the "Site"). This Privacy Policy explains how we collect, use, disclose, and protect personal information submitted through our Site, including through our job application forms.
            </p>
            <p className="mt-3">
              By using the Site or submitting your information, you agree to the terms of this Privacy Policy. If you do not agree, please do not use the Site or submit your information.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 1. Information We Collect */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">1. Information We Collect</h2>
            <p>When you submit a job application through our Site, we collect:</p>
            <ul className="mt-3 space-y-1.5 list-disc list-inside">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>CDL license status and class</li>
              <li>Years of driving experience</li>
              <li>Preferred routes, equipment types, and home-time preferences</li>
              <li>Any other information you voluntarily provide</li>
            </ul>
            <p className="mt-3">
              We also automatically collect standard technical information such as IP address, browser type, device type, and pages visited through cookies and analytics tools.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-3 space-y-1.5 list-disc list-inside">
              <li>Match you with CDL employment opportunities from our carrier partners</li>
              <li>Contact you by phone, text message, or email about relevant job openings</li>
              <li>Share your application information with motor carriers and trucking companies that may have suitable positions</li>
              <li>Improve and personalize your experience on the Site</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and ensure Site security</li>
            </ul>
          </section>

          <hr className="border-brand-border" />

          {/* 3. Sharing With Carrier Partners - Critical Section */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">3. Sharing Your Information with Carrier Partners</h2>
            <p className="font-medium text-brand-text">
              By submitting a job application on our Site, you expressly consent to {COMPANY} sharing your personal information — including your name, phone number, email, and CDL details — with our network of motor carriers, trucking companies, and recruitment partners for the purpose of CDL driver recruitment.
            </p>
            <p className="mt-3">
              These carrier partners may contact you directly via phone, text, or email regarding employment opportunities. We are not responsible for the communication practices of third-party carriers once your information has been shared.
            </p>
            <p className="mt-3">
              We do not sell your personal information to data brokers or unrelated third parties. Information is shared only for CDL employment matching purposes.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 4. TCPA Consent */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">4. Telephone Consumer Protection Act (TCPA) Consent</h2>
            <p>
              By checking the consent box on our application form and submitting your application, you provide your express written consent to {COMPANY} and its carrier partners to contact you using automated telephone dialing systems, pre-recorded or artificial voice messages, and/or text messages (SMS) at the phone number you provided, for the purpose of CDL driver recruitment and employment opportunities.
            </p>
            <p className="mt-3">
              You are not required to provide this consent as a condition of any purchase or service. Message and data rates may apply. Message frequency varies.
            </p>
            <p className="mt-3">
              To opt out of text messages, reply STOP to any message you receive. To opt out of phone calls, please contact us at {CONTACT_EMAIL}.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 5. CCPA */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">5. California Residents - Your CCPA Rights</h2>
            <p>
              If you are a California resident, the California Consumer Privacy Act (CCPA) gives you additional rights:
            </p>
            <ul className="mt-3 space-y-1.5 list-disc list-inside">
              <li><strong className="text-brand-text">Right to Know:</strong> You may request what personal information we have collected about you, the sources, why we collected it, and who we share it with.</li>
              <li><strong className="text-brand-text">Right to Delete:</strong> You may request we delete your personal information, subject to certain exceptions.</li>
              <li><strong className="text-brand-text">Right to Opt-Out:</strong> You may opt out of the sale or sharing of your personal information. We do not sell personal data to unrelated third parties.</li>
              <li><strong className="text-brand-text">Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at {CONTACT_EMAIL}. We will respond within 45 days.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 6. Data Retention */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes described in this Privacy Policy, including active job matching, unless a longer retention period is required by law. If you request deletion of your data, we will remove it from our active systems within 30 days, subject to applicable legal requirements.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 7. Security */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">7. Security</h2>
            <p>
              We implement reasonable technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 8. Job Listings */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">8. Job Listings and Third-Party Content</h2>
            <p>
              Some job listings on our Site may be aggregated from publicly available sources including carrier websites, career pages, and structured data feeds. These listings are provided for informational purposes to connect drivers with employment opportunities. We attribute the original source where available and provide links to original postings where applicable.
            </p>
            <p className="mt-3">
              Carriers whose job listings appear on our Site may contact us to claim, update, or remove their listings at {CONTACT_EMAIL}.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 9. Cookies */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">9. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to improve your experience, analyze Site usage, and understand how visitors find us. You can control cookie settings through your browser preferences. Disabling cookies may affect certain Site functionality.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 10. Children's Privacy */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">10. Children's Privacy</h2>
            <p>
              Our Site is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, contact us at {CONTACT_EMAIL} and we will delete it promptly.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 11. Changes */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. Your continued use of the Site after any changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          <hr className="border-brand-border" />

          {/* 12. Contact */}
          <section>
            <h2 className="font-heading text-lg font-bold text-brand-text mb-3">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, wish to exercise your rights, or want to opt out of communications, contact us:
            </p>
            <div className="mt-4 rounded-xl border border-brand-border bg-brand-surface p-5">
              <p className="font-semibold text-brand-text">{COMPANY}</p>
              <p className="mt-1 text-sm">Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-orange hover:underline">{CONTACT_EMAIL}</a></p>
              <p className="mt-1 text-sm">Website: <a href={SITE_URL} className="text-brand-orange hover:underline">{SITE_URL}</a></p>
            </div>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
