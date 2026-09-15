export type ClientStatus = 
  | 'NEW' 
  | 'CONTACTED' 
  | 'INTERESTED' 
  | 'FOLLOW_UP' 
  | 'CONVERTED' 
  | 'NOT_INTERESTED'

export type EmailStatus = 
  | 'DRAFT' 
  | 'SCHEDULED' 
  | 'SENT' 
  | 'DELIVERED' 
  | 'OPENED' 
  | 'REPLIED' 
  | 'FAILED' 
  | 'BOUNCED'

export type CampaignStatus = 
  | 'DRAFT' 
  | 'SCHEDULED' 
  | 'RUNNING' 
  | 'PAUSED' 
  | 'COMPLETED' 
  | 'FAILED'

export type EmailProvider = 'GMAIL' | 'OUTLOOK' | 'SMTP'

export interface Client {
  id: string
  workspaceId: string
  name: string
  email: string
  company?: string | null
  position?: string | null
  industry?: string | null
  website?: string | null
  phone?: string | null
  location?: string | null
  requirement?: string | null
  notes?: string | null
  status: ClientStatus
  tags: string[]
  isVip: boolean
  lastContactedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface EmailTemplate {
  id: string
  workspaceId: string
  name: string
  description?: string | null
  subject: string
  body: string
  category: string
  language: string
  tone: string
  isFavorite: boolean
  useCount: number
  color?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface EmailAccount {
  id: string
  workspaceId: string
  provider: EmailProvider
  email: string
  name?: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Email {
  id: string
  workspaceId: string
  clientId?: string | null
  templateId?: string | null
  emailAccountId?: string | null
  campaignId?: string | null
  subject: string
  body: string
  recipientEmail: string
  recipientName?: string | null
  senderEmail?: string | null
  senderName?: string | null
  status: EmailStatus
  isDraft: boolean
  isScheduled: boolean
  scheduledAt?: Date | null
  sentAt?: Date | null
  openedAt?: Date | null
  repliedAt?: Date | null
  failureReason?: string | null
  createdAt: Date
  updatedAt: Date
  client?: Client | null
  template?: EmailTemplate | null
  emailAccount?: EmailAccount | null
}

export interface Campaign {
  id: string
  workspaceId: string
  name: string
  description?: string | null
  templateId?: string | null
  emailAccountId?: string | null
  status: CampaignStatus
  scheduledAt?: Date | null
  startedAt?: Date | null
  completedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  template?: EmailTemplate | null
  emailAccount?: EmailAccount | null
  _count?: {
    recipients: number
    emails: number
  }
}

export interface CompanyProfile {
  id: string
  workspaceId: string
  name: string
  logo?: string | null
  email?: string | null
  website?: string | null
  phone?: string | null
  address?: string | null
  industry?: string | null
  description?: string | null
  linkedIn?: string | null
  twitter?: string | null
  facebook?: string | null
  signature?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  id: string
  workspaceId: string
  defaultTone: string
  defaultLanguage: string
  defaultLength: string
  personalizationLevel: string
  defaultSignature?: string | null
  trackOpens: boolean
  trackClicks: boolean
  emailNotifications: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  emailsSentThisMonth: number
  averageOpenRate: number
  averageClickRate: number
  activeClients: number
  emailsSentThisMonthChange: number
  openRateChange: number
  clickRateChange: number
  activeClientsChange: number
}

export interface RecentCampaign {
  id: string
  name: string
  client: string
  sentDate: string
  status: EmailStatus | CampaignStatus
  openRate?: string
  clickRate?: string
}

export interface AnalyticsData {
  date: string
  opens: number
  clicks: number
  sent: number
}

export interface GenerateEmailRequest {
  clientName: string
  clientEmail: string
  clientCompany?: string
  clientPosition?: string
  clientIndustry?: string
  clientWebsite?: string
  clientRequirement?: string
  clientLocation?: string
  templateId?: string
  purpose?: string
  tone: string
  language: string
  length: string
  senderName: string
  senderCompany: string
  senderEmail: string
  senderWebsite?: string
}

export interface GenerateEmailResponse {
  subject: string
  body: string
}

export interface NavItem {
  label: string
  href: string
  icon: string
}
