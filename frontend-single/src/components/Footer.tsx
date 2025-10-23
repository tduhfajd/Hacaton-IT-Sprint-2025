import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SA</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Smart Assistant
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Интеллектуальная система для обработки обращений граждан с использованием 
              искусственного интеллекта для быстрого и качественного обслуживания.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Быстрые ссылки
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/appeal" 
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                >
                  Подать обращение
                </Link>
              </li>
              <li>
                <Link 
                  to="/appeal" 
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                >
                  Статус обращения
                </Link>
              </li>
              <li>
                <Link 
                  to="/login" 
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                >
                  Войти в систему
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Контакты
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>
                <span className="font-medium">Телефон:</span> +7 (XXX) XXX-XX-XX
              </li>
              <li>
                <span className="font-medium">Email:</span> support@vadimevgrafov.ru
              </li>
              <li>
                <span className="font-medium">Адрес:</span> г. Вадим, ул. Примерная, 1
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © 2025 Smart Assistant. Все права защищены.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                to="/privacy" 
                className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 text-sm transition-colors"
              >
                Политика конфиденциальности
              </Link>
              <Link 
                to="/terms" 
                className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 text-sm transition-colors"
              >
                Условия использования
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}