import { useSettings } from '../hooks/useSettings'
import { BankAccountsSection } from '../components/settings/BankAccountsSection'
import { ReminderSection } from '../components/settings/ReminderSection'
import { BotMessagesSection } from '../components/settings/BotMessagesSection'
import { AccountSection } from '../components/settings/AccountSection'
import { ErrorBoundary } from '../components/ErrorBoundary'

export function Settings() {
  const {
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
  } = useSettings()

  if (loading) {
    return (
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-50 rounded-xl"></div>
              <div className="h-10 bg-gray-50 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-sm text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Configuracion</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Ajustes del sistema y preferencias
        </p>
      </div>

      {/* Sections */}
      <ErrorBoundary>
        <AccountSection />
      </ErrorBoundary>
      <ErrorBoundary>
        <BankAccountsSection
          accounts={bankAccounts}
          onCreate={createBankAccount}
          onUpdate={updateBankAccount}
          onDelete={deleteBankAccount}
          onToggle={toggleBankAccount}
        />
      </ErrorBoundary>
      <ErrorBoundary>
        <ReminderSection
          config={reminderConfig}
          onUpdate={updateReminderConfig}
        />
      </ErrorBoundary>
      <ErrorBoundary>
        <BotMessagesSection
          messages={botMessages}
          onUpdate={updateBotMessages}
        />
      </ErrorBoundary>
    </div>
  )
}
