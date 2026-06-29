import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage } from '../i18n';

export default function CookiesPage() {
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  useEffect(() => {
    document.title = isEn ? 'Cookie Policy | Helping People' : 'Política de Cookies | Helping People';
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
        <h1>{isEn ? 'Cookie Policy' : 'Política de Cookies'}</h1>
        <p class="legal-updated">
          {isEn ? 'Last updated: June 29, 2026' : 'Última actualización: 29 de junio de 2026'}
        </p>

        {/* 1 */}
        <h2>{isEn ? '1. What Are Cookies?' : '1. ¿Qué son las cookies?'}</h2>
        <p>
          {isEn
            ? 'Cookies are small text files stored in your browser when you visit a website. They are used to remember information about your visit and improve your browsing experience.'
            : 'Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas un sitio web. Se utilizan para recordar información sobre tu visita y mejorar tu experiencia de navegación.'}
        </p>

        {/* 2 */}
        <h2>{isEn ? '2. Cookies We Use' : '2. Cookies que utilizamos'}</h2>

        <h3>{isEn ? '2.1 Session cookie (strictly necessary)' : '2.1 Cookie de sesión (estrictamente necesaria)'}</h3>
        <ul>
          <li>
            <strong>{isEn ? 'Name:' : 'Nombre:'}</strong> <code>better-auth.session_token</code>
            {isEn ? ' (in production: ' : ' (en producción: '}<code>__Secure-better-auth.session_token</code>)
          </li>
          <li>
            <strong>{isEn ? 'Purpose:' : 'Propósito:'}</strong>
            {isEn ? ' User authentication. Keeps you logged in while you browse.' : ' Autenticación de usuario. Mantiene tu sesión iniciada mientras navegas.'}
          </li>
          <li><strong>{isEn ? 'Type:' : 'Tipo:'}</strong> {isEn ? 'Technical / Essential' : 'Técnica / Esencial'}</li>
          <li><strong>{isEn ? 'Duration:' : 'Duración:'}</strong> {isEn ? 'Session (deleted on logout or expiry)' : 'Sesión (se elimina al cerrar sesión o al expirar)'}</li>
          <li><strong>{isEn ? 'Third parties:' : 'Terceros:'}</strong> {isEn ? 'No' : 'No'}</li>
          <li><strong>HttpOnly:</strong> {isEn ? 'Yes' : 'Sí'}</li>
          <li><strong>Secure:</strong> {isEn ? 'Yes (in production)' : 'Sí (en producción)'}</li>
          <li><strong>SameSite:</strong> Lax</li>
        </ul>

        <h3>{isEn ? '2.2 Local storage (not a cookie, but we explain it)' : '2.2 Almacenamiento local (no es cookie, pero lo explicamos)'}</h3>
        <ul>
          <li><strong>{isEn ? 'Key:' : 'Clave:'}</strong> <code>lang</code></li>
          <li>
            <strong>{isEn ? 'Purpose:' : 'Propósito:'}</strong>
            {isEn ? ' Remember your language preference (English / Spanish).' : ' Recordar tu preferencia de idioma (español / inglés).'}
          </li>
          <li><strong>{isEn ? 'Type:' : 'Tipo:'}</strong> {isEn ? 'Browser localStorage' : 'localStorage del navegador'}</li>
          <li><strong>{isEn ? 'Duration:' : 'Duración:'}</strong> {isEn ? 'Until manually cleared by the user' : 'Hasta que el usuario lo elimine manualmente'}</li>
          <li><strong>{isEn ? 'Third parties:' : 'Terceros:'}</strong> {isEn ? 'No' : 'No'}</li>
        </ul>

        {/* 3 */}
        <h2>{isEn ? '3. Third-Party Cookies' : '3. Cookies de terceros'}</h2>
        <p>
          {isEn
            ? 'We do not use third-party cookies, advertising cookies, social media cookies, or analytics/tracking cookies. The platform is designed to be privacy-respecting.'
            : 'No utilizamos cookies de terceros, ni cookies de publicidad, ni cookies de redes sociales, ni cookies de análisis o tracking. Hemos diseñado la plataforma para ser respetuosa con tu privacidad.'}
        </p>

        {/* 4 */}
        <h2>{isEn ? '4. Why We Use Only One Cookie' : '4. ¿Por qué usamos solo una cookie?'}</h2>
        <p>
          {isEn
            ? 'The only cookie we use is strictly necessary for you to log in securely. We do not track your activity, display ads, or share data with advertising networks. Your browsing data is not monitored or commercialized.'
            : 'La única cookie que utilizamos es la estrictamente necesaria para que puedas iniciar sesión de forma segura. No rastreamos tu actividad, no mostramos anuncios y no compartimos datos con redes de publicidad. Tus datos de navegación no son monitorizados ni comercializados.'}
        </p>

        {/* 5 */}
        <h2>{isEn ? '5. How to Control Cookies' : '5. Cómo controlar las cookies'}</h2>
        <p>{isEn ? 'You can manage cookies from your browser settings:' : 'Puedes gestionar las cookies desde la configuración de tu navegador:'}</p>
        <ul>
          <li>
            <strong>Chrome:</strong>
            {isEn ? ' Settings → Privacy and security → Cookies and other site data' : ' Configuración → Privacidad y seguridad → Cookies y otros datos de sitios'}
          </li>
          <li>
            <strong>Firefox:</strong>
            {isEn ? ' Options → Privacy & Security → Cookies and Site Data' : ' Opciones → Privacidad y seguridad → Cookies y datos del sitio'}
          </li>
          <li>
            <strong>Safari:</strong>
            {isEn ? ' Preferences → Privacy → Cookies and website data' : ' Preferencias → Privacidad → Cookies y datos de sitios web'}
          </li>
          <li>
            <strong>Edge:</strong>
            {isEn ? ' Settings → Cookies and site permissions → Manage and delete cookies' : ' Configuración → Cookies y permisos del sitio → Administrar y eliminar cookies'}
          </li>
        </ul>
        <p>
          {isEn
            ? 'If you disable the session cookie, you will not be able to log in or use the platform, as it is necessary for the authentication system to function.'
            : 'Si deshabilitas la cookie de sesión, no podrás iniciar sesión ni utilizar la plataforma, ya que es necesaria para el funcionamiento del sistema de autenticación.'}
        </p>

        {/* 6 */}
        <h2>{isEn ? '6. Updates' : '6. Actualizaciones'}</h2>
        <p>
          {isEn
            ? 'We may update this cookie policy when necessary to reflect changes in our platform or applicable legislation. The last updated date will be revised accordingly.'
            : 'Podemos actualizar esta política de cookies cuando sea necesario para reflejar cambios en nuestra plataforma o en la legislación aplicable. La fecha de última actualización se revisará en consecuencia.'}
        </p>

        {/* 7 */}
        <h2>{isEn ? '7. Contact' : '7. Contacto'}</h2>
        <p>
          {isEn ? 'If you have questions about our cookie policy, contact us at:' : 'Si tienes dudas sobre nuestra política de cookies, puedes contactarnos en:'}<br />
          goodbytes.net &mdash; <a href="mailto:goodbytes23@gmail.com">goodbytes23@gmail.com</a>
        </p>
      </div>

      <footer class="landing-footer">
        <p>© 2026 Helping People. {isEn ? 'All rights reserved.' : 'Todos los derechos reservados.'}</p>
      </footer>
    </div>
  );
}
