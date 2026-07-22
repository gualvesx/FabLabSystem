import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'pt' | 'en' | 'es' | 'fr';

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English',   flag: '🇺🇸' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
];

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

export const useLanguageStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'pt',
      setLang: (l) => set({ lang: l }),
      toggle: () => {
        const codes: Lang[] = ['pt', 'en', 'es', 'fr'];
        const idx = codes.indexOf(get().lang);
        set({ lang: codes[(idx + 1) % codes.length] });
      },
    }),
    { name: 'sesi-lang' }
  )
);
