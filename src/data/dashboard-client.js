import { Activity, Clock, CheckCircle } from "lucide-react";
export const stats = [
  {
    icon: Activity,
    title: "Active Projects",
    percentage: "80%",
    subtitle: "12 of 15 projects",
    trend: "+12%",
  },
  {
    icon: Clock,
    title: "Videos in Review",
    percentage: "67%",
    subtitle: "8 of 12 in review",
    trend: "+12%",
  },
  {
    icon: CheckCircle,
    title: "Completed Projects",
    percentage: "86%",
    subtitle: "24 of 28 projects",
    trend: "+12%",
  },
];

export const filters = [
  "All",
  "Submitted",
  "Processing",
  "Review",
  "Error",
  "Complete",
];

export const projects = [
  {
    id: 1,
    name: "Summer Campaign Promo",
    platform: "Instagram",
    status: "Review",
    lastUpdated: "10/25/2025",
    progress: 80,
    description: `Create a dynamic 60-second Instagram Reel showcasing our summer product line. The video should feel energetic, vibrant, and capture the excitement of summer adventures.`,
  },
  {
    id: 2,
    name: "Product Unboxing v2",
    platform: "Linkedin",
    status: "Processing",
    lastUpdated: "10/25/2025",
    progress: 45,
    description: `Create a dynamic 60-second Linkedin Reel showcasing our summer product line. The video should feel energetic, vibrant, and capture the excitement of summer adventures.`,
  },
  {
    id: 3,
    name: "Testimonial Compilation",
    platform: "Tiktok",
    status: "Complete",
    lastUpdated: "10/25/2025",
    progress: 100,
    description: `Create a dynamic 60-second Tiktok Reel showcasing our summer product line. The video should feel energetic, vibrant, and capture the excitement of summer adventures.`,
  },
  {
    id: 4,
    name: "Halloween Special",
    platform: "Internal",
    status: "Submitted",
    lastUpdated: "10/25/2025",
    progress: 30,
    description: `Create a dynamic 60-second Reel showcasing our summer product line. The video should feel energetic, vibrant, and capture the excitement of summer adventures.`,
  },
];
