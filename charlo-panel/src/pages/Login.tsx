import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Branding (desktop) */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-12">
        <div className="max-w-sm text-center">
          <img
            src="/favicon.svg"
            alt="Charlo"
            className="w-20 h-20 mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Charlo</h1>
          <p className="text-base text-slate-400 leading-relaxed">
            Sistema de cobranza inteligente por WhatsApp
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-white">100+</p>
              <p className="text-xs text-slate-400 mt-1">Clientes</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-white">95%</p>
              <p className="text-xs text-slate-400 mt-1">Exito</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-xs text-slate-400 mt-1">Activo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <img
              src="/favicon.svg"
              alt="Charlo"
              className="w-16 h-16 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Charlo</h1>
            <p className="text-gray-400 text-sm mt-1">Cobranza Inteligente</p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900">Iniciar sesion</h2>
              <p className="text-sm text-gray-400 mt-1">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  placeholder="tu@email.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contrasena
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesion'}
              </button>
            </form>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            Charlo v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
