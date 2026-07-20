// src/pages/TermsPage.tsx
import React from "react";
import { Link } from "react-router-dom";

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

const TermsPage: React.FC = () => {
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
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm font-semibold text-[#697875]">
            Last updated: 20 July 2026
          </p>

          <div className="mt-6 rounded-lg border border-[#cfd8d2] bg-[#edf3ef] p-5 text-base leading-7 text-[#425351]">
            These Terms govern your use of the UmmahWay mobile app, public
            website, multi-masjid directory, official masjid pages, TV display,
            admin console, support forms, sponsorship forms, and purchase
            features. By using UmmahWay, you agree to these Terms.
          </div>

          <div className="mt-8 space-y-5">
            <Section title="1. What UmmahWay Provides">
              <p>
                UmmahWay is a community platform for masjids and worshippers.
                The service can include official masjid websites, a public
                multi-masjid directory, maps, prayer times, Jumu&apos;ah
                schedules, announcements, Ramadan information, iftar workflows,
                TV display access, mobile app features, app download links,
                sponsorship forms, support tools, account pages, purchase
                history, and admin tools.
              </p>
            </Section>

            <Section title="2. No Emergency, Medical, Legal, Or Fatwa Service">
              <p>
                UmmahWay is an information platform. It is not an emergency
                service, medical service, legal service, financial adviser, or
                religious ruling service. For urgent situations, contact the
                appropriate local emergency services. For religious decisions,
                follow your trusted masjid, scholar, or religious authority.
              </p>
            </Section>

            <Section title="3. Prayer Times And Local Information">
              <p>
                Prayer times, jama&apos;ah times, Jumu&apos;ah schedules,
                announcements, Ramadan details, public pages, and masjid details
                may be entered by authorised masjid admins or provided by
                UmmahWay based on available information. We work to keep data
                accurate, but the local masjid remains the final authority for
                its own schedule, services, announcements, and access rules.
              </p>
              <p>
                Always verify important timing changes directly with the masjid,
                especially during Ramadan, holidays, exceptional events, travel,
                construction, weather disruption, or technical outages.
              </p>
            </Section>

            <Section title="4. Public Masjid Websites And TV Display">
              <p>
                Each active masjid may have a public official website on
                UmmahWay. These pages can show names, addresses, maps, prayer
                schedules, Jumu&apos;ah details, announcements, visit
                information, and TV display links. The TV display is intended
                for screen-friendly public masjid information.
              </p>
              <p>
                Masjid admins must not publish private, confidential, unsafe, or
                unauthorised content through public pages, announcements, or TV
                display surfaces. Public pages may be indexed, linked, shared,
                or displayed by users and search engines.
              </p>
            </Section>

            <Section title="5. Accounts And Admin Access">
              <p>
                Some features require an account. Admin access is only for
                people authorised to act on behalf of a masjid, association,
                business, sponsor, or approved organisation. You are responsible
                for keeping your login details secure and for activity under
                your account.
              </p>
              <p>
                We may approve, reject, limit, suspend, or remove account or
                admin access where needed to protect masjids, users, purchases,
                data integrity, public content, or the reputation and security
                of the service.
              </p>
            </Section>

            <Section title="6. Acceptable Use">
              <p>You agree not to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Use UmmahWay for illegal, harmful, deceptive, or abusive activity.</li>
                <li>Publish content you are not authorised to share publicly.</li>
                <li>Upload discriminatory, hateful, threatening, private, or misleading content.</li>
                <li>Impersonate a masjid, admin, business, sponsor, or other person.</li>
                <li>Interfere with prayer-time data, purchase records, maps, APIs, TV display, or infrastructure.</li>
                <li>Attempt to access accounts, admin tools, purchase data, or systems without permission.</li>
                <li>Scrape, copy, resell, or redistribute service data at scale without permission.</li>
                <li>Use public pages or support forms to spam, harass, phish, or collect data improperly.</li>
              </ul>
            </Section>

            <Section title="7. Admin Content Responsibility">
              <p>
                Admins are responsible for the accuracy, legality, permissions,
                and public suitability of the content they publish. This
                includes masjid profiles, addresses, coordinates, prayer times,
                Jumu&apos;ah schedules, announcements, Ramadan information,
                iftar details, public notes, business sponsorship information,
                images, names, contact details, and TV display content.
              </p>
              <p>
                UmmahWay may edit, hide, remove, or decline content that appears
                inaccurate, unauthorised, unsafe, unlawful, abusive, outdated,
                harmful, private, misleading, or unsuitable for the community.
              </p>
            </Section>

            <Section title="8. Purchases, Entitlements, And Purchase Guidance">
              <p>
                The current founding member offer is called{" "}
                <span className="font-black text-[#14201f]">
                  Founding Supporter
                </span>{" "}
                in the app. It is a one-time, non-consumable in-app purchase
                with product ID{" "}
                <span className="font-mono text-xs text-[#14201f]">
                  ummahway_founding_supporter_lifetime
                </span>
                . It is processed through Apple App Store on iOS or Google Play
                on Android and is not a recurring subscription.
              </p>
              <p>
                You must be signed in to your UmmahWay account before buying or
                restoring Founding Supporter access. The native app sends store
                proof of purchase to UmmahWay for verification. On iOS this can
                include an App Store transaction JWS; on Android this can
                include a Google Play purchase token. UmmahWay verifies the
                purchase with the relevant store, records the entitlement, and
                marks the account with{" "}
                <span className="font-mono text-xs text-[#14201f]">
                  founding_supporter
                </span>{" "}
                and{" "}
                <span className="font-mono text-xs text-[#14201f]">
                  lifetime_premium
                </span>{" "}
                when the purchase is valid.
              </p>
              <p>
                Founding Supporter unlocks the core premium features described
                in the app at checkout, including premium themes, Salah Tracker
                Pro, unlimited private Dua Journal entries, the Founding
                Supporter badge, optional Founding Wall participation, and
                selected future premium features such as Ramadan Tracker Pro
                when launched. The free Dua Journal limit is currently three
                entries; Founding Supporter removes that limit for the signed-in
                account.
              </p>
              <p>
                A one-time lifetime entitlement means access to the described
                paid features for as long as UmmahWay offers and supports those
                features for accounts in good standing. It does not guarantee
                that every feature, platform, price, integration, app-store
                rule, or third-party service will remain unchanged forever.
              </p>
              <div className="rounded-lg border border-[#dfe5df] bg-[#fbfcfa] p-4">
                <p className="font-black text-[#14201f]">
                  What to know before buying
                </p>
                <ul className="mt-2 list-disc space-y-2 pl-5">
                  <li>
                    Checkout is available only in native iOS or Android builds
                    that include in-app purchase support. Web builds and Expo Go
                    cannot complete this purchase.
                  </li>
                  <li>
                    Store prices, tax, payment methods, family sharing,
                    availability, and refund tooling are controlled by Apple or
                    Google for their platforms.
                  </li>
                  <li>
                    Product loading depends on the matching Apple App Store
                    Connect or Google Play Console product being approved,
                    active, and available in your region.
                  </li>
                  <li>
                    Restore Purchases checks the store account for the matching
                    Founding Supporter product and then re-verifies it against
                    your signed-in UmmahWay account.
                  </li>
                  <li>
                    Direct manual or admin unlocks may be used in limited
                    support, testing, community, or trusted administrative
                    cases.
                  </li>
                </ul>
              </div>
              <p>
                Purchase status is linked to the signed-in account, platform,
                product ID, transaction identifiers, purchase token or
                transaction proof, verification events, and revocation records
                available to UmmahWay. If a purchase does not appear, refresh
                your account status, check that you are signed in with the same
                UmmahWay account and the same Apple or Google account used at
                checkout, then use Restore Purchases in the app.
              </p>
              <p>
                Refunds, chargebacks, cancellations, revoked purchases, failed
                validation, misuse, or fraud signals may remove or limit paid
                access. Mandatory consumer rights that apply in your country are
                not excluded by these Terms.
              </p>
              <div className="rounded-lg border border-[#dfe5df] bg-[#fbfcfa] p-4">
                <p className="font-black text-[#14201f]">Purchase help</p>
                <ul className="mt-2 list-disc space-y-2 pl-5">
                  <li>
                    Apple App Store purchases: request refunds or check purchase
                    issues through{" "}
                    <a
                      href="https://support.apple.com/en-us/118223"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black text-[#0b6b62] underline"
                    >
                      Apple Support
                    </a>
                    .
                  </li>
                  <li>
                    Google Play purchases: review refund rules and request help
                    through{" "}
                    <a
                      href="https://support.google.com/googleplay/answer/2479637?hl=en-EN"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black text-[#0b6b62] underline"
                    >
                      Google Play Help
                    </a>
                    .
                  </li>
                  <li>
                    Direct or manual UmmahWay purchases: contact{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="font-black text-[#0b6b62] underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </li>
                </ul>
              </div>
            </Section>

            <Section title="9. Sponsorships And Business Submissions">
              <p>
                If you submit a sponsorship, advertising, or business form, you
                confirm that the information is accurate and that you have
                permission to submit it. Submission does not guarantee approval,
                placement, display, publication, performance, clicks, or
                continued availability.
              </p>
              <p>
                We may reject, edit, hide, or remove sponsorships or ads that do
                not fit the purpose, standards, legal requirements, or community
                expectations of UmmahWay.
              </p>
            </Section>

            <Section title="10. Intellectual Property">
              <p>
                The UmmahWay name, brand, design, website, app interface, code,
                and original materials belong to UmmahWay or its licensors.
                Masjids, businesses, and partners keep ownership of content they
                provide, but grant UmmahWay permission to host, display, format,
                distribute, translate, adapt for TV display, and promote that
                content as needed to operate the service.
              </p>
            </Section>

            <Section title="11. App Stores And Third-Party Services">
              <p>
                The mobile app may be distributed through Apple App Store and
                Google Play. Those stores may apply their own terms and privacy
                rules. UmmahWay may also rely on third-party providers for
                hosting, authentication, storage, maps, analytics, purchase
                validation, notifications, support, email delivery, and TV
                display delivery.
              </p>
              <p>
                We are not responsible for third-party outages, policy changes,
                billing decisions, store account issues, map inaccuracies, or
                services outside our control.
              </p>
            </Section>

            <Section title="12. Availability And Changes">
              <p>
                We aim to keep UmmahWay reliable, but we do not guarantee that
                the service will always be available, error-free, complete, or
                unchanged. We may update, suspend, limit, rename, redesign, or
                discontinue features when needed for security, maintenance,
                legal compliance, community trust, product improvement, or
                third-party platform requirements.
              </p>
            </Section>

            <Section title="13. Disclaimer Of Warranties">
              <p>
                UmmahWay is provided on an &quot;as is&quot; and &quot;as
                available&quot; basis. To the maximum extent permitted by law, we
                disclaim warranties of accuracy, availability, merchantability,
                fitness for a particular purpose, and non-infringement.
              </p>
            </Section>

            <Section title="14. Limitation Of Liability">
              <p>
                To the maximum extent permitted by law, UmmahWay is not liable
                for indirect, incidental, special, consequential, or punitive
                damages, or for losses caused by inaccurate community content,
                missed notifications, outages, map errors, purchase-provider
                issues, user conduct, admin mistakes, public display misuse, or
                third-party services.
              </p>
              <p>
                Nothing in these Terms limits liability where the law does not
                allow it to be limited.
              </p>
            </Section>

            <Section title="15. Termination">
              <p>
                You may stop using UmmahWay at any time. We may suspend or
                terminate access if you violate these Terms, misuse the service,
                create security risks, publish unauthorised content, interfere
                with purchase records, or harm the community or platform.
              </p>
            </Section>

            <Section title="16. Governing Law">
              <p>
                These Terms are governed by the laws applicable in Italy,
                without prejudice to mandatory consumer protection rights that
                may apply in your country of residence.
              </p>
            </Section>

            <Section title="17. Changes To These Terms">
              <p>
                We may update these Terms as UmmahWay grows or legal,
                purchase-provider, app-store, or product requirements change.
                The updated date above shows the latest version. Continued use
                of UmmahWay after changes become effective means you accept the
                updated Terms.
              </p>
            </Section>

            <Section title="18. Contact">
              <p>
                For questions about these Terms, contact{" "}
                <a
                  href={`mailto:${LEGAL_EMAIL}`}
                  className="font-black text-[#0b6b62] underline"
                >
                  {LEGAL_EMAIL}
                </a>
                . For purchase, account, or support issues, contact{" "}
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
            <Link to="/privacy" className="hover:text-[#0b6b62]">
              Privacy Policy
            </Link>
            <Link to="/contact?topic=purchase" className="hover:text-[#0b6b62]">
              Purchase Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
