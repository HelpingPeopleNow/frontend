import { h } from 'preact';
import { useState } from 'preact/hooks';
import PromptsPage from './PromptsPage';

function Home({ onNavigate }) {
  const handleClick = async () => {
    try {
      const res = await fetch('/api/v1/hello');
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: '#1a1a2e',
      color: '#e0e0e0',
    }}>
      <h1 style={{ fontSize: '4rem', margin: '0 0 2rem', color: '#00d4ff' }}>
        hi hermy, p
      </h1>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={handleClick} style={{
          padding: '1rem 2.5rem',
          fontSize: '1.2rem',
          border: 'none',
          borderRadius: '8px',
          background: '#00d4ff',
          color: '#1a1a2e',
          cursor: 'pointer',
          fontWeight: 600,
        }}>
          Say Hello
        </button>
        <button onClick={() => onNavigate('prompts')} style={{
          padding: '1rem 2.5rem',
          fontSize: '1.2rem',
          border: 'none',
          borderRadius: '8px',
          background: '#0f3460',
          color: '#00d4ff',
          cursor: 'pointer',
          fontWeight: 600,
        }}>
          ✏️ Prompt Helpers
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('home');

  if (page === 'prompts') {
    return <PromptsPage onNavigate={() => setPage('home')} />;
  }

  return <Home onNavigate={setPage} />;
}
