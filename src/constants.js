/* ==========================================================================
   APPLICATION CONSTANTS MODULE — personal-branding-agent
   ========================================================================== */

export const DB_CONFIG = {
  NAME: 'PersonalBrandingAgentDB',
  VERSION: 1,
  STORES: {
    CLIENTS: 'clients'
  }
};

export const ROUTES = {
  DASHBOARD: 'dashboard',
  CLIENT_NEW: 'client/new',
  CLIENT_WORKSPACE: 'client/:id',
  CLIENT_STRATEGY: 'client/:id/strategy',
  CLIENT_POSTS: 'client/:id/posts',
  CLIENT_PROFILE: 'client/:id/profile',
  CLIENT_QUESTIONS: 'client/:id/questions'
};

// All available profile fields from CLAUDE.md divided into sections
export const PROFILE_FIELDS = {
  REQUIRED: {
    name: 'Client Name',
    designation: 'Designation / Job Title',
    company: 'Company Name / Organisation',
    industry: 'Industry / Domain'
  },
  OPTIONAL: {
    linkedinUrl: 'LinkedIn Profile URL',
    website: 'Website',
    email: 'Email Address',
    location: 'Location / Geography',
    experience: 'Years of Experience',
    skillsProfessional: 'Professional Skills',
    skillsPersonal: 'Personal Skills',
    education: 'Education Details',
    certifications: 'Certifications',
    achievements: 'Key Achievements',
    awards: 'Awards Received',
    languages: 'Languages Spoken',
    hobbies: 'Hobbies',
    interests: 'Personal Interests',
    targetGeography: 'Target Geography',
    targetCustomers: 'Target Customers',
    targetAudience: 'Target Audience Profile',
    writingStyle: 'Writing Style Reference / Directives',
    mission: 'Mission Statement',
    vision: 'Vision Statement',
    values: 'Core Values',
    storyProfessional: 'Professional Journey / Story',
    storyPersonal: 'Personal Journey / Story',
    bio: 'LinkedIn Bio Summary',
    about: 'Current LinkedIn About Section',
    headline: 'Current LinkedIn Headline',
    goalsContent: 'Content Goals',
    goalsBusiness: 'Business / Retainer Goals',
    services: 'Services Offered',
    products: 'Products Offered',
    idealClient: 'Ideal Client Profile (ICP)',
    brandPersonality: 'Brand Personality (Traits)',
    personalTraits: 'Personal Traits / Quirks',
    brandVoice: 'Brand Voice Directives',
    contentPreferences: 'Content Preferences',
    existingContent: 'Existing Content Examples',
    books: 'Books Written',
    podcasts: 'Podcasts / Audio Work',
    speaking: 'Speaking Engagements',
    media: 'Media Mentions',
    caseStudies: 'Case Studies',
    testimonials: 'Client Testimonials',
    topicsFavorite: 'Favorite Topics to Discuss',
    topicsAvoid: 'Topics to Avoid entirely',
    competitors: 'Competitors to watch',
    inspirations: 'Personal Inspirations',
    anythingElse: 'Additional Notes / Instructions'
  }
};

// Initial empty profile template
export const CLIENT_TEMPLATE = {
  name: '',
  designation: '',
  company: '',
  industry: '',
  status: 'active',
  createdAt: null,
  lastUpdated: null,
  profileCompletion: 0,
  
  // Basic info properties mapped from optional profile fields
  basicInfo: {
    linkedinUrl: '',
    website: '',
    email: '',
    location: '',
    experience: '',
    skillsProfessional: '',
    skillsPersonal: '',
    education: '',
    certifications: '',
    achievements: '',
    awards: '',
    languages: '',
    hobbies: '',
    interests: '',
    targetGeography: '',
    targetCustomers: '',
    targetAudience: '',
    writingStyle: '',
    mission: '',
    vision: '',
    values: '',
    storyProfessional: '',
    storyPersonal: '',
    bio: '',
    about: '',
    headline: '',
    goalsContent: '',
    goalsBusiness: '',
    services: '',
    products: '',
    idealClient: '',
    brandPersonality: '',
    personalTraits: '',
    brandVoice: '',
    contentPreferences: '',
    existingContent: '',
    books: '',
    podcasts: '',
    speaking: '',
    media: '',
    caseStudies: '',
    testimonials: '',
    topicsFavorite: '',
    topicsAvoid: '',
    competitors: '',
    inspirations: '',
    anythingElse: ''
  },
  
  knowledge: {
    additionalInfo: '',
    files: []
  },
  
  strategy: null,
  profileOptimization: null,
  interviewQuestions: null,
  posts: []
};

// Content Generator Prefs
export const CONTENT_PREFS = {
  TONES: ['Conversational', 'Professional', 'Direct & Blunt', 'Storytelling', 'Analytical', 'Technical', 'Humorous', 'Inspirational'],
  WORD_LIMITS: [100, 150, 200, 300, 500],
  CTA_TYPES: ['Ask Question', 'Follow', 'Connect', 'Comment', 'Save', 'Share', 'Visit Website', 'Book Call', 'Download', 'No CTA'],
  STRUCTURES: [
    'Paragraph Style',
    'Short Punchy Sentences',
    'Bullets',
    'Storytelling',
    'Framework',
    'AIDA',
    'PAS',
    'Problem Solution',
    'Listicle',
    'Carousel Script',
    'Thread Style',
    'Founder POV'
  ]
};
