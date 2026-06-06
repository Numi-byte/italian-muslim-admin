// src/pages/PrivacyPage.tsx
import React from "react";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "info@ummahway.com";

const PrivacyPage: React.FC = () => {
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
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Last updated: 06 June 2026
          </p>

          <p className="mt-6 text-base leading-7 text-slate-300">
            This Privacy Policy explains how UmmahWay ("we", "us", or "our")
            collects, uses, stores, and protects personal data when you use the
            UmmahWay website, mobile app, public masjid pages, forms, and admin
            console.
          </p>

          <section className="mt-8 space-y-6 text-sm leading-6 text-slate-300">
            <div>
              <h2 className="text-base font-bold text-white">1. Who We Are</h2>
              <p className="mt-2">
                UmmahWay helps Muslim communities in Trentino-Alto
                Adige/Suedtirol publish verified masjid information, prayer
                times, Jumu'ah schedules, announcements, Ramadan details, and
                community updates through a mobile app and web platform.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                2. Data We Collect
              </h2>
              <p className="mt-2">Depending on how you use UmmahWay, we may process:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <span className="font-semibold text-slate-100">
                    Account data:
                  </span>{" "}
                  email address, authentication details, profile role, and
                  masjid association for authorised admins.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">
                    Masjid and content data:
                  </span>{" "}
                  masjid names, addresses, coordinates, prayer times, Jumu'ah
                  times, announcements, sponsorship requests, and other content
                  submitted through the admin tools or public forms.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">
                    App preferences:
                  </span>{" "}
                  selected masjid, language, calculation preferences, display
                  settings, and notification choices.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">
                    Device and usage data:
                  </span>{" "}
                  device type, browser, operating system, app version, page or
                  screen activity, approximate usage time, and technical logs.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">
                    Optional location data:
                  </span>{" "}
                  if you allow location features, we may use your location to
                  show nearby masjids or map information. You can disable this
                  through your device settings.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">
                    Notification data:
                  </span>{" "}
                  push notification tokens and notification preferences, where
                  you choose to receive app notifications.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                3. How We Use Data
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>To provide and maintain the UmmahWay app and website.</li>
                <li>To show accurate masjid pages, prayer times, and maps.</li>
                <li>To let authorised admins manage their masjid content.</li>
                <li>To send notifications you have enabled.</li>
                <li>To protect accounts, prevent misuse, and secure the platform.</li>
                <li>To improve performance, reliability, and user experience.</li>
                <li>To respond to support, legal, or safety requests.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                4. Legal Bases Under GDPR
              </h2>
              <p className="mt-2">
                For users in the European Union, we rely on the following legal
                bases where applicable:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <span className="font-semibold text-slate-100">
                    Contract:
                  </span>{" "}
                  to provide the app, account, and admin console you use.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">
                    Legitimate interests:
                  </span>{" "}
                  to keep UmmahWay secure, reliable, and useful for communities.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">
                    Consent:
                  </span>{" "}
                  for optional features such as push notifications or precise
                  device location where consent is required.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">
                    Legal obligation:
                  </span>{" "}
                  where we must keep or disclose information under applicable
                  law.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                5. Public Masjid Information
              </h2>
              <p className="mt-2">
                Some masjid information is intentionally public, including
                names, city, address, map position, prayer schedules, Jumu'ah
                details, announcements, and public contact information provided
                by the masjid. Admins should only publish content they are
                authorised to share publicly.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                6. Service Providers
              </h2>
              <p className="mt-2">
                We use trusted providers to operate UmmahWay. This may include
                Supabase for database, authentication, and storage; Vercel or
                similar hosting providers for web delivery; Apple App Store and
                Google Play for app distribution; and map, analytics, email, or
                notification services where required by the product.
              </p>
              <p className="mt-2">
                These providers process data only as needed to provide their
                services to us and are expected to protect data appropriately.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                7. Data Sharing
              </h2>
              <p className="mt-2">
                We do not sell personal data. We may share limited data with
                service providers, authorised masjid admins, legal authorities
                when required, or another organisation if UmmahWay is
                reorganised, transferred, or continued under a successor.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                8. Data Retention
              </h2>
              <p className="mt-2">
                We keep data only for as long as needed for the purposes listed
                in this policy, including providing the service, maintaining
                security, resolving disputes, and meeting legal obligations.
                Admin content may remain visible until removed by authorised
                admins or by UmmahWay.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">9. Security</h2>
              <p className="mt-2">
                We use technical and organisational measures designed to protect
                personal data, including authenticated admin access, role-based
                permissions, encrypted connections, and hosted infrastructure
                controls. No online service can be guaranteed to be completely
                secure.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                10. Your Rights
              </h2>
              <p className="mt-2">
                Depending on your location, you may have the right to access,
                correct, delete, restrict, object to processing, request
                portability, or withdraw consent for your personal data. You may
                also have the right to lodge a complaint with a data protection
                authority.
              </p>
              <p className="mt-2">
                To exercise your rights, contact us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-emerald-200 underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">11. Children</h2>
              <p className="mt-2">
                UmmahWay is designed for general community use. Admin tools are
                intended for authorised adults. If you believe a child has
                provided personal data without appropriate permission, please
                contact us.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                12. International Transfers
              </h2>
              <p className="mt-2">
                Some providers may process data outside your country. Where
                required, we rely on appropriate safeguards such as contractual
                protections, provider security commitments, and applicable data
                transfer mechanisms.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                13. Changes To This Policy
              </h2>
              <p className="mt-2">
                We may update this Privacy Policy as UmmahWay grows or legal
                requirements change. The updated date above will show the latest
                version. Significant changes may also be communicated through
                the app, website, or another appropriate channel.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white">14. Contact</h2>
              <p className="mt-2">
                For privacy questions, requests, or concerns, contact UmmahWay
                at{" "}
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
          <Link to="/terms" className="transition hover:text-emerald-200">
            Terms &amp; Conditions
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
