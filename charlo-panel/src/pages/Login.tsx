import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
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

const taglineWords = ['Gestión', 'de', 'cobranza', 'simplificada']

function TypingText({ words, delay = 0 }: { words: string[]; delay?: number }) {
  const [visibleWords, setVisibleWords] = useState<string[]>([])

  useEffect(() => {
    let currentDelay = delay
    words.forEach((word) => {
      setTimeout(() => {
        setVisibleWords(prev => [...prev, word])
      }, currentDelay)
      currentDelay += 200 // Each word appears after 200ms
    })
  }, [words, delay])

  return (
    <span className="inline-block">
      {visibleWords.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient orbs */}
      <motion.div
        className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400/30 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, -25, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute -bottom-20 right-20 w-72 h-72 bg-blue-500/25 rounded-full blur-3xl"
        animate={{
          x: [0, 20, 0],
          y: [0, -25, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      
      {/* Animated mesh grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  )
}

function FeatureIcon({ path, delay }: { path: string; delay: number }) {
  return (
    <motion.div
      className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/10"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 260, 
        damping: 20,
        delay 
      }}
      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.3)' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </motion.div>
  )
}

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
        <AnimatedBackground />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo with glow effect */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 30, scale: mounted ? 1 : 0.9 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex items-center gap-4 mb-12"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="absolute inset-0 bg-blue-400/50 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/30 relative">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="url(#logoGrad)"/>
                  <path d="M12 16C12 13.79 13.79 12 16 12H32C34.21 12 36 13.79 36 16V28C36 30.21 34.21 32 32 32H20L14 38V32H12V16Z" fill="white" fillOpacity="0.95"/>
                  <path d="M17 20L21 24L27 18" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
                      <stop stopColor="#60a5fa"/>
                      <stop offset="1" stopColor="#3b82f6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
            <div>
              <motion.span 
                className="text-3xl font-bold text-white tracking-tight"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: mounted ? 0 : -20, opacity: mounted ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Charlo
              </motion.span>
              <motion.p 
                className="text-blue-200 text-sm font-medium flex items-center gap-1.5"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: mounted ? 0 : -20, opacity: mounted ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Sparkles className="w-3 h-3" />
                Cobranza Inteligente
              </motion.p>
            </div>
          </motion.div>

          {/* Tagline with typing effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-lg"
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              <TypingText words={taglineWords} delay={400} />
            </h1>
            <motion.p 
              className="text-blue-100 text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: mounted ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              Automatiza recordatorios, recibe pagos y gestiona a tus clientes desde un solo lugar.
            </motion.p>
          </motion.div>

          {/* Features with staggered animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-14 space-y-5"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: mounted ? 1 : 0, x: mounted ? 0 : -30 }}
                transition={{ duration: 0.5, delay: 1.4 + i * 0.15 }}
                className="flex items-center gap-4 group cursor-default"
              >
                <FeatureIcon path={feature.icon} delay={1.6 + i * 0.15} />
                <span className="text-white/90 text-base font-medium group-hover:text-white transition-colors duration-300 group-hover:translate-x-1">
                  {feature.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Decorative elements */}
        <motion.div 
          className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl" />
        
        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-900/50 to-transparent" />
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : -20 }}
            transition={{ duration: 0.6 }}
            className="lg:hidden flex items-center gap-3 mb-10"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="white"/>
                <path d="M12 16C12 13.79 13.79 12 16 12H32C34.21 12 36 13.79 36 16V28C36 30.21 34.21 32 32 32H20L14 38V32H12V16Z" fill="#3b82f6" fillOpacity="0.95"/>
                <path d="M17 20L21 24L27 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Charlo</span>
          </motion.div>

          {/* Form card with glass effect */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 40, scale: mounted ? 1 : 0.95 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-10 relative overflow-hidden"
          >
            {/* Top decorative line */}
            <motion.div 
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: mounted ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: mounted ? 1 : 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-10 text-center"
            >
              <motion.h2 
                className="text-2xl font-bold text-gray-900 mb-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: mounted ? 0 : 10, opacity: mounted ? 1 : 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Bienvenido
              </motion.h2>
              <motion.p 
                className="text-gray-500 text-sm"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: mounted ? 0 : 10, opacity: mounted ? 1 : 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Ingresa tus credenciales para continuar
              </motion.p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50/80 backdrop-blur text-red-600 p-4 rounded-xl text-sm border border-red-200/50 font-medium"
                  >
                    <motion.span 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {error}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: mounted ? 1 : 0, x: mounted ? 0 : -20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <motion.input
                    {...register('email')}
                    type="email"
                    whileFocus={{ scale: 1.01 }}
                    className="w-full px-5 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-xl text-sm transition-all duration-300 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white group-hover:border-gray-200"
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-2 text-xs text-red-500 font-medium"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Password field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: mounted ? 1 : 0, x: mounted ? 0 : -20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative group">
                  <motion.input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    whileFocus={{ scale: 1.01 }}
                    className="w-full px-5 py-4 pr-14 bg-gray-50/50 border-2 border-gray-100 rounded-xl text-sm transition-all duration-300 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white group-hover:border-gray-200"
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-2 text-xs text-red-500 font-medium"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={loading}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={!loading ? { scale: 1.02, boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)' } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <motion.svg 
                        className="animate-spin w-5 h-5" 
                        viewBox="0 0 24 24"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </motion.svg>
                      <span>Ingresando...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <motion.svg 
                        className="w-5 h-5" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor"
                        strokeWidth="2"
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                      >
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </motion.svg>
                    </>
                  )}
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.button>
            </form>
          </motion.div>

          {/* Version text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="text-center text-gray-400 text-sm mt-8"
          >
            Charlo v1.0
          </motion.p>
        </div>
      </div>
    </div>
  )
}