import React from 'react';
import { Newspaper, Bell, TrendingUp } from 'lucide-react';

const News = () => {
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

        {/* Coming Soon Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-10 h-10 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Coming Soon!
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            We're working on bringing you the latest news, special offers, and exclusive deals. Stay tuned!
          </p>

          <div className="flex flex-col space-y-3 max-w-sm mx-auto">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Get notified about new promotions
              </span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Exclusive deals and discounts
              </span>
            </div>
          </div>
        </div>

        {/* Placeholder for future news items */}
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 opacity-50"
            >
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
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
};

export default News;