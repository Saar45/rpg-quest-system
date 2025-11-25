import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { playerAPI, itemsAPI } from '../services/api';
import './Inventory.css';

function Inventory() {
  const { token } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingItemId, setUsingItemId] = useState(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer le profil du joueur pour obtenir l'inventaire
      const profileResponse = await playerAPI.getProfile(token);
      const inventoryIds = profileResponse.data?.inventory || [];

      // Si l'inventaire est vide
      if (inventoryIds.length === 0) {
        setInventory([]);
        setLoading(false);
        return;
      }

      // Récupérer les détails de chaque item
      // Si les items sont déjà populés (objets complets), les utiliser directement
      if (inventoryIds.length > 0 && typeof inventoryIds[0] === 'object' && inventoryIds[0]._id) {
        setInventory(inventoryIds);
      } else {
        // Sinon, récupérer les détails de chaque item par son ID
        const itemPromises = inventoryIds.map(itemId => 
          itemsAPI.getById(token, itemId).catch(err => {
            console.error(`Error fetching item ${itemId}:`, err);
            return null;
          })
        );

        const itemResponses = await Promise.all(itemPromises);
        const items = itemResponses
          .filter(response => response && response.data)
          .map(response => response.data);

        setInventory(items);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement de l\'inventaire');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleUseItem = async (itemId) => {
    try {
      setUsingItemId(itemId);
      setError(null);

      await playerAPI.useItem(token, itemId);

      // Rafraîchir l'inventaire après utilisation
      await fetchInventory();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'utilisation de l\'objet');
      console.error('Error using item:', err);
    } finally {
      setUsingItemId(null);
    }
  };

  const getItemTypeColor = (type) => {
    const colors = {
      weapon: '#e53935',
      armor: '#1e88e5',
      potion: '#43a047',
      material: '#fb8c00',
      quest: '#8e24aa'
    };
    return colors[type] || '#757575';
  };

  const getItemRarityColor = (rarity) => {
    const colors = {
      common: '#9e9e9e',
      uncommon: '#4caf50',
      rare: '#2196f3',
      epic: '#9c27b0',
      legendary: '#ff9800'
    };
    return colors[rarity] || '#757575';
  };

  if (loading) {
    return (
      <div className="inventory">
        <div className="loading">Chargement de l'inventaire...</div>
      </div>
    );
  }

  return (
    <div className="inventory">
      <h2 className="inventory-title">Inventaire du Héros</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {inventory.length === 0 ? (
        <div className="empty-inventory">
          <p>Votre inventaire est vide.</p>
          <p className="empty-subtitle">Complétez des quêtes pour obtenir des objets!</p>
        </div>
      ) : (
        <div className="inventory-stats">
          <p className="item-count">Objets: {inventory.length}</p>
        </div>
      )}

      <div className="inventory-grid">
        {inventory.map((item) => (
          <div key={item._id} className="inventory-item">
            <div className="item-header">
              <h3 className="item-name">{item.name}</h3>
              <div className="item-badges">
                <span 
                  className="item-type-badge"
                  style={{ backgroundColor: getItemTypeColor(item.type) }}
                >
                  {item.type}
                </span>
                <span 
                  className="item-rarity-badge"
                  style={{ backgroundColor: getItemRarityColor(item.rarity) }}
                >
                  {item.rarity}
                </span>
              </div>
            </div>

            <p className="item-description">{item.description}</p>

            {item.effects && Object.keys(item.effects).length > 0 && (
              <div className="item-effects">
                <span className="effects-label">Effets:</span>
                <ul className="effects-list">
                  {Object.entries(item.effects).map(([key, value]) => (
                    <li key={key} className="effect-item">
                      <span className="effect-key">{key}:</span>
                      <span className="effect-value">+{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="item-footer">
              {item.value !== undefined && (
                <span className="item-value">Valeur: {item.value} or</span>
              )}
              <button
                className="use-item-button"
                onClick={() => handleUseItem(item._id)}
                disabled={usingItemId === item._id}
              >
                {usingItemId === item._id ? 'Utilisation...' : 'Utiliser'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Inventory;
