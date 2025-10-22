import React, { useState, useEffect } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { useAppeals } from '../hooks/useAppeals';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category_id?: string;
  category_name?: string;
  tags: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const KnowledgeBasePage: React.FC = () => {
  const { 
    articles, 
    pagination, 
    isLoading, 
    fetchArticles, 
    deleteArticle, 
    searchArticles 
  } = useKnowledgeBase();
  const { categories } = useAppeals();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    const filters: any = {};
    if (selectedCategory !== 'all') filters.category_id = selectedCategory;
    if (searchQuery) filters.search = searchQuery;
    
    await fetchArticles(filters);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadArticles();
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    loadArticles();
  };

  const handleDelete = async (articleId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту статью?')) {
      const result = await deleteArticle(articleId);
      if (result.success) {
        await loadArticles();
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                База знаний
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Управление справочными материалами и документацией
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Создать статью</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по статьям..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </form>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Все категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))
          ) : articles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Статьи не найдены
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Создайте первую статью в базе знаний
              </p>
            </div>
          ) : (
            articles.map((article) => (
              <div
                key={article.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                      {truncateText(article.content, 150)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    <button
                      onClick={() => {
                        setSelectedArticle(article);
                        setShowViewModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        // Handle edit
                      }}
                      className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{article.tags.length - 3} еще
                      </span>
                    )}
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {formatDate(article.created_at)}
                    </span>
                    {article.category_name && (
                      <span className="flex items-center">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {article.category_name}
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    article.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {article.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Показано {articles.length} из {pagination.total} статей
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.offset === 0}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Предыдущая
              </button>
              <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                Страница {Math.floor(pagination.offset / pagination.limit) + 1} из {pagination.pages}
              </span>
              <button
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Следующая
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Article Modal */}
      {showViewModal && selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedArticle.title}
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {selectedArticle.content}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Создано: {formatDate(selectedArticle.created_at)}</span>
                  {selectedArticle.category_name && (
                    <span>Категория: {selectedArticle.category_name}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="btn-secondary"
                  >
                    Закрыть
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      // Handle edit
                    }}
                    className="btn-primary"
                  >
                    Редактировать
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBasePage;