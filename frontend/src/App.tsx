/**
 * Main application entry point setting up Routing, React Query, and global components.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import LearningAssistant from './pages/LearningAssistant';
import CoursePlanner from './pages/CoursePlanner';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* Default redirect to Task 1 */}
            <Route path="/" element={<Navigate to="/learning-assistant" replace />} />
            
            {/* Main Task 1 */}
            <Route path="/learning-assistant" element={<LearningAssistant />} />
            
            {/* Main Task 2 Placeholder */}
            <Route path="/course-planner" element={<CoursePlanner />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
      
      {/* Global Notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: '!bg-slate-800 !text-slate-200 !border !border-slate-700',
          success: { iconTheme: { primary: '#34d399', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#1e293b' } },
        }} 
      />
    </QueryClientProvider>
  );
}

export default App;
