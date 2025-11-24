const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre de la quête est requis'],
    trim: true,
    minlength: [5, 'Le titre doit contenir au moins 5 caractères'],
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    minlength: [20, 'La description doit contenir au moins 20 caractères'],
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  statut: {
    type: String,
    required: [true, 'Le statut est requis'],
    enum: {
      values: ['disponible', 'en_cours', 'terminee', 'echouee', 'abandonnee'],
      message: 'Statut de quête invalide'
    },
    default: 'disponible'
  },
  type: {
    type: String,
    enum: {
      values: ['principale', 'secondaire', 'journaliere', 'evenement', 'guilde'],
      message: 'Type de quête invalide'
    },
    default: 'secondaire'
  },
  difficulte: {
    type: String,
    enum: {
      values: ['facile', 'normale', 'difficile', 'extreme'],
      message: 'Difficulté invalide'
    },
    default: 'normale'
  },
  niveau_requis: {
    type: Number,
    default: 1,
    min: [1, 'Le niveau requis minimum est 1'],
    max: [100, 'Le niveau requis maximum est 100']
  },
  niveau_recommande: {
    type: Number,
    default: 1,
    min: [1, 'Le niveau recommandé minimum est 1'],
    max: [100, 'Le niveau recommandé maximum est 100']
  },
  // Conditions pour débloquer la quête
  prerequis: {
    quetes_requises: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest'
    }],
    niveau_minimum: {
      type: Number,
      default: 1
    },
    objets_requis: [{
      objet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
      },
      quantite: {
        type: Number,
        default: 1,
        min: [1, 'La quantité doit être au moins 1']
      }
    }]
  },
  // Objectifs de la quête
  objectifs: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['tuer', 'collecter', 'parler', 'explorer', 'livrer', 'survivre'],
      required: true
    },
    cible: {
      type: String, // ID de l'entité cible (monstre, NPC, zone, etc.)
      required: true
    },
    quantite_requise: {
      type: Number,
      default: 1,
      min: [1, 'La quantité requise doit être au moins 1']
    },
    quantite_actuelle: {
      type: Number,
      default: 0,
      min: [0, 'La quantité actuelle ne peut pas être négative']
    },
    termine: {
      type: Boolean,
      default: false
    }
  }],
  // Récompenses
  recompenses: {
    experience: {
      type: Number,
      default: 0,
      min: [0, 'L\'expérience ne peut pas être négative']
    },
    or: {
      type: Number,
      default: 0,
      min: [0, 'L\'or ne peut pas être négatif']
    },
    objets: [{
      objet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
      },
      quantite: {
        type: Number,
        default: 1,
        min: [1, 'La quantité doit être au moins 1']
      },
      probabilite: {
        type: Number,
        default: 100,
        min: [0, 'La probabilité minimum est 0%'],
        max: [100, 'La probabilité maximum est 100%']
      }
    }],
    // Récompenses alternatives (le joueur peut choisir)
    choix_recompenses: [{
      nom: String,
      objets: [{
        objet: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item'
        },
        quantite: {
          type: Number,
          default: 1
        }
      }],
      experience: {
        type: Number,
        default: 0
      },
      or: {
        type: Number,
        default: 0
      }
    }]
  },
  // Informations temporelles
  duree_limite: {
    type: Number, // en minutes, 0 = pas de limite
    default: 0,
    min: [0, 'La durée limite ne peut pas être négative']
  },
  date_debut_disponibilite: {
    type: Date,
    default: Date.now
  },
  date_fin_disponibilite: {
    type: Date,
    default: null // null = toujours disponible
  },
  // Informations sur la complétion
  nombre_completions: {
    type: Number,
    default: 0,
    min: [0, 'Le nombre de complétions ne peut pas être négatif']
  },
  repetable: {
    type: Boolean,
    default: false
  },
  cooldown: {
    type: Number, // en heures
    default: 0,
    min: [0, 'Le cooldown ne peut pas être négatif']
  },
  // Liens avec d'autres quêtes
  quete_suivante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest',
    default: null
  },
  quetes_paralleles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest'
  }],
  // Métadonnées
  pnj_donneur: {
    nom: String,
    position: {
      x: Number,
      y: Number
    }
  },
  zone: {
    type: String,
    default: 'Ville'
  },
  visible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
questSchema.index({ statut: 1 });
questSchema.index({ niveau_requis: 1 });
questSchema.index({ type: 1 });
questSchema.index({ zone: 1 });
questSchema.index({ titre: 'text', description: 'text' });

// Méthode pour vérifier si un joueur peut accepter la quête
questSchema.methods.peutEtreAcceptee = function(joueur) {
  // Vérifier le niveau
  if (joueur.niveau < this.niveau_requis) {
    return { possible: false, raison: 'Niveau insuffisant' };
  }
  
  // Vérifier si la quête est disponible
  if (this.statut !== 'disponible') {
    return { possible: false, raison: 'Quête non disponible' };
  }
  
  // Vérifier les dates de disponibilité
  const maintenant = new Date();
  if (this.date_debut_disponibilite > maintenant) {
    return { possible: false, raison: 'Quête pas encore disponible' };
  }
  
  if (this.date_fin_disponibilite && this.date_fin_disponibilite < maintenant) {
    return { possible: false, raison: 'Quête expirée' };
  }
  
  // Vérifier les prérequis de quêtes
  const questesActives = joueur.questsActives || [];
  const questsTerminees = joueur.questsTerminees || [];
  
  for (const prereqId of this.prerequis.quetes_requises) {
    const questTerminee = questsTerminees.find(q => 
      q.quest && q.quest.toString() === prereqId.toString()
    );
    
    if (!questTerminee) {
      return { possible: false, raison: 'Quête prérequise non terminée' };
    }
  }
  
  // Vérifier si le joueur a déjà cette quête active
  if (questesActives.includes(this._id)) {
    return { possible: false, raison: 'Quête déjà en cours' };
  }
  
  return { possible: true };
};

// Méthode pour calculer le pourcentage de progression
questSchema.methods.calculerProgression = function() {
  if (this.objectifs.length === 0) return 0;
  
  const objectifsTermines = this.objectifs.filter(obj => obj.termine).length;
  return Math.round((objectifsTermines / this.objectifs.length) * 100);
};

// Méthode pour vérifier si tous les objectifs sont terminés
questSchema.methods.estTerminee = function() {
  return this.objectifs.length > 0 && this.objectifs.every(obj => obj.termine);
};

// Méthode pour mettre à jour un objectif
questSchema.methods.mettreAJourObjectif = function(index, progression = 1) {
  if (index >= 0 && index < this.objectifs.length) {
    const objectif = this.objectifs[index];
    objectif.quantite_actuelle = Math.min(
      objectif.quantite_actuelle + progression,
      objectif.quantite_requise
    );
    
    if (objectif.quantite_actuelle >= objectif.quantite_requise) {
      objectif.termine = true;
    }
    
    return true;
  }
  return false;
};

// Méthode pour obtenir les récompenses finales
questSchema.methods.obtenirRecompenses = function() {
  const recompenses = {
    experience: this.recompenses.experience,
    or: this.recompenses.or,
    objets: []
  };
  
  // Calculer les objets avec probabilité
  for (const objet of this.recompenses.objets) {
    const chance = Math.random() * 100;
    if (chance <= objet.probabilite) {
      recompenses.objets.push({
        objet: objet.objet,
        quantite: objet.quantite
      });
    }
  }
  
  return recompenses;
};

// Méthode statique pour trouver les quêtes disponibles pour un joueur
questSchema.statics.trouverDisponiblesPour = function(joueur) {
  return this.find({
    statut: 'disponible',
    niveau_requis: { $lte: joueur.niveau },
    visible: true,
    _id: { $nin: joueur.questsActives || [] }
  }).sort({ niveau_requis: 1, type: 1 });
};

// Méthode statique pour rechercher des quêtes
questSchema.statics.rechercher = function(terme) {
  return this.find({
    $text: { $search: terme },
    visible: true
  }).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Quest', questSchema);