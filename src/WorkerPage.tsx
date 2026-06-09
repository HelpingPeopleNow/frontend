import { h } from 'preact';
import { route } from 'preact-router';
import { useAuth } from './AuthProvider';

export default function WorkerPage() {
  const { session, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    route('/login', true);
  };

  return (
    <div class="role-page">
      <div class="role-header">
        <h2>Worker Dashboard</h2>
        <div class="header-right">
          <span class="user-email">{session?.user?.email}</span>
          <button class="btn-chat" onClick={() => route('/', true)}>Chat</button>
          <button class="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div class="role-content">
        <h3>Welcome, Worker!</h3>
        <p>This is where you'll find job opportunities, manage your profile, and connect with clients.</p>
        <div class="placeholder-card">
          <h4>Your Skills</h4>
          <p>Add your skills, experience, and availability to start getting matched with jobs.</p>
        </div>
        <div class="placeholder-card">
          <h4>Available Jobs</h4>
          <p>Jobs near you will appear here once clients post their requests.</p>
        </div>
      </div>
      <style>{`
        .role-page { display: flex; flex-direction: column; height: 100vh; max-width: 800px; margin: 0 auto; }
        .role-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #1a1a2e; border-bottom: 1px solid #333; }
        .role-header h2 { margin: 0; font-size: 1.2rem; color: #4a6cf7; }
        .role-content { flex: 1; padding: 2rem 1rem; overflow-y: auto; }
        .role-content h3 { color: #e0e0ff; margin-bottom: 0.5rem; }
        .role-content p { color: #888; margin-bottom: 1.5rem; }
        .placeholder-card { background: #1a1a2e; border: 1px solid #333; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
        .placeholder-card h4 { color: #4a6cf7; margin: 0 0 0.5rem 0; }
        .placeholder-card p { color: #888; margin: 0; font-size: 0.9rem; }
        .header-right { display: flex; align-items: center; gap: 0.5rem; }
        .user-email { color: #888; font-size: 0.85rem; }
        .btn-chat, .btn-logout { padding: 0.35rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
        .btn-chat { background: #4a6cf7; color: white; }
        .btn-logout { background: #444; color: #ccc; }
      `}</style>
    </div>
  );
}
