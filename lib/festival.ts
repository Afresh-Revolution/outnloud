export const FESTIVAL = {
  name: "Out N Loud",
  edition: "2026",
  dateLabel: "26 December 2026",
  startsAt: "2026-12-26T16:00:00+01:00",
  city: "Jos",
  region: "Plateau State",
  manifesto: "Where the city gathers, the culture speaks, and the energy comes alive.",
} as const;

export const NAV = [
  { href: "/about", label: "About" },
  { href: "/lineup", label: "Lineup" },
  { href: "/tickets", label: "Tickets" },
  { href: "/gallery", label: "Gallery" },
  { href: "/partners", label: "Partners" },
  { href: "/community", label: "Community" },
  { href: "/contact", label: "Contact" },
] as const;

export const HIGHLIGHTS = [
  {
    index: "01",
    title: "Music that fills the plateau",
    copy: "Stages for the songs, DJs, and live sets that already move Jos, placed beside voices the city has not met yet.",
  },
  {
    index: "02",
    title: "A gathering, not a backdrop",
    copy: "The festival is built for the people who stay: neighbours, students, families of the scene, and anyone who treats December as homecoming.",
  },
  {
    index: "03",
    title: "Culture with a Jos accent",
    copy: "Green road-sign colour, street dress, and the pace of the city. The night should feel like here, not like a template flown in from somewhere else.",
  },
  {
    index: "04",
    title: "A date the year can return to",
    copy: "Out N Loud is planned as an annual edition. The site keeps the story, the pictures, and the list so the next December already has a crowd waiting.",
  },
] as const;

export const STAGES = [
  {
    name: "Main Stage",
    detail: "The largest set of the night. Headliners and the songs the whole ground knows.",
    window: "Evening",
  },
  {
    name: "City Stage",
    detail: "Live bands and Jos voices. A closer stage for the sets that carry the city.",
    window: "Afternoon into night",
  },
  {
    name: "Afterhours",
    detail: "DJs after the main programme. The room that keeps the plateau awake.",
    window: "Late",
  },
] as const;

export const FAQS = [
  {
    q: "Where do I buy a ticket?",
    a: "On this website. Choose a tier, enter your name and email, and pay. You do not need to open another events app. The ticket is still issued by our ticketing system, so the gate can scan it.",
  },
  {
    q: "How do I receive my ticket?",
    a: "After payment is confirmed, a QR ticket is sent to the email you entered. Keep that email. At the gate, staff scan the code. A screenshot of the QR is enough if your inbox is on your phone.",
  },
  {
    q: "What if I pay and the page does not confirm?",
    a: "Wait a moment on the confirmation screen. If money left your account and no email arrives, contact the organizer with your name, email, and the time you paid. Tickets are issued only after payment is verified.",
  },
  {
    q: "Can I get a refund?",
    a: "Refund requests go to the organizer. Include the email used at checkout and your order reference. Entry rules and refund decisions are confirmed by the event team.",
  },
  {
    q: "Where is the festival?",
    a: "Jos, Plateau State, on 26 December 2026. The exact venue and gate time will be published here and sent to ticket holders before the day.",
  },
  {
    q: "What should I bring?",
    a: "Your QR ticket, a charged phone, and a valid photo ID if the gate asks for one. Full entry guidance will be posted with the final venue details.",
  },
] as const;
