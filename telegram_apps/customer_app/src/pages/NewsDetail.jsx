import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { newsAPI } from '@/services/api';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: newsData, isLoading, error } = useQuery({
    queryKey: ['news', id],
    queryFn: async () => {
      // use axios instance so baseURL is respected in different environments
      try {
        const resp = await newsAPI.getOne(id);
        return resp.data && resp.data.data && resp.data.data.news;
      } catch (err) {
        // throw a readable error for react-query
        const msg = err?.response?.data || err.message || 'News fetch failed';
        const e = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        e.cause = err;
        throw e;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="p-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !newsData) {
    // Show debug container with error details to help diagnose routing/fetch problems
    const errDetails = error?.message || 'Unknown error';
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-start justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">News Not Found / Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">There was an error loading this news item.</p>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">{errDetails}</pre>
            <div className="mt-4 flex gap-2">
              <button onClick={() => navigate('/news')} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">Back to News</button>
              <button onClick={() => window.location.reload()} className="px-4 py-2 border rounded-lg">Reload</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header with back button */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/news')}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
            News
          </h1>
        </div>
      </div>

      <div className="p-4">
        {/* Featured Image */}
        {newsData.image_url && (
          <div className="w-full h-64 rounded-xl overflow-hidden mb-4">
            <img 
              src={newsData.image_url} 
              alt={newsData.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

          {/* Content */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {newsData.title}
          </h1>

          {/* Meta Information */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(newsData.published_at)}
            </div>
            {newsData.author && (
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {newsData.author}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {newsData.content}
            </p>

            {/* Sublinks rendering: show list of text links if present */}
            {newsData.sublinks && Array.isArray(newsData.sublinks) && newsData.sublinks.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Related Links</h3>
                <ul className="space-y-2">
                  {newsData.sublinks.map((sl, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          try {
                            const url = sl.url;
                            if (url && typeof url === 'string') window.open(url, '_blank');
                          } catch (e) { console.error('Failed to open sublink', e); }
                        }}
                        className="text-primary-600 hover:underline"
                      >
                        {sl.text || sl.url}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
