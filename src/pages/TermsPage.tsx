// src/pages/TermsPage.tsx
import React from "react";
import { Link } from "react-router-dom";

const TermsPage: React.FC = () => {
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
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Last updated: 01 January 2025
          </p>

          <p className="mt-5 text-sm text-slate-300">
            These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of
            the Ummah Way app and the related admin console. By using the
            app, you agree to these Terms.
          </p>

          <section className="mt-6 space-y-4 text-sm text-slate-300">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                1. Service description
              </h2>
              <p className="mt-1">
                Ummah Way provides a digital platform where mosques can
                publish prayer times, Jumuʿah information, announcements and
                Ramadan details, and where worshippers can easily view this
                information.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                2. No emergency or fatwa service
              </h2>
              <p className="mt-1">
                Ummah Way is not an emergency service, and it does not
                provide religious rulings (fatwa). Always follow the instructions
                of your local mosque, religious authority and emergency services
                where relevant.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                3. Accounts &amp; admin access
              </h2>
              <p className="mt-1">
                Some features, especially the admin console, require an account.
                You are responsible for maintaining the confidentiality of your
                login credentials and for all activities carried out under your
                account.
              </p>
              <p className="mt-1">
                Admin access is granted only to individuals authorised by their
                mosque or organisation. We reserve the right to suspend or
                revoke access in case of misuse or security concerns.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                4. Acceptable use
              </h2>
              <p className="mt-1">You agree not to:</p>
              <ul className="mt-2 list-disc list-inside text-slate-300">
                <li>Use the app for illegal or harmful purposes.</li>
                <li>
                  Attempt to gain unauthorised access to the admin console, data
                  or infrastructure.
                </li>
                <li>
                  Upload or publish content that is abusive, discriminatory or
                  unrelated to mosque activities.
                </li>
                <li>
                  Reverse-engineer, modify or attempt to interfere with the
                  technical operation of the service.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                5. Content responsibility
              </h2>
              <p className="mt-1">
                Timings, announcements and other content for each masjid are
                published by that masjid&apos;s authorised admins. While we aim
                to work only with reliable partners, final responsibility for
                the correctness of local content lies with the masjid or
                organisation that publishes it.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                6. Intellectual property
              </h2>
              <p className="mt-1">
                The Ummah Way name, logo, design, and underlying software
                are protected by intellectual property laws. You may not copy,
                redistribute or use them in ways not permitted by these Terms
                without our prior written consent.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                7. Availability &amp; changes to the service
              </h2>
              <p className="mt-1">
                We aim to provide a stable service but cannot guarantee
                uninterrupted availability. We may change, suspend or discontinue
                parts of the app at any time, for example to improve security,
                comply with legal obligations or adapt to community needs.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                8. Disclaimer of warranties
              </h2>
              <p className="mt-1">
                Ummah Way is provided on an &quot;as is&quot; and &quot;as
                available&quot; basis. To the extent allowed by law, we exclude
                all warranties, whether express or implied, including but not
                limited to fitness for a particular purpose and non-infringement.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                9. Limitation of liability
              </h2>
              <p className="mt-1">
                To the maximum extent permitted by law, we are not liable for any
                indirect, incidental or consequential damages arising out of or
                in connection with your use of the app. In any case, our total
                liability will be limited to the amount you have paid (if any)
                for using the service during the 12 months before the claim.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                10. Termination
              </h2>
              <p className="mt-1">
                You may stop using the app at any time. We may suspend or
                terminate access if you violate these Terms, misuse the admin
                console or compromise the security or reputation of the service.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                11. Governing law
              </h2>
              <p className="mt-1">
                These Terms are governed by the laws applicable in Italy,
                without prejudice to any mandatory consumer protection rules that
                apply in your country of residence.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                12. Changes to these Terms
              </h2>
              <p className="mt-1">
                We may update these Terms from time to time. When we do, we will
                update the &quot;Last updated&quot; date above. Continued use of
                the app after changes become effective means you accept the
                updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-100">
                13. Contact
              </h2>
              <p className="mt-1">
                For questions about these Terms, please contact:
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
            to="/privacy"
            className="hover:text-emerald-300 transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
