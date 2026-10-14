import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';

export default function LanguageSelect() {
  const { setLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  function pick(lang: 'en' | 'ta') {
    setLanguage(lang);
    if (user) navigate(`/${user.role.replace('_','-')}/dashboard`);
    else navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center px-4">
      <Globe className="h-16 w-16 text-blue-600 mb-6" />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2 text-center">MEDISAKHI AI</h1>
      <p className="text-xl text-gray-600 mb-12 text-center">Choose your language / உங்கள் மொழியைத் தேர்வு செய்யுங்கள்</p>
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        <button onClick={() => pick('en')}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-10 rounded-3xl text-3xl shadow-xl transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-blue-300">
          English
        </button>
        <button onClick={() => pick('ta')}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-extrabold py-10 rounded-3xl text-3xl shadow-xl transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-green-300">
          தமிழ்
        </button>
      </div>
    </div>
  );
}
