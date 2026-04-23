
export const broadcasts = [
  {
    id: 1,
    title: "Monthly Team Meeting Reminder",
    audience: "Contractors",
    audienceColor: "bg-primary/10 text-primary", // #6a4dff
    priority: "Immediate",
    priorityColor: "bg-[#fbbf24] text-[#92400e]", // yellow
    status: "scheduled",
    scheduledFor: "Mar 20, 10:00 AM",
    content: "Don't forget about our monthly team meeting next Wednesday at 10:00 AM.",
    agenda: [
      "Q1 performance review",
      "New project assignments",
      "Team building activities",
      "Q&A session"
    ],
    additionalInfo: "Meeting link will be sent 15 minutes before start time.",
    views: 0,
    recipients: "Contractors"
  },
  {
    id: 2,
    title: "Upcoming System Maintenance Window",
    audience: "All",
    audienceColor: "bg-accent/10 text-accent", // #2d1b69
    priority: "Scheduled",
    priorityColor: "bg-secondary/50 text-accent", // #a5c9e8
    status: "scheduled",
    scheduledFor: "Mar 18, 2:00 AM",
    content: "Our system will undergo scheduled maintenance on March 18th from 2:00 AM to 4:00 AM EST. During this time, all services will be temporarily unavailable.\n\nWe apologize for any inconvenience and appreciate your patience as we work to improve our platform.",
    views: 0,
    recipients: "All"
  },
  {
    id: 3,
    title: "Q1 Project Updates & New Client Onboarding",
    audience: "All",
    audienceColor: "bg-accent/10 text-accent",
    priority: "Active",
    priorityColor: "bg-green-100 text-green-700",
    status: "sent",
    sentAt: "7h ago",
    content: "Great work everyone on completing Q1 projects! We're excited to announce three new clients joining our platform this month.\n\nPlease review the updated project guidelines and familiarize yourself with the new client requirements.",
    views: 18,
    recipients: "All"
  },
  {
    id: 4,
    title: "Updated Project Guidelines for Mobile Development",
    audience: "Contractors",
    audienceColor: "bg-primary/10 text-primary",
    priority: "Admin",
    priorityColor: "bg-purple-100 text-purple-700",
    status: "sent",
    sentAt: "5h ago",
    content: "We've updated our mobile development guidelines to include new best practices for React Native projects.\n\nKey changes:\n- Updated design system components\n- New testing requirements\n- Enhanced security protocols\n\nPlease review the documentation in your contractor portal.",
    views: 18,
    recipients: "Contractors"
  },
  {
    id: 5,
    title: "Invoice & Payment Terms Update",
    audience: "Clients",
    audienceColor: "bg-[#ec4899]/10 text-[#ec4899]", // pink
    priority: "Admin",
    priorityColor: "bg-purple-100 text-purple-700",
    status: "sent",
    sentAt: "8h ago",
    content: "Important updates to our invoice and payment terms effective April 1st:\n\n- Net 30 payment terms\n- Updated invoice format\n- New payment methods available\n- Early payment discount options\n\nPlease review the attached documentation for full details.",
    views: 18,
    recipients: "Clients"
  },
  {
    id: 6,
    title: "Platform Feature Updates - March 2024",
    audience: "All",
    audienceColor: "bg-accent/10 text-accent",
    priority: "Active",
    priorityColor: "bg-green-100 text-green-700",
    status: "sent",
    sentAt: "2d ago",
    content: "We're excited to announce several new features coming to the platform:\n\n- Enhanced project dashboard\n- Real-time collaboration tools\n- Improved notification system\n- Mobile app updates\n\nThese features will roll out gradually over the next two weeks.",
    views: 45,
    recipients: "All"
  },
  {
    id: 7,
    title: "Holiday Schedule - Spring Break",
    audience: "Management",
    audienceColor: "bg-[#f59e0b]/10 text-[#f59e0b]", // orange
    priority: "Scheduled",
    priorityColor: "bg-secondary/50 text-accent",
    status: "scheduled",
    scheduledFor: "Mar 25, 9:00 AM",
    content: "Please note our modified schedule for the spring break period:\n\n- Office hours: March 25-29\n- Reduced support availability\n- Emergency contact information\n\nPlease plan accordingly and inform your clients of any potential delays.",
    views: 0,
    recipients: "Management"
  }
];

export const filters = ["All", "Contractors", "Clients", "Management"];