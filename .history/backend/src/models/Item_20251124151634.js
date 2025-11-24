const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de l\'objet est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    minlength: [10, 'La description doit contenir au moins 10 caractères'],
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  type: {
    type: String,
    required: [true, 'Le type d\'objet est requis'],
    enum: {
      values: [
        'potion',
        'arme',
        'armure',
        'bouclier',
        'accessoire',
        'materiau',
        'quest',
        'consommable',
        'outil',
        'tresor'
      ],
      message: 'Type d\'objet invalide'
    }
  },
  rarete: {
    type: String,
    enum: {
      values: ['commun', 'rare', 'epique', 'legendaire', 'mythique'],
      message: 'Rareté invalide'
    },
    default: 'commun'
  },
  valeur: {
    type: Number,
    default: 0,
    min: [0, 'La valeur ne peut pas être négative']
  },
  niveau_requis: {
    type: Number,
    default: 1,
    min: [1, 'Le niveau requis minimum est 1'],
    max: [100, 'Le niveau requis maximum est 100']
  },
  attributs: {
    // Pour les armes
    degats: {
      type: Number,
      min: [0, 'Les dégâts ne peuvent pas être négatifs'],
      default: 0
    },
    // Pour les armures et boucliers
    defense: {
      type: Number,
      min: [0, 'La défense ne peut pas être négative'],
      default: 0
    },
    // Pour les potions et consommables
    effet: {
      type: String,
      trim: true
    },
    duree: {
      type: Number, // en secondes
      min: [0, 'La durée ne peut pas être négative'],
      default: 0
    },
    // Bonus de stats
    bonus_force: {
      type: Number,
      default: 0
    },
    bonus_agilite: {
      type: Number,
      default: 0
    },
    bonus_intelligence: {
      type: Number,
      default: 0
    },
    bonus_vie: {
      type: Number,
      default: 0
    },
    bonus_mana: {
      type: Number,
      default: 0
    }
  },
  empilable: {
    type: Boolean,
    default: true
  },
  taille_pile_max: {
    type: Number,
    default: 99,
    min: [1, 'La taille de pile maximum doit être au moins 1']
  },
  utilisable: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: 'default_item.png'
  },
  disponible: {
    type: Boolean,
    default: true
  },
  // Conditions d'utilisation
  conditions: {
    niveau_minimum: {
      type: Number,
      default: 1
    },
    classe_requise: {
      type: String,
      enum: ['guerrier', 'mage', 'archer', 'voleur', 'pretre', 'any'],
      default: 'any'
    }
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
itemSchema.index({ type: 1 });
itemSchema.index({ rarete: 1 });
itemSchema.index({ niveau_requis: 1 });
itemSchema.index({ nom: 'text', description: 'text' });

// Méthode pour vérifier si l'objet peut être équipé par un joueur
itemSchema.methods.peutEtreEquipe = function(joueur) {
  if (joueur.niveau < this.niveau_requis) {
    return false;
  }
  
  if (this.conditions.classe_requise !== 'any' && 
      joueur.classe !== this.conditions.classe_requise) {
    return false;
  }
  
  return true;
};

// Méthode pour obtenir la couleur selon la rareté
itemSchema.methods.getCouleurRarete = function() {
  const couleurs = {
    'commun': '#808080',     // Gris
    'rare': '#0080ff',       // Bleu
    'epique': '#8000ff',     // Violet
    'legendaire': '#ff8000', // Orange
    'mythique': '#ff0080'    // Rose
  };
  
  return couleurs[this.rarete] || couleurs['commun'];
};

// Méthode pour calculer le prix de vente (70% de la valeur)
itemSchema.methods.getPrixVente = function() {
  return Math.floor(this.valeur * 0.7);
};

// Méthode statique pour créer un objet de quête
itemSchema.statics.creerObjetQuete = function(nom, description, valeur = 0) {
  return new this({
    nom,
    description,
    type: 'quest',
    valeur,
    empilable: true,
    utilisable: false,
    conditions: {
      niveau_minimum: 1,
      classe_requise: 'any'
    }
  });
};

// Méthode statique pour trouver des objets par type
itemSchema.statics.trouverParType = function(type) {
  return this.find({ type, disponible: true }).sort({ niveau_requis: 1 });
};

// Méthode statique pour recherche d'objets
itemSchema.statics.rechercher = function(terme) {
  return this.find({
    $text: { $search: terme },
    disponible: true
  }).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Item', itemSchema);