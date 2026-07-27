import type { CountryCode, CountryConfig } from "./countryConfig";

export type LanguageCode = "en" | "de" | "it" | "ur" | "ar";

type TranslationDictionary = {
  [key: string]: string | TranslationDictionary;
};

export const LANGUAGE_STORAGE_KEY = "ummahway.language";

export const LANGUAGES: Array<{
  code: LanguageCode;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
}> = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
];

const countryLanguageDefaults: Partial<Record<CountryCode, LanguageCode>> = {
  it: "it",
  de: "de",
  at: "de",
  ch: "de",
  uk: "en",
  us: "en",
  ca: "en",
  nl: "en",
  be: "en",
  fr: "en",
  es: "en",
  pk: "ur",
  sa: "ar",
  ae: "ar",
};

export const translations = {
  en: {
    language: {
      label: "Language",
      country: "Country",
    },
    nav: {
      admin: "Admin",
      display: "Display",
      tvDisplay: "TV Display",
      explore: "Explore",
      more: "More",
      menu: "Menu",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact",
      masjids: "Masjids",
      list: "List",
    },
    links: {
      masjids: {
        name: "Masjid Prayer Times",
        navLabel: "Masjids",
        description:
          "Find official masjid pages with prayer times, Jumu'ah schedules, announcements, maps, and directions.",
      },
      listMasjid: {
        name: "List Your Masjid",
        navLabel: "List Masjid",
        description:
          "Create an official UmmahWay page for a masjid so worshippers can find accurate local information.",
      },
      tv: {
        name: "UmmahWay TV Display",
        navLabel: "TV",
        description:
          "Open the screen-friendly UmmahWay TV display for mosque halls, entrances, and community displays.",
      },
      sponsor: {
        name: "Sponsor Community Offers",
        navLabel: "Sponsors",
        description:
          "Apply to share reviewed sponsor offers with Muslim communities through UmmahWay.",
      },
      careers: {
        name: "Careers at UmmahWay",
        navLabel: "Careers",
        description:
          "Explore open roles at UmmahWay and submit a CV for active opportunities.",
      },
      contact: {
        name: "Contact UmmahWay",
        navLabel: "Contact",
        description:
          "Contact UmmahWay for support with accounts, purchases, masjid listings, timings, privacy, or technical issues.",
      },
    },
    store: {
      iosLabel: "Download on the",
      androidLabel: "Get it on",
      appStore: "App Store",
      googlePlay: "Google Play",
    },
    publicPages: {
      common: {
        home: "Home",
        backHome: "Back home",
        viewMasjids: "View masjids",
        findMasjids: "Find masjids",
        officialWebsites: "Official Masjid Websites",
        legal: "Legal",
        lastUpdated: "Last updated: 27 July 2026",
        privacyPolicy: "Privacy Policy",
        termsConditions: "Terms & Conditions",
        privacyContact: "Privacy Contact",
        purchaseSupport: "Purchase Support",
      },
      listMasjid: {
        tagline: "Masjid onboarding",
        eyebrow: "Official masjid pages",
        title: "List your masjid on UmmahWay",
        text:
          "Give your community one official place for prayer times, Jumu'ah schedules, announcements, directions, and TV display access.",
        bulletPublic:
          "A public page that can become the masjid's official website.",
        bulletAdmin:
          "Admin access for trusted volunteers who keep timings and notices updated.",
        bulletCountry:
          "Country-aware discovery so people can find local masjids faster.",
      },
      tv: {
        tagline: "TV Display",
        eyebrow: "Hall screens",
        title: "UmmahWay TV Display",
        text:
          "Open a clean display for masjid halls, entrances, and community screens with prayer times, Jumu'ah details, and important notices.",
        openDisplay: "Open TV display",
        listMasjid: "List your masjid",
        cardTitle: "Built for prayer spaces",
        bulletTimes:
          "Daily prayer times and jama'ah times stay visible at a glance.",
        bulletJumuah:
          "Jumu'ah schedules and masjid notices can be shown without a printed sheet.",
        bulletLink:
          "Each masjid can open the same display link from its official UmmahWay page.",
      },
      contact: {
        panelEyebrow: "Support",
        panelTitle: "Send us a message",
        panelText: "We'll reply to the email address you provide below.",
        name: "Name *",
        email: "Email *",
        topic: "Topic *",
        subject: "Subject *",
        message: "Message *",
        send: "Send message",
        sending: "Sending...",
        missingRequired: "Please complete all required fields.",
        invalidEmail: "Please enter a valid email address.",
        submitError: "Could not send your message.",
        success: "Thank you - your message has been sent.",
        topicPurchase: "Purchase or subscription",
        topicLogin: "Login or account access",
        topicMasjid: "Masjid or Jamaah timings",
        topicTechnical: "Technical issue",
        topicPrivacy: "Privacy or data request",
        topicOther: "Other",
        tagline: "Support",
        eyebrow: "Get in touch",
        title: "We're here to help",
        text:
          "Questions about a purchase, your account, or masjid timings? Send us a note and we'll get back to you.",
        replyNote: "Replies go to the email address in your message.",
        cardText:
          "For prayer times and notices, visit your masjid's page - each one is kept current by its own team.",
      },
    },
    home: {
      navTagline: "{country} masjid prayer times",
      seoTitle: "Masjid Prayer Times in {country} | UmmahWay",
      seoDescription:
        "Find masjids in {country}, daily prayer times, Jumu'ah schedules, announcements, directions, and UmmahWay TV display links.",
      heroTitle: "Prayer times from masjids in {country}.",
      heroText:
        "Every masjid listed for {country} shows today's prayer times, Jumu'ah, news and directions, kept up to date by the people who run it.",
      findMasjid: "Find a masjid",
      openDisplay: "Open display",
      listMasjid: "List a masjid",
      chooseCountry: "Choose your country",
      chooseCountryText:
        "This domain is not tied to one country yet, so select the country you want to browse.",
      show: "Show",
      masjidsListedLower: "masjids listed",
      onMap: "on the map",
      dailyPrayers: "daily prayers",
      directory: "Directory",
      directoryTitle: "Find your local masjid in {country}",
      masjidsListed: "Masjids listed",
      loadingMasjids: "Loading masjids...",
      loadMasjidsError: "Could not load masjids: {error}",
      noMasjids:
        "No masjids are listed for {country} yet. Choose another country or ask your masjid to join UmmahWay.",
      openPage: "Open page",
      directions: "Directions",
      display: "Display",
      map: "Map",
      noMappedLocations: "No mapped locations yet.",
      mapMore: "{name} and {count} more on the map",
      masjidLocations: "Masjid locations",
      everyPage: "Every page",
      pageSectionTitle: "What's on a masjid page",
      pageSectionText:
        "Each page is built around what people look for before heading to the masjid: the times, Friday details, notices and how to get there.",
      forTeams: "For masjid teams",
      teamsTitle: "One place to keep everything current",
      teamsText:
        "Update the times once and they show on the page, the app and the hall display together, with no juggling separate tools.",
      adminSignIn: "Admin sign in",
      getSetUp: "Get set up",
      adminConsole: "Admin console",
      timetableEditor: "Timetable editor",
      live: "Live",
      pageLabel: "Page",
      appLabel: "App",
      publicSite: "public site",
      hallScreen: "hall screen",
      mobileSync: "mobile sync",
      todaysTimes: "Today's times",
      saved: "Saved",
      jamaah: "jama'ah",
      appTitle: "Prayer times in your pocket",
      appText:
        "Get the UmmahWay app for prayer times, Jumu'ah and notices from the masjids near you.",
      footerText: "Prayer times for local masjids.",
      previewJumuahNote: "Khutbah in Italian & Arabic",
      previewNotice: "Notice",
      previewNoticeText: "Iftar sign-up opens after Maghrib.",
    },
    features: {
      dailyPrayerTimes: {
        title: "Daily prayer times",
        text: "Today's begins and jama'ah times for all five prayers, ready to check before you set off.",
      },
      jumuahTimes: {
        title: "Jumu'ah times",
        text: "Friday khutbah and jama'ah times, with the language and any overflow slots noted alongside.",
      },
      notices: {
        title: "News & notices",
        text: "Events, Ramadan timings and urgent changes from the masjid, in one place instead of scattered messages.",
      },
      hallDisplay: {
        title: "Hall display",
        text: "A screen-friendly timetable for entrances and prayer halls, opened straight from the same page.",
      },
    },
    adminFeatures: {
      profile: "Masjid profile and visibility",
      daily: "Daily begins and jama'ah times",
      jumuah: "Jumu'ah slots and khutbah notes",
      notices: "News and notices",
      ramadan: "Ramadan and iftar timings",
      editor: "Editor access for volunteers",
    },
    masjid: {
      seoTitle: "{name} Prayer Times & Jumu'ah | UmmahWay",
      seoDescription:
        "{name} in {city}, {country}: daily prayer times, Jumu'ah timetable, announcements, directions, and UmmahWay TV display.",
      breadcrumbMasjids: "Masjids in {country}",
      pageUnavailable: "Page unavailable",
      backToMasjids: "Back to all masjids",
      prayerTimes: "Prayer Times",
      news: "News",
      visitUs: "Visit Us",
      directions: "Directions",
      display: "Display",
      nextJamaah: "Next Jama'ah",
      inCountdown: "in {time}",
      noTimetableToday: "Today's timetable has not been published yet.",
      prayerTimetable: "Prayer Timetable",
      todayDate: "Today, {date}",
      begins: "Begins",
      jamaah: "Jama'ah",
      next: "Next",
      friday: "Friday",
      jumuahPrayer: "Jumu'ah Prayer",
      congregation: "Congregation",
      first: "First",
      second: "Second",
      slot: "Slot {slot}",
      khutbah: "Khutbah {time}",
      noJumuah: "The Jumu'ah timetable will appear here once it is set.",
      fromMasjid: "From the masjid",
      newsNotices: "News & Notices",
      noNotices: "There are no notices at the moment.",
      findUs: "Find us",
      visitTitle: "Visit the masjid",
      visitWithAddress:
        "You'll find us at {address}. Everyone is welcome for the five daily prayers and Jumu'ah.",
      visitWithCity:
        "{name} is in {city}. Everyone is welcome for the five daily prayers and Jumu'ah.",
      openInMaps: "Open in Maps",
      hallDisplay: "Hall Display",
      timetableScreen: "Timetable screen",
      mobileApp: "Mobile App",
      timesOnTheGo: "Times on the go",
      communityTitle: "A house of prayer for the community",
      latestNotice: "Latest notice",
      allMasjids: "All masjids",
      footerNote: "Prayer times and notices maintained by the masjid · UmmahWay",
      bottomPrayers: "Prayers",
    },
    masjidHighlights: {
      daily: "Five daily prayers in congregation",
      jumuah: "Jumu'ah khutbah and prayer every Friday",
      current: "Timetable kept current throughout the year",
      gatherings: "Ramadan, Eid and community gatherings",
    },
    categories: {
      general: "Notice",
      jumuah: "Jumu'ah",
      event: "Event",
      ramadan: "Ramadan",
      urgent: "Urgent",
    },
    prayers: {
      fajr: "Fajr",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
    },
  },
  de: {
    language: { label: "Sprache", country: "Land" },
    nav: {
      admin: "Admin",
      display: "Anzeige",
      tvDisplay: "TV-Anzeige",
      explore: "Entdecken",
      more: "Mehr",
      menu: "Menü",
      openMenu: "Menü öffnen",
      closeMenu: "Menü schließen",
      privacy: "Datenschutz",
      terms: "Bedingungen",
      contact: "Kontakt",
      masjids: "Moscheen",
      list: "Eintragen",
    },
    links: {
      masjids: {
        name: "Gebetszeiten der Moscheen",
        navLabel: "Moscheen",
        description:
          "Finde offizielle Moscheeseiten mit Gebetszeiten, Jumu'ah-Zeiten, Ankündigungen, Karten und Wegbeschreibung.",
      },
      listMasjid: {
        name: "Moschee eintragen",
        navLabel: "Moschee eintragen",
        description:
          "Erstelle eine offizielle UmmahWay-Seite, damit Besucher genaue lokale Informationen finden.",
      },
      tv: {
        name: "UmmahWay TV-Anzeige",
        navLabel: "TV",
        description:
          "Öffne die bildschirmfreundliche TV-Anzeige für Gebetsräume, Eingänge und Gemeindeflächen.",
      },
      sponsor: {
        name: "Gemeindeangebote sponsern",
        navLabel: "Sponsoren",
        description:
          "Bewirb dich, geprüfte Sponsor-Angebote mit muslimischen Gemeinden über UmmahWay zu teilen.",
      },
      careers: {
        name: "Karriere bei UmmahWay",
        navLabel: "Karriere",
        description:
          "Entdecke offene Rollen bei UmmahWay und sende deinen Lebenslauf für aktive Möglichkeiten.",
      },
      contact: {
        name: "UmmahWay kontaktieren",
        navLabel: "Kontakt",
        description:
          "Kontaktiere UmmahWay bei Fragen zu Konten, Käufen, Moscheeeinträgen, Zeiten, Datenschutz oder Technik.",
      },
    },
    store: {
      iosLabel: "Laden im",
      androidLabel: "Jetzt bei",
      appStore: "App Store",
      googlePlay: "Google Play",
    },
    publicPages: {
      common: {
        home: "Startseite",
        backHome: "Zur Startseite",
        viewMasjids: "Moscheen ansehen",
        findMasjids: "Moscheen finden",
        officialWebsites: "Offizielle Moschee-Websites",
        legal: "Rechtliches",
        lastUpdated: "Zuletzt aktualisiert: 27. Juli 2026",
        privacyPolicy: "Datenschutzerklärung",
        termsConditions: "Bedingungen",
        privacyContact: "Datenschutzkontakt",
        purchaseSupport: "Kauf-Support",
      },
      listMasjid: {
        tagline: "Moschee-Onboarding",
        eyebrow: "Offizielle Moscheeseiten",
        title: "Trage deine Moschee bei UmmahWay ein",
        text:
          "Gib deiner Gemeinde einen offiziellen Ort für Gebetszeiten, Jumu'ah-Pläne, Ankündigungen, Wegbeschreibung und TV-Anzeige.",
        bulletPublic:
          "Eine öffentliche Seite, die zur offiziellen Website der Moschee werden kann.",
        bulletAdmin:
          "Adminzugang für vertrauenswürdige Helfer, die Zeiten und Hinweise aktuell halten.",
        bulletCountry:
          "Länderbezogene Suche, damit Menschen lokale Moscheen schneller finden.",
      },
      tv: {
        tagline: "TV-Anzeige",
        eyebrow: "Hallenbildschirme",
        title: "UmmahWay TV-Anzeige",
        text:
          "Öffne eine klare Anzeige für Gebetsräume, Eingänge und Gemeindebildschirme mit Gebetszeiten, Jumu'ah-Details und wichtigen Hinweisen.",
        openDisplay: "TV-Anzeige öffnen",
        listMasjid: "Moschee eintragen",
        cardTitle: "Für Gebetsräume gebaut",
        bulletTimes:
          "Tägliche Gebetszeiten und Jama'ah-Zeiten bleiben auf einen Blick sichtbar.",
        bulletJumuah:
          "Jumu'ah-Pläne und Moschee-Hinweise können ohne gedruckten Aushang gezeigt werden.",
        bulletLink:
          "Jede Moschee kann denselben Anzeigelink von ihrer offiziellen UmmahWay-Seite öffnen.",
      },
      contact: {
        panelEyebrow: "Support",
        panelTitle: "Schreib uns eine Nachricht",
        panelText:
          "Wir antworten an die E-Mail-Adresse, die du unten angibst.",
        name: "Name *",
        email: "E-Mail *",
        topic: "Thema *",
        subject: "Betreff *",
        message: "Nachricht *",
        send: "Nachricht senden",
        sending: "Wird gesendet...",
        missingRequired: "Bitte fülle alle Pflichtfelder aus.",
        invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
        submitError: "Deine Nachricht konnte nicht gesendet werden.",
        success: "Danke - deine Nachricht wurde gesendet.",
        topicPurchase: "Kauf oder Abo",
        topicLogin: "Login oder Kontozugang",
        topicMasjid: "Moschee- oder Jamaah-Zeiten",
        topicTechnical: "Technisches Problem",
        topicPrivacy: "Datenschutz- oder Datenanfrage",
        topicOther: "Anderes",
        tagline: "Support",
        eyebrow: "Kontakt aufnehmen",
        title: "Wir helfen dir gern",
        text:
          "Fragen zu einem Kauf, deinem Konto oder Moscheezeiten? Schreib uns und wir melden uns.",
        replyNote: "Antworten gehen an die E-Mail-Adresse in deiner Nachricht.",
        cardText:
          "Für Gebetszeiten und Hinweise besuche die Seite deiner Moschee - sie wird vom jeweiligen Team aktuell gehalten.",
      },
    },
    home: {
      navTagline: "Gebetszeiten für Moscheen in {country}",
      seoTitle: "Gebetszeiten der Moscheen in {country} | UmmahWay",
      seoDescription:
        "Finde Moscheen in {country}, tägliche Gebetszeiten, Jumu'ah-Pläne, Ankündigungen, Wegbeschreibungen und UmmahWay TV-Anzeigen.",
      heroTitle: "Gebetszeiten von Moscheen in {country}.",
      heroText:
        "Jede gelistete Moschee in {country} zeigt heutige Gebetszeiten, Jumu'ah, Neuigkeiten und Wegbeschreibung, gepflegt von den Verantwortlichen der Moschee.",
      findMasjid: "Moschee finden",
      openDisplay: "Anzeige öffnen",
      listMasjid: "Moschee eintragen",
      chooseCountry: "Land auswählen",
      chooseCountryText:
        "Diese Domain ist noch keinem Land fest zugeordnet. Wähle das Land aus, das du durchsuchen möchtest.",
      show: "Anzeigen",
      masjidsListedLower: "Moscheen gelistet",
      onMap: "auf der Karte",
      dailyPrayers: "tägliche Gebete",
      directory: "Verzeichnis",
      directoryTitle: "Finde deine lokale Moschee in {country}",
      masjidsListed: "Gelistete Moscheen",
      loadingMasjids: "Moscheen werden geladen...",
      loadMasjidsError: "Moscheen konnten nicht geladen werden: {error}",
      noMasjids:
        "Für {country} sind noch keine Moscheen gelistet. Wähle ein anderes Land oder bitte deine Moschee, UmmahWay beizutreten.",
      openPage: "Seite öffnen",
      directions: "Wegbeschreibung",
      display: "Anzeige",
      map: "Karte",
      noMappedLocations: "Noch keine Standorte auf der Karte.",
      mapMore: "{name} und {count} weitere auf der Karte",
      masjidLocations: "Moschee-Standorte",
      everyPage: "Jede Seite",
      pageSectionTitle: "Was auf einer Moscheeseite steht",
      pageSectionText:
        "Jede Seite ist auf das ausgerichtet, was Besucher vor dem Weg zur Moschee suchen: Zeiten, Freitagsdetails, Hinweise und Anfahrt.",
      forTeams: "Für Moschee-Teams",
      teamsTitle: "Ein Ort, um alles aktuell zu halten",
      teamsText:
        "Aktualisiere die Zeiten einmal und sie erscheinen auf Seite, App und Hallenanzeige zusammen, ohne mehrere Werkzeuge zu pflegen.",
      adminSignIn: "Admin-Anmeldung",
      getSetUp: "Einrichtung starten",
      adminConsole: "Admin-Konsole",
      timetableEditor: "Zeitplan-Editor",
      live: "Live",
      pageLabel: "Seite",
      appLabel: "App",
      publicSite: "öffentliche Seite",
      hallScreen: "Hallenbildschirm",
      mobileSync: "mobile Synchronisierung",
      todaysTimes: "Heutige Zeiten",
      saved: "Gespeichert",
      jamaah: "Jama'ah",
      appTitle: "Gebetszeiten in deiner Tasche",
      appText:
        "Hol dir die UmmahWay-App für Gebetszeiten, Jumu'ah und Hinweise der Moscheen in deiner Nähe.",
      footerText: "Gebetszeiten für lokale Moscheen.",
      previewJumuahNote: "Khutbah auf Italienisch & Arabisch",
      previewNotice: "Hinweis",
      previewNoticeText: "Iftar-Anmeldung öffnet nach Maghrib.",
    },
    features: {
      dailyPrayerTimes: {
        title: "Tägliche Gebetszeiten",
        text: "Heutige Beginn- und Jama'ah-Zeiten für alle fünf Gebete, bereit zum Prüfen vor dem Losgehen.",
      },
      jumuahTimes: {
        title: "Jumu'ah-Zeiten",
        text: "Freitags-Khutbah und Jama'ah-Zeiten, mit Sprache und möglichen Zusatzzeiten.",
      },
      notices: {
        title: "Neuigkeiten & Hinweise",
        text: "Veranstaltungen, Ramadan-Zeiten und dringende Änderungen der Moschee an einem Ort.",
      },
      hallDisplay: {
        title: "Hallenanzeige",
        text: "Ein bildschirmfreundlicher Zeitplan für Eingänge und Gebetsräume, direkt von derselben Seite.",
      },
    },
    adminFeatures: {
      profile: "Moscheeprofil und Sichtbarkeit",
      daily: "Tägliche Beginn- und Jama'ah-Zeiten",
      jumuah: "Jumu'ah-Slots und Khutbah-Notizen",
      notices: "Neuigkeiten und Hinweise",
      ramadan: "Ramadan- und Iftar-Zeiten",
      editor: "Editorzugang für Freiwillige",
    },
    masjid: {
      seoTitle: "{name} Gebetszeiten & Jumu'ah | UmmahWay",
      seoDescription:
        "{name} in {city}, {country}: tägliche Gebetszeiten, Jumu'ah-Plan, Ankündigungen, Wegbeschreibung und UmmahWay TV-Anzeige.",
      breadcrumbMasjids: "Moscheen in {country}",
      pageUnavailable: "Seite nicht verfügbar",
      backToMasjids: "Zurück zu allen Moscheen",
      prayerTimes: "Gebetszeiten",
      news: "Neuigkeiten",
      visitUs: "Besuchen",
      directions: "Wegbeschreibung",
      display: "Anzeige",
      nextJamaah: "Nächste Jama'ah",
      inCountdown: "in {time}",
      noTimetableToday: "Der heutige Zeitplan wurde noch nicht veröffentlicht.",
      prayerTimetable: "Gebetszeitplan",
      todayDate: "Heute, {date}",
      begins: "Beginn",
      jamaah: "Jama'ah",
      next: "Nächste",
      friday: "Freitag",
      jumuahPrayer: "Jumu'ah-Gebet",
      congregation: "Gemeindegebet",
      first: "Erste",
      second: "Zweite",
      slot: "Slot {slot}",
      khutbah: "Khutbah {time}",
      noJumuah: "Der Jumu'ah-Zeitplan erscheint hier, sobald er eingetragen ist.",
      fromMasjid: "Von der Moschee",
      newsNotices: "Neuigkeiten & Hinweise",
      noNotices: "Zurzeit gibt es keine Hinweise.",
      findUs: "So findest du uns",
      visitTitle: "Die Moschee besuchen",
      visitWithAddress:
        "Du findest uns unter {address}. Alle sind zu den fünf täglichen Gebeten und Jumu'ah willkommen.",
      visitWithCity:
        "{name} befindet sich in {city}. Alle sind zu den fünf täglichen Gebeten und Jumu'ah willkommen.",
      openInMaps: "In Karten öffnen",
      hallDisplay: "Hallenanzeige",
      timetableScreen: "Zeitplan-Bildschirm",
      mobileApp: "Mobile App",
      timesOnTheGo: "Zeiten unterwegs",
      communityTitle: "Ein Haus des Gebets für die Gemeinde",
      latestNotice: "Neuester Hinweis",
      allMasjids: "Alle Moscheen",
      footerNote: "Gebetszeiten und Hinweise werden von der Moschee gepflegt · UmmahWay",
      bottomPrayers: "Gebete",
    },
    masjidHighlights: {
      daily: "Fünf tägliche Gebete in Gemeinschaft",
      jumuah: "Jumu'ah-Khutbah und Gebet jeden Freitag",
      current: "Zeitplan das ganze Jahr aktuell",
      gatherings: "Ramadan, Eid und Gemeindetreffen",
    },
    categories: {
      general: "Hinweis",
      jumuah: "Jumu'ah",
      event: "Veranstaltung",
      ramadan: "Ramadan",
      urgent: "Dringend",
    },
    prayers: {
      fajr: "Fajr",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
    },
  },
  it: {
    language: { label: "Lingua", country: "Paese" },
    nav: {
      admin: "Admin",
      display: "Schermo",
      tvDisplay: "Schermo TV",
      explore: "Esplora",
      more: "Altro",
      menu: "Menu",
      openMenu: "Apri menu",
      closeMenu: "Chiudi menu",
      privacy: "Privacy",
      terms: "Condizioni",
      contact: "Contatti",
      masjids: "Moschee",
      list: "Inserisci",
    },
    links: {
      masjids: {
        name: "Orari di preghiera delle moschee",
        navLabel: "Moschee",
        description:
          "Trova pagine ufficiali delle moschee con orari di preghiera, Jumu'ah, annunci, mappe e indicazioni.",
      },
      listMasjid: {
        name: "Inserisci la tua moschea",
        navLabel: "Inserisci moschea",
        description:
          "Crea una pagina ufficiale UmmahWay per una moschea così i fedeli trovano informazioni locali accurate.",
      },
      tv: {
        name: "Schermo TV UmmahWay",
        navLabel: "TV",
        description:
          "Apri lo schermo UmmahWay ottimizzato per sale di preghiera, ingressi e spazi comunitari.",
      },
      sponsor: {
        name: "Sponsorizza offerte per la comunità",
        navLabel: "Sponsor",
        description:
          "Candidati per condividere offerte sponsorizzate revisionate con le comunità musulmane tramite UmmahWay.",
      },
      careers: {
        name: "Lavora con UmmahWay",
        navLabel: "Carriere",
        description:
          "Scopri i ruoli aperti in UmmahWay e invia il tuo CV per le opportunità attive.",
      },
      contact: {
        name: "Contatta UmmahWay",
        navLabel: "Contatti",
        description:
          "Contatta UmmahWay per account, acquisti, schede moschee, orari, privacy o problemi tecnici.",
      },
    },
    store: {
      iosLabel: "Scarica su",
      androidLabel: "Disponibile su",
      appStore: "App Store",
      googlePlay: "Google Play",
    },
    publicPages: {
      common: {
        home: "Home",
        backHome: "Torna alla home",
        viewMasjids: "Vedi moschee",
        findMasjids: "Trova moschee",
        officialWebsites: "Siti ufficiali delle moschee",
        legal: "Legale",
        lastUpdated: "Ultimo aggiornamento: 27 luglio 2026",
        privacyPolicy: "Informativa sulla privacy",
        termsConditions: "Termini e condizioni",
        privacyContact: "Contatto privacy",
        purchaseSupport: "Supporto acquisti",
      },
      listMasjid: {
        tagline: "Onboarding moschea",
        eyebrow: "Pagine ufficiali delle moschee",
        title: "Inserisci la tua moschea su UmmahWay",
        text:
          "Dai alla tua comunità un luogo ufficiale per orari di preghiera, programmi del Jumu'ah, annunci, indicazioni e display TV.",
        bulletPublic:
          "Una pagina pubblica che può diventare il sito ufficiale della moschea.",
        bulletAdmin:
          "Accesso admin per volontari fidati che tengono aggiornati orari e avvisi.",
        bulletCountry:
          "Scoperta per paese, così le persone trovano più velocemente le moschee locali.",
      },
      tv: {
        tagline: "Display TV",
        eyebrow: "Schermi della sala",
        title: "Display TV UmmahWay",
        text:
          "Apri un display pulito per sale di preghiera, ingressi e schermi comunitari con orari, dettagli del Jumu'ah e avvisi importanti.",
        openDisplay: "Apri display TV",
        listMasjid: "Inserisci la moschea",
        cardTitle: "Pensato per gli spazi di preghiera",
        bulletTimes:
          "Gli orari giornalieri e della jama'ah restano visibili a colpo d'occhio.",
        bulletJumuah:
          "Programmi del Jumu'ah e avvisi della moschea possono essere mostrati senza fogli stampati.",
        bulletLink:
          "Ogni moschea può aprire lo stesso link display dalla propria pagina ufficiale UmmahWay.",
      },
      contact: {
        panelEyebrow: "Supporto",
        panelTitle: "Mandaci un messaggio",
        panelText: "Risponderemo all'indirizzo email che indichi qui sotto.",
        name: "Nome *",
        email: "Email *",
        topic: "Argomento *",
        subject: "Oggetto *",
        message: "Messaggio *",
        send: "Invia messaggio",
        sending: "Invio...",
        missingRequired: "Compila tutti i campi obbligatori.",
        invalidEmail: "Inserisci un indirizzo email valido.",
        submitError: "Non è stato possibile inviare il messaggio.",
        success: "Grazie - il tuo messaggio è stato inviato.",
        topicPurchase: "Acquisto o abbonamento",
        topicLogin: "Accesso o account",
        topicMasjid: "Orari moschea o jamaah",
        topicTechnical: "Problema tecnico",
        topicPrivacy: "Richiesta privacy o dati",
        topicOther: "Altro",
        tagline: "Supporto",
        eyebrow: "Contattaci",
        title: "Siamo qui per aiutarti",
        text:
          "Domande su un acquisto, il tuo account o gli orari della moschea? Scrivici e ti risponderemo.",
        replyNote: "Le risposte arrivano all'email indicata nel messaggio.",
        cardText:
          "Per orari e avvisi, visita la pagina della tua moschea - ogni pagina è aggiornata dal suo team.",
      },
    },
    home: {
      navTagline: "Orari di preghiera delle moschee in {country}",
      seoTitle: "Orari di preghiera delle moschee in {country} | UmmahWay",
      seoDescription:
        "Trova moschee in {country}, orari giornalieri, Jumu'ah, annunci, indicazioni e link allo schermo TV UmmahWay.",
      heroTitle: "Orari di preghiera dalle moschee in {country}.",
      heroText:
        "Ogni moschea elencata in {country} mostra gli orari di oggi, Jumu'ah, notizie e indicazioni, aggiornati dalle persone che la gestiscono.",
      findMasjid: "Trova una moschea",
      openDisplay: "Apri schermo",
      listMasjid: "Inserisci una moschea",
      chooseCountry: "Scegli il paese",
      chooseCountryText:
        "Questo dominio non è ancora collegato a un solo paese, quindi seleziona quello che vuoi consultare.",
      show: "Mostra",
      masjidsListedLower: "moschee elencate",
      onMap: "sulla mappa",
      dailyPrayers: "preghiere giornaliere",
      directory: "Directory",
      directoryTitle: "Trova la tua moschea locale in {country}",
      masjidsListed: "Moschee elencate",
      loadingMasjids: "Caricamento moschee...",
      loadMasjidsError: "Impossibile caricare le moschee: {error}",
      noMasjids:
        "Non ci sono ancora moschee elencate per {country}. Scegli un altro paese o chiedi alla tua moschea di unirsi a UmmahWay.",
      openPage: "Apri pagina",
      directions: "Indicazioni",
      display: "Schermo",
      map: "Mappa",
      noMappedLocations: "Nessuna posizione sulla mappa ancora.",
      mapMore: "{name} e altre {count} sulla mappa",
      masjidLocations: "Posizioni delle moschee",
      everyPage: "Ogni pagina",
      pageSectionTitle: "Cosa trovi in una pagina moschea",
      pageSectionText:
        "Ogni pagina è costruita intorno a ciò che le persone cercano prima di andare in moschea: orari, dettagli del venerdì, avvisi e indicazioni.",
      forTeams: "Per i team delle moschee",
      teamsTitle: "Un unico posto per tenere tutto aggiornato",
      teamsText:
        "Aggiorna gli orari una volta e appaiono sulla pagina, nell'app e sullo schermo della sala, senza gestire strumenti separati.",
      adminSignIn: "Accesso admin",
      getSetUp: "Configura",
      adminConsole: "Console admin",
      timetableEditor: "Editor orari",
      live: "Live",
      pageLabel: "Pagina",
      appLabel: "App",
      publicSite: "sito pubblico",
      hallScreen: "schermo sala",
      mobileSync: "sync mobile",
      todaysTimes: "Orari di oggi",
      saved: "Salvato",
      jamaah: "jama'ah",
      appTitle: "Orari di preghiera in tasca",
      appText:
        "Scarica l'app UmmahWay per orari di preghiera, Jumu'ah e avvisi dalle moschee vicino a te.",
      footerText: "Orari di preghiera per moschee locali.",
      previewJumuahNote: "Khutbah in italiano e arabo",
      previewNotice: "Avviso",
      previewNoticeText: "Le iscrizioni iftar aprono dopo Maghrib.",
    },
    features: {
      dailyPrayerTimes: {
        title: "Orari di preghiera giornalieri",
        text: "Inizio e jama'ah di oggi per tutte le cinque preghiere, pronti da controllare prima di uscire.",
      },
      jumuahTimes: {
        title: "Orari Jumu'ah",
        text: "Khutbah e jama'ah del venerdì, con lingua ed eventuali turni aggiuntivi indicati accanto.",
      },
      notices: {
        title: "Notizie e avvisi",
        text: "Eventi, orari Ramadan e cambiamenti urgenti dalla moschea in un unico posto.",
      },
      hallDisplay: {
        title: "Schermo sala",
        text: "Un calendario ottimizzato per ingressi e sale di preghiera, aperto dalla stessa pagina.",
      },
    },
    adminFeatures: {
      profile: "Profilo moschea e visibilità",
      daily: "Inizio giornaliero e orari jama'ah",
      jumuah: "Slot Jumu'ah e note khutbah",
      notices: "Notizie e avvisi",
      ramadan: "Orari Ramadan e iftar",
      editor: "Accesso editor per volontari",
    },
    masjid: {
      seoTitle: "{name} Orari di preghiera e Jumu'ah | UmmahWay",
      seoDescription:
        "{name} a {city}, {country}: orari giornalieri, Jumu'ah, annunci, indicazioni e schermo TV UmmahWay.",
      breadcrumbMasjids: "Moschee in {country}",
      pageUnavailable: "Pagina non disponibile",
      backToMasjids: "Torna a tutte le moschee",
      prayerTimes: "Orari preghiere",
      news: "Notizie",
      visitUs: "Visita",
      directions: "Indicazioni",
      display: "Schermo",
      nextJamaah: "Prossima Jama'ah",
      inCountdown: "tra {time}",
      noTimetableToday: "L'orario di oggi non è ancora stato pubblicato.",
      prayerTimetable: "Orario di preghiera",
      todayDate: "Oggi, {date}",
      begins: "Inizio",
      jamaah: "Jama'ah",
      next: "Prossima",
      friday: "Venerdì",
      jumuahPrayer: "Preghiera Jumu'ah",
      congregation: "Congregazione",
      first: "Prima",
      second: "Seconda",
      slot: "Slot {slot}",
      khutbah: "Khutbah {time}",
      noJumuah: "L'orario Jumu'ah apparirà qui appena sarà impostato.",
      fromMasjid: "Dalla moschea",
      newsNotices: "Notizie e avvisi",
      noNotices: "Al momento non ci sono avvisi.",
      findUs: "Dove siamo",
      visitTitle: "Visita la moschea",
      visitWithAddress:
        "Ci trovi a {address}. Tutti sono benvenuti per le cinque preghiere giornaliere e Jumu'ah.",
      visitWithCity:
        "{name} si trova a {city}. Tutti sono benvenuti per le cinque preghiere giornaliere e Jumu'ah.",
      openInMaps: "Apri in Mappe",
      hallDisplay: "Schermo sala",
      timetableScreen: "Schermo orari",
      mobileApp: "App mobile",
      timesOnTheGo: "Orari in movimento",
      communityTitle: "Una casa di preghiera per la comunità",
      latestNotice: "Ultimo avviso",
      allMasjids: "Tutte le moschee",
      footerNote: "Orari e avvisi mantenuti dalla moschea · UmmahWay",
      bottomPrayers: "Preghiere",
    },
    masjidHighlights: {
      daily: "Cinque preghiere giornaliere in congregazione",
      jumuah: "Khutbah e preghiera Jumu'ah ogni venerdì",
      current: "Orario aggiornato tutto l'anno",
      gatherings: "Ramadan, Eid e incontri comunitari",
    },
    categories: {
      general: "Avviso",
      jumuah: "Jumu'ah",
      event: "Evento",
      ramadan: "Ramadan",
      urgent: "Urgente",
    },
    prayers: {
      fajr: "Fajr",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
    },
  },
  ur: {
    language: { label: "زبان", country: "ملک" },
    nav: {
      admin: "ایڈمن",
      display: "ڈسپلے",
      tvDisplay: "ٹی وی ڈسپلے",
      explore: "دیکھیں",
      more: "مزید",
      menu: "مینو",
      openMenu: "مینو کھولیں",
      closeMenu: "مینو بند کریں",
      privacy: "پرائیویسی",
      terms: "شرائط",
      contact: "رابطہ",
      masjids: "مساجد",
      list: "درج کریں",
    },
    links: {
      masjids: {
        name: "مساجد کے اوقات نماز",
        navLabel: "مساجد",
        description:
          "اوقات نماز، جمعہ، اعلانات، نقشے اور راستے کے ساتھ سرکاری مسجد صفحات تلاش کریں۔",
      },
      listMasjid: {
        name: "اپنی مسجد درج کریں",
        navLabel: "مسجد درج کریں",
        description:
          "مسجد کے لئے سرکاری UmmahWay صفحہ بنائیں تاکہ نمازی درست مقامی معلومات حاصل کر سکیں۔",
      },
      tv: {
        name: "UmmahWay ٹی وی ڈسپلے",
        navLabel: "ٹی وی",
        description:
          "مسجد ہال، داخلی راستوں اور کمیونٹی اسکرینوں کے لئے واضح ٹی وی ڈسپلے کھولیں۔",
      },
      sponsor: {
        name: "کمیونٹی آفرز اسپانسر کریں",
        navLabel: "اسپانسرز",
        description:
          "UmmahWay کے ذریعے مسلم کمیونٹیز کے ساتھ منظور شدہ اسپانسر آفرز شیئر کرنے کے لئے درخواست دیں۔",
      },
      careers: {
        name: "UmmahWay میں کیریئر",
        navLabel: "کیریئر",
        description:
          "UmmahWay میں کھلے کردار دیکھیں اور فعال مواقع کے لئے اپنا سی وی جمع کروائیں۔",
      },
      contact: {
        name: "UmmahWay سے رابطہ",
        navLabel: "رابطہ",
        description:
          "اکاؤنٹ، خریداری، مسجد لسٹنگ، اوقات، پرائیویسی یا تکنیکی مدد کے لئے رابطہ کریں۔",
      },
    },
    store: {
      iosLabel: "ڈاؤن لوڈ کریں",
      androidLabel: "حاصل کریں",
      appStore: "App Store",
      googlePlay: "Google Play",
    },
    publicPages: {
      common: {
        home: "ہوم",
        backHome: "ہوم پر واپس",
        viewMasjids: "مساجد دیکھیں",
        findMasjids: "مساجد تلاش کریں",
        officialWebsites: "سرکاری مسجد ویب سائٹس",
        legal: "قانونی",
        lastUpdated: "آخری تازہ کاری: 27 جولائی 2026",
        privacyPolicy: "پرائیویسی پالیسی",
        termsConditions: "شرائط و ضوابط",
        privacyContact: "پرائیویسی رابطہ",
        purchaseSupport: "خریداری سپورٹ",
      },
      listMasjid: {
        tagline: "مسجد آن بورڈنگ",
        eyebrow: "سرکاری مسجد صفحات",
        title: "اپنی مسجد UmmahWay پر شامل کریں",
        text:
          "اپنی کمیونٹی کو اوقات نماز، جمعہ شیڈول، اعلانات، راستہ اور ٹی وی ڈسپلے کے لئے ایک سرکاری جگہ دیں۔",
        bulletPublic:
          "ایک عوامی صفحہ جو مسجد کی سرکاری ویب سائٹ بن سکتا ہے۔",
        bulletAdmin:
          "قابل اعتماد رضاکاروں کے لئے ایڈمن رسائی جو اوقات اور اعلانات تازہ رکھتے ہیں۔",
        bulletCountry:
          "ملک کے لحاظ سے تلاش تاکہ لوگ مقامی مساجد تیزی سے ڈھونڈ سکیں۔",
      },
      tv: {
        tagline: "ٹی وی ڈسپلے",
        eyebrow: "ہال اسکرینیں",
        title: "UmmahWay ٹی وی ڈسپلے",
        text:
          "مسجد ہال، داخلی راستوں اور کمیونٹی اسکرینوں کے لئے صاف ڈسپلے کھولیں جس میں اوقات نماز، جمعہ تفصیلات اور اہم اعلانات ہوں۔",
        openDisplay: "ٹی وی ڈسپلے کھولیں",
        listMasjid: "مسجد شامل کریں",
        cardTitle: "نماز کی جگہوں کے لئے بنایا گیا",
        bulletTimes:
          "روزانہ اوقات نماز اور جماعت کے اوقات ایک نظر میں واضح رہتے ہیں۔",
        bulletJumuah:
          "جمعہ شیڈول اور مسجد اعلانات بغیر چھپے ہوئے کاغذ کے دکھائے جا سکتے ہیں۔",
        bulletLink:
          "ہر مسجد اپنی سرکاری UmmahWay صفحے سے یہی ڈسپلے لنک کھول سکتی ہے۔",
      },
      contact: {
        panelEyebrow: "سپورٹ",
        panelTitle: "ہمیں پیغام بھیجیں",
        panelText: "ہم نیچے دیے گئے ای میل ایڈریس پر جواب دیں گے۔",
        name: "نام *",
        email: "ای میل *",
        topic: "موضوع *",
        subject: "عنوان *",
        message: "پیغام *",
        send: "پیغام بھیجیں",
        sending: "بھیجا جا رہا ہے...",
        missingRequired: "براہ کرم تمام لازمی خانے مکمل کریں۔",
        invalidEmail: "براہ کرم درست ای میل ایڈریس درج کریں۔",
        submitError: "آپ کا پیغام نہیں بھیجا جا سکا۔",
        success: "شکریہ - آپ کا پیغام بھیج دیا گیا ہے۔",
        topicPurchase: "خریداری یا سبسکرپشن",
        topicLogin: "لاگ اِن یا اکاؤنٹ رسائی",
        topicMasjid: "مسجد یا جماعت کے اوقات",
        topicTechnical: "تکنیکی مسئلہ",
        topicPrivacy: "پرائیویسی یا ڈیٹا درخواست",
        topicOther: "دیگر",
        tagline: "سپورٹ",
        eyebrow: "رابطہ کریں",
        title: "ہم مدد کے لئے حاضر ہیں",
        text:
          "خریداری، اکاؤنٹ یا مسجد کے اوقات کے بارے میں سوال ہے؟ ہمیں پیغام بھیجیں، ہم جواب دیں گے۔",
        replyNote: "جواب آپ کے پیغام میں دی گئی ای میل پر بھیجا جائے گا۔",
        cardText:
          "اوقات نماز اور اعلانات کے لئے اپنی مسجد کا صفحہ دیکھیں - ہر صفحہ اس کی اپنی ٹیم تازہ رکھتی ہے۔",
      },
    },
    home: {
      navTagline: "{country} کی مساجد کے اوقات نماز",
      seoTitle: "{country} میں مساجد کے اوقات نماز | UmmahWay",
      seoDescription:
        "{country} میں مساجد، روزانہ اوقات نماز، جمعہ، اعلانات، راستے اور UmmahWay ٹی وی ڈسپلے لنکس تلاش کریں۔",
      heroTitle: "{country} کی مساجد سے اوقات نماز۔",
      heroText:
        "{country} میں ہر درج مسجد آج کے اوقات نماز، جمعہ، خبریں اور راستہ دکھاتی ہے، مسجد کی ٹیم کے ذریعے تازہ رکھا گیا۔",
      findMasjid: "مسجد تلاش کریں",
      openDisplay: "ڈسپلے کھولیں",
      listMasjid: "مسجد درج کریں",
      chooseCountry: "ملک منتخب کریں",
      chooseCountryText:
        "یہ ڈومین ابھی ایک ملک سے منسلک نہیں، اس لئے وہ ملک منتخب کریں جسے آپ دیکھنا چاہتے ہیں۔",
      show: "دکھائیں",
      masjidsListedLower: "مساجد درج",
      onMap: "نقشے پر",
      dailyPrayers: "روزانہ نمازیں",
      directory: "ڈائریکٹری",
      directoryTitle: "{country} میں اپنی مقامی مسجد تلاش کریں",
      masjidsListed: "درج مساجد",
      loadingMasjids: "مساجد لوڈ ہو رہی ہیں...",
      loadMasjidsError: "مساجد لوڈ نہیں ہو سکیں: {error}",
      noMasjids:
        "{country} کے لئے ابھی کوئی مسجد درج نہیں۔ دوسرا ملک منتخب کریں یا اپنی مسجد سے UmmahWay میں شامل ہونے کو کہیں۔",
      openPage: "صفحہ کھولیں",
      directions: "راستہ",
      display: "ڈسپلے",
      map: "نقشہ",
      noMappedLocations: "ابھی کوئی مقام نقشے پر نہیں۔",
      mapMore: "{name} اور {count} مزید نقشے پر",
      masjidLocations: "مسجد مقامات",
      everyPage: "ہر صفحہ",
      pageSectionTitle: "مسجد کے صفحے میں کیا ہوتا ہے",
      pageSectionText:
        "ہر صفحہ ان چیزوں کے لئے بنایا گیا ہے جو لوگ مسجد جانے سے پہلے دیکھتے ہیں: اوقات، جمعہ کی تفصیل، اعلانات اور راستہ۔",
      forTeams: "مسجد ٹیموں کے لئے",
      teamsTitle: "سب کچھ تازہ رکھنے کے لئے ایک جگہ",
      teamsText:
        "اوقات ایک بار اپ ڈیٹ کریں اور وہ صفحے، ایپ اور ہال ڈسپلے پر ساتھ دکھائی دیتے ہیں۔",
      adminSignIn: "ایڈمن سائن اِن",
      getSetUp: "سیٹ اپ شروع کریں",
      adminConsole: "ایڈمن کنسول",
      timetableEditor: "اوقات ایڈیٹر",
      live: "لائیو",
      pageLabel: "صفحہ",
      appLabel: "ایپ",
      publicSite: "عوامی سائٹ",
      hallScreen: "ہال اسکرین",
      mobileSync: "موبائل سنک",
      todaysTimes: "آج کے اوقات",
      saved: "محفوظ",
      jamaah: "جماعت",
      appTitle: "اوقات نماز آپ کی جیب میں",
      appText:
        "قریبی مساجد کے اوقات نماز، جمعہ اور اعلانات کے لئے UmmahWay ایپ حاصل کریں۔",
      footerText: "مقامی مساجد کے اوقات نماز۔",
      previewJumuahNote: "خطبہ اطالوی اور عربی میں",
      previewNotice: "اعلان",
      previewNoticeText: "افطار سائن اپ مغرب کے بعد کھلتا ہے۔",
    },
    features: {
      dailyPrayerTimes: {
        title: "روزانہ اوقات نماز",
        text: "پانچوں نمازوں کے آج کے آغاز اور جماعت کے اوقات، روانگی سے پہلے دیکھنے کے لئے تیار۔",
      },
      jumuahTimes: {
        title: "جمعہ کے اوقات",
        text: "جمعہ کا خطبہ اور جماعت، زبان اور اضافی اوقات کے ساتھ۔",
      },
      notices: {
        title: "خبریں اور اعلانات",
        text: "ایونٹس، رمضان اوقات اور فوری تبدیلیاں ایک ہی جگہ۔",
      },
      hallDisplay: {
        title: "ہال ڈسپلے",
        text: "داخلی راستوں اور نماز ہالز کے لئے اسکرین دوست اوقات، اسی صفحے سے کھلتے ہیں۔",
      },
    },
    adminFeatures: {
      profile: "مسجد پروفائل اور نمائش",
      daily: "روزانہ آغاز اور جماعت کے اوقات",
      jumuah: "جمعہ سلاٹس اور خطبہ نوٹس",
      notices: "خبریں اور اعلانات",
      ramadan: "رمضان اور افطار اوقات",
      editor: "رضاکاروں کے لئے ایڈیٹر رسائی",
    },
    masjid: {
      seoTitle: "{name} اوقات نماز اور جمعہ | UmmahWay",
      seoDescription:
        "{city}، {country} میں {name}: روزانہ اوقات نماز، جمعہ، اعلانات، راستہ اور UmmahWay ٹی وی ڈسپلے۔",
      breadcrumbMasjids: "{country} میں مساجد",
      pageUnavailable: "صفحہ دستیاب نہیں",
      backToMasjids: "تمام مساجد پر واپس جائیں",
      prayerTimes: "اوقات نماز",
      news: "خبریں",
      visitUs: "تشریف لائیں",
      directions: "راستہ",
      display: "ڈسپلے",
      nextJamaah: "اگلی جماعت",
      inCountdown: "{time} میں",
      noTimetableToday: "آج کا ٹائم ٹیبل ابھی شائع نہیں ہوا۔",
      prayerTimetable: "نماز کا ٹائم ٹیبل",
      todayDate: "آج، {date}",
      begins: "آغاز",
      jamaah: "جماعت",
      next: "اگلی",
      friday: "جمعہ",
      jumuahPrayer: "نماز جمعہ",
      congregation: "جماعت",
      first: "پہلی",
      second: "دوسری",
      slot: "سلاٹ {slot}",
      khutbah: "خطبہ {time}",
      noJumuah: "جمعہ کا ٹائم ٹیبل سیٹ ہونے پر یہاں ظاہر ہوگا۔",
      fromMasjid: "مسجد کی طرف سے",
      newsNotices: "خبریں اور اعلانات",
      noNotices: "اس وقت کوئی اعلان نہیں۔",
      findUs: "ہمیں تلاش کریں",
      visitTitle: "مسجد تشریف لائیں",
      visitWithAddress:
        "آپ ہمیں {address} پر پائیں گے۔ پانچوں نمازوں اور جمعہ کے لئے سب خوش آمدید ہیں۔",
      visitWithCity:
        "{name} {city} میں ہے۔ پانچوں نمازوں اور جمعہ کے لئے سب خوش آمدید ہیں۔",
      openInMaps: "نقشے میں کھولیں",
      hallDisplay: "ہال ڈسپلے",
      timetableScreen: "ٹائم ٹیبل اسکرین",
      mobileApp: "موبائل ایپ",
      timesOnTheGo: "چلتے پھرتے اوقات",
      communityTitle: "کمیونٹی کے لئے عبادت کا گھر",
      latestNotice: "تازہ اعلان",
      allMasjids: "تمام مساجد",
      footerNote: "اوقات نماز اور اعلانات مسجد کے ذریعے برقرار رکھے جاتے ہیں · UmmahWay",
      bottomPrayers: "نمازیں",
    },
    masjidHighlights: {
      daily: "پانچ روزانہ نمازیں جماعت کے ساتھ",
      jumuah: "ہر جمعہ خطبہ اور نماز جمعہ",
      current: "سال بھر تازہ ٹائم ٹیبل",
      gatherings: "رمضان، عید اور کمیونٹی اجتماعات",
    },
    categories: {
      general: "اعلان",
      jumuah: "جمعہ",
      event: "ایونٹ",
      ramadan: "رمضان",
      urgent: "فوری",
    },
    prayers: {
      fajr: "فجر",
      dhuhr: "ظہر",
      asr: "عصر",
      maghrib: "مغرب",
      isha: "عشاء",
    },
  },
  ar: {
    language: { label: "اللغة", country: "الدولة" },
    nav: {
      admin: "الإدارة",
      display: "العرض",
      tvDisplay: "شاشة التلفاز",
      explore: "استكشف",
      more: "المزيد",
      menu: "القائمة",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      privacy: "الخصوصية",
      terms: "الشروط",
      contact: "اتصل بنا",
      masjids: "المساجد",
      list: "إضافة",
    },
    links: {
      masjids: {
        name: "مواقيت الصلاة في المساجد",
        navLabel: "المساجد",
        description:
          "اعثر على صفحات المساجد الرسمية مع مواقيت الصلاة، الجمعة، الإعلانات، الخرائط والاتجاهات.",
      },
      listMasjid: {
        name: "أضف مسجدك",
        navLabel: "أضف مسجد",
        description:
          "أنشئ صفحة رسمية على UmmahWay لمسجدك حتى يجد المصلون معلومات محلية دقيقة.",
      },
      tv: {
        name: "شاشة UmmahWay",
        navLabel: "التلفاز",
        description:
          "افتح شاشة UmmahWay المناسبة للمداخل وقاعات الصلاة وشاشات المجتمع.",
      },
      sponsor: {
        name: "رعاية عروض المجتمع",
        navLabel: "الرعاة",
        description:
          "قدّم طلباً لمشاركة عروض رعاية مراجعة مع المجتمعات المسلمة عبر UmmahWay.",
      },
      careers: {
        name: "الوظائف في UmmahWay",
        navLabel: "الوظائف",
        description:
          "استكشف الوظائف المفتوحة في UmmahWay وأرسل سيرتك الذاتية للفرص المتاحة.",
      },
      contact: {
        name: "اتصل بـ UmmahWay",
        navLabel: "اتصل بنا",
        description:
          "تواصل مع UmmahWay لدعم الحسابات، المشتريات، إدراج المساجد، المواقيت، الخصوصية أو المشاكل التقنية.",
      },
    },
    store: {
      iosLabel: "حمّل من",
      androidLabel: "احصل عليه من",
      appStore: "App Store",
      googlePlay: "Google Play",
    },
    publicPages: {
      common: {
        home: "الرئيسية",
        backHome: "العودة للرئيسية",
        viewMasjids: "عرض المساجد",
        findMasjids: "ابحث عن المساجد",
        officialWebsites: "مواقع المساجد الرسمية",
        legal: "قانوني",
        lastUpdated: "آخر تحديث: 27 يوليو 2026",
        privacyPolicy: "سياسة الخصوصية",
        termsConditions: "الشروط والأحكام",
        privacyContact: "تواصل الخصوصية",
        purchaseSupport: "دعم المشتريات",
      },
      listMasjid: {
        tagline: "إضافة المسجد",
        eyebrow: "صفحات المساجد الرسمية",
        title: "أضف مسجدك إلى UmmahWay",
        text:
          "امنح مجتمعك مكاناً رسمياً واحداً لمواقيت الصلاة، جداول الجمعة، الإعلانات، الاتجاهات، وشاشة التلفاز.",
        bulletPublic:
          "صفحة عامة يمكن أن تصبح الموقع الرسمي للمسجد.",
        bulletAdmin:
          "صلاحية إدارة للمتطوعين الموثوقين لتحديث المواقيت والإعلانات.",
        bulletCountry:
          "اكتشاف حسب البلد حتى يجد الناس المساجد المحلية بسرعة أكبر.",
      },
      tv: {
        tagline: "شاشة التلفاز",
        eyebrow: "شاشات القاعة",
        title: "شاشة UmmahWay التلفازية",
        text:
          "افتح شاشة واضحة لقاعات المساجد والمداخل وشاشات المجتمع تعرض مواقيت الصلاة، تفاصيل الجمعة، والإعلانات المهمة.",
        openDisplay: "افتح شاشة التلفاز",
        listMasjid: "أضف المسجد",
        cardTitle: "مصممة لمساحات الصلاة",
        bulletTimes:
          "تبقى مواقيت الصلاة اليومية وأوقات الجماعة واضحة بنظرة واحدة.",
        bulletJumuah:
          "يمكن عرض جداول الجمعة وإعلانات المسجد دون ورقة مطبوعة.",
        bulletLink:
          "يمكن لكل مسجد فتح نفس رابط الشاشة من صفحته الرسمية على UmmahWay.",
      },
      contact: {
        panelEyebrow: "الدعم",
        panelTitle: "أرسل لنا رسالة",
        panelText: "سنرد على عنوان البريد الإلكتروني الذي تضعه أدناه.",
        name: "الاسم *",
        email: "البريد الإلكتروني *",
        topic: "الموضوع *",
        subject: "العنوان *",
        message: "الرسالة *",
        send: "إرسال الرسالة",
        sending: "جارٍ الإرسال...",
        missingRequired: "يرجى إكمال جميع الحقول المطلوبة.",
        invalidEmail: "يرجى إدخال بريد إلكتروني صالح.",
        submitError: "تعذر إرسال رسالتك.",
        success: "شكراً - تم إرسال رسالتك.",
        topicPurchase: "شراء أو اشتراك",
        topicLogin: "تسجيل الدخول أو الحساب",
        topicMasjid: "مواقيت المسجد أو الجماعة",
        topicTechnical: "مشكلة تقنية",
        topicPrivacy: "طلب خصوصية أو بيانات",
        topicOther: "أخرى",
        tagline: "الدعم",
        eyebrow: "تواصل معنا",
        title: "نحن هنا للمساعدة",
        text:
          "هل لديك سؤال عن شراء أو حسابك أو مواقيت المسجد؟ أرسل لنا رسالة وسنعود إليك.",
        replyNote: "تصل الردود إلى البريد الإلكتروني الموجود في رسالتك.",
        cardText:
          "للمواقيت والإعلانات، زر صفحة مسجدك - كل صفحة يحدّثها فريقها.",
      },
    },
    home: {
      navTagline: "مواقيت صلاة المساجد في {country}",
      seoTitle: "مواقيت صلاة المساجد في {country} | UmmahWay",
      seoDescription:
        "اعثر على مساجد في {country}، المواقيت اليومية، الجمعة، الإعلانات، الاتجاهات وروابط شاشة UmmahWay.",
      heroTitle: "مواقيت الصلاة من مساجد {country}.",
      heroText:
        "كل مسجد مدرج في {country} يعرض مواقيت اليوم، الجمعة، الأخبار والاتجاهات، محدثة من القائمين عليه.",
      findMasjid: "ابحث عن مسجد",
      openDisplay: "فتح الشاشة",
      listMasjid: "إضافة مسجد",
      chooseCountry: "اختر الدولة",
      chooseCountryText:
        "هذا النطاق غير مرتبط بدولة واحدة بعد، فاختر الدولة التي تريد تصفحها.",
      show: "عرض",
      masjidsListedLower: "مساجد مدرجة",
      onMap: "على الخريطة",
      dailyPrayers: "صلوات يومية",
      directory: "الدليل",
      directoryTitle: "اعثر على مسجدك المحلي في {country}",
      masjidsListed: "المساجد المدرجة",
      loadingMasjids: "جاري تحميل المساجد...",
      loadMasjidsError: "تعذر تحميل المساجد: {error}",
      noMasjids:
        "لا توجد مساجد مدرجة في {country} بعد. اختر دولة أخرى أو اطلب من مسجدك الانضمام إلى UmmahWay.",
      openPage: "فتح الصفحة",
      directions: "الاتجاهات",
      display: "الشاشة",
      map: "الخريطة",
      noMappedLocations: "لا توجد مواقع على الخريطة بعد.",
      mapMore: "{name} و {count} أخرى على الخريطة",
      masjidLocations: "مواقع المساجد",
      everyPage: "كل صفحة",
      pageSectionTitle: "ماذا يوجد في صفحة المسجد",
      pageSectionText:
        "كل صفحة مبنية حول ما يبحث عنه الناس قبل الذهاب إلى المسجد: المواقيت، تفاصيل الجمعة، الإعلانات وكيفية الوصول.",
      forTeams: "لفرق المساجد",
      teamsTitle: "مكان واحد لإبقاء كل شيء محدثاً",
      teamsText:
        "حدّث المواقيت مرة واحدة فتظهر في الصفحة والتطبيق وشاشة القاعة معاً دون إدارة أدوات متعددة.",
      adminSignIn: "دخول الإدارة",
      getSetUp: "ابدأ الإعداد",
      adminConsole: "لوحة الإدارة",
      timetableEditor: "محرر المواقيت",
      live: "مباشر",
      pageLabel: "الصفحة",
      appLabel: "التطبيق",
      publicSite: "الموقع العام",
      hallScreen: "شاشة القاعة",
      mobileSync: "مزامنة الجوال",
      todaysTimes: "مواقيت اليوم",
      saved: "محفوظ",
      jamaah: "الجماعة",
      appTitle: "مواقيت الصلاة في جيبك",
      appText:
        "احصل على تطبيق UmmahWay لمواقيت الصلاة، الجمعة والإعلانات من المساجد القريبة.",
      footerText: "مواقيت الصلاة للمساجد المحلية.",
      previewJumuahNote: "الخطبة بالإيطالية والعربية",
      previewNotice: "إعلان",
      previewNoticeText: "يفتح تسجيل الإفطار بعد المغرب.",
    },
    features: {
      dailyPrayerTimes: {
        title: "مواقيت الصلاة اليومية",
        text: "بداية وجماعة صلوات اليوم الخمس، جاهزة للمراجعة قبل الخروج.",
      },
      jumuahTimes: {
        title: "مواقيت الجمعة",
        text: "وقت الخطبة وصلاة الجمعة، مع اللغة وأي أوقات إضافية موضحة.",
      },
      notices: {
        title: "الأخبار والإعلانات",
        text: "الفعاليات، مواقيت رمضان والتغييرات العاجلة من المسجد في مكان واحد.",
      },
      hallDisplay: {
        title: "شاشة القاعة",
        text: "جدول مناسب للشاشات عند المداخل وقاعات الصلاة، يفتح مباشرة من نفس الصفحة.",
      },
    },
    adminFeatures: {
      profile: "ملف المسجد والظهور",
      daily: "بداية الصلوات اليومية وأوقات الجماعة",
      jumuah: "خانات الجمعة وملاحظات الخطبة",
      notices: "الأخبار والإعلانات",
      ramadan: "مواقيت رمضان والإفطار",
      editor: "وصول المحرر للمتطوعين",
    },
    masjid: {
      seoTitle: "{name} مواقيت الصلاة والجمعة | UmmahWay",
      seoDescription:
        "{name} في {city}، {country}: مواقيت يومية، جدول الجمعة، الإعلانات، الاتجاهات وشاشة UmmahWay.",
      breadcrumbMasjids: "مساجد في {country}",
      pageUnavailable: "الصفحة غير متاحة",
      backToMasjids: "العودة إلى كل المساجد",
      prayerTimes: "مواقيت الصلاة",
      news: "الأخبار",
      visitUs: "زيارة",
      directions: "الاتجاهات",
      display: "الشاشة",
      nextJamaah: "الجماعة التالية",
      inCountdown: "بعد {time}",
      noTimetableToday: "لم يتم نشر جدول اليوم بعد.",
      prayerTimetable: "جدول الصلاة",
      todayDate: "اليوم، {date}",
      begins: "البداية",
      jamaah: "الجماعة",
      next: "التالي",
      friday: "الجمعة",
      jumuahPrayer: "صلاة الجمعة",
      congregation: "الجماعة",
      first: "الأولى",
      second: "الثانية",
      slot: "الفترة {slot}",
      khutbah: "الخطبة {time}",
      noJumuah: "سيظهر جدول الجمعة هنا بعد إدخاله.",
      fromMasjid: "من المسجد",
      newsNotices: "الأخبار والإعلانات",
      noNotices: "لا توجد إعلانات حالياً.",
      findUs: "اعثر علينا",
      visitTitle: "زيارة المسجد",
      visitWithAddress:
        "ستجدنا في {address}. الجميع مرحب بهم للصلوات الخمس وصلاة الجمعة.",
      visitWithCity:
        "{name} في {city}. الجميع مرحب بهم للصلوات الخمس وصلاة الجمعة.",
      openInMaps: "فتح في الخرائط",
      hallDisplay: "شاشة القاعة",
      timetableScreen: "شاشة المواقيت",
      mobileApp: "تطبيق الجوال",
      timesOnTheGo: "المواقيت أثناء التنقل",
      communityTitle: "بيت صلاة للمجتمع",
      latestNotice: "آخر إعلان",
      allMasjids: "كل المساجد",
      footerNote: "مواقيت الصلاة والإعلانات تُدار من المسجد · UmmahWay",
      bottomPrayers: "الصلوات",
    },
    masjidHighlights: {
      daily: "الصلوات الخمس اليومية جماعة",
      jumuah: "خطبة وصلاة الجمعة كل أسبوع",
      current: "جدول محدث طوال العام",
      gatherings: "رمضان، العيد ولقاءات المجتمع",
    },
    categories: {
      general: "إعلان",
      jumuah: "الجمعة",
      event: "فعالية",
      ramadan: "رمضان",
      urgent: "عاجل",
    },
    prayers: {
      fajr: "الفجر",
      dhuhr: "الظهر",
      asr: "العصر",
      maghrib: "المغرب",
      isha: "العشاء",
    },
  },
} satisfies Record<LanguageCode, TranslationDictionary>;

export function getDefaultLanguageForCountry(code: CountryCode): LanguageCode {
  return countryLanguageDefaults[code] ?? "en";
}

export function getStoredLanguage(): LanguageCode | null {
  if (typeof window === "undefined") return null;
  return normalizeLanguageCode(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function saveLanguagePreference(code: LanguageCode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
}

export function normalizeLanguageCode(
  value: string | null | undefined
): LanguageCode | null {
  const normalized = value?.trim().toLowerCase().slice(0, 2);
  return LANGUAGES.some((language) => language.code === normalized)
    ? (normalized as LanguageCode)
    : null;
}

export function getLanguageMeta(code: LanguageCode) {
  return (
    LANGUAGES.find((language) => language.code === code) ?? {
      code: "en",
      name: "English",
      nativeName: "English",
      dir: "ltr",
    }
  );
}

export function isRtlLanguage(code: LanguageCode) {
  return getLanguageMeta(code).dir === "rtl";
}

export function makeTranslator(language: LanguageCode) {
  return (key: string, values?: Record<string, string | number>) =>
    interpolate(lookupTranslation(language, key), values);
}

export function lookupTranslation(language: LanguageCode, key: string) {
  const translated = lookup(translations[language], key);
  if (typeof translated === "string") return translated;
  const fallback = lookup(translations.en, key);
  return typeof fallback === "string" ? fallback : key;
}

export function interpolate(
  template: string,
  values?: Record<string, string | number>
) {
  if (!values) return template;
  return Object.entries(values).reduce(
    (result, [key, value]) =>
      result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export function getLocalizedPublicLinks(language: LanguageCode) {
  const t = makeTranslator(language);
  return [
    {
      name: t("links.masjids.name"),
      navLabel: t("links.masjids.navLabel"),
      path: "/masjids",
      description: t("links.masjids.description"),
    },
    {
      name: t("links.listMasjid.name"),
      navLabel: t("links.listMasjid.navLabel"),
      path: "/list-your-masjid",
      description: t("links.listMasjid.description"),
    },
    {
      name: t("links.tv.name"),
      navLabel: t("links.tv.navLabel"),
      path: "/tv",
      description: t("links.tv.description"),
    },
    {
      name: t("links.sponsor.name"),
      navLabel: t("links.sponsor.navLabel"),
      path: "/sponsor",
      description: t("links.sponsor.description"),
    },
    {
      name: t("links.careers.name"),
      navLabel: t("links.careers.navLabel"),
      path: "/careers",
      description: t("links.careers.description"),
    },
    {
      name: t("links.contact.name"),
      navLabel: t("links.contact.navLabel"),
      path: "/contact",
      description: t("links.contact.description"),
    },
  ] as const;
}

export function getLocalizedCountryName(
  country: CountryConfig,
  language: LanguageCode
) {
  try {
    const displayNames = new Intl.DisplayNames([language], { type: "region" });
    return displayNames.of(country.countryIso) ?? country.name;
  } catch {
    return country.localName || country.name;
  }
}

function lookup(dictionary: TranslationDictionary, key: string) {
  return key.split(".").reduce<TranslationDictionary | string | undefined>(
    (current, part) =>
      current && typeof current === "object" ? current[part] : undefined,
    dictionary
  );
}
