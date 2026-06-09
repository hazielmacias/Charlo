import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <div className="min-h-screen flex">
      {/* Left panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-float-medium" />
          <div className="absolute -bottom-20 right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-float-fast" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex items-center gap-3 mb-10"
          >
            <motion.div
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="#3b82f6"/>
                <path d="M12 16C12 13.79 13.79 12 16 12H32C34.21 12 36 13.79 36 16V28C36 30.21 34.21 32 32 32H20L14 38V32H12V16Z" fill="white" fillOpacity="0.95"/>
                <path d="M17 20L21 24L27 18" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <div>
              <span className="text-2xl font-bold text-white tracking-tight">Charlo</span>
              <p className="text-blue-200 text-xs font-medium">Cobranza Inteligente</p>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="max-w-md"
          >
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
              Gestión de cobranza simplificada
            </h1>
            <p className="text-blue-100 text-base leading-relaxed">
              Automatiza recordatorios, recibe pagos y gestiona a tus clientes desde un solo lugar.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="mt-12 space-y-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: mounted ? 1 : 0, x: mounted ? 0 : -20 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 group cursor-default"
              >
                <motion.div
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={feature.icon} />
                  </svg>
                </motion.div>
                <span className="text-white/90 text-sm font-medium group-hover:text-white transition-colors duration-300">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-400/10 rounded-full blur-2xl" />
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-sm xl:max-w-md">
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : -10 }}
            transition={{ duration: 0.5 }}
            className="lg:hidden flex items-center gap-2.5 mb-8"
          >
            <motion.div
              className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.05, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="white"/>
                <path d="M12 16C12 13.79 13.79 12 16 12H32C34.21 12 36 13.79 36 16V28C36 30.21 34.21 32 32 32H20L14 38V32H12V16Z" fill="#3b82f6" fillOpacity="0.95"/>
                <path d="M17 20L21 24L27 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Charlo</span>
          </motion.div>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20, scale: mounted ? 1 : 0.98 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: mounted ? 1 : 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900">Iniciar Sesión</h2>
              <p className="text-sm text-gray-400 mt-1">Ingresa tus credenciales para continuar</p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm border border-red-100 font-medium"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <motion.div whileFocus={{ scale: 1.01 }} className="relative">
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm transition-all duration-300 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white hover:border-gray-300"
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                  />
                </motion.div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-1.5 text-xs text-red-500"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <motion.div whileFocus={{ scale: 1.01 }} className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm transition-all duration-300 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white hover:border-gray-300"
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </motion.button>
                </motion.div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-1.5 text-xs text-red-500"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.4)' }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </motion.button>
            </form>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-center text-gray-400 text-xs mt-6"
          >
            Charlo v1.0
          </motion.p>
        </div>
      </div>
    </div>
  )
}