/**
 * LocalAI Class
 * A local AI engine that learns from conversations and can generate code
 * No external API required - works entirely in the browser
 */

import { getConfig } from '../config.js';
import { createElement, showToast } from '../utils/dom.js';

/**
 * LocalAI - A self-improving local AI that stores conversations and generates responses
 */
export class LocalAI {
    constructor() {
        this.conversations = [];
        this.knowledgeBase = this.loadKnowledgeBase();
        this.codeTemplates = this.loadCodeTemplates();
        this.loadConversations();
    }
    
    /**
     * Load knowledge base from localStorage or use defaults
     * @returns {Array} Knowledge base entries
     */
    loadKnowledgeBase() {
        const savedKB = localStorage.getItem('localAIKnowledgeBase');
        if (savedKB) {
            try {
                return JSON.parse(savedKB);
            } catch (e) {
                console.error('Error loading knowledge base:', e);
            }
        }
        
        // Default knowledge base
        return [
            {
                question: "Comment faire une boucle for en JavaScript ?",
                answer: "Voici comment faire une boucle for en JavaScript :\n\n```javascript\n// Boucle for basique\nfor (let i = 0; i < 10; i++) {\n  console.log(i); // Affiche 0 à 9\n}\n\n// Boucle for...of pour les tableaux\nconst tableau = [1, 2, 3, 4, 5];\nfor (const element of tableau) {\n  console.log(element);\n}\n\n// Boucle for...in pour les objets\nconst objet = { a: 1, b: 2, c: 3 };\nfor (const cle in objet) {\n  console.log(cle, objet[cle]);\n}\n```",
                tags: ["javascript", "boucle", "for", "code"]
            },
            {
                question: "Comment créer une fonction en JavaScript ?",
                answer: "Voici comment créer une fonction en JavaScript :\n\n```javascript\n// Fonction classique\nfunction direBonjour(nom) {\n  return `Bonjour, ${nom} !`;\n}\n\n// Fonction fléchée (arrow function)\nconst direBonjour = (nom) => {\n  return `Bonjour, ${nom} !`;\n};\n\n// Fonction avec paramètres par défaut\nfunction multiplier(a, b = 2) {\n  return a * b;\n}\n\n// Appel\nconsole.log(direBonjour("Alice")); // "Bonjour, Alice !"\nconsole.log(multiplier(5)); // 10 (5 * 2)\n```",
                tags: ["javascript", "fonction", "code"]
            },
            {
                question: "Quelle est la différence entre let, const et var en JavaScript ?",
                answer: "Voici les différences entre `let`, `const` et `var` en JavaScript :\n\n| Mot-clé | Portée | Réaffectable | Déclaration multiple | Hoisting |\n|---------|--------|--------------|---------------------|----------|\n| `var`   | Fonction | ✅ Oui | ✅ Oui | ✅ Oui (avec valeur undefined) |\n| `let`   | Bloc    | ✅ Oui | ❌ Non | ❌ Non (erreur temporelle) |\n| `const` | Bloc    | ❌ Non | ❌ Non | ❌ Non (erreur temporelle) |\n\n**Exemples :**\n```javascript\n// var (éviter en JavaScript moderne)\nvar x = 10;\nif (true) {\n  var x = 20; // Même variable !\n}\nconsole.log(x); // 20\n\n// let (portée de bloc)\nlet y = 10;\nif (true) {\n  let y = 20; // Nouvelle variable locale\n  console.log(y); // 20\n}\nconsole.log(y); // 10\n\n// const (constante, portée de bloc)\nconst z = 10;\nz = 20; // ❌ Erreur : Assignment to constant variable\n```",
                tags: ["javascript", "let", "const", "var", "portée"]
            },
            {
                question: "Comment faire une requête HTTP en JavaScript ?",
                answer: "Voici plusieurs façons de faire des requêtes HTTP en JavaScript :\n\n```javascript\n// 1. Avec fetch (moderne, recommandé)\nfetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Erreur:', error));\n\n// 2. Avec fetch + async/await\nasync function getData() {\n  try {\n    const response = await fetch('https://api.example.com/data');\n    const data = await response.json();\n    console.log(data);\n  } catch (error) {\n    console.error('Erreur:', error);\n  }\n}\n\n// 3. Avec XMLHttpRequest (ancien)\nconst xhr = new XMLHttpRequest();\nxhr.open('GET', 'https://api.example.com/data', true);\nxhr.onload = function() {\n  if (xhr.status === 200) {\n    const data = JSON.parse(xhr.responseText);\n    console.log(data);\n  }\n};\nxhr.send();\n\n// 4. Avec axios (nécessite d'importer la bibliothèque)\n// npm install axios\nimport axios from 'axios';\naxios.get('https://api.example.com/data')\n  .then(response => console.log(response.data))\n  .catch(error => console.error('Erreur:', error));\n```",
                tags: ["javascript", "http", "fetch", "api", "code"]
            },
            {
                question: "Comment manipuler le DOM en JavaScript ?",
                answer: "Voici les méthodes essentielles pour manipuler le DOM :\n\n```javascript\n// 1. Sélectionner des éléments\nconst element = document.getElementById('monId');\nconst elements = document.querySelectorAll('.maClasse');\nconst firstDiv = document.querySelector('div');\n\n// 2. Modifier le contenu\nelement.textContent = 'Nouveau texte';\nelement.innerHTML = '<strong>HTML</strong>';\n\n// 3. Modifier les styles\nelement.style.color = 'red';\nelement.style.backgroundColor = '#f0f0f0';\nelement.classList.add('maClasse');\nelement.classList.remove('autreClasse');\n\n// 4. Modifier les attributs\nelement.setAttribute('data-info', 'valeur');\nconst value = element.getAttribute('data-info');\n\n// 5. Créer des éléments\nconst newDiv = document.createElement('div');\nnewDiv.textContent = 'Nouvel élément';\ndocument.body.appendChild(newDiv);\n\n// 6. Supprimer des éléments\nelement.remove();\n// ou\nparentElement.removeChild(element);\n\n// 7. Écouter les événements\nelement.addEventListener('click', (event) => {\n  console.log('Élément cliqué !', event.target);\n});\n```",
                tags: ["javascript", "dom", "manipulation", "code"]
            },
            {
                question: "Comment gérer les promesses en JavaScript ?",
                answer: "Voici comment gérer les promesses (Promises) en JavaScript :\n\n```javascript\n// 1. Créer une promesse\nconst maPromesse = new Promise((resolve, reject) => {\n  // Simulation d'une opération asynchrone\n  setTimeout(() => {\n    const succes = true;\n    if (succes) {\n      resolve('Opération réussie !');\n    } else {\n      reject(new Error('Opération échouée'));\n    }\n  }, 1000);\n});\n\n// 2. Utiliser .then() et .catch()\nmaPromesse\n  .then(resultat => {\n    console.log(resultat); // "Opération réussie !"\n  })\n  .catch(error => {\n    console.error(error); // En cas d'erreur\n  });\n\n// 3. Utiliser async/await (plus moderne)\nasync function executerPromesse() {\n  try {\n    const resultat = await maPromesse;\n    console.log(resultat);\n  } catch (error) {\n    console.error(error);\n  }\n}\n\n// 4. Promise.all() pour exécuter plusieurs promesses en parallèle\nconst promesse1 = Promise.resolve(1);\nconst promesse2 = Promise.resolve(2);\nconst promesse3 = new Promise(resolve => setTimeout(resolve, 100, 3));
\nPromise.all([promesse1, promesse2, promesse3])\n  .then(valeurs => {\n    console.log(valeurs); // [1, 2, 3]\n  });\n\n// 5. Promise.race() - retourne dès qu'une promesse est résolue\nPromise.race([promesse1, promesse2, promesse3])\n  .then(valeur => {\n    console.log(valeur); // 1 (la première résolue)\n  });\n```",
                tags: ["javascript", "promesse", "async", "await", "code"]
            },
            {
                question: "Comment utiliser les tableaux en JavaScript ?",
                answer: "Voici les méthodes essentielles pour manipuler les tableaux en JavaScript :\n\n```javascript\n// 1. Créer un tableau\nconst tableau = [1, 2, 3, 4, 5];\nconst tableauVide = [];\n\n// 2. Accéder aux éléments\nconst premier = tableau[0]; // 1\nconst dernier = tableau[tableau.length - 1]; // 5\n\n// 3. Ajouter des éléments\ntableau.push(6); // [1, 2, 3, 4, 5, 6]\ntableau.unshift(0); // [0, 1, 2, 3, 4, 5, 6]\ntableau.splice(2, 0, 1.5); // Insère à l'index 2\n\n// 4. Supprimer des éléments\ntableau.pop(); // Supprime le dernier\ntableau.shift(); // Supprime le premier\ntableau.splice(2, 1); // Supprime 1 élément à l'index 2\n\n// 5. Trouver des éléments\nconst index = tableau.indexOf(3); // 3\nconst existe = tableau.includes(3); // true\n\n// 6. Transformer un tableau\nconst doubles = tableau.map(x => x * 2); // [2, 4, 6, 8, 10, 12]\nconst pairs = tableau.filter(x => x % 2 === 0); // [2, 4, 6]\nconst somme = tableau.reduce((acc, val) => acc + val, 0); // 21\n\n// 7. Trier un tableau\ntableau.sort((a, b) => a - b); // Tri numérique\ntableau.sort(); // Tri alphabétique (pour les chaînes)\n\n// 8. Parcourir un tableau\ntableau.forEach((element, index) => {\n  console.log(`Élément ${index}: ${element}`);\n});\n\n// 9. Autres méthodes utiles\nconst nouveauTableau = tableau.slice(1, 4); // [2, 3, 4]\nconst concatene = tableau.concat([7, 8, 9]); // [1, 2, 3, 4, 5, 6, 7, 8, 9]\nconst joint = tableau.join('-'); // "1-2-3-4-5-6"\n```",
                tags: ["javascript", "tableau", "array", "code"]
            }
        ];
    }
    
    /**
     * Load code templates for generation
     * @returns {Object} Code templates by language
     */
    loadCodeTemplates() {
        const savedTemplates = localStorage.getItem('localAICodeTemplates');
        if (savedTemplates) {
            try {
                return JSON.parse(savedTemplates);
            } catch (e) {
                console.error('Error loading code templates:', e);
            }
        }
        
        // Default code templates
        return {
            javascript: {
                loop: `for (let i = 0; i < {{count}}; i++) {
  // Votre code ici
  console.log(i);
}`,
                function: `function {{name}}({{params}}) {
  // Votre code ici
  return {{returnValue}};
}`,
                class: `class {{name}} {
  constructor({{params}}) {
    // Initialisation
    {{initCode}}
  }
  
  {{methods}}
}`,
                fetch: `fetch('{{url}}')
  .then(response => response.json())
  .then(data => {
    // Traiter les données
    console.log(data);
  })
  .catch(error => {
    console.error('Erreur:', error);
  });`
            },
            python: {
                loop: `for i in range({{count}}):
    # Votre code ici
    print(i)`,
                function: `def {{name}}({{params}}):
    # Votre code ici
    return {{returnValue}}`,
                class: `class {{name}}:
    def __init__(self, {{params}}):
        # Initialisation
        {{initCode}}
    
    {{methods}}`
            },
            html: {
                basic: `<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
</head>
<body>
    <!-- Votre contenu ici -->
    <h1>{{heading}}</h1>
</body>
</html>`,
                form: `<form id="{{formId}}">
    <label for="{{fieldName}}">{{label}}:</label>
    <input type="{{type}}" id="{{fieldName}}" name="{{fieldName}}" />
    <button type="submit">Envoyer</button>
</form>`
            },
            css: {
                basic: `/* Sélecteur pour {{element}} */
{{selector}} {
    /* Vos styles ici */
    color: #333;
    background-color: #f5f5f5;
    padding: 10px;
    margin: 5px;
}`
            }
        };
    }
    
    /**
     * Load conversations from localStorage
     */
    loadConversations() {
        const savedConversations = localStorage.getItem('localAIConversations');
        if (savedConversations) {
            try {
                this.conversations = JSON.parse(savedConversations);
            } catch (e) {
                console.error('Error loading conversations:', e);
                this.conversations = [];
            }
        }
    }
    
    /**
     * Save conversations to localStorage
     */
    saveConversations() {
        try {
            localStorage.setItem('localAIConversations', JSON.stringify(this.conversations));
        } catch (e) {
            console.error('Error saving conversations:', e);
        }
    }
    
    /**
     * Save knowledge base to localStorage
     */
    saveKnowledgeBase() {
        try {
            localStorage.setItem('localAIKnowledgeBase', JSON.stringify(this.knowledgeBase));
        } catch (e) {
            console.error('Error saving knowledge base:', e);
        }
    }
    
    /**
     * Save code templates to localStorage
     */
    saveCodeTemplates() {
        try {
            localStorage.setItem('localAICodeTemplates', JSON.stringify(this.codeTemplates));
        } catch (e) {
            console.error('Error saving code templates:', e);
        }
    }
    
    /**
     * Add a conversation to memory
     * @param {Array} messages - Array of message objects
     */
    addConversation(messages) {
        this.conversations.push({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            messages: messages.map(msg => ({ ...msg }))
        });
        this.saveConversations();
    }
    
    /**
     * Add knowledge to the knowledge base
     * @param {string} question - Question
     * @param {string} answer - Answer
     * @param {Array} tags - Tags for categorization
     */
    addKnowledge(question, answer, tags = []) {
        this.knowledgeBase.push({
            question,
            answer,
            tags,
            timestamp: new Date().toISOString()
        });
        this.saveKnowledgeBase();
    }
    
    /**
     * Add a code template
     * @param {string} language - Programming language
     * @param {string} name - Template name
     * @param {string} template - Template content
     */
    addCodeTemplate(language, name, template) {
        if (!this.codeTemplates[language]) {
            this.codeTemplates[language] = {};
        }
        this.codeTemplates[language][name] = template;
        this.saveCodeTemplates();
    }
    
    /**
     * Find similar knowledge entries
     * @param {string} query - Search query
     * @param {number} limit - Maximum number of results
     * @returns {Array} Matching knowledge entries
     */
    findSimilarKnowledge(query, limit = 3) {
        const queryLower = query.toLowerCase();
        
        // Score each entry based on similarity
        const scoredEntries = this.knowledgeBase.map(entry => {
            const questionLower = entry.question.toLowerCase();
            const tagsLower = entry.tags.join(' ').toLowerCase();
            
            // Simple similarity score
            let score = 0;
            
            // Exact match
            if (questionLower.includes(queryLower) || queryLower.includes(questionLower)) {
                score += 100;
            }
            
            // Tag match
            if (tagsLower.includes(queryLower)) {
                score += 50;
            }
            
            // Word overlap
            const queryWords = queryLower.split(/\s+/);
            const questionWords = questionLower.split(/\s+/);
            const matchingWords = queryWords.filter(word => questionWords.includes(word));
            score += matchingWords.length * 10;
            
            // Partial match
            if (questionLower.includes(queryLower.substring(0, Math.min(queryLower.length, 10)))) {
                score += 20;
            }
            
            return { ...entry, score };
        }).filter(entry => entry.score > 0);
        
        // Sort by score and return top results
        return scoredEntries
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
    
    /**
     * Find similar conversations
     * @param {string} query - Search query
     * @param {number} limit - Maximum number of results
     * @returns {Array} Matching conversations
     */
    findSimilarConversations(query, limit = 3) {
        const queryLower = query.toLowerCase();
        
        const scoredConversations = this.conversations.map(conv => {
            // Check all messages in the conversation
            let score = 0;
            conv.messages.forEach(msg => {
                const contentLower = msg.content.toLowerCase();
                
                // Exact match
                if (contentLower.includes(queryLower) || queryLower.includes(contentLower)) {
                    score += 100;
                }
                
                // Partial match
                const queryWords = queryLower.split(/\s+/);
                const contentWords = contentLower.split(/\s+/);
                const matchingWords = queryWords.filter(word => contentWords.includes(word));
                score += matchingWords.length * 5;
            });
            
            return { ...conv, score };
        }).filter(conv => conv.score > 0);
        
        return scoredConversations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
    
    /**
     * Generate a response based on the query
     * @param {string} query - User query
     * @param {Array} conversationHistory - Previous messages in the conversation
     * @returns {Promise<string>} Generated response
     */
    async generateResponse(query, conversationHistory = []) {
        const queryLower = query.toLowerCase();
        
        // 1. Check if it's a code generation request
        const codeLanguages = ['javascript', 'js', 'python', 'py', 'html', 'css', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust'];
        const isCodeRequest = codeLanguages.some(lang => queryLower.includes(lang)) ||
                              queryLower.includes('code') ||
                              queryLower.includes('script') ||
                              queryLower.includes('fonction') ||
                              queryLower.includes('boucle') ||
                              queryLower.includes('classe');
        
        if (isCodeRequest) {
            return this.generateCodeResponse(query);
        }
        
        // 2. Search knowledge base
        const knowledgeMatches = this.findSimilarKnowledge(query, 3);
        if (knowledgeMatches.length > 0) {
            // Return the best match
            return knowledgeMatches[0].answer;
        }
        
        // 3. Search conversations
        const conversationMatches = this.findSimilarConversations(query, 3);
        if (conversationMatches.length > 0) {
            // Find the most relevant message in the best conversation
            const bestConv = conversationMatches[0];
            const relevantMessage = bestConv.messages.find(msg => 
                msg.content.toLowerCase().includes(queryLower) ||
                queryLower.includes(msg.content.toLowerCase())
            );
            
            if (relevantMessage) {
                // Find the AI response to this message
                const messageIndex = bestConv.messages.findIndex(msg => msg === relevantMessage);
                if (messageIndex >= 0 && bestConv.messages[messageIndex + 1]) {
                    return bestConv.messages[messageIndex + 1].content;
                }
            }
            
            // If no direct match, return the last AI message from the conversation
            const aiMessages = bestConv.messages.filter(msg => msg.role === 'ai');
            if (aiMessages.length > 0) {
                return aiMessages[aiMessages.length - 1].content;
            }
        }
        
        // 4. Generate a generic response
        return this.generateGenericResponse(query);
    }
    
    /**
     * Generate a code response
     * @param {string} query - User query about code
     * @returns {string} Generated code response
     */
    generateCodeResponse(query) {
        const queryLower = query.toLowerCase();
        
        // Extract language if specified
        let language = null;
        const languageKeywords = {
            'javascript': ['javascript', 'js', 'ecmascript'],
            'python': ['python', 'py'],
            'html': ['html', 'htm'],
            'css': ['css'],
            'java': ['java'],
            'c++': ['c++', 'cpp'],
            'c#': ['c#', 'csharp'],
            'php': ['php'],
            'ruby': ['ruby', 'rb'],
            'go': ['go', 'golang'],
            'rust': ['rust']
        };
        
        for (const [lang, keywords] of Object.entries(languageKeywords)) {
            if (keywords.some(keyword => queryLower.includes(keyword))) {
                language = lang;
                break;
            }
        }
        
        // If no language detected, default to JavaScript
        language = language || 'javascript';
        
        // Check for specific code patterns
        if (queryLower.includes('boucle') || queryLower.includes('loop')) {
            return this.generateLoopExample(language);
        }
        
        if (queryLower.includes('fonction') || queryLower.includes('function')) {
            return this.generateFunctionExample(language);
        }
        
        if (queryLower.includes('classe') || queryLower.includes('class')) {
            return this.generateClassExample(language);
        }
        
        if (queryLower.includes('tableau') || queryLower.includes('array') || queryLower.includes('liste')) {
            return this.generateArrayExample(language);
        }
        
        if (queryLower.includes('objet') || queryLower.includes('object')) {
            return this.generateObjectExample(language);
        }
        
        if (queryLower.includes('requête') || queryLower.includes('fetch') || queryLower.includes('api') || queryLower.includes('http')) {
            return this.generateFetchExample(language);
        }
        
        // Default: provide a general code example
        return `Voici un exemple de code en ${language} :

\[Exemple de code ${language}]

Si vous avez une question plus spécifique, n'hésitez pas à demander !`;
    }
    
    /**
     * Generate a loop example
     * @param {string} language - Programming language
     * @returns {string} Loop example
     */
    generateLoopExample(language) {
        const templates = {
            javascript: `Voici comment faire des boucles en JavaScript :

\`\`\`javascript
// 1. Boucle for (compteur)
for (let i = 0; i < 5; i++) {
  console.log("Itération " + i);
}

// 2. Boucle for...of (tableaux)
const tableau = [1, 2, 3, 4, 5];
for (const element of tableau) {
  console.log(element);
}

// 3. Boucle for...in (objets)
const objet = { a: 1, b: 2, c: 3 };
for (const cle in objet) {
  console.log(cle + ": " + objet[cle]);
}

// 4. Boucle while
let i = 0;
while (i < 5) {
  console.log("While: " + i);
  i++;
}

// 5. Boucle do...while
let j = 0;
do {
  console.log("Do-While: " + j);
  j++;
} while (j < 5);
\`\`\`

Quelle boucle souhaitez-vous utiliser ?`,
            python: `Voici comment faire des boucles en Python :

\`\`\`python
# 1. Boucle for
for i in range(5):
    print("Itération", i)

# 2. Boucle for avec tableau
tableau = [1, 2, 3, 4, 5]
for element in tableau:
    print(element)

# 3. Boucle for avec dictionnaire
objet = {"a": 1, "b": 2, "c": 3}
for cle in objet:
    print(cle + ":", objet[cle])

# 4. Boucle while
i = 0
while i < 5:
    print("While:", i)
    i += 1
\`\`\`

Quelle boucle souhaitez-vous utiliser ?`,
            html: `Les boucles en HTML ne sont pas directement possibles, mais vous pouvez utiliser JavaScript :

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>Exemple de boucle</title>
</head>
<body>
    <div id="output"></div>
    
    <script>
        // Boucle for en JavaScript
        for (let i = 0; i < 5; i++) {
            document.getElementById('output').innerHTML += 
                '<p>Itération ' + i + '</p>';
        }
    </script>
</body>
</html>
\`\`\`

Souhaitez-vous un exemple plus spécifique ?`
        };
        
        return templates[language] || templates.javascript;
    }
    
    /**
     * Generate a function example
     * @param {string} language - Programming language
     * @returns {string} Function example
     */
    generateFunctionExample(language) {
        const templates = {
            javascript: `Voici comment créer des fonctions en JavaScript :

\`\`\`javascript
// 1. Fonction classique
function direBonjour(nom) {
  return "Bonjour, " + nom + " !";
}

// 2. Fonction fléchée (arrow function)
const direBonjour = (nom) => {
  return "Bonjour, " + nom + " !";
};

// 3. Fonction avec paramètres par défaut
function multiplier(a, b = 2) {
  return a * b;
}

// 4. Fonction anonyme
const carrer = function(x) {
  return x * x;
};

// 5. Appel de fonction
console.log(direBonjour("Alice")); // "Bonjour, Alice !"
console.log(multiplier(5)); // 10 (5 * 2)
console.log(carrer(4)); // 16
\`\`\`

Souhaitez-vous un exemple avec des paramètres spécifiques ?`,
            python: `Voici comment créer des fonctions en Python :

\`\`\`python
# 1. Fonction simple
def dire_bonjour(nom):
    return "Bonjour, " + nom + " !"

# 2. Fonction avec paramètres par défaut
def multiplier(a, b=2):
    return a * b

# 3. Fonction avec arguments variables
def somme(*nombres):
    total = 0
    for nombre in nombres:
        total += nombre
    return total

# 4. Fonction lambda
carrer = lambda x: x * x

# 5. Appel de fonction
print(dire_bonjour("Alice"))  # "Bonjour, Alice !"
print(multiplier(5))          # 10 (5 * 2)
print(somme(1, 2, 3, 4))      # 10
print(carrer(4))              # 16
\`\`\`

Souhaitez-vous un exemple avec des paramètres spécifiques ?`
        };
        
        return templates[language] || templates.javascript;
    }
    
    /**
     * Generate a class example
     * @param {string} language - Programming language
     * @returns {string} Class example
     */
    generateClassExample(language) {
        const templates = {
            javascript: `Voici comment créer des classes en JavaScript :

\`\`\`javascript
// 1. Classe de base
class Personne {
  constructor(nom, age) {
    this.nom = nom;
    this.age = age;
  }
  
  sePresenter() {
    return "Je m'appelle " + this.nom + " et j'ai " + this.age + " ans.";
  }
}

// 2. Héritage
class Etudiant extends Personne {
  constructor(nom, age, universite) {
    super(nom, age);
    this.universite = universite;
  }
  
  sePresenter() {
    return super.sePresenter() + " Je suis étudiant à " + this.universite + ".";
  }
}

// 3. Utilisation
const alice = new Personne("Alice", 25);
console.log(alice.sePresenter());

const bob = new Etudiant("Bob", 20, "Sorbonne");
console.log(bob.sePresenter());
\`\`\`

Souhaitez-vous un exemple plus complexe ?`,
            python: `Voici comment créer des classes en Python :

\`\`\`python
# 1. Classe de base
class Personne:
    def __init__(self, nom, age):
        self.nom = nom
        self.age = age
    
    def se_presenter(self):
        return f"Je m'appelle {self.nom} et j'ai {self.age} ans."

# 2. Héritage
class Etudiant(Personne):
    def __init__(self, nom, age, universite):
        super().__init__(nom, age)
        self.universite = universite
    
    def se_presenter(self):
        return super().se_presenter() + f" Je suis étudiant à {self.universite}."

# 3. Utilisation
alice = Personne("Alice", 25)
print(alice.se_presenter())

bob = Etudiant("Bob", 20, "Sorbonne")
print(bob.se_presenter())
\`\`\`

Souhaitez-vous un exemple plus complexe ?`
        };
        
        return templates[language] || templates.javascript;
    }
    
    /**
     * Generate an array example
     * @param {string} language - Programming language
     * @returns {string} Array example
     */
    generateArrayExample(language) {
        const templates = {
            javascript: `Voici comment manipuler les tableaux en JavaScript :

\`\`\`javascript
// 1. Créer un tableau
const nombres = [1, 2, 3, 4, 5];
const noms = ["Alice", "Bob", "Charlie"];

// 2. Accéder aux éléments
console.log(nombres[0]); // 1
console.log(nombres[nombres.length - 1]); // 5

// 3. Ajouter des éléments
nombres.push(6); // Ajoute à la fin
nombres.unshift(0); // Ajoute au début

// 4. Supprimer des éléments
nombres.pop(); // Supprime le dernier
nombres.shift(); // Supprime le premier

// 5. Parcourir un tableau
nombres.forEach((element, index) => {
  console.log("Élément " + index + ": " + element);
});

// 6. Transformer un tableau
const doubles = nombres.map(x => x * 2);
const pairs = nombres.filter(x => x % 2 === 0);
const somme = nombres.reduce((acc, val) => acc + val, 0);

// 7. Trier un tableau
nombres.sort((a, b) => a - b); // Tri numérique
\`\`\`

Quelle opération souhaitez-vous effectuer sur un tableau ?`,
            python: `Voici comment manipuler les listes en Python :

\`\`\`python
# 1. Créer une liste
nombres = [1, 2, 3, 4, 5]
noms = ["Alice", "Bob", "Charlie"]

# 2. Accéder aux éléments
print(nombres[0])  # 1
print(nombres[-1]) # 5 (dernier élément)

# 3. Ajouter des éléments
nombres.append(6)  # Ajoute à la fin
nombres.insert(0, 0)  # Ajoute à une position spécifique

# 4. Supprimer des éléments
nombres.pop()  # Supprime le dernier
nombres.remove(3)  # Supprime la première occurrence de 3

# 5. Parcourir une liste
for index, element in enumerate(nombres):
    print("Élément", index, ":", element)

# 6. Compréhensions de liste
carres = [x**2 for x in nombres]
pairs = [x for x in nombres if x % 2 == 0]

# 7. Trier une liste
nombres.sort()  # Tri croissant
nombres.sort(reverse=True)  # Tri décroissant
\`\`\`

Quelle opération souhaitez-vous effectuer sur une liste ?`
        };
        
        return templates[language] || templates.javascript;
    }
    
    /**
     * Generate an object example
     * @param {string} language - Programming language
     * @returns {string} Object example
     */
    generateObjectExample(language) {
        const templates = {
            javascript: `Voici comment travailler avec les objets en JavaScript :

\`\`\`javascript
// 1. Créer un objet
const personne = {
  nom: "Alice",
  age: 25,
  ville: "Paris"
};

// 2. Accéder aux propriétés
console.log(personne.nom); // "Alice"
console.log(personne["age"]); // 25

// 3. Modifier un objet
personne.age = 26;
personne.profession = "Développeuse";

// 4. Supprimer une propriété
delete personne.ville;

// 5. Parcourir un objet
for (const cle in personne) {
  console.log(cle + ": " + personne[cle]);
}

// 6. Object.keys, Object.values, Object.entries
console.log(Object.keys(personne)); // ["nom", "age", "profession"]
console.log(Object.values(personne)); // ["Alice", 26, "Développeuse"]
console.log(Object.entries(personne)); // [["nom", "Alice"], ["age", 26], ...]

// 7. Méthodes dans un objet
const calculatrice = {
  ajouter: function(a, b) {
    return a + b;
  },
  soustraire(a, b) {
    return a - b;
  }
};

console.log(calculatrice.ajouter(5, 3)); // 8
\`\`\`

Souhaitez-vous un exemple plus spécifique ?`
        };
        
        return templates[language] || templates.javascript;
    }
    
    /**
     * Generate a fetch/HTTP request example
     * @param {string} language - Programming language
     * @returns {string} Fetch example
     */
    generateFetchExample(language) {
        const templates = {
            javascript: `Voici comment faire des requêtes HTTP en JavaScript :

\`\`\`javascript
// 1. Avec fetch (moderne, recommandé)
fetch('https://api.example.com/data')
  .then(response => {
    if (!response.ok) {
      throw new Error('Erreur réseau: ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    console.log('Données reçues:', data);
  })
  .catch(error => {
    console.error('Erreur:', error);
  });

// 2. Avec fetch + async/await
async function recupererDonnees() {
  try {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) {
      throw new Error('Erreur: ' + response.status);
    }
    const data = await response.json();
    console.log('Données:', data);
    return data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// 3. Avec des headers personnalisés
fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer votre_token'
  },
  body: JSON.stringify({ key: 'value' })
})
.then(response => response.json())
.then(data => console.log(data));

// 4. Avec axios (nécessite d'importer la bibliothèque)
// npm install axios
import axios from 'axios';

axios.get('https://api.example.com/data')
  .then(response => {
    console.log('Données:', response.data);
  })
  .catch(error => {
    console.error('Erreur:', error);
  });
\`\`\`

Quelle méthode souhaitez-vous utiliser ?`
        };
        
        return templates[language] || templates.javascript;
    }
    
    /**
     * Generate a generic response
     * @param {string} query - User query
     * @returns {string} Generic response
     */
    generateGenericResponse(query) {
        const queryLower = query.toLowerCase();
        
        // Greetings
        if (queryLower.includes('bonjour') || queryLower.includes('salut') || queryLower.includes('hello')) {
            return "Bonjour ! Comment puis-je vous aider aujourd'hui ? 😊";
        }
        
        // Thanks
        if (queryLower.includes('merci') || queryLower.includes('thank')) {
            return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. 😊";
        }
        
        // How are you
        if (queryLower.includes('comment ça va') || queryLower.includes('comment vas-tu') || queryLower.includes('how are you')) {
            return "Je vais très bien, merci ! Et vous, comment allez-vous ? 😊";
        }
        
        // Who are you
        if (queryLower.includes('qui es-tu') || queryLower.includes('qui êtes-vous') || queryLower.includes('who are you')) {
            return "Je suis votre assistant IA local. Je peux répondre à vos questions, générer du code, et apprendre de nos conversations. Je fonctionne entièrement dans votre navigateur, sans dépendre d'une API externe. 🚀";
        }
        
        // What can you do
        if (queryLower.includes('que peux-tu faire') || queryLower.includes('que pouvez-vous faire') || queryLower.includes('what can you do')) {
            return `Je peux :
- Répondre à vos questions en me basant sur nos conversations passées
- Générer du code dans plusieurs langages (JavaScript, Python, HTML, CSS, etc.)
- Vous expliquer des concepts de programmation
- Apprendre de nos échanges pour devenir de plus en plus pertinent
- Fonctionner entièrement localement, sans envoyer vos données à une API externe

Essayez-moi avec une question technique ou une demande de code !`;
        }
        
        // Default response
        return "Je ne suis pas sûr de comprendre votre question. Pouvez-vous reformuler ou me donner plus de détails ? Je suis là pour vous aider ! 😊";
    }
    
    /**
     * Learn from a conversation
     * @param {Array} messages - Array of message objects
     */
    learnFromConversation(messages) {
        // Extract question-answer pairs
        for (let i = 0; i < messages.length - 1; i++) {
            const question = messages[i];
            const answer = messages[i + 1];
            
            if (question.role === 'user' && answer.role === 'ai') {
                // Add to knowledge base if it's a good quality answer
                if (answer.content.length > 20) { // Only store substantial answers
                    this.addKnowledge(
                        question.content,
                        answer.content,
                        this.extractTags(question.content)
                    );
                }
            }
        }
    }
    
    /**
     * Extract tags from a question
     * @param {string} question - User question
     * @returns {Array} Extracted tags
     */
    extractTags(question) {
        const tags = [];
        const questionLower = question.toLowerCase();
        
        // Programming languages
        const languages = ['javascript', 'js', 'python', 'py', 'html', 'css', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'typescript', 'ts'];
        languages.forEach(lang => {
            if (questionLower.includes(lang)) {
                tags.push(lang);
            }
        });
        
        // Common topics
        const topics = [
            'boucle', 'loop', 'for', 'while', 'fonction', 'function', 'classe', 'class',
            'tableau', 'array', 'liste', 'objet', 'object', 'dom', 'api', 'requête',
            'http', 'fetch', 'promesse', 'promise', 'async', 'await', 'erreur', 'error',
            'algorithme', 'structure', 'données', 'base de données', 'database'
        ];
        
        topics.forEach(topic => {
            if (questionLower.includes(topic)) {
                tags.push(topic);
            }
        });
        
        return [...new Set(tags)]; // Remove duplicates
    }
    
    /**
     * Clear all knowledge
     */
    clearKnowledge() {
        this.knowledgeBase = [];
        this.conversations = [];
        localStorage.removeItem('localAIKnowledgeBase');
        localStorage.removeItem('localAIConversations');
    }
    
    /**
     * Export knowledge base
     * @returns {Object} Exported data
     */
    exportKnowledge() {
        return {
            knowledgeBase: this.knowledgeBase,
            conversations: this.conversations,
            codeTemplates: this.codeTemplates
        };
    }
    
    /**
     * Import knowledge base
     * @param {Object} data - Data to import
     */
    importKnowledge(data) {
        if (data.knowledgeBase) {
            this.knowledgeBase = data.knowledgeBase;
            this.saveKnowledgeBase();
        }
        if (data.conversations) {
            this.conversations = data.conversations;
            this.saveConversations();
        }
        if (data.codeTemplates) {
            this.codeTemplates = data.codeTemplates;
            this.saveCodeTemplates();
        }
    }
}

// Singleton instance
export const localAI = new LocalAI();
export default LocalAI;
