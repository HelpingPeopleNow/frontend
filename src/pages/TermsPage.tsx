import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage } from '../i18n';

export default function TermsPage() {
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  useEffect(() => {
    document.title = isEn ? 'Terms & Conditions | Helping People' : 'Términos y Condiciones | Helping People';
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
        <h1>{isEn ? 'Terms & Conditions' : 'Términos y Condiciones'}</h1>
        <p class="legal-updated">
          {isEn ? 'Last updated: June 29, 2026' : 'Última actualización: 29 de junio de 2026'}
        </p>

        {/* 1 */}
        <h2>{isEn ? '1. Acceptance of Terms' : '1. Aceptación de los Términos'}</h2>
        <p>
          {isEn
            ? 'By accessing or using Helping People (goodbytes.net), you agree to be bound by these Terms and Conditions in their entirety. If you do not agree with any part, do not use the platform.'
            : 'Al acceder o utilizar Helping People (goodbytes.net), aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no utilices la plataforma.'}
        </p>

        {/* 2 */}
        <h2>{isEn ? '2. Service Description' : '2. Descripción del Servicio'}</h2>
        <p>
          {isEn
            ? 'Helping People is a matching platform that connects clients with home-service professionals through an AI assistant. We facilitate introductions between parties but are not part of any agreement, contract, or employment relationship between users.'
            : 'Helping People es una plataforma de emparejamiento que conecta a clientes con profesionales del hogar mediante un asistente con inteligencia artificial. Facilitamos la introducción entre las partes, pero no somos parte de ningún acuerdo, contrato o relación laboral entre usuarios.'}
        </p>

        {/* 3 */}
        <h2>{isEn ? '3. User Accounts' : '3. Cuentas de Usuario'}</h2>
        <ul>
          <li>{isEn ? 'You must be at least 18 years old to use the platform.' : 'Debes tener al menos 18 años para usar la plataforma.'}</li>
          <li>{isEn ? 'You are responsible for maintaining the confidentiality of your account.' : 'Eres responsable de mantener la confidencialidad de tu cuenta.'}</li>
          <li>{isEn ? 'All information you provide must be truthful and current.' : 'La información que proporciones debe ser veraz y actualizada.'}</li>
          <li>{isEn ? 'We reserve the right to suspend or cancel accounts for misuse.' : 'Nos reservamos el derecho de suspender o cancelar cuentas por uso indebido.'}</li>
        </ul>

        {/* 4 */}
        <h2>{isEn ? '4. User Conduct' : '4. Conducta del Usuario'}</h2>
        <p>{isEn ? 'You may not:' : 'No puedes:'}</p>
        <ul>
          <li>{isEn ? 'Use the platform for illegal or unauthorized purposes.' : 'Usar la plataforma para fines ilegales o no autorizados.'}</li>
          <li>{isEn ? 'Harass, threaten, or harm other users.' : 'Acosar, amenazar o dañar a otros usuarios.'}</li>
          <li>{isEn ? 'Create false or misleading profiles.' : 'Crear perfiles falsos o engañosos.'}</li>
          <li>{isEn ? 'Manipulate the matching or search system.' : 'Manipular el sistema de emparejamiento o búsqueda.'}</li>
          <li>{isEn ? 'Share confidential information of other users.' : 'Compartir información confidencial de otros usuarios.'}</li>
        </ul>

        {/* 5 */}
        <h2>{isEn ? '5. Relationship Between Users' : '5. Relación entre Usuarios'}</h2>
        <p>
          {isEn
            ? 'Helping People acts solely as a technological intermediary. Any agreement, contract, payment, or relationship arising between clients and professionals is the sole responsibility of the parties involved. We are not liable for:'
            : 'Helping People actúa únicamente como intermediario tecnológico. Cualquier acuerdo, contrato, pago o relación que surja entre clientes y profesionales es responsabilidad exclusiva de las partes implicadas. No nos hacemos responsables de:'}
        </p>
        <ul>
          <li>{isEn ? 'The quality of services provided.' : 'La calidad de los servicios prestados.'}</li>
          <li>{isEn ? 'Compliance with verbal or written agreements.' : 'El cumplimiento de acuerdos verbales o escritos.'}</li>
          <li>{isEn ? 'Damages, losses, or disputes arising from offline meetings.' : 'Daños, pérdidas o disputas surgidas de encuentros offline.'}</li>
          <li>{isEn ? 'The accuracy of credentials or insurance declared by professionals.' : 'La veracidad de las credenciales o seguros declarados por los profesionales.'}</li>
        </ul>

        {/* 6 */}
        <h2>{isEn ? '6. Limitation of Liability' : '6. Limitación de Responsabilidad'}</h2>
        <p>
          {isEn
            ? 'To the maximum extent permitted by law, Helping People (goodbytes.net) and its owners shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from the use of the platform, including but not limited to financial losses, property damage, or personal injury.'
            : 'En la máxima medida permitida por la ley, Helping People (goodbytes.net) y sus propietarios no serán responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos derivados del uso de la plataforma, incluyendo pero no limitado a pérdidas económicas, daños a la propiedad o lesiones personales.'}
        </p>

        {/* 7 */}
        <h2>{isEn ? '7. Intellectual Property' : '7. Propiedad Intelectual'}</h2>
        <p>
          {isEn
            ? 'The content, logos, design, and code of the platform are the property of goodbytes.net. You may not reproduce, distribute, or modify any element without express authorization.'
            : 'El contenido, logotipos, diseño y código de la plataforma son propiedad de goodbytes.net. No puedes reproducir, distribuir o modificar ningún elemento sin autorización expresa.'}
        </p>

        {/* 8 */}
        <h2>{isEn ? '8. Cancellation and Termination' : '8. Cancelación y Terminación'}</h2>
        <p>
          {isEn
            ? 'You may delete your account at any time by contacting us at goodbytes23@gmail.com. We reserve the right to terminate accounts that violate these terms.'
            : 'Puedes eliminar tu cuenta en cualquier momento contactándonos a goodbytes23@gmail.com. Nos reservamos el derecho de terminar cuentas que violen estos términos.'}
        </p>

        {/* 9 */}
        <h2>{isEn ? '9. Modifications' : '9. Modificaciones'}</h2>
        <p>
          {isEn
            ? 'We may update these terms at any time. Changes will be posted on this page with a revised update date. Continued use of the platform after changes constitutes acceptance.'
            : 'Podemos actualizar estos términos en cualquier momento. Los cambios serán publicados en esta página con una fecha de actualización revisada. El uso continuado de la plataforma tras los cambios constituye aceptación.'}
        </p>

        {/* 10 */}
        <h2>{isEn ? '10. Governing Law' : '10. Legislación Aplicable'}</h2>
        <p>
          {isEn
            ? 'These terms are governed by the laws of Spain. Any disputes shall be resolved in the courts of Madrid.'
            : 'Estos términos se rigen por las leyes de España. Cualquier disputa será resuelta en los tribunales de Madrid.'}
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
