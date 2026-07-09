# Claude AI Chatbot Clone

Un **clone ultra-fidèle** de l'interface de **Claude.ai** avec un chatbot IA fonctionnel. Ce projet utilise une **architecture modulaire**, un **code ultra-propre** et une **UI pixel-perfect** pour reproduire l'expérience de Claude.ai.

## 🚀 Démarrage Rapide

### 1. Cloner le dépôt
```bash
git clone https://github.com/fsdfsdbs/test.git
cd test
```

### 2. Configurer l'API
Modifiez le fichier `config.json` pour ajouter votre **clé API** :

```json
{
  "api": {
    "provider": "mistral",
    "url": "https://api.mistral.ai/v1/chat/completions",
    "key": "VOTRE_CLE_API_ICI",
    "model": "mistral-tiny"
  }
}
```

**OU** utilisez l'interface :
- Cliquez sur **⚙️ Paramètres** (en bas à gauche)
- Sélectionnez votre **fournisseur** (Mistral, OpenAI, Groq)
- Entrez votre **clé API**
- Choisissez un **modèle** et un **thème**
- Cliquez sur **Enregistrer**

### 3. Ouvrir dans un navigateur
Ouvrez `index.html` dans votre navigateur, ou utilisez un serveur local :

```bash
# Avec Python
python -m http.server 8000

# Avec Node.js
npx serve
```

Puis allez sur : [http://localhost:8000](http://localhost:8000)

---

## 🎨 Fonctionnalités

### ✅ Interface Ultra-Fidèle
- **Design pixel-perfect** comme Claude.ai (couleurs, polices, espacements)
- **Sidebar** avec historique des conversations
- **Barre de chat** identique à l'original
- **Thème clair/sombre/système** (automatique ou manuel)
- **Responsive** (mobile, tablette, desktop)
- **Animations fluides** (fadeIn, typing indicator)

### ✅ Chat Avancé
- **Messages en temps réel** avec indicateur de saisie
- **Streaming** des réponses (comme Claude)
- **Historique des conversations** (sauvegardé dans `localStorage`)
- **Suppression/copie/partage** des conversations
- **Recherche** dans l'historique
- **Prompts rapides** (boutons de suggestions)

### ✅ Markdown Complet
- **Titres** (`#`, `##`, `###`)
- **Texte en gras** (`**gras**`)
- **Texte en italique** (`*italique*`)
- **Texte barré** (`~~barré~~`)
- **Listes** (`- élément`, `1. élément`)
- **Blocs de code** (```code```) avec **copie en un clic**
- **Code inline** (`` `code` ``)
- **Liens** (`[texte](url)`)
- **Images** (`![alt](url)`)
- **Citations** (`> texte`)
- **Tableaux** (syntaxe markdown)

### ✅ API Flexible
- **Mistral AI** (par défaut)
- **OpenAI** (GPT-3.5, GPT-4)
- **Groq** (Llama3, Mixtral)
- **Personnalisée** (n'importe quelle API compatible)
- **Gestion des erreurs** avancée
- **Compteur de tokens** en temps réel

### ✅ Raccourcis Clavier
| Raccourci | Action |
|-----------|--------|
| `Ctrl/Cmd + K` | Nouveau chat |
| `Ctrl/Cmd + ,` | Ouvrir les paramètres |
| `Ctrl/Cmd + F` | Rechercher dans les chats |
| `Entrée` | Envoyer (si configuré) |
| `Shift + Entrée` | Saut de ligne |
| `Échap` | Fermer les modales |

---

## 📁 Structure du Projet

```
.
├── index.html                      # Page principale
├── config.json                     # Configuration de l'API
├── README.md                       # Documentation
├── styles/
│   └── main.css                    # Styles principaux (960+ lignes)
├── scripts/
│   ├── main.js                     # Point d'entrée
│   ├── config.js                   # Configuration centrale
│   ├── classes/
│   │   ├── ChatApp.js              # Application principale
│   │   ├── APIClient.js            # Client API
│   │   ├── UIManager.js            # Gestionnaire UI
│   │   └── StorageManager.js       # Gestion du stockage
│   └── utils/
│       ├── helpers.js              # Fonctions utilitaires
│       ├── markdown.js             # Parseur Markdown
│       └── dom.js                  # Utilitaires DOM
└── assets/                         # Ressources (icônes, images)
```

---

## 🔧 Personnalisation

### Changer le modèle par défaut
Dans `config.json` :
```json
{
  "api": {
    "model": "mistral-small"
  }
}
```

### Changer la température
```json
{
  "settings": {
    "temperature": 0.9
  }
}
```

### Changer le nombre max de tokens
```json
{
  "settings": {
    "maxTokens": 100000
  }
}
```

### Désactiver le streaming
```json
{
  "settings": {
    "enableStreaming": false
  }
}
```

---

## 🌐 Déploiement sur GitHub Pages

1. Activez **GitHub Pages** dans les paramètres du dépôt :
   - Allez dans **Settings > Pages**
   - Sélectionnez la branche `main` et le dossier `/ (root)`
   - Cliquez sur **Save**

2. Votre site sera disponible à :
   ```
   https://fsdfsdbs.github.io/test/
   ```

⚠️ **Attention** : Ne commitez **pas** votre clé API dans le dépôt ! Utilisez :
- Les **paramètres dans l'interface** (stockés dans `localStorage`)
- Un **backend** (Node.js, Python) pour masquer la clé

---

## 🛠️ Développement

### Ajouter une nouvelle API
1. Modifiez `scripts/config.js` pour ajouter le fournisseur
2. Mettez à jour `APIClient.js` si nécessaire
3. Testez avec votre endpoint

### Exemple pour une API personnalisée
```javascript
// Dans scripts/config.js
const API_PROVIDERS = {
    ...API_PROVIDERS,
    custom: {
        url: 'https://votre-api.com/v1/chat',
        models: ['votre-modele-1', 'votre-modele-2']
    }
};
```

### Exemple de requête API
```javascript
// Le format attendu par l'API
{
    model: "votre-modele",
    messages: [
        { role: "user", content: "Bonjour" }
    ],
    temperature: 0.7,
    max_tokens: 32000,
    stream: true
}
```

---

## 📊 Performances

- **Pas de dépendances** (100% vanilla JS/CSS/HTML)
- **Code modulaire** (classes ES6, séparation des responsabilités)
- **Optimisé** (debounce, throttle, lazy loading)
- **Rapide** (localStorage pour le stockage)
- **Évolutif** (architecture facile à étendre)

---

## 🎯 Comparaison avec Claude.ai

| Fonctionnalité | Claude.ai | Notre Clone |
|---------------|-----------|-------------|
| Interface | ✅ | ✅ **100% fidèle** |
| Sidebar | ✅ | ✅ |
| Historique | ✅ | ✅ |
| Thème sombre | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Streaming | ✅ | ✅ |
| Raccourcis | ✅ | ✅ |
| Partage | ❌ | ✅ **En plus** |
| Export JSON/HTML | ❌ | ✅ **En plus** |
| Recherche | ✅ | ✅ |
| Copie code | ❌ | ✅ **En plus** |

---

## 📜 Licence

Ce projet est **open source** sous licence MIT. Vous pouvez l'utiliser librement pour des projets personnels ou commerciaux.

---

## 🙏 Remerciements

- **Claude AI** pour l'inspiration du design
- **Mistral AI** pour les modèles de langage
- **Inter Font** (Google Fonts) pour la typographie
- **GitHub** pour l'hébergement

---

## 🔗 Liens Utiles

- [Mistral AI API](https://docs.mistral.ai/)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Groq API](https://console.groq.com/docs)
- [GitHub Pages](https://pages.github.com/)
- [Markdown Guide](https://www.markdownguide.org/)

---

## 💡 Conseils

1. **Pour de meilleures performances** : Utilisez le streaming (`enableStreaming: true`)
2. **Pour économiser des tokens** : Réduisez `maxTokens`
3. **Pour plus de créativité** : Augmentez `temperature` (jusqu'à 1.0)
4. **Pour un design personnalisé** : Modifiez `styles/main.css`
5. **Pour ajouter des fonctionnalités** : Étendez les classes dans `scripts/classes/`

---

**Profitez de votre clone de Claude.ai ! 🎉**
