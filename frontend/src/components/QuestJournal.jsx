import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { questsAPI, playerAPI } from '../services/api';
import './QuestJournal.css';

function QuestJournal() {
  const { token } = useAuth();
  const [availableQuests, setAvailableQuests] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingQuestId, setAcceptingQuestId] = useState(null);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer toutes les quêtes disponibles
      const questsResponse = await questsAPI.getAll(token);
      const allQuests = questsResponse.data || [];

      // Récupérer le profil du joueur pour voir ses quêtes en cours
      const profileResponse = await playerAPI.getProfile(token);
      const playerQuests = profileResponse.data?.quests || [];

      // Séparer les quêtes disponibles et les quêtes en cours
      const activeQuestIds = playerQuests.map(q => q.questId?._id || q.questId);
      
      const active = playerQuests.filter(q => q.status === 'in_progress').map(q => ({
        ...q.questId,
        status: q.status,
        playerQuestId: q._id
      }));

      const available = allQuests.filter(q => !activeQuestIds.includes(q._id));

      setActiveQuests(active);
      setAvailableQuests(available);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des quêtes');
      console.error('Error fetching quests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuest = async (questId) => {
    try {
      setAcceptingQuestId(questId);
      setError(null);

      await playerAPI.acceptQuest(token, questId);
      
      // Rafraîchir la liste des quêtes après acceptation
      await fetchQuests();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'acceptation de la quête');
      console.error('Error accepting quest:', err);
    } finally {
      setAcceptingQuestId(null);
    }
  };

  const getQuestDifficultyColor = (difficulty) => {
    const colors = {
      easy: '#4caf50',
      medium: '#ff9800',
      hard: '#f44336',
      epic: '#9c27b0'
    };
    return colors[difficulty] || '#666';
  };

  if (loading) {
    return (
      <div className="quest-journal">
        <div className="loading">Chargement des quêtes...</div>
      </div>
    );
  }

  return (
    <div className="quest-journal">
      <h2 className="journal-title">Journal de Quêtes</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Quêtes en cours */}
      <section className="quest-section">
        <h3 className="section-title">Quêtes en cours ({activeQuests.length})</h3>
        {activeQuests.length === 0 ? (
          <p className="empty-message">Aucune quête en cours. Acceptez une nouvelle quête ci-dessous!</p>
        ) : (
          <div className="quest-grid">
            {activeQuests.map((quest) => (
              <div key={quest._id} className="quest-card active-quest">
                <div className="quest-header">
                  <h4 className="quest-title">{quest.title}</h4>
                  {/* <span 
                    className="quest-difficulty"
                    style={{ backgroundColor: getQuestDifficultyColor(quest.difficulty) }}
                  >
                    {quest.difficulty}
                  </span> */}
                </div>
                <p className="quest-description">{quest.description}</p>
                <div className="quest-footer">
                  <div className="quest-rewards">
                    <span className="reward-label">Récompenses:</span>
                    <span className="reward-value">{quest.experienceReward} XP</span>
                    {quest.itemRewards?.length > 0 && (
                      <span className="reward-value">{quest.itemRewards.length} objet(s)</span>
                    )}
                  </div>
                  <span className="quest-status in-progress">En cours</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quêtes disponibles */}
      <section className="quest-section">
        <h3 className="section-title">Quêtes disponibles ({availableQuests.length})</h3>
        {availableQuests.length === 0 ? (
          <p className="empty-message">Aucune nouvelle quête disponible pour le moment.</p>
        ) : (
          <div className="quest-grid">
            {availableQuests.map((quest) => (
              <div key={quest._id} className="quest-card available-quest">
                <div className="quest-header">
                  <h4 className="quest-title">{quest.title}</h4>
                  {/* <span 
                    className="quest-difficulty"
                    style={{ backgroundColor: getQuestDifficultyColor(quest.difficulty) }}
                  >
                    {quest.difficulty}
                  </span> */}
                </div>
                <p className="quest-description">{quest.description}</p>
                <div className="quest-footer">
                  <div className="quest-rewards">
                    <span className="reward-label">Récompenses:</span>
                    <span className="reward-value">{quest.experienceReward} XP</span>
                    {quest.itemRewards?.length > 0 && (
                      <span className="reward-value">{quest.itemRewards.length} objet(s)</span>
                    )}
                  </div>
                  <button
                    className="accept-button"
                    onClick={() => handleAcceptQuest(quest._id)}
                    disabled={acceptingQuestId === quest._id}
                  >
                    {acceptingQuestId === quest._id ? 'Acceptation...' : 'Accepter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default QuestJournal;
