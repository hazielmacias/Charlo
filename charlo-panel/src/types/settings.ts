export interface BankAccount {
  id: string
  bank_name: string
  cbu: string
  alias?: string
  account_holder: string
  account_type: 'checking' | 'savings'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ReminderConfig {
  id: string
  start_hour: number
  end_hour: number
  timezone: string
  frequency_minutes: number
  max_attempts: number
  max_overdue_reminders: number
  overdue_interval_days: number
  is_active: boolean
}

export interface ReminderMessages {
  id: string
  '3_days': string
  '1_day': string
  due_today: string
  overdue: string
}

export interface BotMessages {
  id: string
  welcome: string
  menu: string
  debt_info: string
  payment_instructions: string
  receipt_confirmation: string
  agent_transfer: string
  outside_hours: string
  error: string
}

export interface AppSettings {
  bank_accounts: BankAccount[]
  reminder_config: ReminderConfig
  bot_messages: BotMessages
  reminder_messages: ReminderMessages
}