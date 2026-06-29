import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage } from '../i18n';

export default function PrivacyPage() {
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  useEffect(() => {
    document.title = isEn ? 'Privacy Policy | Helping People' : 'Política de Privacidad | Helping People';
  }, [lang]);

  return (
    <div class="legal-page">
      <nav class="landing-nav">
        <div class="logo" onClick={() => route('/', false)} style={{ cursor: 'pointer' }}>
          <span class="logo-mark">H</span>
          <span>Helping People</span>
        </div>
      </nav>

      <div class="legal-content">
        <h1>{isEn ? 'Privacy Policy' : 'Política de Privacidad'}</h1>
        <p class="legal-updated">
          {isEn ? 'Last updated: June 29, 2026' : 'Última actualización: 29 de junio de 2026'}
        </p>

        {/* 1 */}
        <h2>{isEn ? '1. Data Controller' : '1. Responsable del Tratamiento'}</h2>
        <p>
          {isEn ? 'Owner: goodbytes.net' : 'Titular: goodbytes.net'}<br />
          {isEn ? 'Email: ' : 'Correo electrónico: '}<a href="mailto:goodbytes23@gmail.com">goodbytes23@gmail.com</a>
        </p>

        {/* 2 */}
        <h2>{isEn ? '2. Data We Collect' : '2. Datos que Recopilamos'}</h2>

        <h3>{isEn ? '2.1 Authentication data' : '2.1 Datos de autenticación'}</h3>
        <ul>
          <li>{isEn ? 'Email address (for magic link login)' : 'Correo electrónico (para inicio de sesión mediante magic link)'}</li>
          <li>{isEn ? 'Name (optional, provided by Better Auth)' : 'Nombre (opcional, proporcionado por Better Auth)'}</li>
        </ul>

        <h3>{isEn ? '2.2 Worker profile' : '2.2 Perfil de trabajador'}</h3>
        <p>{isEn ? 'Collected through AI chat:' : 'Recopilados mediante chat con IA:'}</p>
        <ul>
          <li>{isEn ? 'Profession, business name, biography' : 'Profesión, nombre comercial, biografía'}</li>
          <li>{isEn ? 'Phone, address, city, service radius' : 'Teléfono, dirección, ciudad, radio de servicio'}</li>
          <li>{isEn ? 'Hourly rate, minimum charge, years of experience' : 'Tarifa por hora, cargo mínimo, años de experiencia'}</li>
          <li>{isEn ? 'Certifications, liability insurance, languages' : 'Certificaciones, seguro de responsabilidad, idiomas'}</li>
          <li>{isEn ? 'Emergency service, website, social media' : 'Servicio de emergencia, sitio web, redes sociales'}</li>
        </ul>

        <h3>{isEn ? '2.3 Client profile' : '2.3 Perfil de cliente'}</h3>
        <p>{isEn ? 'Collected through AI chat:' : 'Recopilados mediante chat con IA:'}</p>
        <ul>
          <li>{isEn ? 'Full name, phone, city, address' : 'Nombre completo, teléfono, ciudad, dirección'}</li>
          <li>{isEn ? 'Property type, preferred contact method, notes' : 'Tipo de propiedad, método de contacto preferido, notas'}</li>
        </ul>

        <h3>{isEn ? '2.4 Messages and conversations' : '2.4 Mensajes y conversaciones'}</h3>
        <ul>
          <li>{isEn ? 'Full chat history with the AI assistant' : 'Historial completo de chats con el asistente IA'}</li>
          <li>{isEn ? 'Direct messages between users (including reports)' : 'Mensajes directos entre usuarios (incluyendo reportes)'}</li>
          <li>{isEn ? 'Conversation metadata (dates, status)' : 'Metadatos de conversación (fechas, estado)'}</li>
        </ul>

        <h3>{isEn ? '2.5 Technical data' : '2.5 Datos técnicos'}</h3>
        <ul>
          <li>{isEn ? 'IP address (ephemeral server logs only, not stored)' : 'Dirección IP (solo en logs efímeros de servidor, no almacenada)'}</li>
          <li>{isEn ? 'User-Agent (ephemeral logs only)' : 'User-Agent (solo en logs efímeros)'}</li>
          <li>{isEn ? 'Language preference (stored in browser localStorage)' : 'Preferencia de idioma (almacenada en localStorage del navegador)'}</li>
        </ul>

        <h3>{isEn ? '2.6 Session cookie' : '2.6 Cookie de sesión'}</h3>
        <ul>
          <li><code>better-auth.session_token</code> / <code>__Secure-better-auth.session_token</code></li>
        </ul>

        {/* 3 */}
        <h2>{isEn ? '3. Purpose of Processing' : '3. Finalidad del Tratamiento'}</h2>
        <ul>
          <li>{isEn ? 'Provide the matching and AI assistant service' : 'Proveer el servicio de emparejamiento y asistente IA'}</li>
          <li>{isEn ? 'Facilitate direct communication between users' : 'Facilitar la comunicación directa entre usuarios'}</li>
          <li>{isEn ? 'Improve the platform through aggregated analysis' : 'Mejorar la plataforma mediante análisis agregados'}</li>
          <li>{isEn ? 'Comply with legal obligations' : 'Cumplir con obligaciones legales'}</li>
        </ul>

        {/* 4 */}
        <h2>{isEn ? '4. Legal Basis' : '4. Base Legal'}</h2>
        <ul>
          <li>{isEn ? 'User consent when creating an account and using the platform' : 'Consentimiento del usuario al crear cuenta y usar la plataforma'}</li>
          <li>{isEn ? 'Performance of the requested service' : 'Ejecución del servicio solicitado'}</li>
          <li>{isEn ? 'Legitimate interest in improving and securing the platform' : 'Interés legítimo en la mejora y seguridad de la plataforma'}</li>
        </ul>

        {/* 5 */}
        <h2>{isEn ? '5. Data Recipients' : '5. Destinatarios de los Datos'}</h2>
        <p>{isEn ? 'We share data with:' : 'Compartimos datos con:'}</p>
        <ul>
          <li>
            <strong>{isEn ? 'LLM Providers' : 'Proveedores de LLM'}</strong>
            {isEn
              ? ' (OpenCode AI, Mistral, Ollama): message content is sent to process AI assistant responses.'
              : ' (OpenCode AI, Mistral, Ollama): el contenido de los mensajes se envía para procesar la respuesta del asistente IA.'}
          </li>
          <li>
            <strong>{isEn ? 'Email Provider' : 'Proveedor de email'}</strong>
            {isEn
              ? ' (SMTP / Gmail): to send magic link login emails.'
              : ' (SMTP / Gmail): para enviar enlaces mágicos de inicio de sesión.'}
          </li>
          <li>
            <strong>{isEn ? 'Database Hosting' : 'Alojamiento de base de datos'}</strong>
            {isEn
              ? ' (PostgreSQL with pgvector): for persistent storage.'
              : ' (PostgreSQL con pgvector): para almacenamiento persistente.'}
          </li>
          <li>
            <strong>{isEn ? 'Other Users' : 'Otros usuarios'}</strong>
            {isEn
              ? ': worker profiles (except phone and address) are publicly visible. Full profiles are shared with matched clients.'
              : ': los perfiles de trabajador (excepto teléfono y dirección) son visibles públicamente. Los perfiles completos se comparten con clientes con los que se establece un emparejamiento.'}
          </li>
        </ul>
        <p>
          {isEn
            ? 'We do not sell personal data to third parties under any circumstances.'
            : 'No vendemos datos personales a terceros bajo ninguna circunstancia.'}
        </p>

        {/* 6 */}
        <h2>{isEn ? '6. International Transfers' : '6. Transferencias Internacionales'}</h2>
        <p>
          {isEn
            ? 'Some LLM providers may process data on servers outside the European Economic Area. All providers comply with the EU-US Data Privacy Framework or have Standard Contractual Clauses in place.'
            : 'Algunos proveedores de LLM pueden procesar datos en servidores fuera del Espacio Económico Europeo. Todos los proveedores cumplen con el Marco de Privacidad de Datos UE-EE.UU. o cuentan con Cláusulas Contractuales Tipo.'}
        </p>

        {/* 7 */}
        <h2>{isEn ? '7. Data Retention' : '7. Retención de Datos'}</h2>
        <p>
          {isEn
            ? 'We retain your data while your account is active. Upon account deletion request, data is deleted within 30 days, except where we must retain it by law.'
            : 'Conservamos tus datos mientras tu cuenta esté activa. Tras la solicitud de eliminación de cuenta, los datos se eliminan en un plazo máximo de 30 días, excepto aquellos que debamos conservar por obligación legal.'}
        </p>

        {/* 8 */}
        <h2>{isEn ? '8. Your Rights (GDPR)' : '8. Tus Derechos (RGPD)'}</h2>
        <ul>
          <li><strong>{isEn ? 'Access:' : 'Acceso:'}</strong> {isEn ? 'request a copy of your data.' : 'solicita una copia de tus datos.'}</li>
          <li><strong>{isEn ? 'Rectification:' : 'Rectificación:'}</strong> {isEn ? 'correct inaccurate data.' : 'corrige datos inexactos.'}</li>
          <li><strong>{isEn ? 'Erasure:' : 'Supresión:'}</strong> {isEn ? 'request deletion of your data.' : 'solicita la eliminación de tus datos.'}</li>
          <li><strong>{isEn ? 'Restriction:' : 'Limitación:'}</strong> {isEn ? 'restrict processing in certain cases.' : 'restringe el tratamiento en ciertos casos.'}</li>
          <li><strong>{isEn ? 'Portability:' : 'Portabilidad:'}</strong> {isEn ? 'receive your data in a structured format.' : 'recibe tus datos en formato estructurado.'}</li>
          <li><strong>{isEn ? 'Objection:' : 'Oposición:'}</strong> {isEn ? 'object to processing of your data.' : 'objeta al tratamiento de tus datos.'}</li>
        </ul>
        <p>
          {isEn
            ? 'To exercise your rights, write to '
            : 'Para ejercer tus derechos, escribe a '}
          <a href="mailto:goodbytes23@gmail.com">goodbytes23@gmail.com</a>.
          {isEn ? ' We will respond within 30 days.' : ' Responderemos en un plazo máximo de 30 días.'}
        </p>

        {/* 9 */}
        <h2>{isEn ? '9. Security' : '9. Seguridad'}</h2>
        <p>
          {isEn
            ? 'We implement technical and organizational measures to protect your data, including encryption in transit (HTTPS/TLS), HttpOnly/Secure cookies, and restricted database access. However, no internet transmission is 100% secure.'
            : 'Implementamos medidas técnicas y organizativas para proteger tus datos, incluyendo cifrado en tránsito (HTTPS/TLS), cookies HttpOnly/Secure, y acceso restringido a bases de datos. Sin embargo, ninguna transmisión por Internet es 100% segura.'}
        </p>

        {/* 10 */}
        <h2>{isEn ? '10. Changes to This Policy' : '10. Cambios en esta Política'}</h2>
        <p>
          {isEn
            ? 'We will update this policy when necessary. Significant changes will be notified through the platform or by email.'
            : 'Actualizaremos esta política cuando sea necesario. Te notificaremos de cambios significativos mediante la plataforma o por correo electrónico.'}
        </p>

        {/* 11 */}
        <h2>{isEn ? '11. Contact' : '11. Contacto'}</h2>
        <p>
          goodbytes.net &mdash; <a href="mailto:goodbytes23@gmail.com">goodbytes23@gmail.com</a>
        </p>
      </div>

      <footer class="landing-footer">
        <p>© 2026 Helping People. {isEn ? 'All rights reserved.' : 'Todos los derechos reservados.'}</p>
      </footer>
    </div>
  );
}
