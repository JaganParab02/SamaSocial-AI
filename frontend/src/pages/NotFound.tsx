/**
 * NotFound — 404 page.
 */
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-100 mb-2">404</h1>
        <p className="text-slate-400 mb-8">The page you're looking for doesn't exist.</p>
        <Link
          to="/learning-assistant"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Home className="w-4 h-4" />
          Back to Learning Assistant
        </Link>
      </div>
    </div>
  );
}
