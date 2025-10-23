import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Calendar, ChevronRight } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

const News = () => {
  const navigate = useNavigate();

  const { data: newsData, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const res = await fetch('/api/news');
      const json = await res.json();
      return json.data.news || [];
    }
  });

  const handleNewsClick = (newsId) => {
    navigate(`/news/${newsId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="p-4">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mt-2 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex space-x-4">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-full"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="p-4">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            News & Updates
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with our latest offers and announcements
          </p>
        </div>

        {/* News List */}
        {newsData && newsData.length > 0 ? (
          <div className="space-y-4">
            {newsData.map((news) => (
              <div
                key={news.id}
                onClick={() => handleNewsClick(news.id)}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all cursor-pointer"
              >
                {news.image_url && (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={news.image_url} 
                      alt={news.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {news.title}
                  </h3>
                  {news.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {news.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(news.published_at)}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No News Yet
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              We're working on bringing you the latest news, special offers, and exclusive deals. Stay tuned!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;