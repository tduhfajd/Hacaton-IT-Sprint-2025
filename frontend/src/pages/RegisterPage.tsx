import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { UserIcon, LockClosedIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  phone?: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser, isAuthenticated, isLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormData>()

  const password = watch('password')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/')
    }
  }, [isAuthenticated, isLoading, navigate])

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    try {
      const { confirmPassword, ...registerData } = data
      const result = await registerUser(registerData)
      if (result.success) {
        navigate('/')
      }
    } catch (error) {
      console.error('Registration error:', error)
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
            Регистрация
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Создайте аккаунт для подачи обращений
          </p>
        </div>
        
        <div className="card">
          <div className="card-content">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <UserIcon className="inline h-4 w-4 mr-1" />
                  Полное имя
                </label>
                <input
                  {...register('full_name', { 
                    required: 'Полное имя обязательно',
                    minLength: { value: 2, message: 'Минимум 2 символа' },
                    maxLength: { value: 100, message: 'Максимум 100 символов' }
                  })}
                  type="text"
                  className="input"
                  placeholder="Введите ваше полное имя"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <EnvelopeIcon className="inline h-4 w-4 mr-1" />
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
                  <PhoneIcon className="inline h-4 w-4 mr-1" />
                  Телефон (необязательно)
                </label>
                <input
                  {...register('phone', {
                    pattern: {
                      value: /^[\+]?[1-9][\d]{0,15}$/,
                      message: 'Введите корректный номер телефона'
                    }
                  })}
                  type="tel"
                  className="input"
                  placeholder="+7 (XXX) XXX-XX-XX"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <LockClosedIcon className="inline h-4 w-4 mr-1" />
                  Пароль
                </label>
                <input
                  {...register('password', { 
                    required: 'Пароль обязателен',
                    minLength: { value: 8, message: 'Минимум 8 символов' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: 'Пароль должен содержать заглавную букву, строчную букву, цифру и спецсимвол'
                    }
                  })}
                  type="password"
                  className="input"
                  placeholder="Введите пароль"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <LockClosedIcon className="inline h-4 w-4 mr-1" />
                  Подтверждение пароля
                </label>
                <input
                  {...register('confirmPassword', { 
                    required: 'Подтверждение пароля обязательно',
                    validate: value => value === password || 'Пароли не совпадают'
                  })}
                  type="password"
                  className="input"
                  placeholder="Подтвердите пароль"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
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
                      Регистрация...
                    </div>
                  ) : (
                    'Зарегистрироваться'
                  )}
                </button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Уже есть аккаунт?{' '}
                  <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                    Войти
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