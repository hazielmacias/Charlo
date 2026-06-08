import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { BankAccount, ReminderConfig, BotMessages } from '../types/settings'

const defaultReminderConfig: ReminderConfig = {
  id: '',
  start_hour: 8,
  end_hour: 20,
  timezone: 'America/Mexico_City',
  frequency_minutes: 15,
  max_attempts: 3,
  is_active: true,
}

const defaultBotMessages: BotMessages = {
  id: '',
  welcome: '¡Hola {name}! Soy Charló, tu asistente de cobranza. ¿En qué puedo ayudarte?',
  menu: 'Por favor, selecciona una opción:',
  debt_info: 'Estas son tus deudas pendientes:',
  payment_instructions: 'Aquí tienes los datos para realizar tu pago:',
  receipt_confirmation: 'Hemos recibido tu comprobante. Lo revisaremos pronto.',
  agent_transfer: 'Un agente se pondrá en contacto contigo.',
  outside_hours: 'Nuestro horario de atención es de 8:00 AM a 8:00 PM.',
  error: 'Lo siento, hubo un error. Por favor, intenta de nuevo.',
}

export function useSettings() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(defaultReminderConfig)
  const [botMessages, setBotMessages] = useState<BotMessages>(defaultBotMessages)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch bank accounts - handle table not existing
      const { data: banks, error: banksError } = await supabase
        .from('bank_config')
        .select('*')
        .order('created_at', { ascending: false })

      if (banksError) {
        console.warn('bank_config table error:', banksError.message)
      } else {
        setBankAccounts(banks || [])
      }

      // Fetch settings - handle table not existing
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')

      if (settingsError) {
        console.warn('settings table error:', settingsError.message)
      } else if (settings) {
        // Find reminder config
        const reminderSetting = settings.find((s: any) => s.key === 'reminder_config')
        if (reminderSetting) {
          try {
            const parsed = JSON.parse(reminderSetting.value || '{}')
            setReminderConfig({ ...defaultReminderConfig, ...parsed })
          } catch {
            // Use default
          }
        }

        // Find bot messages
        const messagesSetting = settings.find((s: any) => s.key === 'bot_messages')
        if (messagesSetting) {
          try {
            const parsed = JSON.parse(messagesSetting.value || '{}')
            setBotMessages({ ...defaultBotMessages, ...parsed })
          } catch {
            // Use default
          }
        }
      }
    } catch (err) {
      // Don't set error, just log it - we have defaults
      console.warn('Settings fetch warning:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Bank Account CRUD
  const createBankAccount = async (data: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('bank_config').insert(data)
    if (error) throw error
    await fetchSettings()
  }

  const updateBankAccount = async (id: string, data: Partial<BankAccount>) => {
    const { error } = await supabase.from('bank_config').update(data).eq('id', id)
    if (error) throw error
    await fetchSettings()
  }

  const deleteBankAccount = async (id: string) => {
    const { error } = await supabase.from('bank_config').delete().eq('id', id)
    if (error) throw error
    await fetchSettings()
  }

  const toggleBankAccount = async (id: string, is_active: boolean) => {
    await updateBankAccount(id, { is_active })
  }

  // Reminder Config - save to localStorage as fallback
  const updateReminderConfig = async (config: Partial<ReminderConfig>) => {
    const newConfig = { ...reminderConfig, ...config }
    setReminderConfig(newConfig)

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'reminder_config', value: JSON.stringify(newConfig) }, { onConflict: 'key' })
      if (error) throw error
    } catch {
      // Save to localStorage as fallback
      localStorage.setItem('charlo_reminder_config', JSON.stringify(newConfig))
    }
  }

  // Bot Messages - save to localStorage as fallback
  const updateBotMessages = async (messages: Partial<BotMessages>) => {
    const newMessages = { ...botMessages, ...messages }
    setBotMessages(newMessages)

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'bot_messages', value: JSON.stringify(newMessages) }, { onConflict: 'key' })
      if (error) throw error
    } catch {
      // Save to localStorage as fallback
      localStorage.setItem('charlo_bot_messages', JSON.stringify(newMessages))
    }
  }

  return {
    bankAccounts,
    reminderConfig,
    botMessages,
    loading,
    error,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    toggleBankAccount,
    updateReminderConfig,
    updateBotMessages,
    refetch: fetchSettings,
  }
}

export function useAccount() {
  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) throw error
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  return { updateEmail, updatePassword }
}
