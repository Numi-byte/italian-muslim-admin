// src/pages/PrivacyPage.tsx
import React from "react";
import { Link } from "react-router-dom";

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-400/60 flex items-center justify-center">
              <span className="text-xs font-bold tracking-widest text-emerald-300">
                IM
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-[0.22em] uppercase text-emerald-300">
                Ummah Way
              </span>
              <span className="text-[11px] text-slate-400">
                South Tyrol &amp; Trentino
              </span>
            </div>
          </Link>
          <Link
            to="/"
            className="text-[11px] text-slate-400 hover:text-emerald-300"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-2xl font-semibold text-slate-50">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Last updated: 01 January 2025
          </p>

          <p className="mt-5 text-sm text-slate-300">
            This Privacy Policy explains how Ummah Way (&quot;we&quot;,
            &quot;us&quot; or &quot;our&quot;) collects, uses and protects
            personal data when you use our mobile app and the related admin
            console.
          </p>

          <section className="mt-6 space-y-4 text-sm text-slate-300">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                1. Who we are
              </h2>
              <p className="mt-1 text-slate-300">
                Ummah Way is a digital service focused on mosques in South
                Tyrol and Trentino. The app provides verified prayer times,
                announcements and Ramadan information published by local
                masjids.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                2. Data we collect
              </h2>
              <p className="mt-1">
                Depending on how you use Ummah Way, we may process:
              </p>
              <ul className="mt-2 list-disc list-inside text-slate-300">
                <li>
                  <span className="font-semibold">Account data:</span> e-mail
                  address and basic profile if you create an account or access
                  the admin console.
                </li>
                <li>
                  <span className="font-semibold">Masjid selection:</span> your
                  preferred masjid stored on your device or, optionally, in your
                  account.
                </li>
                <li>
                  <span className="font-semibold">Usage data:</span> basic
                  technical information (device type, app version, approximate
                  timing of app usage) to keep the service secure and improve
                  performance.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                3. How we use your data
              </h2>
              <p className="mt-1">
                We use personal data strictly for the purposes of:
              </p>
              <ul className="mt-2 list-disc list-inside text-slate-300">
                <li>Providing the app and admin console functionality.</li>
                <li>
                  Remembering your selected masjid and app language preferences.
                </li>
                <li>
                  Securing the admin area and preventing unauthorised access.
                </li>
                <li>
                  Analysing aggregated usage to understand how the app is used
                  and where to improve.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                4. Legal basis (GDPR)
              </h2>
              <p className="mt-1">
                For users in the European Union, our main legal bases under the
                GDPR are:
              </p>
              <ul className="mt-2 list-disc list-inside text-slate-300">
                <li>
                  <span className="font-semibold">Performance of a contract:</span>{" "}
                  to provide the app when you install and use it.
                </li>
                <li>
                  <span className="font-semibold">Legitimate interest:</span> to
                  maintain security, prevent abuse and improve the service in a
                  privacy-respecting way.
                </li>
                <li>
                  <span className="font-semibold">Consent:</span> where
                  required, for optional features such as certain notifications
                  or communication.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                5. Data storage &amp; retention
              </h2>
              <p className="mt-1">
                We store data only for as long as necessary to provide the
                service or as required by law. Where possible, we keep data
                either:
              </p>
              <ul className="mt-2 list-disc list-inside text-slate-300">
                <li>On your device (for example, your selected masjid).</li>
                <li>
                  On servers located in the EU, with appropriate technical and
                  organisational security measures.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                6. Sharing of data
              </h2>
              <p className="mt-1">
                We do not sell your data. We may share limited information only
                with:
              </p>
              <ul className="mt-2 list-disc list-inside text-slate-300">
                <li>
                  Technical providers that help us host and run the service.
                </li>
                <li>
                  Masjid admins, where necessary, to understand anonymous usage
                  and improve how the app serves their community.
                </li>
                <li>
                  Authorities, only if required by applicable law or to respond
                  to lawful requests.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                7. Your rights
              </h2>
              <p className="mt-1">
                Depending on your location, you may have the right to:
              </p>
              <ul className="mt-2 list-disc list-inside text-slate-300">
                <li>Access the personal data we hold about you.</li>
                <li>Request correction or deletion of your data.</li>
                <li>Object to or restrict certain types of processing.</li>
                <li>Withdraw consent for optional features at any time.</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, you can contact us at{" "}
                <a
                  href="mailto:info@example.com"
                  className="text-emerald-300 underline"
                >
                  info@example.com
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                8. Children
              </h2>
              <p className="mt-1">
                Ummah Way is designed for general mosque audiences, but the
                admin console is intended only for authorised adults acting on
                behalf of masjids. If you believe a child has provided us with
                personal data without appropriate consent, please contact us.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                9. Changes to this policy
              </h2>
              <p className="mt-1">
                We may update this Privacy Policy from time to time. When we do,
                we will update the &quot;Last updated&quot; date at the top of
                this page. In case of significant changes, we may also notify
                you via the app or other appropriate channels.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                10. Contact
              </h2>
              <p className="mt-1">
                If you have questions about this Privacy Policy or how we handle
                personal data, please contact:
              </p>
              <p className="mt-1 text-slate-300">
                Email:{" "}
                <a
                  href="mailto:info@example.com"
                  className="text-emerald-300 underline"
                >
                  info@example.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 text-[11px] text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Ummah Way</span>
          <Link
            to="/terms"
            className="hover:text-emerald-300 transition-colors"
          >
            Terms &amp; Conditions
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
