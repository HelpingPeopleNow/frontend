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
    'admin.provider.desc': 'Choose which backend the assistant uses. Default = env var USE_OLLAMA.',
    'admin.provider.default': 'Default (env: USE_OLLAMA)',
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

    // Chat Page
    'chat.placeholder': 'Ask anything...',
    'chat.thinking': 'Thinking...',
    'chat.error.network': 'Network error — is the backend running?',
    'chat.complete.profile': 'Complete your Worker Profile →',
    'chat.post.request': 'Post Your First Request →',
    'chat.no.messages': 'No messages yet.',
    'chat.prompts.missing': 'Cannot continue — system prompts are not configured. Please ask an admin to set them up.',

    // Worker Page
    'worker.title': 'Worker Profile',
    'worker.loading': 'Loading profile…',
    'worker.saved': 'Profile saved successfully!',
    'worker.save.error': 'Failed to save profile',
    'worker.chat.title': 'Build Your Profile via Chat',
    'worker.chat.welcome': "Start a conversation to build your profile naturally. Or fill the form directly on the right.",
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
    'worker.form.core': 'Core Identity',
    'worker.form.profession': 'Profession',
    'worker.form.profession.placeholder': 'Select your profession',
    'worker.form.business': 'Business Name',
    'worker.form.bio': 'Bio',
    'worker.form.phone': 'Phone',
    'worker.form.location': 'Location & Service Area',
    'worker.form.city': 'City',
    'worker.form.radius': 'Service Radius (km)',
    'worker.form.address': 'Address',
    'worker.form.pricing': 'Pricing',
    'worker.form.hourly': 'Hourly Rate (€)',
    'worker.form.minimum': 'Minimum Charge (€)',
    'worker.form.free.estimate': 'Free Estimate',
    'worker.form.credentials': 'Credentials',
    'worker.form.experience': 'Years of Experience',
    'worker.form.certifications': 'Certifications',
    'worker.form.insurance': 'Has Insurance',
    'worker.form.languages': 'Languages',
    'worker.form.emergency': 'Emergency Service',
    'worker.form.online': 'Online Presence',
    'worker.form.website': 'Website',
    'worker.form.social': 'Social Networks',
    'worker.form.save': 'Save Profile',
    'worker.form.saving': 'Saving…',
    'worker.reset.role': '✕ Stop being a worker',

    // Client Page
    'client.title': 'Client Portal',
    'client.loading': 'Loading profile…',
    'client.saved': 'Profile saved successfully!',
    'client.save.error': 'Failed to save profile',
    'client.save': 'Save Profile',
    'client.saving': 'Saving…',
    'client.chat.title': 'Build Your Profile via Chat',
    'client.chat.welcome': 'Start a conversation to build your profile naturally. Or fill the form directly on the right.',
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
    'client.form.personal': 'Personal Information',
    'client.form.full_name': 'Full Name',
    'client.form.phone': 'Phone',
    'client.form.location': 'Location',
    'client.form.city': 'City',
    'client.form.address': 'Address',
    'client.form.bio': 'Bio',
    'client.form.bio.placeholder': 'Brief description about yourself (optional)',
    'client.form.optional': 'optional',
    'client.find': 'Find the Right Worker',
    'client.desc': 'Post a job, browse professionals, and get your home services done.',
    'client.post': 'Post a Job',
    'client.post.desc': 'Describe what you need done — plumber, electrician, cleaner, handyman, etc.',
    'client.requests': 'Your Requests',
    'client.requests.desc': 'Track your open requests and see responses from available workers.',
    'client.reset.role': '✕ Stop being a client',

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
    'admin.provider.desc': 'Elige qué backend usa el asistente. Por defecto = variable USE_OLLAMA.',
    'admin.provider.default': 'Por defecto (env: USE_OLLAMA)',
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

    // Chat Page
    'chat.placeholder': 'Pregunta lo que quieras...',
    'chat.thinking': 'Pensando...',
    'chat.error.network': 'Error de red — ¿el backend está funcionando?',
    'chat.complete.profile': 'Completa tu Perfil de Trabajador →',
    'chat.post.request': 'Publica tu Primera Solicitud →',
    'chat.no.messages': 'Aún no hay mensajes.',
    'chat.prompts.missing': 'No se puede continuar — los prompts del sistema no están configurados. Pídele a un administrador que los configure.',

    // Worker Page
    'worker.title': 'Perfil de Trabajador',
    'worker.loading': 'Cargando perfil…',
    'worker.saved': '¡Perfil guardado correctamente!',
    'worker.save.error': 'Error al guardar el perfil',
    'worker.chat.title': 'Crea tu Perfil por Chat',
    'worker.chat.welcome': 'Conversa para crear tu perfil de forma natural. O rellena el formulario directamente a la derecha.',
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
    'worker.form.core': 'Identidad Principal',
    'worker.form.profession': 'Profesión',
    'worker.form.profession.placeholder': 'Selecciona tu profesión',
    'worker.form.business': 'Nombre del Negocio',
    'worker.form.bio': 'Biografía',
    'worker.form.phone': 'Teléfono',
    'worker.form.location': 'Ubicación y Zona de Servicio',
    'worker.form.city': 'Ciudad',
    'worker.form.radius': 'Radio de Servicio (km)',
    'worker.form.address': 'Dirección',
    'worker.form.pricing': 'Precios',
    'worker.form.hourly': 'Tarifa por Hora (€)',
    'worker.form.minimum': 'Cargo Mínimo (€)',
    'worker.form.free.estimate': 'Presupuesto Gratuito',
    'worker.form.credentials': 'Credenciales',
    'worker.form.experience': 'Años de Experiencia',
    'worker.form.certifications': 'Certificaciones',
    'worker.form.insurance': 'Tiene Seguro',
    'worker.form.languages': 'Idiomas',
    'worker.form.emergency': 'Servicio de Emergencia',
    'worker.form.online': 'Presencia Online',
    'worker.form.website': 'Sitio Web',
    'worker.form.social': 'Redes Sociales',
    'worker.form.save': 'Guardar Perfil',
    'worker.form.saving': 'Guardando…',
    'worker.reset.role': '✕ Dejar de ser trabajador',

    // Client Page
    'client.title': 'Portal de Cliente',
    'client.loading': 'Cargando perfil…',
    'client.saved': '¡Perfil guardado correctamente!',
    'client.save.error': 'Error al guardar el perfil',
    'client.save': 'Guardar Perfil',
    'client.saving': 'Guardando…',
    'client.chat.title': 'Crea tu Perfil por Chat',
    'client.chat.welcome': 'Conversa para crear tu perfil de forma natural. O rellena el formulario directamente a la derecha.',
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
    'client.form.personal': 'Información Personal',
    'client.form.full_name': 'Nombre Completo',
    'client.form.phone': 'Teléfono',
    'client.form.location': 'Ubicación',
    'client.form.city': 'Ciudad',
    'client.form.address': 'Dirección',
    'client.form.bio': 'Biografía',
    'client.form.bio.placeholder': 'Breve descripción sobre ti (opcional)',
    'client.form.optional': 'opcional',
    'client.find': 'Encuentra al Profesional Adecuado',
    'client.desc': 'Publica un trabajo, busca profesionales y realiza tus servicios del hogar.',
    'client.post': 'Publicar un Trabajo',
    'client.post.desc': 'Describe lo que necesitas — fontanero, electricista, limpiador, manitas, etc.',
    'client.requests': 'Tus Solicitudes',
    'client.requests.desc': 'Sigue tus solicitudes abiertas y ve las respuestas de los trabajadores disponibles.',
    'client.reset.role': '✕ Dejar de ser cliente',

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
