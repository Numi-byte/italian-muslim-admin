// src/pages/PrivacyPage.tsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { getGlobalCanonicalUrl, setPageSeo } from "../lib/seo";

const LEGAL_EMAIL = "info@ummahway.com";
const SUPPORT_EMAIL = "support@ummahway.com";

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section className="rounded-lg border border-[#dfe5df] bg-white p-5 shadow-sm shadow-[#0d302b]/5">
    <h2 className="text-lg font-black text-[#14201f]">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-6 text-[#52615f]">
      {children}
    </div>
  </section>
);

const PrivacyPage: React.FC = () => {
  useEffect(() => {
    const canonicalUrl = getGlobalCanonicalUrl("/privacy");
    setPageSeo({
      title: "Privacy Policy | UmmahWay",
      description:
        "Read how UmmahWay collects, uses, stores, and protects data across the app, public masjid websites, TV display, support, sponsorship, and purchase features.",
      canonicalUrl,
      imageUrl: "https://ummahway.com/icon.png",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Privacy Policy",
        url: canonicalUrl,
        description:
          "How UmmahWay collects, uses, stores, and protects data across the app, public masjid websites, TV display, support, sponsorship, and purchase features.",
        isPartOf: {
          "@type": "WebSite",
          name: "UmmahWay",
          url: "https://ummahway.com",
        },
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#14201f]">
      <header className="sticky top-0 z-40 border-b border-[#dfe5df] bg-[#f6f7f4]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-10 w-10 rounded-lg" />
            <div className="leading-tight">
              <span className="block text-sm font-black text-[#14201f]">
                UmmahWay
              </span>
              <span className="hidden text-xs font-semibold text-[#697875] sm:block">
                Official Masjid Websites
              </span>
            </div>
          </Link>
          <Link
            to="/"
            className="rounded-md border border-[#cfd8d2] bg-white px-3 py-2 text-sm font-black text-[#14201f] hover:border-[#0b6b62]/40"
          >
            Home
          </Link>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-sm font-black text-[#0b6b62]">Legal</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm font-semibold text-[#697875]">
            Last updated: 20 July 2026
          </p>

          <div className="mt-6 rounded-lg border border-[#cfd8d2] bg-[#edf3ef] p-5 text-base leading-7 text-[#425351]">
            This Privacy Policy explains how UmmahWay collects, uses, stores,
            and protects data when you use the UmmahWay mobile app, public
            website, multi-masjid directory, official masjid pages, TV display,
            admin console, support forms, sponsorship forms, and purchase
            features.
          </div>

          <div className="mt-8 space-y-5">
            <Section title="1. Who We Are">
              <p>
                UmmahWay helps Muslim communities publish and access official
                masjid information. The service includes public masjid
                websites, prayer times, Jumu&apos;ah schedules, announcements,
                Ramadan updates, maps, TV display access, app downloads, admin
                tools, support, sponsorship, and purchase-related account
                features.
              </p>
              <p>
                For privacy questions, contact us at{" "}
                <a
                  href={`mailto:${LEGAL_EMAIL}`}
                  className="font-black text-[#0b6b62] underline"
                >
                  {LEGAL_EMAIL}
                </a>
                .
              </p>
            </Section>

            <Section title="2. Data We Collect">
              <p>Depending on how you use UmmahWay, we may process:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-black text-[#14201f]">
                    Account and admin data:
                  </span>{" "}
                  email address, user ID, authentication records, profile role,
                  admin permissions, assigned masjids, and account status.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">
                    Public masjid data:
                  </span>{" "}
                  masjid names, short names, slugs, cities, regions, addresses,
                  coordinates, time zones, prayer times, Jumu&apos;ah times,
                  announcements, Ramadan information, iftar information, public
                  notes, and visibility status.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">
                    Website and TV display data:
                  </span>{" "}
                  public page content, display-ready schedules, navigation
                  activity, page availability, and technical data needed to
                  deliver masjid websites and the TV experience.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">
                    App preferences:
                  </span>{" "}
                  selected masjid, language, prayer calculation preferences,
                  notification choices, selected theme, public display name,
                  Founding Wall visibility choice, display settings, and similar
                  app settings.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">
                    Purchase and entitlement data:
                  </span>{" "}
                  platform, product ID, purchase date, verification date,
                  transaction or original transaction identifiers, iOS
                  transaction JWS where used for App Store validation, Android
                  purchase token where used for Google Play validation,
                  purchase event status, entitlement status, revocation status,
                  store verification responses, and related validation records.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">
                    Premium feature data:
                  </span>{" "}
                  Salah Tracker records, Dua Journal entries, selected premium
                  themes, Founding Supporter badge status, Founding Wall display
                  name, optional wall message, wall visibility setting, and join
                  or creation dates connected to those features.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">
                    Support and form data:
                  </span>{" "}
                  name, email address, topic, subject, message, sponsorship or
                  business details, and rate-limiting or anti-abuse metadata
                  such as IP-derived technical information.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">
                    Device, analytics, and log data:
                  </span>{" "}
                  browser, device type, operating system, app version, pages or
                  screens viewed, approximate usage time, performance signals,
                  error logs, and security events.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">
                    Optional location and notification data:
                  </span>{" "}
                  location permission data used to show nearby masjids or map
                  information, and push notification tokens where you enable
                  notifications.
                </li>
              </ul>
            </Section>

            <Section title="3. How We Use Data">
              <ul className="list-disc space-y-2 pl-5">
                <li>To operate the UmmahWay app, website, and admin console.</li>
                <li>
                  To publish official masjid websites, prayer times, Jumu&apos;ah
                  schedules, announcements, maps, and TV display information.
                </li>
                <li>
                  To let authorised masjid teams manage public content and
                  timing data.
                </li>
                <li>
                  To verify purchases, maintain premium or lifetime
                  entitlements, detect revoked purchases, and show purchase
                  history.
                </li>
                <li>
                  To respond to support, sponsorship, privacy, legal, safety,
                  and account requests.
                </li>
                <li>
                  To protect accounts, prevent misuse, rate-limit forms, debug
                  errors, and secure the platform.
                </li>
                <li>
                  To improve reliability, performance, accessibility, and user
                  experience.
                </li>
              </ul>
            </Section>

            <Section title="4. Legal Bases Under GDPR">
              <p>
                For users in the European Union or European Economic Area, we
                rely on one or more legal bases depending on the feature:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-black text-[#14201f]">Contract:</span>{" "}
                  to provide accounts, purchases, app access, and requested
                  services.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">
                    Legitimate interests:
                  </span>{" "}
                  to operate secure public masjid websites, prevent abuse,
                  maintain platform reliability, and improve the service.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">Consent:</span>{" "}
                  for optional features such as push notifications, precise
                  location, or certain analytics where consent is required.
                </li>
                <li>
                  <span className="font-black text-[#14201f]">
                    Legal obligation:
                  </span>{" "}
                  where we must retain, disclose, or process information under
                  applicable law.
                </li>
              </ul>
            </Section>

            <Section title="5. Public Masjid Information">
              <p>
                Masjid pages are intended to be public official websites. Public
                information can include masjid names, addresses, map locations,
                daily schedules, Jumu&apos;ah details, announcements, Ramadan
                updates, TV display content, and other content submitted by
                authorised admins.
              </p>
              <p>
                Masjid admins should only publish personal data, names, phone
                numbers, images, or other identifying information when they have
                permission and a lawful basis to share it publicly.
              </p>
            </Section>

            <Section title="6. Purchases And Store Data">
              <p>
                If you buy the Founding Supporter founding member purchase, the
                current product ID is{" "}
                <span className="font-mono text-xs text-[#14201f]">
                  ummahway_founding_supporter_lifetime
                </span>
                . The payment is handled by Apple App Store on iOS or Google
                Play on Android. We do not receive your full card number from
                Apple or Google.
              </p>
              <p>
                To verify the purchase and keep your entitlement active, we may
                process your UmmahWay user ID, platform, product ID, purchase
                date, verification date, transaction ID, original transaction
                ID, Apple transaction JWS, Google purchase token, purchase event
                records, store verification responses, rate-limit metadata, and
                revocation status. Purchase tokens and transaction proof are
                used for verification, restore, support, fraud prevention,
                dispute handling, and entitlement audit.
              </p>
              <p>
                When a store purchase is valid, the account can be marked with{" "}
                <span className="font-mono text-xs text-[#14201f]">
                  founding_supporter
                </span>{" "}
                and{" "}
                <span className="font-mono text-xs text-[#14201f]">
                  lifetime_premium
                </span>
                . Premium access is treated as active only while the entitlement
                is valid and not revoked.
              </p>
              <p>
                Founding Supporter features may also create or use feature data.
                For example, premium themes store your selected theme, Salah
                Tracker stores prayer logs and analytics inputs, Dua Journal
                stores your private entries, and Founding Wall stores your
                display name, optional message, visibility setting, and join
                date.
              </p>
              <p>
                The Founding Wall is optional. If you choose to show your entry,
                your display name, optional message, and join date may be public
                to other users or website visitors. Your email address, private
                profile data, payment details, purchase token, transaction JWS,
                and private Dua Journal entries are not displayed on the
                Founding Wall.
              </p>
              <p>
                Refunds, cancellations, revoked purchases, and chargebacks may
                cause premium access to be removed or marked as revoked.
                Purchase history shown in the admin/account area is used to help
                you and support staff understand the current status of your
                entitlement.
              </p>
            </Section>

            <Section title="7. Service Providers">
              <p>
                We use trusted providers to operate UmmahWay. This may include
                Supabase for database, authentication, and storage; Vercel or
                similar hosting providers for web delivery; Apple App Store and
                Google Play for app distribution and purchases; map providers;
                analytics and error-monitoring tools; email or support tools;
                and notification services.
              </p>
              <p>
                These providers process data only as needed to provide their
                services to us and are expected to protect data appropriately.
              </p>
            </Section>

            <Section title="8. Data Sharing">
              <p>
                We do not sell personal data. We may share limited data with
                service providers, authorised masjid admins, app-store or
                payment providers, legal authorities where required, safety or
                abuse-prevention partners, or a successor organisation if
                UmmahWay is reorganised, transferred, or continued under another
                operator.
              </p>
            </Section>

            <Section title="9. Data Retention">
              <p>
                We keep data only as long as reasonably needed for the purposes
                described in this policy. Account, admin, and masjid content may
                remain while the account or masjid is active. Purchase records
                may be retained as needed for entitlement verification,
                accounting, fraud prevention, dispute handling, and legal
                obligations. Support messages are retained while needed to
                resolve the request and maintain service records.
              </p>
              <p>
                Public masjid content may remain visible until removed by an
                authorised admin or by UmmahWay.
              </p>
            </Section>

            <Section title="10. Security">
              <p>
                We use technical and organisational measures designed to protect
                data, including authenticated admin access, role-based
                permissions, encrypted connections, hosted infrastructure
                controls, audit-oriented purchase records, and form
                rate-limiting. No online service can be guaranteed completely
                secure.
              </p>
            </Section>

            <Section title="11. Your Rights">
              <p>
                Depending on your location, you may have the right to access,
                correct, delete, restrict, object to processing, request
                portability, withdraw consent, or lodge a complaint with a data
                protection authority. GDPR requests are generally answered
                without undue delay and, where required, within the applicable
                legal period.
              </p>
              <p>
                To exercise privacy rights, contact{" "}
                <a
                  href={`mailto:${LEGAL_EMAIL}`}
                  className="font-black text-[#0b6b62] underline"
                >
                  {LEGAL_EMAIL}
                </a>
                . For purchase or account support, contact{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-black text-[#0b6b62] underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </Section>

            <Section title="12. Children">
              <p>
                UmmahWay is designed for general community use. Admin tools,
                purchase management, sponsorship tools, and public publishing
                tools are intended for authorised adults. If you believe a child
                has provided personal data without appropriate permission,
                please contact us.
              </p>
            </Section>

            <Section title="13. International Transfers">
              <p>
                Some providers may process data outside your country. Where
                required, we rely on appropriate safeguards such as contractual
                protections, provider security commitments, and applicable data
                transfer mechanisms.
              </p>
            </Section>

            <Section title="14. Changes To This Policy">
              <p>
                We may update this Privacy Policy as UmmahWay grows, including
                when new website, TV display, admin, purchase, analytics, or
                support features are added. The updated date above shows the
                latest version.
              </p>
            </Section>

            <Section title="15. Contact">
              <p>
                For privacy questions, requests, or concerns, contact UmmahWay
                at{" "}
                <a
                  href={`mailto:${LEGAL_EMAIL}`}
                  className="font-black text-[#0b6b62] underline"
                >
                  {LEGAL_EMAIL}
                </a>
                . For support and purchases, contact{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-black text-[#0b6b62] underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#dfe5df] bg-[#edf2ee]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-5 text-sm font-bold text-[#536260] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>&copy; {new Date().getFullYear()} UmmahWay</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/terms" className="hover:text-[#0b6b62]">
              Terms &amp; Conditions
            </Link>
            <Link to="/contact?topic=privacy" className="hover:text-[#0b6b62]">
              Privacy Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
