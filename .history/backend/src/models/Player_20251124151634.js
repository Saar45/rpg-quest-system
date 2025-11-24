const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const playerSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  motDePasseHache: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  niveau: {
    type: Number,
    default: 1,
    min: [1, 'Le niveau minimum est 1'],
    max: [100, 'Le niveau maximum est 100']
  },
  experience: {
    type: Number,
    default: 0,
    min: [0, 'L\'expérience ne peut pas être négative']
  },
  inventaire: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    quantite: {
      type: Number,
      default: 1,
      min: [1, 'La quantité minimum est 1']
    },
    dateAcquisition: {
      type: Date,
      default: Date.now
    }
  }],
  questsActives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quest'
  }],
  questsTerminees: [{
    quest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest'
    },
    dateCompletion: {
      type: Date,
      default: Date.now
    }
  }],
  position: {
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    }
  },
  dernierConnexion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.motDePasseHache;
      return ret;
    }
  }
});

// Index pour améliorer les performances
playerSchema.index({ email: 1 });
playerSchema.index({ niveau: 1 });

// Middleware pour hacher le mot de passe avant sauvegarde
playerSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasseHache')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.motDePasseHache = await bcrypt.hash(this.motDePasseHache, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer le mot de passe
playerSchema.methods.comparerMotDePasse = async function(motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasseHache);
};

// Méthode pour calculer l'expérience nécessaire au prochain niveau
playerSchema.methods.experienceProchainNiveau = function() {
  return this.niveau * 100; // Formule simple: niveau * 100
};

// Méthode pour vérifier si le joueur peut monter de niveau
playerSchema.methods.peutMonterNiveau = function() {
  return this.experience >= this.experienceProchainNiveau();
};

// Méthode pour ajouter un objet à l'inventaire
playerSchema.methods.ajouterObjet = function(itemId, quantite = 1) {
  const existingItem = this.inventaire.find(item => 
    item.item.toString() === itemId.toString()
  );
  
  if (existingItem) {
    existingItem.quantite += quantite;
  } else {
    this.inventaire.push({
      item: itemId,
      quantite: quantite
    });
  }
};

// Méthode pour retirer un objet de l'inventaire
playerSchema.methods.retirerObjet = function(itemId, quantite = 1) {
  const itemIndex = this.inventaire.findIndex(item => 
    item.item.toString() === itemId.toString()
  );
  
  if (itemIndex !== -1) {
    this.inventaire[itemIndex].quantite -= quantite;
    if (this.inventaire[itemIndex].quantite <= 0) {
      this.inventaire.splice(itemIndex, 1);
    }
    return true;
  }
  return false;
};

// Méthode pour gagner de l'expérience
playerSchema.methods.gagnerExperience = function(xp) {
  this.experience += xp;
  
  // Vérifier si le joueur peut monter de niveau
  while (this.peutMonterNiveau() && this.niveau < 100) {
    this.experience -= this.experienceProchainNiveau();
    this.niveau += 1;
  }
};

module.exports = mongoose.model('Player', playerSchema);