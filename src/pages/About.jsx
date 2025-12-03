import { useTranslation } from '../context/LanguageContext';
import { Info, BookOpen, ExternalLink, ShieldAlert, Mail } from 'lucide-react';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-screen transition-colors duration-200 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 py-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
            <Info className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.aboutTitle}</h1>
          <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            {t.aboutDesc}
          </p>
        </div>

        {/* Data Source Credit Card - IMPORTANT */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
               <BookOpen className="w-32 h-32 text-gray-900 dark:text-white" />
           </div>
           
           <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
               <BookOpen className="w-5 h-5 text-blue-500" />
               {t.dataSources}
           </h2>
           
           <p className="text-gray-600 dark:text-zinc-300 mb-6 leading-relaxed relative z-10">
               {t.nisanyanCredit}
           </p>

           <a 
             href="https://www.nisanyanadlar.com" 
             target="_blank" 
             rel="noopener noreferrer"
             className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
           >
               {t.visitNisanyan}
               <ExternalLink className="w-4 h-4" />
           </a>
        </div>

        {/* Disclaimer & Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    {t.disclaimer}
                </h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {t.disclaimerText}
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-500" />
                    {t.contact}
                </h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                    <a href="mailto:contact@isimbul.com" className="hover:text-blue-500 transition-colors">contact@isimbul.com</a>
                </p>
            </div>
        </div>

      </div>
    </div>
  );
}