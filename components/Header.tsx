
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-blue-100 py-4 px-6 sticky top-0 z-50 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-blue-500 p-2 rounded-lg text-white shadow-inner">
          <i className="fas fa-search-plus text-xl"></i>
        </div>
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          AI 違い探しマスター
        </h1>
      </div>
      <div className="hidden sm:flex items-center gap-4">
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
          Powered by Gemini 2.5
        </span>
      </div>
    </header>
  );
};

export default Header;
