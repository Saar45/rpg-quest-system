import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import QuestJournal from './QuestJournal';
import Inventory from './Inventory';
import './Dashboard.css';

function Dashboard() {
  const { user, logout, refreshPlayer } = useAuth();

  // Rafraîchir les données du joueur au chargement du Dashboard
  useEffect(() => {
    refreshPlayer();
  }, [refreshPlayer]);

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

        <QuestJournal />
        <Inventory />
      </div>
    </div>
  );
}

export default Dashboard;
