// Text of the legal pages (Privacy Policy, Terms of Use, Sources and attribution, Contact).
// Plain data, so the wording can be changed without touching the screens.
//
// A section is { heading, body } where body is a list of paragraphs (strings) and bullet lists ({ list: [...] }).
// This is a draft written for a hackathon project. It has NOT been reviewed by a lawyer.

// Fill these in before a public launch. The pages show them as they are.
export const CONTACT = {
  project: "Nexus (Team TechiZens)",
  officer: "[GRIEVANCE OFFICER NAME]",
  email: "[YOUR EMAIL ADDRESS]",
  court: "[YOUR CITY], India",
}

export const LEGAL_UPDATED = "10 October 2026"

// Students in these years (Class 10th to 12th) are treated as under 18. See src/lib/age.js.
export const MINORS_RULE =
  "If you are in school (Class 10th to 12th) or otherwise under 18, you need a parent or guardian's permission to use Nexus. For school students, Connections and Squad Hub are switched off."

export const LEGAL_PAGES = {
  privacy: {
    title: "Privacy Policy",
    intro:
      "Nexus helps college students find opportunities and teammates. This page says what we collect, why, who can see it, and how you can delete it.",
    sections: [
      {
        heading: "Who we are",
        body: [
          `${CONTACT.project} runs Nexus. For anything about your data, write to ${CONTACT.officer} at ${CONTACT.email}.`,
        ],
      },
      {
        heading: "What we collect",
        body: [
          {
            list: [
              "From Google sign-in: your name and email address. We do not store your Google password and never see it.",
              "What you enter: interests, skills, whether you are a beginner, year of study, your city and country, and an optional headline and About text.",
              "What you do: the opportunities you save, which alerts you have read, and (when these features run on our database) your posts, comments, likes, connections, Squad Hub choices and requests. Today some of these are kept only in your own browser.",
              "Technical data: our hosting and database providers may log your IP address, browser type and the time of each request, as any website does.",
            ],
          },
          "\"Detect my location\" uses your browser's location only to pick the nearest listed city. The coordinates stay in your browser and are not sent to us.",
        ],
      },
      {
        heading: "Why we use it",
        body: [
          {
            list: [
              "To rank opportunities for you and explain why each one fits.",
              "To show whether you are eligible, and to alert you when a saved opportunity changes.",
              "To suggest people and squads that fit your skills and weekly hours, if you choose to use those features.",
            ],
          },
          "We do not sell your data, show advertising, or track you across other websites.",
        ],
      },
      {
        heading: "Who can see it",
        body: [
          "Other signed-in students can see your name, college, year, city, headline, About, interests and skills. They cannot see your email address.",
          "Your contact details are shared with another student only after you both agree in the Squad Hub (double opt-in). Connecting with someone never shares contact details.",
          "Posts and activity are visible to your connections. Please do not put phone numbers or emails in posts or your About text.",
        ],
      },
      {
        heading: "Services we use",
        body: [
          "Supabase (database and sign-in), Google (sign-in) and Vercel (hosting). These providers process data for us and their servers may be outside India.",
          "Opportunity listings are collected from public sources. See Sources and attribution.",
        ],
      },
      {
        heading: "How long we keep it, and deleting it",
        body: [
          "We keep your data while your account exists. You can delete your account at any time from the Profile page. This removes your profile and the data linked to it.",
          "Reports about content may be kept for a limited time so we can deal with abuse.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          {
            list: [
              "See and correct your details: on the Profile page.",
              "Delete your account and data: on the Profile page.",
              "Withdraw your consent: delete your account, or write to us.",
              "Complain: write to the grievance officer above. If you are not satisfied, you may complain to the Data Protection Board of India.",
            ],
          },
        ],
      },
      {
        heading: "Children and school students",
        body: [
          MINORS_RULE,
          "We treat students in Class 10th to 12th as under 18. We do not use their data for advertising, tracking or profiling beyond ranking opportunities for them.",
          "Your choice of year during sign-up is how we know. We do not verify age or a parent's permission yet.",
        ],
      },
      {
        heading: "Cookies and browser storage",
        body: [
          "Nexus uses your browser's storage to keep you signed in, remember your choices (for example saved items and the notice you dismissed), and keep demo data. These are needed for the site to work.",
          "We do not use advertising or analytics cookies.",
        ],
      },
      {
        heading: "Security",
        body: [
          "Data is sent over HTTPS and protected in the database with row-level security, so a student can only read their own private rows. No system is perfectly secure. If a breach affects you we will tell you and the authorities as the law requires.",
        ],
      },
      {
        heading: "Changes",
        body: [`We will change this page if our practices change. The date at the top shows the latest version (${LEGAL_UPDATED}).`],
      },
    ],
  },

  terms: {
    title: "Terms of Use",
    intro: "By signing in to Nexus you agree to these terms. If you do not agree, please do not use Nexus.",
    sections: [
      {
        heading: "What Nexus is",
        body: [
          "Nexus is a discovery tool. It collects public opportunity listings, scores how well they fit you, and helps you find teammates. Nexus is not the organizer of any opportunity.",
          "Nexus never applies for you. You apply on the organizer's own website, and their rules apply to that.",
        ],
      },
      {
        heading: "Who can use it",
        body: [
          "You must be a student and provide true details. Use one account of your own.",
          MINORS_RULE,
        ],
      },
      {
        heading: "Listings, scores and alerts",
        body: [
          {
            list: [
              "Listings come from third-party websites and can be wrong, incomplete or out of date. Always confirm on the organizer's website before you apply or spend money.",
              "\"Verified\" means all the details we look for are present and the sources did not disagree. It does not mean a person at Nexus checked the opportunity.",
              "Relevance is an estimate based on your profile. Eligibility is based on the details listed, and a missing detail is not treated as a yes.",
              "Change alerts are best-effort. A change can be missed or delayed, so do not rely on them for a deadline.",
              "Fees are not shown. Check the organizer's website.",
            ],
          },
        ],
      },
      {
        heading: "Posts, comments and profiles",
        body: [
          "You are responsible for what you post. Do not post anything that is illegal, hateful, harassing, sexual, misleading or spam. Do not impersonate anyone. Do not share other people's personal details, or your own phone number or email.",
          "You give Nexus permission to store and show your content to the people it is meant for, so the features can work. It stays yours.",
          "You can report a post, comment or profile with the Report button. We may remove content or suspend accounts that break these rules.",
        ],
      },
      {
        heading: "Squad Hub and meeting people",
        body: [
          "Squad Hub is voluntary. We do not check who people are or whether their skills are real. Take the usual care when you share contact details or meet someone, and tell a parent, guardian or friend if you are meeting in person.",
        ],
      },
      {
        heading: "Ownership",
        body: [
          "Nexus's code is open source under the MIT license (see the LICENSE file in the repository). Organizer names, logos and listing details belong to their owners. Nexus is not affiliated with or endorsed by them.",
        ],
      },
      {
        heading: "No warranty, limited liability",
        body: [
          "Nexus is a student project provided \"as is\", without promises that it will be accurate, always available or error-free. To the extent the law allows, Nexus and its team are not liable for losses from missed deadlines, wrong listings, dealings with other students or third-party websites.",
        ],
      },
      {
        heading: "Ending your use",
        body: ["You can stop at any time and delete your account on the Profile page. We may suspend an account that breaks these terms."],
      },
      {
        heading: "Law and disputes",
        body: [
          `These terms follow the laws of India. Courts in ${CONTACT.court} can hear disputes. Please contact us first at ${CONTACT.email} so we can try to fix it.`,
        ],
      },
      {
        heading: "Changes",
        body: [`We may update these terms. The date at the top shows the latest version (${LEGAL_UPDATED}).`],
      },
    ],
  },

  sources: {
    title: "Sources and attribution",
    intro: "Where the listings come from, how we collect them, and what the labels mean.",
    sections: [
      {
        heading: "Where listings come from",
        body: [
          {
            list: [
              "Devpost: hackathons, read from the public data that devpost.com/hackathons uses.",
              "Unstop: hackathons, competitions, quizzes, workshops and internships, read from Unstop's public search API.",
            ],
          },
          "Every listing links back to its source and to the organizer's registration page. Nexus is not affiliated with or endorsed by Devpost, Unstop or any organizer.",
        ],
      },
      {
        heading: "How we collect",
        body: [
          {
            list: [
              "Only public pages and endpoints that the site's robots.txt allows.",
              "One request at a time, with a pause between requests.",
              "No logins and no personal data of anyone. Only listing facts: title, theme, dates, deadline, format, location, team size and links.",
              "Descriptions are written from those facts. We do not copy long text or banner images.",
              "A detail the source does not give stays empty and is flagged. We do not guess it.",
            ],
          },
          "These sources are not official partners. Their endpoints can change or stop at any time. If you run a listed event or site and want a listing changed or removed, write to us and we will act promptly.",
        ],
      },
      {
        heading: "What the labels mean",
        body: [
          {
            list: [
              "Verified: all details we look for are present and sources did not disagree. Nobody at Nexus checked it by hand.",
              "Check details: something is missing, or two sources disagree. Confirm on the organizer's website.",
              "Last verified: when our collector last saw the listing. After 14 days we mark it as possibly out of date.",
              "Closed: the deadline (or end date) has passed.",
              "Relevance %: how well it matches your interests and skills. It is an estimate.",
              "Eligible / Not eligible: based on the year requirement the listing states, if any.",
            ],
          },
        ],
      },
      {
        heading: "Names and logos",
        body: [
          "Organizer names and logos appear only to show who runs an opportunity. They are trademarks of their owners.",
        ],
      },
      {
        heading: "Open-source software and fonts",
        body: [
          "Nexus is built with React, Vite, Tailwind CSS, shadcn/ui, Lucide icons and Supabase, and the Geist typeface (SIL Open Font License). Thanks to their authors.",
        ],
      },
    ],
  },

  contact: {
    title: "Contact and grievances",
    intro: "How to reach us about your data, content, a listing, or a complaint.",
    sections: [
      {
        heading: "Grievance officer",
        body: [
          { list: [`Name: ${CONTACT.officer}`, `Email: ${CONTACT.email}`] },
          "We aim to acknowledge a complaint within 24 hours and resolve it within 15 days.",
        ],
      },
      {
        heading: "What to write to us about",
        body: [
          {
            list: [
              "Your data: to see, correct or delete it, or to withdraw consent.",
              "Content: a post, comment or profile that breaks the Terms of Use. You can also use the Report button.",
              "A listing: wrong details, or a request from an organizer to change or remove it.",
              "A security problem: tell us privately before you tell anyone else.",
            ],
          },
          "Please include a link or the name of the listing or person, and what is wrong.",
        ],
      },
    ],
  },
}
