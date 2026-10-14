import { Link } from 'react-router-dom';
import { Pill, Bell, Mic, Users, Phone, Globe, Shield, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/i18n';

export default function Welcome() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Skip link */}
      <a href="#main-content" className="skip-link focus:left-0 focus:top-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:p-3">
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-xl p-2">
              <Pill className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">MEDISAKHI AI</h1>
              <p className="text-xs text-blue-600 leading-none">Medicine Assistance Platform</p>
            </div>
          </div>
          {/* Language Toggle */}
          <div className="flex gap-2" role="group" aria-label="Language selection">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${language === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300 hover:border-blue-500'}`}
              aria-pressed={language === 'en'}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${language === 'ta' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300 hover:border-blue-500'}`}
              aria-pressed={language === 'ta'}
            >
              தமிழ்
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex bg-blue-100 rounded-full px-5 py-2 mb-6">
            <span className="text-blue-700 font-medium text-sm">
              {language === 'ta' ? '🌟 மருத்துவ உதவி தளம்' : '🌟 Medicine Assistance Platform'}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            {language === 'ta' ? (
              <>உங்கள் மருந்து. <span className="text-blue-600">உங்கள் மொழி.</span> உங்கள் பாதுகாப்பு.</>
            ) : (
              <>Your Medicine. <span className="text-blue-600">Your Language.</span> Your Safety.</>
            )}
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            {language === 'ta'
              ? 'குரல் வழிகாட்டுதல், SMS நினைவூட்டல்கள், மற்றும் AI உதவியாளருடன் மருந்து மேலாண்மை.'
              : 'Medicine management with voice guidance, SMS reminders, and an AI assistant — in Tamil and English.'}
          </p>

          {/* Demo Banner */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 mb-8 text-sm">
            <p className="font-bold text-yellow-800 mb-1">
              {language === 'ta' ? '🎭 டெமோ பயன்பாடு — அனைத்தும் கற்பனை தரவு' : '🎭 Demo App — All data is fictional'}
            </p>
            <p className="text-yellow-700">
              {language === 'ta'
                ? 'நோயாளி: patient@demo.medisakhi | கவனிப்பாளர்: caregiver@demo.medisakhi | கடவுச்சொல்: Demo@1234'
                : 'Patient: patient@demo.medisakhi | Caregiver: caregiver@demo.medisakhi | Password: Demo@1234'}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-5 rounded-2xl text-xl shadow-lg transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              <Shield className="h-6 w-6" />
              {t('auth.login', language)}
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-5 rounded-2xl text-xl shadow-lg transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-green-300"
            >
              <Heart className="h-6 w-6" />
              {t('auth.register', language)}
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-white py-16" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto px-4">
            <h2 id="features-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">
              {language === 'ta' ? 'எங்கள் சேவைகள்' : 'How We Help'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Bell className="h-8 w-8 text-blue-600" />,
                  title: language === 'ta' ? '⏰ நினைவூட்டல்கள்' : '⏰ Smart Reminders',
                  desc: language === 'ta'
                    ? 'மாத்திரையின் நிறம், வடிவம், அளவுடன் நினைவூட்டுகிறோம்'
                    : 'Reminders with tablet color, shape & size — so you take the right one',
                },
                {
                  icon: <Mic className="h-8 w-8 text-green-600" />,
                  title: language === 'ta' ? '🎤 குரல் உதவி' : '🎤 Voice Assistant',
                  desc: language === 'ta'
                    ? 'தமிழிலும் ஆங்கிலத்திலும் கேட்டு, புரிந்துகொள்ளுங்கள்'
                    : 'Ask in Tamil or English — hear instructions read aloud',
                },
                {
                  icon: <Phone className="h-8 w-8 text-purple-600" />,
                  title: language === 'ta' ? '📱 SMS ஆதரவு' : '📱 Basic Phone SMS',
                  desc: language === 'ta'
                    ? 'கீபேட் போனிலும் 1 அல்லது 2 என்று பதிலளிக்கலாம்'
                    : 'Works on any keypad phone — Reply 1 to confirm, 2 for help',
                },
                {
                  icon: <Users className="h-8 w-8 text-orange-600" />,
                  title: language === 'ta' ? '👨‍👩‍👧 குடும்ப எச்சரிக்கை' : '👨‍👩‍👧 Family Alerts',
                  desc: language === 'ta'
                    ? 'தவறினால் நேரடியாக மகன்/மகள்/கவனிப்பாளருக்கு SMS அனுப்பும்'
                    : 'Missed reminder? Automatically alerts your son, daughter, or caretaker',
                },
                {
                  icon: <Globe className="h-8 w-8 text-teal-600" />,
                  title: language === 'ta' ? '🌐 இரு மொழி' : '🌐 Tamil & English',
                  desc: language === 'ta'
                    ? 'அனைத்து திரைகளும் தமிழிலும் ஆங்கிலத்திலும் கிடைக்கும்'
                    : 'Every screen, button, and message available in both languages',
                },
                {
                  icon: <Heart className="h-8 w-8 text-red-500" />,
                  title: language === 'ta' ? '♿ அனைவருக்கும்' : '♿ Accessible to All',
                  desc: language === 'ta'
                    ? 'பார்வை, கேட்டல், நகர்வு இயலாமை — அனைவருக்கும் வடிவமைக்கப்பட்டது'
                    : 'Built for visual, hearing, mobility & cognitive disabilities',
                },
                {
                  icon: <Pill className="h-8 w-8 text-indigo-600" />,
                  title: language === 'ta' ? '💊 மருந்து அடையாளம்' : '💊 Medicine ID',
                  desc: language === 'ta'
                    ? 'நிறம், வடிவம், படம் மூலம் சரியான மாத்திரையை கண்டறியுங்கள்'
                    : 'Identify tablets by color, shape & photo — no reading needed',
                },
                {
                  icon: <Shield className="h-8 w-8 text-blue-500" />,
                  title: language === 'ta' ? '🤖 AI உதவியாளர்' : '🤖 AI Assistant',
                  desc: language === 'ta'
                    ? 'MediFriend — தமிழிலும் ஆங்கிலத்திலும் கேள்விகளுக்கு பதிலளிக்கும்'
                    : 'MediFriend chatbot answers questions about your registered medicines',
                },
              ].map((f, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="mb-3">{f.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{f.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SMS Keypad Section */}
        <section className="bg-blue-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Phone className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              {language === 'ta' ? 'கீபேட் போனிலும் வேலை செய்யும்!' : 'Works on Keypad Phones Too!'}
            </h2>
            <p className="text-blue-200 text-lg mb-8">
              {language === 'ta'
                ? 'ஸ்மார்ட்போன் இல்லாவிட்டாலும் SMS மூலம் நினைவூட்டல் பெறலாம்'
                : 'No smartphone needed — receive SMS reminders on any basic phone'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-800 rounded-2xl p-6 text-left">
                <p className="text-blue-300 text-sm mb-2 font-medium">English SMS:</p>
                <p className="bg-blue-950 rounded-xl p-4 font-mono text-sm text-green-300 leading-relaxed">
                  "MEDISAKHI: Time for Metformin 500mg. Take 1 YELLOW ROUND tablet after food. Reply 1=Taken, 2=Help"
                </p>
              </div>
              <div className="bg-blue-800 rounded-2xl p-6 text-left">
                <p className="text-blue-300 text-sm mb-2 font-medium">Tamil SMS:</p>
                <p className="bg-blue-950 rounded-xl p-4 font-mono text-sm text-green-300 leading-relaxed">
                  "MEDISAKHI: Metformin 500mg மருந்து நேரம். 1 மஞ்சள் வட்ட மாத்திரை. பதில்: 1=எடுத்துவிட்டேன், 2=உதவி"
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center">
        <p className="text-sm">
          {language === 'ta'
            ? 'MEDISAKHI AI — மருந்து உதவி தளம். இது மருத்துவ ஆலோசனை அல்ல.'
            : 'MEDISAKHI AI — Medicine Assistance Platform. Not a substitute for medical advice.'}
        </p>
      </footer>
    </div>
  );
}
