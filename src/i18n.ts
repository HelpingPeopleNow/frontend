import { h, ComponentChildren, createContext } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';

// ── Translation dictionary ──────────────────────────────────────────────
export type Lang = 'en' | 'es';

const STORAGE_KEY = 'hermes_lang';

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // App / Auth
    'app.title': 'Helping People',
    'auth.checking': 'Checking authentication...',
    'auth.loading': 'Loading...',
    'auth.signin': 'Sign In',
    'auth.signin.desc': "Enter your email and we'll send you a magic link. First time here? Your account will be created automatically.",
    'auth.signin.or_create': 'Sign in or create an account',
    'auth.no.password': 'No password needed — we email you a magic link.',
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
    'auth.captcha.required': "Please complete the CAPTCHA — we need to verify you're human before sending the magic link.",

    // Landing nav
    'landing.nav.how_it_works': 'How it works',

    // Navigation
    'nav.admin': 'Admin',
    'nav.chat': 'Chat',
    'nav.find': 'Find a Pro',
    'nav.inbox': 'Messages',
    'nav.back': '← Back',

    // Admin Page
    'admin.title': '🛠 System Admin',
    'admin.subtitle': 'Edit prompts and LLM provider.',
    'admin.db': '🗄 Adminer (DB)',
    'admin.loading': 'Loading...',
    'admin.load.error': 'Failed to load prompts',
    'admin.provider': 'LLM Provider',
    'admin.provider.desc': 'Choose which backend the assistant uses. Default = auto fallback chain (Mistral → OpenCode 0 → OpenCode 1 → OpenCode 2 → Ollama).',
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
    'admin.menu.llm': 'LLM Provider',
    'admin.menu.llm.desc': 'Change which AI model the assistant uses',
    'admin.menu.prompts': 'System Prompts',
    'admin.menu.prompts.desc': 'Edit the prompts that guide the AI assistant',
    'admin.menu.users': 'Users',
    'admin.menu.users.desc': 'View, edit and delete registered users',
    'admin.menu.workers': 'Workers',
    'admin.menu.workers.desc': 'Manage worker profiles and tradespeople',
    'admin.menu.clients': 'Clients',
    'admin.menu.clients.desc': 'Manage client profiles and home owners',
    'admin.menu.conversations': 'Conversations',
    'admin.menu.conversations.desc': 'View chat conversations and metadata',
    'admin.menu.messages': 'Messages',
    'admin.menu.messages.desc': 'Browse individual chat messages',
    'admin.menu.direct_conversations': 'Direct Conversations',
    'admin.menu.direct_conversations.desc': 'Worker ↔ client direct messages with sentiment scores',
    'admin.menu.db.desc': 'Direct database access',
    'admin.back': 'Back',
    'admin.edit': 'Edit',
    'admin.cancel': 'Cancel',
    'admin.confirm_delete': 'Delete this record?',
    'admin.delete': 'Delete',
    'admin.error': 'Error',
    'admin.no_records': 'No records found.',

    // Chat Page
    'chat.placeholder': 'Ask anything...',
    'chat.thinking': 'Thinking...',
    'chat.error.network': 'Network error — is the backend running?',
    'chat.location.denied': 'Location access helps us find the closest traders near you. You can enable it in your browser settings.',
    'chat.complete.profile': 'Complete your Worker Profile →',
    'chat.post.request': 'Post Your First Request →',
    'chat.no.messages': 'No messages yet.',
    'chat.prompts.missing': 'Cannot continue — system prompts are not configured. Please ask an admin to set them up.',
    'chat.welcome.title': 'Welcome! How can we help you?',
    'chat.welcome.desc1': 'Tell us what you need — home repairs, cleaning, plumbing, electrical work, or anything else.',
    'chat.welcome.desc2': 'We\'ll match you with the right professionals in your area.',
    'chat.welcome.worker.title': 'Set Up Your Worker Profile',
    'chat.welcome.worker.desc': 'Tell us about your trade and experience — we\'ll build your profile through conversation.',
    'chat.welcome.client.title': 'Set Up Your Client Profile',
    'chat.welcome.client.desc': 'Tell us about yourself so professionals can better assist you.',
    'chat.mic.start': 'Press to speak',
    'chat.mic.stop': 'Stop recording',
    'chat.mic.listening': 'Listening...',
    'chat.mic.unavailable': 'Voice unavailable — please type',

    // Mode Chooser
    'chooser.title': 'What would you like to do?',
    'chooser.desc': 'Choose how you want to use Helping People.',
    'chooser.worker.label': 'I am a Worker',
    'chooser.worker.desc': 'Build your professional profile through a quick chat.',
    'chooser.client.label': 'I am a Client',
    'chooser.client.desc': 'Create your client profile so professionals can find you.',
    'chooser.search.label': 'Find a Professional',
    'chooser.search.desc': 'Search for local professionals in your area.',

    // Find Page
    'find.title': 'Find a Professional',
    'find.welcome.title': 'Find the Right Professional',
    'find.welcome.desc': 'Tell us what you need and we\'ll find trusted professionals in your area.',
    'find.placeholder': 'I need an electrician in Madrid…',

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
    'sidebar.main': 'Main',
    'chat.role.assistant': 'Assistant',
    'chat.prompts.title': 'System Prompts Missing',
    'worker.card.years_exp': 'years exp.',
    'auth.placeholder.name': 'Your name',

    // Direct Messages
    'dm.inbox.title': 'Messages',
    'dm.inbox.empty.title': 'No messages yet',
    'dm.inbox.empty.desc': 'When you contact a professional or receive a message, it will appear here.',
    'dm.thread.empty': 'No messages yet. Say hello!',
    'dm.thread.unknown': 'User',
    'dm.placeholder': 'Type a message...',
    'dm.type.client': 'Client',
    'dm.type.worker': 'Worker',
    'dm.type.user': 'User',
    'dm.contact.loading': 'Opening conversation...',
    'dm.contact.error': 'Could not start conversation',
    'dm.contact.error.title': 'Something went wrong',
    'dm.contact.back': 'Back to search',
    'dm.block': 'Block',
    'dm.block.title': 'Block this conversation?',
    'dm.block.desc': 'You will no longer receive messages from this user.',
    'dm.report': 'Report',
    'dm.report.title': 'Report this conversation',
    'dm.report.desc': 'This will be reviewed by our moderation team.',
    'dm.archive': 'Archive',
    'dm.rate.limited': 'Sending too fast — please wait a moment.',
    'dm.status.open': 'Live',
    'dm.status.connecting': 'Connecting…',
    'dm.status.polling': 'Checking for messages',
    'dm.status.disconnected': 'Offline',

    // Public Profile
    'profile.contact': 'Contact this professional',
    'profile.not_found': 'Professional profile not found',
    'profile.years_experience': 'years experience',
    'profile.hourly_rate': 'hourly rate',
    'profile.minimum_charge': 'minimum charge',
    'profile.free_estimate': 'Free estimate',
    'profile.has_insurance': 'Insured',
    'profile.emergency_service': 'Emergency service',
    'profile.latest_professionals': 'Latest Professionals',
    'profile.view_profile': 'View Profile',
    'profile.chat_now': 'Chat',
    'profile.view_all': 'View all',

    // Landing Page — hero
    'landing.hero.badge': 'Talk or type. In English or Spanish.',
    'landing.hero.heading.before': "Just say what you need.",
    'landing.hero.heading.highlight': "We'll find the right person.",
    'landing.hero.desc': "Tell us in your own words — or just speak — and we'll match you with the right local professional in seconds. No forms, no long searches.",
    'landing.hero.cta.start': 'Try it free',
    'landing.hero.cta.signin': 'Sign in',

    // Landing Page — benefit chips (replace stats)
    'landing.benefits.chip1': 'No forms to fill out',
    'landing.benefits.chip2': 'Chat in your language',
    'landing.benefits.chip3': 'Speak instead of type',
    'landing.benefits.chip4': 'Connect in seconds',
    'landing.benefits.chip5': 'No passwords',

    // Landing Page — latest professionals
    'landing.profiles.subtitle': 'Local professionals ready to help you.',

    // Landing Page — features (6 plain-language cards)
    'landing.features.title': 'What you can do here',
    'landing.features.subtitle': "Six things that make this feel different from a normal directory.",
    'landing.features.voice.title': 'Talk instead of type',
    'landing.features.voice.desc': "Press the microphone and say what you need. Works in Spanish and English. Faster than typing — and perfect when your hands are busy.",
    'landing.features.understand.title': 'We understand you, even if you ramble',
    'landing.features.understand.desc': "Say it however you like — 'I have a leaky pipe', 'need a plumber fast', 'urgent: water everywhere'. We get it and find the right person.",
    'landing.features.results.title': 'Results that actually fit',
    'landing.features.results.desc': "Instead of a hundred random names, we show you the few people who really match what you're looking for. Sorted by who is closest to you.",
    'landing.features.languages.title': 'Available in Spanish and English',
    'landing.features.languages.desc': "Switch languages anytime. The whole site — and every chat with a professional — works in both. Whichever feels more natural to you.",
    'landing.features.chat.title': 'Chat with the pro directly',
    'landing.features.chat.desc': "No phone calls, no waiting for emails. Open a chat in one click and talk it out. You can block or report anyone who isn't respectful.",
    'landing.features.passwordless.title': 'No passwords, no hassle',
    'landing.features.passwordless.desc': "Type your email, we send you a magic link, click it, you're in. That's the whole sign-up. No passwords to remember.",

    // Landing Page — how it works
    'landing.how.title': 'How it works',
    'landing.how.subtitle': "Three simple steps. That's all.",
    'landing.how.step1.title': 'Tell us what you need',
    'landing.how.step1.desc': "Open the chat, type or speak. No forms, no profile to fill out first.",
    'landing.how.step2.title': 'We find the right people',
    'landing.how.step2.desc': "In a few seconds, see local professionals who match — with their photo, experience, and rates right there.",
    'landing.how.step3.title': 'Chat and decide',
    'landing.how.step3.desc': "Message anyone you like. Ask questions, agree on the job. No commitments until you're ready.",

    // Landing Page — scenarios (replace testimonials)
    'landing.scenarios.title': 'What it feels like to use it',
    'landing.scenarios.subtitle': 'Three everyday moments.',
    'landing.scenarios.1.title': "It's 9 PM and a pipe just burst.",
    'landing.scenarios.1.desc': "You open the app, say 'need a plumber urgently, water everywhere'. Within seconds, the closest plumbers who do emergencies pop up. You tap one, send a message, done.",
    'landing.scenarios.2.title': 'You just moved to Madrid.',
    'landing.scenarios.2.desc': "You need a cleaner who speaks English. Type or say it, the app shows you a few nearby. Read their profiles, message the one you like.",
    'landing.scenarios.3.title': "You're a handyman with 20 years of experience.",
    'landing.scenarios.3.desc': "You don't have time to fill out a 20-field form. Just chat with the app like you'd text a friend. Your full profile is ready in 5 minutes — and clients who actually need you start showing up.",

    // Landing Page — why we built it
    'landing.why.title': 'Why we built it',
    'landing.why.body': "We're building a service that feels like asking a friend: 'Hey, do you know a good plumber?' That's it. No marketplace fatigue, no endless scrolling.",

    // Landing Page — CTA
    'landing.cta.title': 'Try it. Just say what you need.',
    'landing.cta.desc': 'Free, no card, no forms. Just your email.',
    'landing.cta.start': 'Try it free',

    // Landing Page — footer
    'landing.footer.copyright': '© 2026 Helping People. All rights reserved.',

    // Legal pages
    'legal.terms': 'Terms &amp; Conditions',
    'legal.privacy': 'Privacy Policy',
    'legal.cookies': 'Cookie Policy',
  },

  es: {
    // App / Auth
    'app.title': 'Helping People',
    'auth.checking': 'Verificando autenticación...',
    'auth.loading': 'Cargando...',
    'auth.signin': 'Iniciar Sesión',
    'auth.signin.desc': 'Ingresa tu email y te enviaremos un enlace mágico. ¿Primera vez aquí? Tu cuenta se creará automáticamente.',
    'auth.signin.or_create': 'Inicia sesión o crea tu cuenta',
    'auth.no.password': 'Sin contraseña — te enviamos un enlace mágico por email.',
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
    'auth.captcha.required': 'Por favor completa el CAPTCHA — necesitamos verificar que eres humano antes de enviar el enlace mágico.',

    // Landing nav
    'landing.nav.how_it_works': 'Cómo funciona',

    // Navigation
    'nav.admin': 'Admin',
    'nav.chat': 'Chat',
    'nav.find': 'Buscar Profesional',
    'nav.inbox': 'Mensajes',
    'nav.back': '← Volver',

    // Admin Page
    'admin.title': '🛠 Admin del Sistema',
    'admin.subtitle': 'Edita los prompts y el proveedor LLM.',
    'admin.db': '🗄 Adminer (BD)',
    'admin.loading': 'Cargando...',
    'admin.load.error': 'Error al cargar los prompts',
    'admin.provider': 'Proveedor LLM',
    'admin.provider.desc': 'Elige qué backend usa el asistente. Por defecto = cadena de respaldo automática (Mistral → OpenCode 0 → OpenCode 1 → OpenCode 2 → Ollama).',
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
    'admin.menu.llm': 'Proveedor LLM',
    'admin.menu.llm.desc': 'Cambiar qué modelo de IA usa el asistente',
    'admin.menu.prompts': 'Prompts del Sistema',
    'admin.menu.prompts.desc': 'Editar los prompts que guían al asistente de IA',
    'admin.menu.users': 'Usuarios',
    'admin.menu.users.desc': 'Ver, editar y eliminar usuarios registrados',
    'admin.menu.workers': 'Trabajadores',
    'admin.menu.workers.desc': 'Gestionar perfiles de trabajadores y profesionales',
    'admin.menu.clients': 'Clientes',
    'admin.menu.clients.desc': 'Gestionar perfiles de clientes y propietarios',
    'admin.menu.conversations': 'Conversaciones',
    'admin.menu.conversations.desc': 'Ver conversaciones y metadatos del chat',
    'admin.menu.messages': 'Mensajes',
    'admin.menu.messages.desc': 'Explorar mensajes individuales del chat',
    'admin.menu.direct_conversations': 'Conversaciones Directas',
    'admin.menu.direct_conversations.desc': 'Mensajes directos trabajador ↔ cliente con puntuaciones de sentimiento',
    'admin.menu.db.desc': 'Acceso directo a la base de datos',
    'admin.back': 'Volver',
    'admin.edit': 'Editar',
    'admin.cancel': 'Cancelar',
    'admin.confirm_delete': '¿Eliminar este registro?',
    'admin.delete': 'Eliminar',
    'admin.error': 'Error',
    'admin.no_records': 'No se encontraron registros.',

    // Chat Page
    'chat.placeholder': 'Pregunta lo que quieras...',
    'chat.thinking': 'Pensando...',
    'chat.error.network': 'Error de red — ¿el backend está funcionando?',
    'chat.location.denied': 'El acceso a la ubicación nos ayuda a encontrar los trabajadores más cercanos. Puedes activarlo en la configuración de tu navegador.',
    'chat.complete.profile': 'Completa tu Perfil de Trabajador →',
    'chat.post.request': 'Publica tu Primera Solicitud →',
    'chat.no.messages': 'Aún no hay mensajes.',
    'chat.prompts.missing': 'No se puede continuar — los prompts del sistema no están configurados. Pídele a un administrador que los configure.',
    'chat.welcome.title': '¡Bienvenido! ¿Cómo podemos ayudarte?',
    'chat.welcome.desc1': 'Cuéntanos qué necesitas — reparaciones, limpieza, fontanería, electricidad o cualquier otra cosa.',
    'chat.welcome.desc2': 'Te conectaremos con los profesionales adecuados en tu zona.',
    'chat.welcome.worker.title': 'Configura tu Perfil de Trabajador',
    'chat.welcome.worker.desc': 'Cuéntanos sobre tu oficio y experiencia — construiremos tu perfil mediante una conversación.',
    'chat.welcome.client.title': 'Configura tu Perfil de Cliente',
    'chat.welcome.client.desc': 'Cuéntanos sobre ti para que los profesionales puedan ayudarte mejor.',
    'chat.mic.start': 'Pulsa para hablar',
    'chat.mic.stop': 'Detener grabación',
    'chat.mic.listening': 'Escuchando...',
    'chat.mic.unavailable': 'Voz no disponible — escribe el mensaje',

    // Mode Chooser
    'chooser.title': '¿Qué te gustaría hacer?',
    'chooser.desc': 'Elige cómo quieres usar Helping People.',
    'chooser.worker.label': 'Soy Trabajador',
    'chooser.worker.desc': 'Crea tu perfil profesional en una conversación rápida.',
    'chooser.client.label': 'Soy Cliente',
    'chooser.client.desc': 'Crea tu perfil de cliente para que los profesionales te encuentren.',
    'chooser.search.label': 'Buscar un Profesional',
    'chooser.search.desc': 'Busca profesionales de confianza en tu zona.',

    // Find Page
    'find.title': 'Buscar un Profesional',
    'find.welcome.title': 'Encuentra al Profesional Adecuado',
    'find.welcome.desc': 'Cuéntanos qué necesitas y encontraremos profesionales de confianza en tu zona.',
    'find.placeholder': 'Necesito un electricista en Madrid…',

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
    'sidebar.main': 'Principal',
    'chat.role.assistant': 'Asistente',
    'chat.prompts.title': 'Faltan Prompts del Sistema',
    'worker.card.years_exp': 'años de exp.',
    'auth.placeholder.name': 'Tu nombre',

    // Direct Messages
    'dm.inbox.title': 'Mensajes',
    'dm.inbox.empty.title': 'No hay mensajes',
    'dm.inbox.empty.desc': 'Cuando contactes con un profesional o recibas un mensaje, aparecerá aquí.',
    'dm.thread.empty': 'No hay mensajes aún. ¡Saluda!',
    'dm.thread.unknown': 'Usuario',
    'dm.placeholder': 'Escribe un mensaje...',
    'dm.type.client': 'Cliente',
    'dm.type.worker': 'Profesional',
    'dm.type.user': 'Usuario',
    'dm.contact.loading': 'Abriendo conversación...',
    'dm.contact.error': 'No se pudo iniciar la conversación',
    'dm.contact.error.title': 'Algo salió mal',
    'dm.contact.back': 'Volver a la búsqueda',
    'dm.block': 'Bloquear',
    'dm.block.title': '¿Bloquear esta conversación?',
    'dm.block.desc': 'Ya no recibirás mensajes de este usuario.',
    'dm.report': 'Reportar',
    'dm.report.title': 'Reportar esta conversación',
    'dm.report.desc': 'Será revisado por nuestro equipo de moderación.',
    'dm.archive': 'Archivar',
    'dm.rate.limited': 'Enviando demasiado rápido — espera un momento.',
    'dm.status.open': 'En vivo',
    'dm.status.connecting': 'Conectando…',
    'dm.status.polling': 'Buscando mensajes',
    'dm.status.disconnected': 'Desconectado',

    // Public Profile
    'profile.contact': 'Contactar a este profesional',
    'profile.not_found': 'Perfil profesional no encontrado',
    'profile.years_experience': 'años de experiencia',
    'profile.hourly_rate': 'tarifa por hora',
    'profile.minimum_charge': 'cargo mínimo',
    'profile.free_estimate': 'Presupuesto gratuito',
    'profile.has_insurance': 'Asegurado',
    'profile.emergency_service': 'Servicio de emergencia',
    'profile.latest_professionals': 'Últimos profesionales',
    'profile.view_profile': 'Ver perfil',
    'profile.chat_now': 'Chat',
    'profile.view_all': 'Ver todos',

    // Landing Page — hero
    'landing.hero.badge': 'Habla o escribe. En español o inglés.',
    'landing.hero.heading.before': 'Solo dinos qué necesitas.',
    'landing.hero.heading.highlight': 'Nosotros encontramos a la persona adecuada.',
    'landing.hero.desc': 'Cuéntanos con tus palabras — o simplemente habla — y te conectamos con el profesional local ideal en segundos. Sin formularios, sin búsquedas largas.',
    'landing.hero.cta.start': 'Probar gratis',
    'landing.hero.cta.signin': 'Iniciar sesión',

    // Landing Page — benefit chips (reemplazan stats)
    'landing.benefits.chip1': 'Sin formularios',
    'landing.benefits.chip2': 'Chatea en tu idioma',
    'landing.benefits.chip3': 'Habla en vez de escribir',
    'landing.benefits.chip4': 'Conecta en segundos',
    'landing.benefits.chip5': 'Sin contraseñas',

    // Landing Page — latest professionals
    'landing.profiles.subtitle': 'Profesionales locales listos para ayudarte.',

    // Landing Page — features (6 tarjetas en lenguaje sencillo)
    'landing.features.title': 'Qué puedes hacer aquí',
    'landing.features.subtitle': 'Seis cosas que hacen que esto se sienta diferente a una guía normal.',
    'landing.features.voice.title': 'Habla en vez de escribir',
    'landing.features.voice.desc': 'Pulsa el micrófono y di qué necesitas. Funciona en español e inglés. Más rápido que escribir — y perfecto cuando tienes las manos ocupadas.',
    'landing.features.understand.title': 'Te entendemos aunque no te expliques perfecto',
    'landing.features.understand.desc': 'Dilo como quieras — "tengo una tubería que gotea", "necesito un fontanero ya", "urgente: agua por todas partes". Lo entendemos y encontramos a la persona adecuada.',
    'landing.features.results.title': 'Resultados que de verdad encajan contigo',
    'landing.features.results.desc': 'En vez de un montón de nombres al azar, te mostramos solo las personas que de verdad coinciden con lo que buscas. Ordenadas por cercanía.',
    'landing.features.languages.title': 'Disponible en español e inglés',
    'landing.features.languages.desc': 'Cambia de idioma cuando quieras. Toda la web — y cada chat con un profesional — funciona en los dos. El que te resulte más natural.',
    'landing.features.chat.title': 'Chatea directo con el profesional',
    'landing.features.chat.desc': 'Sin llamadas, sin esperar emails. Abre un chat con un clic y habla. Puedes bloquear o reportar a cualquiera que no sea respetuoso.',
    'landing.features.passwordless.title': 'Sin contraseñas, sin líos',
    'landing.features.passwordless.desc': 'Escribe tu email, te enviamos un enlace mágico, lo abres y listo. Eso es todo el registro. Sin contraseñas que recordar.',

    // Landing Page — how it works
    'landing.how.title': 'Cómo funciona',
    'landing.how.subtitle': 'Tres pasos sencillos. Nada más.',
    'landing.how.step1.title': 'Cuéntanos qué necesitas',
    'landing.how.step1.desc': 'Abre el chat, escribe o habla. Sin formularios, sin perfil que rellenar antes.',
    'landing.how.step2.title': 'Encontramos a las personas adecuadas',
    'landing.how.step2.desc': 'En unos segundos, ves profesionales locales que encajan — con su foto, experiencia y tarifas a la vista.',
    'landing.how.step3.title': 'Chatea y decide',
    'landing.how.step3.desc': 'Escribe a quien quieras. Pregunta, acuerda el trabajo. Sin compromiso hasta que estés listo.',

    // Landing Page — scenarios (reemplazan testimonials)
    'landing.scenarios.title': 'Cómo se siente usarlo',
    'landing.scenarios.subtitle': 'Tres momentos del día a día.',
    'landing.scenarios.1.title': 'Son las 9 de la noche y revienta una tubería.',
    'landing.scenarios.1.desc': 'Abres la app, dices "necesito un fontanero urgente, agua por todas partes". En segundos aparecen los fontaneros más cercanos que hacen urgencias. Tocas uno, le escribes, listo.',
    'landing.scenarios.2.title': 'Te acabas de mudar a Madrid.',
    'landing.scenarios.2.desc': 'Necesitas una persona de limpieza que hable inglés. Lo escribes o lo dices, la app te muestra algunas cerca. Lees sus perfiles, le escribes a la que te guste.',
    'landing.scenarios.3.title': 'Eres manitas con 20 años de experiencia.',
    'landing.scenarios.3.desc': 'No tienes tiempo de rellenar un formulario de 20 campos. Solo chateas con la app como si escribieras a un amigo. Tu perfil completo está listo en 5 minutos — y empiezan a aparecer clientes que de verdad te necesitan.',

    // Landing Page — why we built it
    'landing.why.title': 'Por qué lo construimos',
    'landing.why.body': 'Estamos creando un servicio que se siente como preguntarle a un amigo: "Oye, ¿conoces un buen fontanero?". Nada más. Sin marearte con mil opciones, sin scroll infinito.',

    // Landing Page — CTA
    'landing.cta.title': 'Pruébalo. Solo dinos qué necesitas.',
    'landing.cta.desc': 'Gratis, sin tarjeta, sin formularios. Solo tu email.',
    'landing.cta.start': 'Probar gratis',

    // Landing Page — footer
    'landing.footer.copyright': '© 2026 Helping People. Todos los derechos reservados.',

    // Legal pages
    'legal.terms': 'Términos y Condiciones',
    'legal.privacy': 'Política de Privacidad',
    'legal.cookies': 'Política de Cookies',
  },
};

// ── Language Context ────────────────────────────────────────────────────
interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'es',
  setLang: () => {},
  t: (k) => k,
});

export function useLanguage() {
  return useContext(LangContext);
}

export function LanguageProvider({ children }: { children: ComponentChildren }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === 'en' || stored === 'es') {
      setLangState(stored);
      return;
    }
    // First visit — check browser language
    const browserLang = (navigator.language || '').slice(0, 2);
    if (browserLang === 'en' || browserLang === 'es') {
      setLangState(browserLang);
      localStorage.setItem(STORAGE_KEY, browserLang);
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
