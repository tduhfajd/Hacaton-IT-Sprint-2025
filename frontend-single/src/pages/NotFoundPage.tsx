import { Link } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Страница не найдена
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            К сожалению, запрашиваемая страница не существует или была перемещена.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="btn-primary px-6 py-3 inline-flex items-center"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Вернуться на главную
          </Link>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Если вы считаете, что это ошибка, пожалуйста,{' '}
            <a href="mailto:support@vadimevgrafov.ru" className="text-primary-600 hover:text-primary-500">
              свяжитесь с нами
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}