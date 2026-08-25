import type {
  User as ApiUser,
  Job,
  Candidate,
  Application,
  ApplicationStage,
  Interview,
  Notification,
  Message,
  Conversation,
  ActivityItem
} from "@workspace/api-client-react";

export type {
  Job,
  Candidate,
  Application,
  ApplicationStage,
  Interview,
  Notification,
  Message,
  Conversation,
  ActivityItem
} from "@workspace/api-client-react";

export type User = ApiUser & { title?: string };
export type Role = User["role"];

export const MOCK_USERS: Record<string, User> = {
  recruiter: {
    id: 1,
    email: "sarah.jenkins@stratos.com",
    role: "recruiter",
    name: "Sarah Jenkins",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=SJ&backgroundColor=00236f&textColor=ffffff",
    createdAt: new Date().toISOString(),
  },
  candidate: {
    id: 2,
    email: "alex.rivera@example.com",
    role: "candidate",
    name: "Alex Rivera",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=AR&backgroundColor=0058be&textColor=ffffff",
    createdAt: new Date().toISOString(),
  }
};

export const MOCK_JOBS: Job[] = [
  {
    id: 101,
    title: "Senior Product Designer",
    company: "Stratos Financial",
    companyLogoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=SF&backgroundColor=111c2d",
    location: "New York, NY",
    locationType: "hybrid",
    type: "full_time",
    salaryMin: 140000,
    salaryMax: 180000,
    salaryCurrency: "USD",
    description: "We are looking for a Senior Product Designer to lead design for our core platform...",
    requirements: "5+ years of experience in product design, specifically with complex B2B platforms.",
    responsibilities: "Lead end-to-end design for the core platform. Mentor junior designers.",
    benefits: "Health, Dental, Vision, 401k matching, unlimited PTO.",
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "B2B"],
    status: "published",
    applicantCount: 42,
    viewCount: 315,
    department: "Design",
    experienceLevel: "Senior",
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 102,
    title: "Frontend Engineer",
    company: "Stratos Financial",
    companyLogoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=SF&backgroundColor=111c2d",
    location: "Remote",
    locationType: "remote",
    type: "full_time",
    salaryMin: 120000,
    salaryMax: 160000,
    salaryCurrency: "USD",
    description: "Join our frontend team building high-performance financial tools...",
    skills: ["React", "TypeScript", "Tailwind CSS", "React Query"],
    status: "published",
    applicantCount: 87,
    viewCount: 540,
    department: "Engineering",
    experienceLevel: "Mid-Level",
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 103,
    title: "Data Scientist",
    company: "Stratos Financial",
    companyLogoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=SF&backgroundColor=111c2d",
    location: "San Francisco, CA",
    locationType: "onsite",
    type: "full_time",
    salaryMin: 150000,
    salaryMax: 195000,
    salaryCurrency: "USD",
    description: "We are seeking a Data Scientist to improve our risk models...",
    skills: ["Python", "Machine Learning", "SQL", "Pandas"],
    status: "draft",
    applicantCount: 0,
    viewCount: 0,
    department: "Data",
    experienceLevel: "Senior",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 104,
    title: "UX Researcher",
    company: "Stratos Financial",
    companyLogoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=SF&backgroundColor=111c2d",
    location: "Chicago, IL",
    locationType: "hybrid",
    type: "full_time",
    salaryMin: 110000,
    salaryMax: 145000,
    salaryCurrency: "USD",
    description: "Help us understand our users better...",
    skills: ["User Interviews", "Usability Testing", "Survey Design"],
    status: "published",
    applicantCount: 24,
    viewCount: 150,
    department: "Design",
    experienceLevel: "Mid-Level",
    postedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 105,
    title: "Product Manager",
    company: "Stratos Financial",
    companyLogoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=SF&backgroundColor=111c2d",
    location: "Remote",
    locationType: "remote",
    type: "full_time",
    salaryMin: 135000,
    salaryMax: 175000,
    salaryCurrency: "USD",
    description: "Lead the roadmap for our core product...",
    skills: ["Agile", "Roadmapping", "Jira", "Data Analysis"],
    status: "closed",
    applicantCount: 120,
    viewCount: 800,
    department: "Product",
    experienceLevel: "Senior",
    postedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 201,
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=AR&backgroundColor=0058be&textColor=ffffff",
    headline: "Senior Product Designer | Systems Thinker",
    location: "Brooklyn, NY",
    skills: ["Figma", "UI/UX", "Design Systems", "Prototyping", "React"],
    experience: [
      {
        id: 1,
        company: "FinTech Solutions",
        title: "Senior Product Designer",
        startDate: "2020-03-01",
        current: true,
        description: "Leading design system architecture and core product workflows."
      },
      {
        id: 2,
        company: "Creative Agency",
        title: "Product Designer",
        startDate: "2017-06-01",
        endDate: "2020-02-28",
        description: "Designed responsive web apps for various B2B clients."
      }
    ],
    education: [
      {
        id: 1,
        institution: "Rhode Island School of Design",
        degree: "BFA",
        field: "Industrial Design",
        startYear: 2013,
        endYear: 2017
      }
    ],
    resumeUrl: "alex-rivera-resume.pdf",
    portfolioUrl: "https://alexrivera.design",
    linkedinUrl: "https://linkedin.com/in/alexrivera",
    summary: "A passionate designer focused on creating simple solutions for complex financial platforms.",
    yearsOfExp: 6,
    availability: "2 weeks notice",
    salaryExpectation: 155000,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 202,
    name: "Jamie Chen",
    email: "jamie.chen@example.com",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=JC&backgroundColor=1e3a8a&textColor=ffffff",
    headline: "UX Researcher & Strategist",
    location: "Chicago, IL",
    skills: ["User Interviews", "Usability Testing", "Miro", "Data Analysis"],
    yearsOfExp: 4,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 203,
    name: "Sam Taylor",
    email: "sam.t@example.com",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=ST&backgroundColor=003120&textColor=ffffff",
    headline: "Frontend Architect",
    location: "Remote",
    skills: ["React", "TypeScript", "Next.js", "GraphQL"],
    yearsOfExp: 8,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 204,
    name: "Morgan Lee",
    email: "morgan.l@example.com",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=ML&backgroundColor=ba1a1a&textColor=ffffff",
    headline: "Product Designer",
    location: "New York, NY",
    skills: ["Figma", "Wireframing", "CSS"],
    yearsOfExp: 3,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 205,
    name: "Casey Jordan",
    email: "casey.j@example.com",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=CJ&backgroundColor=64748b&textColor=ffffff",
    headline: "Lead UX Designer",
    location: "Remote",
    skills: ["Figma", "Design Strategy", "Mentorship", "Prototyping"],
    yearsOfExp: 10,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 301,
    jobId: 101,
    candidateId: 201,
    job: MOCK_JOBS.find(j => j.id === 101),
    candidate: MOCK_CANDIDATES.find(c => c.id === 201),
    status: "interviewing",
    stage: "interview",
    aiScore: 94,
    aiSummary: "Strong match for Senior Product Designer. Extensive experience with B2B platforms and design systems aligns perfectly with requirements.",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 302,
    jobId: 101,
    candidateId: 204,
    job: MOCK_JOBS.find(j => j.id === 101),
    candidate: MOCK_CANDIDATES.find(c => c.id === 204),
    status: "rejected",
    stage: "screening",
    aiScore: 62,
    aiSummary: "Falls short of experience requirements (3 years vs required 5+). Solid UI skills but lacks proven B2B enterprise experience.",
    rejectionReason: "Lacks required experience level.",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 303,
    jobId: 101,
    candidateId: 205,
    job: MOCK_JOBS.find(j => j.id === 101),
    candidate: MOCK_CANDIDATES.find(c => c.id === 205),
    status: "reviewing",
    stage: "screening",
    aiScore: 88,
    aiSummary: "Highly experienced designer with strong leadership background. Overqualified for the IC role, but excellent domain knowledge.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 304,
    jobId: 102,
    candidateId: 203,
    job: MOCK_JOBS.find(j => j.id === 102),
    candidate: MOCK_CANDIDATES.find(c => c.id === 203),
    status: "offered",
    stage: "offer",
    aiScore: 98,
    aiSummary: "Exceptional frontend architecture skills matching all tech stack requirements.",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 305,
    jobId: 104,
    candidateId: 202,
    job: MOCK_JOBS.find(j => j.id === 104),
    candidate: MOCK_CANDIDATES.find(c => c.id === 202),
    status: "shortlisted",
    stage: "decision",
    aiScore: 85,
    aiSummary: "Solid research methodologies. Slightly light on enterprise platform testing but great foundational skills.",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const MOCK_INTERVIEWS: Interview[] = [
  {
    id: 401,
    applicationId: 301,
    application: MOCK_APPLICATIONS.find(a => a.id === 301),
    type: "async_video",
    status: "invited",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 30,
    invitationNote: "We'd love to learn more about your experience with design systems.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 402,
    applicationId: 304,
    application: MOCK_APPLICATIONS.find(a => a.id === 304),
    type: "live_video",
    status: "completed",
    scheduledAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    userId: 2,
    type: "interview_invite",
    title: "Interview Invitation",
    body: "You have been invited to a video interview for Senior Product Designer at Stratos Financial.",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionUrl: "/candidate/interviews/401"
  },
  {
    id: 2,
    userId: 2,
    type: "application_update",
    title: "Application Viewed",
    body: "Your application for Frontend Engineer has been viewed by the recruiter.",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actionUrl: "/candidate/dashboard"
  }
];

export const MOCK_STATS = {
  activeJobs: 3,
  totalCandidates: 142,
  pendingReviews: 14,
  scheduledInterviews: 8,
  openOffers: 2,
  timeToHireAvg: 18,
  pipelineByStage: {
    "Applied": 65,
    "Screening": 42,
    "Interview": 28,
    "Decision": 5,
    "Offer": 2
  }
};

export interface MockConversation extends Conversation {
  messages: Message[];
}

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 1,
    participants: [MOCK_USERS.recruiter, MOCK_USERS.candidate],
    relatedJobTitle: "Senior Product Designer",
    unreadCount: 1,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: {
      id: 102,
      conversationId: 1,
      senderId: MOCK_USERS.recruiter.id,
      sender: MOCK_USERS.recruiter,
      content: "Looking forward to your async interview submission. Let me know if you need any clarification.",
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    messages: [
      {
        id: 101,
        conversationId: 1,
        senderId: MOCK_USERS.candidate.id,
        sender: MOCK_USERS.candidate,
        content: "Hi Sarah, thanks for the invite! Quick question — should the walkthrough cover the whole case study or just the final designs?",
        read: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 102,
        conversationId: 1,
        senderId: MOCK_USERS.recruiter.id,
        sender: MOCK_USERS.recruiter,
        content: "Looking forward to your async interview submission. Let me know if you need any clarification.",
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 2,
    participants: [MOCK_USERS.recruiter, MOCK_USERS.candidate],
    relatedJobTitle: "Senior Product Designer",
    unreadCount: 0,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: {
      id: 201,
      conversationId: 2,
      senderId: MOCK_USERS.recruiter.id,
      sender: MOCK_USERS.recruiter,
      content: "Your application has moved to the next stage. Please review the updated timeline.",
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    messages: [
      {
        id: 201,
        conversationId: 2,
        senderId: MOCK_USERS.recruiter.id,
        sender: MOCK_USERS.recruiter,
        content: "Your application has moved to the next stage. Please review the updated timeline.",
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

export function getConversationsFor(userId: number | undefined) {
  if (!userId) return [];
  return MOCK_CONVERSATIONS.filter(c => c.participants.some(p => p.id === userId));
}

export function otherParticipant(conversation: MockConversation, userId: number | undefined) {
  return conversation.participants.find(p => p.id !== userId) ?? conversation.participants[0];
}

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 501,
    type: "application_stage_change",
    description: "Alex Rivera moved to Interview stage for Senior Product Designer",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 502,
    type: "interview_completed",
    description: "Sam Taylor completed Live Video interview for Frontend Engineer",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 503,
    type: "job_published",
    description: "Senior Product Designer role was published",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 504,
    type: "candidate_shortlisted",
    description: "Jamie Chen was shortlisted for UX Researcher",
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 505,
    type: "offer_accepted",
    description: "Sam Taylor accepted the offer for Frontend Engineer",
    createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 506,
    type: "application_rejected",
    description: "Morgan Lee's application for Senior Product Designer was declined",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 507,
    type: "job_published",
    description: "UX Researcher role was published",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 508,
    type: "interview_scheduled",
    description: "Async video interview sent to Alex Rivera for Senior Product Designer",
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  },
];

export const USERS = Object.values(MOCK_USERS);

export const SCREENING_QUESTIONS = [
  { id: 1, question: 'Do you have experience with B2B enterprise SaaS platforms?', type: 'yes_no', required: true },
  { id: 2, question: 'Please share a link to your portfolio.', type: 'text', required: true },
  { id: 3, question: 'How many years of experience do you have with Figma?', type: 'text', required: false },
  { id: 4, question: 'Are you comfortable working in a hybrid environment (3 days/week in office)?', type: 'yes_no', required: true },
  { id: 5, question: 'What is your expected salary range?', type: 'text', required: false },
];

export const INTERVIEW_QUESTIONS = [
  { id: 1, question: 'Walk us through a recent project where you redesigned a complex workflow.', type: 'video', timeLimit: 180, retakes: 1, order: 1 },
  { id: 2, question: 'How do you approach building and maintaining design systems?', type: 'video', timeLimit: 120, retakes: 1, order: 2 },
  { id: 3, question: 'Describe a time you used data to influence a product decision.', type: 'video', timeLimit: 120, retakes: 2, order: 3 },
  { id: 4, question: 'What is your process for conducting user research on a tight timeline?', type: 'text', timeLimit: 300, retakes: 0, order: 4 },
  { id: 5, question: 'Tell us about a disagreement with a stakeholder and how you resolved it.', type: 'behavioral', timeLimit: 120, retakes: 1, order: 5 },
];

export const RECRUITER_NOTIFICATIONS = [
  { id: 1, type: 'application_update', title: 'New Application', body: 'Jamie Chen applied for UX Researcher.', read: false, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 2, type: 'interview_invite', title: 'Interview Completed', body: 'Sam Taylor completed their async interview for Frontend Engineer.', read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 3, type: 'offer_received', title: 'Offer Accepted', body: 'Sam Taylor accepted the offer for Frontend Engineer.', read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 4, type: 'message', title: 'New Message', body: 'Alex Rivera sent you a message about the Senior Product Designer role.', read: true, createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
  { id: 5, type: 'system', title: 'Weekly Digest', body: 'Your pipeline summary for this week is ready.', read: true, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
];

