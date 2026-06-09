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

const features = [
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Recordatorios automáticos por WhatsApp' },
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Verificación de comprobantes en tiempo real' },
  { icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', label: 'Dashboard en tiempo real' },
]

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
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          {/* Top: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="#1e293b" />
                <path d="M12 16C12 13.79 13.79 12 16 12H32C34.21 12 36 13.79 36 16V28C36 30.21 34.21 32 32 32H20L14 38V32H12V16Z" fill="white" fillOpacity="0.95" />
                <path d="M17 20L21 24L27 18" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-white text-lg font-semibold tracking-tight" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                Charlo
              </div>
              <div className="text-blue-200/60 text-[10px] uppercase tracking-[0.2em] font-medium">
                Cobranza
              </div>
            </div>
          </div>

          {/* Middle: Tagline */}
          <div className="max-w-md">
            <h1
              className="text-white text-4xl xl:text-5xl font-light leading-[1.1] tracking-tight mb-6"
              style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}
            >
              Cobranza <span className="font-semibold italic">inteligente</span> que cobra por ti.
            </h1>
            <p
              className="text-slate-300/80 text-base leading-relaxed max-w-sm"
              style={{ letterSpacing: '-0.005em' }}
            >
              Automatiza recordatorios, recibe pagos y gestiona a tus clientes desde un solo lugar.
            </p>
          </div>

          {/* Bottom: Features */}
          <div className="space-y-3.5 max-w-sm">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/8 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/10">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
                    <path d={feature.icon} />
                  </svg>
                </div>
                <span className="text-slate-200/90 text-sm font-normal" style={{ letterSpacing: '-0.005em' }}>
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Right panel - Form */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="white" />
                <path d="M12 16C12 13.79 13.79 12 16 12H32C34.21 12 36 13.79 36 16V28C36 30.21 34.21 32 32 32H20L14 38V32H12V16Z" fill="#0f172a" />
                <path d="M17 20L21 24L27 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-base font-semibold text-slate-900 tracking-tight">Charlo</span>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h2
              className="text-slate-900 text-[28px] font-semibold leading-tight tracking-tight mb-2"
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
              Charlo · v1.0
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}