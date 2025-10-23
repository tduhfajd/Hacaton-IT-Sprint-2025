import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const { theme, setTheme, actualTheme } = useTheme()
  const location = useLocation()

  const navigation = [
    { name: 'Главная', href: '/' },
    { name: 'Подать обращение', href: '/appeal' },
    { name: 'Статус обращения', href: '/appeal' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SA</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Smart Assistant
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-gray-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme selector */}
            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
              >
                {actualTheme === 'light' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
              
              {isThemeMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      setTheme('light')
                      setIsThemeMenuOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      theme === 'light' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <SunIcon className="h-4 w-4 mr-2" />
                    Светлая
                  </button>
                  <button
                    onClick={() => {
                      setTheme('dark')
                      setIsThemeMenuOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      theme === 'dark' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <MoonIcon className="h-4 w-4 mr-2" />
                    Темная
                  </button>
                  <button
                    onClick={() => {
                      setTheme('system')
                      setIsThemeMenuOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      theme === 'system' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                    Системная
                  </button>
                </div>
              )}
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="btn-primary px-4 py-2"
              >
                Регистрация
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700 mt-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Регистрация
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}