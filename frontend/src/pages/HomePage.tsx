import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const navigate = useNavigate()
  const [trackingNumber, setTrackingNumber] = useState('')

  const handleTrackAppeal = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      navigate(`/appeal-status/${trackingNumber.trim()}`)
    }
  }

  const features = [
    {
      name: 'Быстрая подача обращений',
      description: 'Подайте обращение в несколько кликов с удобной формой',
      icon: DocumentTextIcon,
    },
    {
      name: 'Отслеживание статуса',
      description: 'Следите за ходом рассмотрения вашего обращения в реальном времени',
      icon: ClockIcon,
    },
    {
      name: 'Прозрачность процесса',
      description: 'Получайте уведомления о каждом этапе рассмотрения',
      icon: CheckCircleIcon,
    },
    {
      name: 'Экспертная поддержка',
      description: 'Получайте помощь от квалифицированных операторов',
      icon: UserGroupIcon,
    },
    {
      name: 'Обратная связь',
      description: 'Общайтесь с операторами и получайте ответы на вопросы',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'ИИ-ассистент',
      description: 'Умная система поможет классифицировать и обработать ваше обращение',
      icon: CogIcon,
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Умный помощник для</span>{' '}
                  <span className="block text-primary-600 xl:inline">обращений граждан</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 dark:text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Современная платформа для подачи и отслеживания обращений в муниципальные службы с использованием искусственного интеллекта
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/appeal"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                    >
                      Подать обращение
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/appeal-status"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
                    >
                      Отследить обращение
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-primary-400 to-primary-600 sm:h-72 md:h-96 lg:w-full lg:h-full"></div>
        </div>
      </div>

      {/* Tracking Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Отслеживание обращения
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Введите номер обращения для просмотра его статуса и истории
            </p>
          </div>
          
          <div className="mt-8 max-w-md mx-auto">
            <form onSubmit={handleTrackAppeal} className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="tracking-number" className="sr-only">
                  Номер обращения
                </label>
                <input
                  type="text"
                  id="tracking-number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Введите номер обращения (например: AP123456)"
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Найти
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Возможности</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Все что нужно для эффективной работы
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
              Наша платформа предоставляет полный набор инструментов для подачи, обработки и отслеживания обращений
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">{feature.name}</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-300">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Готовы начать?</span>
            <span className="block">Подайте ваше первое обращение.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-primary-200">
            Присоединяйтесь к тысячам граждан, которые уже используют нашу платформу для решения своих вопросов
          </p>
          <Link
            to="/appeal"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 sm:w-auto"
          >
            Начать сейчас
          </Link>
        </div>
      </div>
    </div>
  )
}