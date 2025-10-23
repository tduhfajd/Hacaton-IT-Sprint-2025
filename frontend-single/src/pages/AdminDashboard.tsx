import { useState } from 'react'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const stats = [
  { name: 'Всего обращений', value: '1,234', change: '+12%', changeType: 'positive' },
  { name: 'Обработано сегодня', value: '89', change: '+5%', changeType: 'positive' },
  { name: 'Среднее время ответа', value: '2.5ч', change: '-15%', changeType: 'positive' },
  { name: 'Удовлетворенность', value: '94%', change: '+2%', changeType: 'positive' },
]

const knowledgeItems = [
  {
    id: 1,
    title: 'Как оформить льготы на проезд',
    category: 'Социальная защита',
    lastUpdated: '2025-01-27',
    status: 'active'
  },
  {
    id: 2,
    title: 'Процедура подачи жалобы на ЖКУ',
    category: 'ЖКУ',
    lastUpdated: '2025-01-26',
    status: 'active'
  },
  {
    id: 3,
    title: 'Восстановление уличного освещения',
    category: 'Благоустройство',
    lastUpdated: '2025-01-25',
    status: 'draft'
  }
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false)

  const tabs = [
    { id: 'overview', name: 'Обзор', icon: ChartBarIcon },
    { id: 'knowledge', name: 'База знаний', icon: DocumentTextIcon },
    { id: 'users', name: 'Пользователи', icon: UserGroupIcon },
    { id: 'settings', name: 'Настройки', icon: CogIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Административная панель
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Управление системой и мониторинг производительности
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.name} className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {stat.name}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Обращения по категориям
                  </h2>
                </div>
                <div className="card-content">
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    График будет здесь
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Статистика по времени
                  </h2>
                </div>
                <div className="card-content">
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    График будет здесь
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                База знаний
              </h2>
              <button
                onClick={() => setIsAddingKnowledge(true)}
                className="btn-primary px-4 py-2 flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Добавить статью
              </button>
            </div>

            <div className="card">
              <div className="card-content p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Название
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Категория
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Обновлено
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {knowledgeItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                              {item.status === 'active' ? 'Активна' : 'Черновик'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.lastUpdated}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card">
            <div className="card-content text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Управление пользователями
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Функция будет доступна в следующих версиях
              </p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card">
            <div className="card-content text-center py-12">
              <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Настройки системы
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Функция будет доступна в следующих версиях
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}