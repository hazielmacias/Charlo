import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    setLoading(true)

    const { error } = await signIn(data.email, data.password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel - Brand */}
      <aside className="hidden lg:flex lg:w-[42%] xl:w-[45%] relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        {/* Geometric SVG illustration */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 600 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="orbGlow1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="orbGlow2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.08" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width="600" height="1000" fill="url(#grid)" />

          {/* Soft glow orbs */}
          <circle cx="120" cy="180" r="180" fill="url(#orbGlow1)" />
          <circle cx="500" cy="750" r="220" fill="url(#orbGlow2)" />

          {/* Abstract circles - representing connection network */}
          <g opacity="0.15" stroke="white" fill="none">
            <circle cx="100" cy="150" r="60" strokeWidth="1" />
            <circle cx="500" cy="280" r="90" strokeWidth="1" />
            <circle cx="180" cy="450" r="40" strokeWidth="1" />
            <circle cx="420" cy="600" r="120" strokeWidth="1" />
            <circle cx="80" cy="780" r="70" strokeWidth="1" />
            <circle cx="320" cy="850" r="50" strokeWidth="1" />
          </g>

          {/* Filled accent circles */}
          <g>
            <circle cx="500" cy="280" r="6" fill="#3b82f6" opacity="0.8" />
            <circle cx="420" cy="600" r="4" fill="#60a5fa" opacity="0.9" />
            <circle cx="180" cy="450" r="5" fill="#3b82f6" opacity="0.7" />
            <circle cx="80" cy="780" r="3" fill="#60a5fa" opacity="0.9" />
          </g>

          {/* Connecting lines */}
          <g opacity="0.2" stroke="white" strokeWidth="0.5">
            <line x1="100" y1="150" x2="180" y2="450" />
            <line x1="180" y1="450" x2="420" y2="600" />
            <line x1="420" y1="600" x2="500" y2="280" />
            <line x1="80" y1="780" x2="320" y2="850" />
            <line x1="100" y1="150" x2="500" y2="280" />
          </g>

          {/* Chat bubble icons - abstract */}
          <g opacity="0.12" fill="white">
            <path d="M 60 200 Q 60 180 80 180 L 130 180 Q 150 180 150 200 L 150 230 Q 150 250 130 250 L 100 250 L 80 270 L 85 250 L 80 250 Q 60 250 60 230 Z" />
            <path d="M 440 480 Q 440 460 460 460 L 520 460 Q 540 460 540 480 L 540 510 Q 540 530 520 530 L 490 530 L 470 550 L 475 530 L 460 530 Q 440 530 440 510 Z" />
          </g>
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center w-full p-12 xl:p-16">
          {/* Logo: large wordmark with custom icon */}
          <div className="mb-16 flex items-center gap-4">
            {/* Custom logo icon: speech bubble with checkmark */}
            <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0f172a" />
                    <stop offset="1" stopColor="#1e3a8a" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 16C12 13.79 13.79 12 16 12H32C34.21 12 36 13.79 36 16V28C36 30.21 34.21 32 32 32H20L14 38V32H12V16Z"
                  fill="url(#logoGrad)"
                />
                <path
                  d="M18 22L22 26L30 18"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {/* Subtle dot accent */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-950" />
            </div>

            {/* Wordmark */}
            <div className="flex flex-col">
              <div
                className="text-white text-2xl font-semibold tracking-tight leading-none"
                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.035em' }}
              >
                Charl<span className="text-blue-400">ó</span>
              </div>
              <div
                className="text-blue-200/50 text-[10px] uppercase font-semibold mt-1.5"
                style={{ letterSpacing: '0.25em' }}
              >
                Cobranza
              </div>
            </div>
          </div>

          {/* Tagline with subtle WhatsApp mention */}
          <div className="max-w-md">
            <h1
              className="text-white text-4xl xl:text-5xl font-light leading-[1.1] mb-7"
              style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}
            >
              Cobra <span className="font-semibold italic">inteligente</span>,
              <br />
              directo por <span className="font-medium text-blue-300">WhatsApp</span>.
            </h1>
            <p
              className="text-slate-400/90 text-[15px] leading-relaxed max-w-sm"
              style={{ letterSpacing: '-0.005em' }}
            >
              Tu asistente de cobranza que recuerda, conversa y recupera pagos automaticamente.
            </p>
          </div>
        </div>
      </aside>

      {/* Right panel - Form */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-14">
            <div className="relative w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                <path d="M12 16C12 13.79 13.79 12 16 12H32C34.21 12 36 13.79 36 16V28C36 30.21 34.21 32 32 32H20L14 38V32H12V16Z" fill="white" />
                <path d="M17 20L21 24L27 18" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-slate-900 tracking-tight" style={{ letterSpacing: '-0.025em' }}>
                Charl<span className="text-blue-500">ó</span>
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h2
              className="text-slate-900 text-[28px] font-semibold leading-tight mb-2"
              style={{ letterSpacing: '-0.025em' }}
            >
              Iniciar sesión
            </h2>
            <p className="text-slate-500 text-sm" style={{ letterSpacing: '-0.005em' }}>
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100 font-medium">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-slate-700 mb-2 tracking-tight">
                Correo electrónico
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                placeholder="tu@correo.com"
                autoComplete="email"
                style={{ letterSpacing: '-0.005em' }}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-slate-700 mb-2 tracking-tight">
                Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ letterSpacing: '-0.005em' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-100 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 active:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              style={{ letterSpacing: '-0.005em' }}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-100">
            <p className="text-center text-xs text-slate-400 tracking-wide">
              Charló · v1.0
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}