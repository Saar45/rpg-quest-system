import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>RPG Quest System</h1>
        <button onClick={handleLogout} className="logout-button">
          Déconnexion
        </button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Bienvenue, {user?.name}!</h2>
          <div className="player-stats">
            <div className="stat">
              <span className="stat-label">Niveau</span>
              <span className="stat-value">{user?.level || 1}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Expérience</span>
              <span className="stat-value">{user?.experience || 0} XP</span>
            </div>
            <div className="stat">
              <span className="stat-label">Email</span>
              <span className="stat-value">{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="info-message">
          <h3>🎮 Votre aventure commence ici !</h3>
          <p>Les fonctionnalités de quêtes et d'inventaire seront bientôt disponibles.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
