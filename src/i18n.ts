import { h, createContext } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';

// ── Translation dictionary ──────────────────────────────────────────────
export type Lang = 'en' | 'es';

const STORAGE_KEY = 'hermes_lang';

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // App / Auth
    'app.title': 'HelpingPeopleNow',
    'auth.checking': 'Checking authentication...',
    'auth.loading': 'Loading...',
    'auth.signin': 'Sign In',
    'auth.signin.desc': "Enter your email and we'll send you a magic link.",
    'auth.signup': 'Create Account',
    'auth.signup.desc': 'Enter your name and email — no password needed.',
    'auth.magic.sent': 'Check your email ✉️',
    'auth.magic.desc': 'We sent a magic link to',
    'auth.magic.click': 'Click the link in the email to sign in.',
    'auth.magic.click.signup': 'Click the link to sign in — your account will be created automatically.',
    'auth.magic.expires': 'Link expires in 5 minutes.',
    'auth.send.again': 'Send again',
    'auth.try.again': 'Try again',
    'auth.send.magic': 'Send Magic Link',
    'auth.sending': 'Sending...',
    'auth.logout': 'Logout',
    'auth.logout.confirm': 'Are you sure you want to log out?',
    'auth.email': 'Email',
    'auth.name': 'Name',
    'auth.email.required': 'Email is required',
    'auth.name.email.required': 'Name and email are required',
    'auth.no.account': "Don't have an account?",
    'auth.has.account': 'Already have an account?',
    'auth.signup.link': 'Sign up',
    'auth.signin.link': 'Sign in',

    // Navigation
    'nav.admin': 'Admin',
    'nav.chat': 'Chat',
    'nav.worker.profile': 'Worker Profile',
    'nav.client.portal': 'Client Portal',
    'nav.back': '← Back',

    // Admin Page
    'admin.title': '🛠 System Admin',
    'admin.subtitle': 'Edit prompts and LLM provider.',
    'admin.db': '🗄 Adminer (DB)',
    'admin.loading': 'Loading...',
    'admin.load.error': 'Failed to load prompts',
    'admin.provider': 'LLM Provider',
    'admin.provider.desc': 'Choose which backend the assistant uses. Default = auto fallback chain (Mistral → OpenCode → Ollama).',
    'admin.provider.default': 'Default (auto)',
    'admin.save': 'Save',
    'admin.saving': 'Saving...',
    'admin.helper.label': 'Helper Prompt',
    'admin.helper.desc': 'System prompt for the helper service',
    'admin.worker.label': 'Worker Profile Prompt',
    'admin.worker.desc': 'System prompt for worker onboarding chat',
    'admin.prompt.client': 'Client Profile Prompt',
    'admin.client.desc': 'System prompt for client onboarding chat',
    'admin.lang.en': 'EN',
    'admin.lang.es': 'ES',
    'admin.prompt.helper': 'Helper Prompt',
    'admin.prompt.worker': 'Worker Profile Prompt',
    'admin.prompt.find_trader_search': 'Find Trader Search Prompt',
    'admin.prompt.find_trader_presentation': 'Find Trader Presentation Prompt',
    'admin.find_trader_search.desc': 'System prompt for finding traders (search phase)',
    'admin.find_trader_presentation.desc': 'System prompt for presenting traders to clients',

    // Chat Page
    'chat.placeholder': 'Ask anything...',
    'chat.thinking': 'Thinking...',
    'chat.error.network': 'Network error — is the backend running?',
    'chat.complete.profile': 'Complete your Worker Profile →',
    'chat.post.request': 'Post Your First Request →',
    'chat.no.messages': 'No messages yet.',
    'chat.prompts.missing': 'Cannot continue — system prompts are not configured. Please ask an admin to set them up.',
    'chat.welcome.title': 'Welcome! How can we help you?',
    'chat.welcome.desc1': 'Tell us what you need — home repairs, cleaning, plumbing, electrical work, or anything else.',
    'chat.welcome.desc2': 'We\'ll match you with the right professionals in your area.',
    'chat.mic.start': 'Press to speak',
    'chat.mic.stop': 'Stop recording',
    'chat.mic.listening': 'Listening...',

    // Worker Page
    'worker.title': 'Worker Profile',
    'worker.loading': 'Loading profile…',
    'worker.chat.title': 'Build Your Profile via Chat',
    'worker.chat.welcome': 'Start a conversation to build your profile naturally.',
    'worker.chat.example': 'Example:',
    'worker.chat.example.text': '"I\'m a plumber in Madrid with 8 years experience"',
    'worker.chat.you': 'You',
    'worker.chat.assistant': 'Assistant',
    'worker.chat.typing': 'typing…',
    'worker.chat.placeholder.start': "I'm a plumber in Madrid…",
    'worker.chat.placeholder.answer': 'Type your answer…',
    'worker.chat.send': 'Send',
    'worker.chat.error': 'Network error — please try again.',
    'worker.chat.empty': '(empty response)',
    'worker.card.core': 'Core Identity',
    'worker.card.profession': 'Profession',
    'worker.card.business_name': 'Business Name',
    'worker.card.bio': 'Bio',
    'worker.card.phone': 'Phone',
    'worker.card.location': 'Location & Service Area',
    'worker.card.city': 'City',
    'worker.card.radius': 'Service Radius (km)',
    'worker.card.address': 'Address',
    'worker.card.pricing': 'Pricing',
    'worker.card.hourly': 'Hourly Rate (€)',
    'worker.card.minimum': 'Minimum Charge (€)',
    'worker.card.free_estimate': 'Free Estimate',
    'worker.card.credentials': 'Credentials',
    'worker.card.experience': 'Years of Experience',
    'worker.card.certifications': 'Certifications',
    'worker.card.insurance': 'Has Insurance',
    'worker.card.languages': 'Languages',
    'worker.card.emergency': 'Emergency Service',
    'worker.card.online': 'Online Presence',
    'worker.card.website': 'Website',
    'worker.card.social': 'Social Networks',
    'worker.card.empty': '—',
    'worker.card.bool.yes': '✓',
    'worker.card.bool.no': '✗',
    'worker.card.reset': 'Reset Profile',
    'worker.card.reset.confirm': 'Are you sure? This will clear all your profile data.',
    'worker.reset.role': '✕ Stop being a worker',

    // Client Page
    'client.title': 'Client Portal',
    'client.loading': 'Loading profile…',
    'client.chat.title': 'Build Your Profile via Chat',
    'client.chat.welcome': 'Start a conversation to build your profile naturally.',
    'client.chat.example': 'Example:',
    'client.chat.example.text': '"My name is John, I live in Madrid"',
    'client.chat.you': 'You',
    'client.chat.assistant': 'Assistant',
    'client.chat.typing': 'typing…',
    'client.chat.placeholder.start': 'My name is John…',
    'client.chat.placeholder.answer': 'Type your answer…',
    'client.chat.send': 'Send',
    'client.chat.error': 'Network error — please try again.',
    'client.chat.empty': '(empty response)',
    'client.card.personal': 'Personal Information',
    'client.card.full_name': 'Full Name',
    'client.card.phone': 'Phone',
    'client.card.location': 'Location',
    'client.card.city': 'City',
    'client.card.address': 'Address',
    'client.card.bio': 'Bio',
    'client.card.preferred_contact': 'Preferred Contact',
    'client.card.property_type': 'Property Type',
    'client.card.notes': 'Notes',
    'client.card.about': 'About',
    'client.card.empty': '—',
    'client.card.bool.yes': '✓',
    'client.card.bool.no': '✗',
    'client.card.reset': 'Reset Profile',
    'client.card.reset.confirm': 'Are you sure? This will clear all your profile data.',
    'client.find': 'Find the Right Worker',
    'client.desc': 'Post a job, browse professionals, and get your home services done.',
    'client.post': 'Post a Job',
    'client.post.desc': 'Describe what you need done — plumber, electrician, cleaner, handyman, etc.',
    'client.requests': 'Your Requests',
    'client.requests.desc': 'Track your open requests and see responses from available workers.',
    'client.reset.role': '✕ Stop being a client',

    // Client Find a Trader
    'client.tab.profile': 'My Profile',
    'client.tab.find': 'Find a Trader',
    'client.find.title': 'Find a Trader',
    'client.find.welcome': 'Tell us what you need and we\'ll find the right professional for you.',
    'client.find.placeholder': 'I need an electrician in Madrid…',
    'client.find.placeholder.followup': 'Any other requirements?',
    'client.find.you': 'You',
    'client.find.assistant': 'Assistant',
    'client.find.typing': 'typing…',
    'client.find.send': 'Send',
    'client.find.error': 'Network error — please try again.',
    'client.find.empty': '(empty response)',
    'client.find.no_results': 'No workers found matching your criteria.',
    'client.find.results_found': '{count} workers found',
    'client.find.badge.insured': 'Insured',
    'client.find.badge.emergency': 'Emergency',
    'client.find.badge.free_estimate': 'Free Estimate',

    // General
    'lang.switch': 'Language',
  },

  es: {
    // App / Auth
    'app.title': 'HelpingPeopleNow',
    'auth.checking': 'Verificando autenticación...',
    'auth.loading': 'Cargando...',
    'auth.signin': 'Iniciar Sesión',
    'auth.signin.desc': 'Ingresa tu email y te enviaremos un enlace mágico.',
    'auth.signup': 'Crear Cuenta',
    'auth.signup.desc': 'Ingresa tu nombre y email — no necesitas contraseña.',
    'auth.magic.sent': 'Revisa tu email ✉️',
    'auth.magic.desc': 'Enviamos un enlace mágico a',
    'auth.magic.click': 'Haz clic en el enlace del email para iniciar sesión.',
    'auth.magic.click.signup': 'Haz clic en el enlace — tu cuenta se creará automáticamente.',
    'auth.magic.expires': 'El enlace expira en 5 minutos.',
    'auth.send.again': 'Enviar de nuevo',
    'auth.try.again': 'Intentar de nuevo',
    'auth.send.magic': 'Enviar Enlace Mágico',
    'auth.sending': 'Enviando...',
    'auth.logout': 'Cerrar Sesión',
    'auth.logout.confirm': '¿Estás seguro de que quieres cerrar sesión?',
    'auth.email': 'Email',
    'auth.name': 'Nombre',
    'auth.email.required': 'El email es obligatorio',
    'auth.name.email.required': 'Nombre y email son obligatorios',
    'auth.no.account': '¿No tienes cuenta?',
    'auth.has.account': '¿Ya tienes cuenta?',
    'auth.signup.link': 'Registrarse',
    'auth.signin.link': 'Iniciar sesión',

    // Navigation
    'nav.admin': 'Admin',
    'nav.chat': 'Chat',
    'nav.worker.profile': 'Perfil de Trabajador',
    'nav.client.portal': 'Portal de Cliente',
    'nav.back': '← Volver',

    // Admin Page
    'admin.title': '🛠 Admin del Sistema',
    'admin.subtitle': 'Edita los prompts y el proveedor LLM.',
    'admin.db': '🗄 Adminer (BD)',
    'admin.loading': 'Cargando...',
    'admin.load.error': 'Error al cargar los prompts',
    'admin.provider': 'Proveedor LLM',
    'admin.provider.desc': 'Elige qué backend usa el asistente. Por defecto = cadena de respaldo automática (Mistral → OpenCode → Ollama).',
    'admin.provider.default': 'Por defecto (auto)',
    'admin.save': 'Guardar',
    'admin.saving': 'Guardando...',
    'admin.helper.label': 'Prompt de Asistente',
    'admin.helper.desc': 'Prompt del sistema para el servicio helper',
    'admin.worker.label': 'Prompt de Perfil de Trabajador',
    'admin.worker.desc': 'Prompt del sistema para el chat de registro de trabajador',
    'admin.prompt.client': 'Prompt de Perfil de Cliente',
    'admin.client.desc': 'Prompt del sistema para el chat de registro de cliente',
    'admin.lang.en': 'EN',
    'admin.lang.es': 'ES',
    'admin.prompt.helper': 'Prompt de Asistente',
    'admin.prompt.worker': 'Prompt de Perfil de Trabajador',
    'admin.prompt.find_trader_search': 'Prompt de Búsqueda de Profesional',
    'admin.prompt.find_trader_presentation': 'Prompt de Presentación de Profesional',
    'admin.find_trader_search.desc': 'Prompt del sistema para buscar profesionales (fase de búsqueda)',
    'admin.find_trader_presentation.desc': 'Prompt del sistema para presentar profesionales a clientes',

    // Chat Page
    'chat.placeholder': 'Pregunta lo que quieras...',
    'chat.thinking': 'Pensando...',
    'chat.error.network': 'Error de red — ¿el backend está funcionando?',
    'chat.complete.profile': 'Completa tu Perfil de Trabajador →',
    'chat.post.request': 'Publica tu Primera Solicitud →',
    'chat.no.messages': 'Aún no hay mensajes.',
    'chat.prompts.missing': 'No se puede continuar — los prompts del sistema no están configurados. Pídele a un administrador que los configure.',
    'chat.welcome.title': '¡Bienvenido! ¿Cómo podemos ayudarte?',
    'chat.welcome.desc1': 'Cuéntanos qué necesitas — reparaciones, limpieza, fontanería, electricidad o cualquier otra cosa.',
    'chat.welcome.desc2': 'Te conectaremos con los profesionales adecuados en tu zona.',
    'chat.mic.start': 'Pulsa para hablar',
    'chat.mic.stop': 'Detener grabación',
    'chat.mic.listening': 'Escuchando...',

    // Worker Page
    'worker.title': 'Perfil de Trabajador',
    'worker.loading': 'Cargando perfil…',
    'worker.chat.title': 'Crea tu Perfil por Chat',
    'worker.chat.welcome': 'Conversa para crear tu perfil de forma natural.',
    'worker.chat.example': 'Ejemplo:',
    'worker.chat.example.text': '"Soy fontanero en Madrid con 8 años de experiencia"',
    'worker.chat.you': 'Tú',
    'worker.chat.assistant': 'Asistente',
    'worker.chat.typing': 'escribiendo…',
    'worker.chat.placeholder.start': 'Soy fontanero en Madrid…',
    'worker.chat.placeholder.answer': 'Escribe tu respuesta…',
    'worker.chat.send': 'Enviar',
    'worker.chat.error': 'Error de red — inténtalo de nuevo.',
    'worker.chat.empty': '(respuesta vacía)',
    'worker.card.core': 'Identidad Principal',
    'worker.card.profession': 'Profesión',
    'worker.card.business_name': 'Nombre del Negocio',
    'worker.card.bio': 'Biografía',
    'worker.card.phone': 'Teléfono',
    'worker.card.location': 'Ubicación y Zona de Servicio',
    'worker.card.city': 'Ciudad',
    'worker.card.radius': 'Radio de Servicio (km)',
    'worker.card.address': 'Dirección',
    'worker.card.pricing': 'Precios',
    'worker.card.hourly': 'Tarifa por Hora (€)',
    'worker.card.minimum': 'Cargo Mínimo (€)',
    'worker.card.free_estimate': 'Presupuesto Gratuito',
    'worker.card.credentials': 'Credenciales',
    'worker.card.experience': 'Años de Experiencia',
    'worker.card.certifications': 'Certificaciones',
    'worker.card.insurance': 'Tiene Seguro',
    'worker.card.languages': 'Idiomas',
    'worker.card.emergency': 'Servicio de Emergencia',
    'worker.card.online': 'Presencia Online',
    'worker.card.website': 'Sitio Web',
    'worker.card.social': 'Redes Sociales',
    'worker.card.empty': '—',
    'worker.card.bool.yes': '✓',
    'worker.card.bool.no': '✗',
    'worker.card.reset': 'Restablecer Perfil',
    'worker.card.reset.confirm': '¿Estás seguro? Esto borrará todos los datos de tu perfil.',
    'worker.reset.role': '✕ Dejar de ser trabajador',

    // Client Page
    'client.title': 'Portal de Cliente',
    'client.loading': 'Cargando perfil…',
    'client.chat.title': 'Crea tu Perfil por Chat',
    'client.chat.welcome': 'Conversa para crear tu perfil de forma natural.',
    'client.chat.example': 'Ejemplo:',
    'client.chat.example.text': '"Me llamo Juan, vivo en Madrid"',
    'client.chat.you': 'Tú',
    'client.chat.assistant': 'Asistente',
    'client.chat.typing': 'escribiendo…',
    'client.chat.placeholder.start': 'Me llamo Juan…',
    'client.chat.placeholder.answer': 'Escribe tu respuesta…',
    'client.chat.send': 'Enviar',
    'client.chat.error': 'Error de red — inténtalo de nuevo.',
    'client.chat.empty': '(respuesta vacía)',
    'client.card.personal': 'Información Personal',
    'client.card.full_name': 'Nombre Completo',
    'client.card.phone': 'Teléfono',
    'client.card.location': 'Ubicación',
    'client.card.city': 'Ciudad',
    'client.card.address': 'Dirección',
    'client.card.bio': 'Biografía',
    'client.card.preferred_contact': 'Contacto Preferido',
    'client.card.property_type': 'Tipo de Propiedad',
    'client.card.notes': 'Notas',
    'client.card.about': 'Acerca de',
    'client.card.empty': '—',
    'client.card.bool.yes': '✓',
    'client.card.bool.no': '✗',
    'client.card.reset': 'Restablecer Perfil',
    'client.card.reset.confirm': '¿Estás seguro? Esto borrará todos los datos de tu perfil.',
    'client.find': 'Encuentra al Profesional Adecuado',
    'client.desc': 'Publica un trabajo, busca profesionales y realiza tus servicios del hogar.',
    'client.post': 'Publicar un Trabajo',
    'client.post.desc': 'Describe lo que necesitas — fontanero, electricista, limpiador, manitas, etc.',
    'client.requests': 'Tus Solicitudes',
    'client.requests.desc': 'Sigue tus solicitudes abiertas y ve las respuestas de los trabajadores disponibles.',
    'client.reset.role': '✕ Dejar de ser cliente',

    // Client Find a Trader
    'client.tab.profile': 'Mi Perfil',
    'client.tab.find': 'Buscar Profesional',
    'client.find.title': 'Buscar Profesional',
    'client.find.welcome': 'Cuéntanos qué necesitas y encontraremos al profesional adecuado.',
    'client.find.placeholder': 'Necesito un electricista en Madrid…',
    'client.find.placeholder.followup': '¿Algún otro requisito?',
    'client.find.you': 'Tú',
    'client.find.assistant': 'Asistente',
    'client.find.typing': 'escribiendo…',
    'client.find.send': 'Enviar',
    'client.find.error': 'Error de red — inténtalo de nuevo.',
    'client.find.empty': '(respuesta vacía)',
    'client.find.no_results': 'No se encontraron profesionales.',
    'client.find.results_found': '{count} profesionales encontrados',
    'client.find.badge.insured': 'Asegurado',
    'client.find.badge.emergency': 'Emergencias',
    'client.find.badge.free_estimate': 'Presupuesto Gratis',

    // General
    'lang.switch': 'Idioma',
  },
};

// ── Language Context ────────────────────────────────────────────────────
interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

export function useLanguage() {
  return useContext(LangContext);
}

export function LanguageProvider({ children }: { children: any }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === 'en' || stored === 'es') {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string, fallback?: string): string => {
    return translations[lang]?.[key] || translations.en?.[key] || fallback || key;
  };

  return h(LangContext.Provider, { value: { lang, setLang, t } }, children);
}

// ── Language Toggle Component ──────────────────────────────────────────
export function LangToggle({ style }: { style?: h.JSX.CSSProperties }) {
  const { lang, setLang } = useLanguage();
  return h('button', {
    onClick: () => setLang(lang === 'en' ? 'es' : 'en'),
    className: `btn-lang${lang === 'es' ? ' active' : ''}`,
    style: style || undefined,
  }, lang === 'en' ? 'ES' : 'EN');
}
