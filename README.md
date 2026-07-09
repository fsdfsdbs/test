# Claude AI Chatbot Clone

Un clone complet de l'interface de **Claude AI** avec un chatbot fonctionnel. Vous pouvez utiliser n'importe quelle API de chat (Mistral AI, OpenAI, etc.) en configurant simplement l'URL et la clé API.

## 🚀 Démarrage rapide

### 1. Cloner le dépôt
```bash
git clone https://github.com/fsdfsdbs/test.git
cd test
```

### 2. Configurer l'API
Modifiez le fichier `config.json` pour ajouter votre **clé API** et l'**URL de l'endpoint** :

```json
{
  "api": {
    "url": "https://api.mistral.ai/v1/chat/completions",
    "key": "VOTRE_CLE_API_ICI",
    "model": "mistral-tiny"
  }
}
```

#### API supportées :
- **Mistral AI** : `https://api.mistral.ai/v1/chat/completions`
- **OpenAI** : `https://api.openai.com/v1/chat/completions`
- **Groq** : `https://api.groq.com/v1/chat/completions`
- **Autres** : Toute API compatible avec le format `ChatCompletion`

### 3. Ouvrir dans un navigateur
Ouvrez simplement `index.html` dans votre navigateur, ou utilisez un serveur local :

```bash
# Avec Python
python -m http.server 8000

# Avec Node.js (npx)
npx serve
```

Puis allez sur : [http://localhost:8000](http://localhost:8000)

---

## ⚙️ Configuration via l'interface

1. Cliquez sur l'icône **⚙️ Paramètres** en bas de la barre latérale.
2. Entrez :
   - **URL de l'API** (ex: `https://api.mistral.ai/v1/chat/completions`)
   - **Clé API** (votre clé personnelle)
   - **Modèle** (ex: `mistral-tiny`, `gpt-3.5-turbo`)
3. Choisissez un **thème** (clair, sombre, système).
4. Cliquez sur **Enregistrer**.

---

## 🎨 Fonctionnalités

### Interface
✅ **Design identique à Claude AI** (couleurs, polices, disposition)
✅ **Barre latérale** avec historique des conversations
✅ **Thème clair/sombre** (automatique ou manuel)
✅ **Responsive** (mobile, tablette, desktop)

### Chat
✅ **Messages en temps réel** (avec indicateur de saisie)
✅ **Historique des conversations** (sauvegardé localement)
✅ **Suppression de conversations**
✅ **Copie de conversation** (dans le presse-papiers)
✅ **Prompts rapides** (boutons de suggestions)

### Markdown
✅ **Support du Markdown** dans les réponses :
- Titres (`#`, `##`, `###`)
- Texte en **gras** (`**gras**`)
- Texte en *italique* (`*italique*`)
- Listes (`- élément`, `1. élément`)
- Blocs de code (```code```)
- Liens (`[texte](url)`)
- Citations (`> texte`)

### Raccourcis clavier
| Raccourci | Action |
|-----------|--------|
| `Ctrl/Cmd + K` | Nouveau chat |
| `Ctrl/Cmd + ,` | Ouvrir les paramètres |
| `Échap` | Fermer le modal |
| `Entrée` | Envoyer le message |
| `Shift + Entrée` | Saut de ligne |

---

## 📁 Structure du projet

```
.
├── index.html          # Page principale
├── style.css           # Styles (design Claude AI)
├── script.js           # Logique du chat + appels API
├── config.json         # Configuration de l'API
└── assets/             # Images/icônes (optionnel)
```

---

## 🔧 Personnalisation

### Changer le modèle par défaut
Modifiez `config.json` :
```json
{
  "api": {
    "model": "mistral-small"
  }
}
```

### Changer la température
Dans `script.js`, modifiez :
```javascript
const CONFIG = {
    temperature: 0.7, // 0 = déterministe, 1 = créatif
    // ...
};
```

### Changer le nombre max de tokens
```javascript
const CONFIG = {
    maxTokens: 32000, // Limite selon votre API
    // ...
};
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

⚠️ **Attention** : Si vous utilisez une **clé API secrète**, ne la commitez **pas** dans le dépôt ! Utilisez plutôt :
- Les **paramètres dans l'interface** (stockés dans `localStorage`)
- Un **backend** (Node.js, Python) pour masquer la clé

---

## 🛠️ Développement

### Ajouter une nouvelle API
1. Modifiez `callChatAPI()` dans `script.js` pour adapter le format de requête/réponse.
2. Testez avec votre endpoint.

### Exemple pour OpenAI
```javascript
const requestBody = {
    model: CONFIG.api.model,
    messages: apiMessages,
    temperature: CONFIG.temperature,
    max_tokens: CONFIG.maxTokens
};
```

### Exemple pour Mistral
```javascript
const requestBody = {
    model: CONFIG.api.model,
    messages: apiMessages,
    temperature: CONFIG.temperature,
    max_tokens: CONFIG.maxTokens
};
```

---

## 📜 Licence

Ce projet est **open source** sous licence MIT. Vous pouvez l'utiliser librement pour des projets personnels ou commerciaux.

---

## 🙏 Remerciements

- **Claude AI** pour l'inspiration du design
- **Mistral AI** pour les modèles de langage
- **Inter Font** (Google Fonts) pour la typographie

---

## 🔗 Liens utiles

- [Mistral AI API](https://docs.mistral.ai/)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [GitHub Pages](https://pages.github.com/)
