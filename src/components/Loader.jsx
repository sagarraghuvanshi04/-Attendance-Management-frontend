import React from 'react';

const Loader = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="font-black text-indigo-600 animate-pulse uppercase tracking-widest text-sm">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Loader;
