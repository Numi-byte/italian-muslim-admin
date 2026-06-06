// src/pages/TermsPage.tsx
import React from "react";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "info@ummahway.com";

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050814] text-slate-50 flex flex-col">
      <header className="border-b border-white/10 bg-[#050814]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-300/40 bg-emerald-300/10">
              <span className="text-xs font-black tracking-widest text-emerald-200">
                UW
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-[0.22em] uppercase text-emerald-200">
                UmmahWay
              </span>
              <span className="text-[11px] text-slate-400">
                Trentino-Alto Adige/Suedtirol
              </span>
            </div>
          </Link>
          <Link
            to="/"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-emerald-200"
          >
            &larr; Home
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Last updated: 06 June 2026
          </p>

          <p className="mt-6 text-base leading-7 text-slate-300">
            These Terms &amp; Conditions ("Terms") govern your use of the
            UmmahWay website, mobile app, public masjid pages, forms, and admin
            console. By accessing or using UmmahWay, you agree to these Terms.
          </p>

          <section className="mt-8 space-y-6 text-sm leading-6 text-slate-300">
            <div>
              <h2 className="text-base font-bold text-white">
                1. What UmmahWay Provides
              </h2>
              <p className="mt-2">
                UmmahWay is a community platform for masjids and worshippers in
                Trentino-Alto Adige/Suedtirol. The service can include masjid
                profiles, prayer times, Jumu'ah schedules, announcements,
                Ramadan information, maps, sponsorship forms, and admin tools.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                2. No Emergency, Medical, Legal, Or Fatwa Service
              </h2>
              <p className="mt-2">
                UmmahWay is an information platform. It is not an emergency
                service, medical service, legal service, or religious ruling
                service. For urgent situations, contact the appropriate local
                emergency services. For religious decisions, follow your trusted
                masjid, scholar, or religious authority.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                3. Prayer Times And Local Information
              </h2>
              <p className="mt-2">
                Prayer times, iqamah times, Jumu'ah schedules, announcements,
                and masjid details may be entered by authorised masjid admins or
                provided by UmmahWay based on available information. We work to
                keep data accurate, but local masjids remain the final authority
                for their own schedules and announcements.
              </p>
              <p className="mt-2">
                Always verify important timing changes directly with the masjid,
                especially during Ramadan, holidays, exceptional events, travel,
                or technical outages.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                4. Accounts And Admin Access
              </h2>
              <p className="mt-2">
                Some features require an account. Admin access is only for
                people authorised to act on behalf of a masjid, association, or
                approved organisation. You are responsible for keeping your
                login details secure and for activity under your account.
              </p>
              <p className="mt-2">
                We may approve, reject, suspend, or remove admin access where
                needed to protect masjids, users, data integrity, or the
                reputation of the service.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                5. Acceptable Use
              </h2>
              <p className="mt-2">You agree not to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Use UmmahWay for illegal, harmful, deceptive, or abusive activity.</li>
                <li>Publish content you are not authorised to share.</li>
                <li>Upload discriminatory, hateful, threatening, or misleading content.</li>
                <li>Impersonate a masjid, admin, business, or other person.</li>
                <li>Attempt to access accounts, data, or systems without permission.</li>
                <li>Interfere with the platform, security, maps, APIs, or infrastructure.</li>
                <li>Scrape, copy, resell, or redistribute service data at scale without permission.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                6. Admin Content Responsibility
              </h2>
              <p className="mt-2">
                Admins are responsible for the accuracy, legality, permissions,
                and public suitability of the content they publish. This
                includes prayer times, announcements, images, logos, business
                sponsorship information, contact details, addresses, and map
                coordinates.
              </p>
              <p className="mt-2">
                UmmahWay may edit, hide, or remove content that appears
                inaccurate, unauthorised, unsafe, unlawful, abusive, outdated,
                or harmful to the community.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                7. Public Pages And Maps
              </h2>
              <p className="mt-2">
                Masjid pages and map pins are intended to help users find active
                masjids and community information. Map locations are provided
                for convenience and may not always be exact. Users should follow
                local signage, official masjid instructions, and applicable
                access rules.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                8. Sponsorships And Business Submissions
              </h2>
              <p className="mt-2">
                If you submit a sponsorship or business form, you confirm that
                the information is accurate and that you have permission to
                submit it. Submission does not guarantee approval, placement, or
                publication. We may reject or remove sponsorships that do not fit
                the purpose or standards of UmmahWay.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                9. Intellectual Property
              </h2>
              <p className="mt-2">
                The UmmahWay name, brand, design, website, app interface, code,
                and original materials belong to UmmahWay or its licensors.
                Masjids and partners keep ownership of content they provide, but
                they grant UmmahWay permission to host, display, format,
                distribute, and promote that content as needed to operate the
                service.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                10. App Stores And Third-Party Services
              </h2>
              <p className="mt-2">
                The mobile app may be distributed through Apple App Store and
                Google Play. Those stores may apply their own terms and privacy
                rules. UmmahWay may also rely on third-party providers for
                hosting, authentication, storage, maps, analytics,
                notifications, and email delivery.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                11. Availability And Changes
              </h2>
              <p className="mt-2">
                We aim to keep UmmahWay reliable, but we do not guarantee that
                the service will always be available, error-free, or unchanged.
                We may update, suspend, limit, or discontinue features when
                needed for security, maintenance, legal compliance, or product
                improvement.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                12. Disclaimer Of Warranties
              </h2>
              <p className="mt-2">
                UmmahWay is provided on an "as is" and "as available" basis. To
                the maximum extent permitted by law, we disclaim warranties of
                accuracy, availability, fitness for a particular purpose, and
                non-infringement.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                13. Limitation Of Liability
              </h2>
              <p className="mt-2">
                To the maximum extent permitted by law, UmmahWay is not liable
                for indirect, incidental, special, consequential, or punitive
                damages, or for losses caused by inaccurate community content,
                missed notifications, outages, map errors, user conduct, or
                third-party services.
              </p>
              <p className="mt-2">
                Nothing in these Terms limits liability where the law does not
                allow it to be limited.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">14. Termination</h2>
              <p className="mt-2">
                You may stop using UmmahWay at any time. We may suspend or
                terminate access if you violate these Terms, misuse the service,
                create security risks, publish unauthorised content, or harm the
                community or platform.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                15. Governing Law
              </h2>
              <p className="mt-2">
                These Terms are governed by the laws applicable in Italy,
                without prejudice to mandatory consumer protection rights that
                may apply in your country of residence.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                16. Changes To These Terms
              </h2>
              <p className="mt-2">
                We may update these Terms as UmmahWay grows or legal
                requirements change. The updated date above will show the latest
                version. Continued use of UmmahWay after changes become
                effective means you accept the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">17. Contact</h2>
              <p className="mt-2">
                For questions about these Terms, contact UmmahWay at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-emerald-200 underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[#050814]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 text-[11px] text-slate-500 sm:px-6 lg:px-8">
          <span>&copy; {new Date().getFullYear()} UmmahWay</span>
          <Link to="/privacy" className="transition hover:text-emerald-200">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
