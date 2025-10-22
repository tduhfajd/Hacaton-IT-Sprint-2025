import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/')
    }
  }, [isAuthenticated, isLoading, navigate])

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    try {
      const result = await login(data.email, data.password)
      if (result.success) {
        navigate('/')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Войдите в свой аккаунт для доступа к системе
          </p>
        </div>
        
        <div className="card">
          <div className="card-content">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email адрес
                </label>
                <input
                  {...register('email', { 
                    required: 'Email обязателен',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Введите корректный email'
                    }
                  })}
                  type="email"
                  className="input"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Пароль
                </label>
                <input
                  {...register('password', { required: 'Пароль обязателен' })}
                  type="password"
                  className="input"
                  placeholder="Введите пароль"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Запомнить меня
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Забыли пароль?
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Вход...
                    </div>
                  ) : (
                    'Войти'
                  )}
                </button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Нет аккаунта?{' '}
                  <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Зарегистрироваться
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}