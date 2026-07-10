/**
 * LocalAI Class - V2
 * Moteur d'IA local qui apprend des conversations et génère du code
 * Aucune API externe requise - fonctionne entièrement dans le navigateur
 *
 * Changements V2 :
 * - Correction du bug de string cassée (retour à la ligne brut dans un template Promise)
 * - Normalisation du texte (accents, casse, ponctuation) avant toute comparaison
 * - Scoring par similarité (Jaccard + Levenshtein léger) au lieu de includes() strict
 * - Seuil de confiance clair : en dessous, on ne répond plus "au hasard"
 * - Synonymes simples pour élargir la reconnaissance des intentions
 * - Code sanitizé (plus de string cassée dans les templates)
 */

import { getConfig } from '../config.js';
import { createElement, showToast } from '../utils/dom.js';

// Seuil en dessous duquel on considère qu'on n'a "pas vraiment" de bonne réponse
const CONFIDENCE_THRESHOLD = 25;

// Table de synonymes -> mot canonique, pour élargir la reconnaissance d'intention
const SYNONYMS = {
    boucle: 'boucle', loop: 'boucle', iteration: 'boucle', iterer: 'boucle',
    fonction: 'fonction', function: 'fonction', methode: 'fonction',
    classe: 'classe', class: 'classe', objet: 'objet', object: 'objet',
    tableau: 'tableau', array: 'tableau', liste: 'tableau',
    requete: 'requete', fetch: 'requete', api: 'requete', http: 'requete', ajax: 'requete',
    promesse: 'promesse', promise: 'promesse', async: 'promesse', asynchrone: 'promesse',
    bonjour: 'salutation', salut: 'salutation', hello: 'salutation', coucou: 'salutation',
    merci: 'remerciement', thanks: 'remerciement', thank: 'remerciement',
    aide: 'aide', help: 'aide', comment: 'comment'
};

/**
 * LocalAI - IA locale auto-améliorante qui stocke les conversations et génère des réponses
 */
export class LocalAI {
    constructor() {
        this.conversations = [];
        this.knowledgeBase = this.loadKnowledgeBase();
        this.codeTemplates = this.loadCodeTemplates();
        this.loadConversations();
    }

    // ---------------------------------------------------------------------
    // Normalisation / similarité de texte
    // ---------------------------------------------------------------------

    /**
     * Normalise une chaîne : minuscule, sans accents, sans ponctuation
     * @param {string} str
     * @returns {string}
     */
    normalize(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
            .replace(/[^a-z0-9\s]/g, ' ') // enlève ponctuation
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Découpe en mots normalisés et remplace les synonymes connus par leur forme canonique
     * @param {string} str
     * @returns {Array<string>}
     */
    tokenize(str) {
        return this.normalize(str)
            .split(' ')
            .filter(Boolean)
            .map(word => SYNONYMS[word] || word);
    }

    /**
     * Distance de Levenshtein (nombre minimal d'opérations pour passer de a à b)
     * Utilisée pour tolérer les fautes de frappe sur des mots courts
     * @param {string} a
     * @param {string} b
     * @returns {number}
     */
    levenshtein(a, b) {
        if (a === b) return 0;
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
            Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
        );

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // suppression
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }
        return matrix[a.length][b.length];
    }

    /**
     * Deux mots sont considérés "proches" si leur distance de Levenshtein
     * est petite par rapport à leur longueur (tolère fautes de frappe)
     * @param {string} wordA
     * @param {string} wordB
     * @returns {boolean}
     */
    wordsAreClose(wordA, wordB) {
        if (wordA === wordB) return true;
        if (Math.abs(wordA.length - wordB.length) > 2) return false;
        const maxLen = Math.max(wordA.length, wordB.length);
        if (maxLen < 4) return false; // trop court pour du fuzzy matching fiable
        const distance = this.levenshtein(wordA, wordB);
        return distance <= Math.floor(maxLen / 4) + 1;
    }

    /**
     * Calcule un score de similarité entre une requête et un texte cible
     * Combine : chevauchement de mots (exact + fuzzy) et inclusion de sous-chaîne
     * @param {string} query
     * @param {string} target
     * @returns {number} score (plus haut = plus similaire)
     */
    similarityScore(query, target) {
        const queryNorm = this.normalize(query);
        const targetNorm = this.normalize(target);
        if (!queryNorm || !targetNorm) return 0;

        let score = 0;

        // Inclusion directe (après normalisation) = très fort signal
        if (targetNorm.includes(queryNorm) || queryNorm.includes(targetNorm)) {
            score += 60;
        }

        const queryWords = this.tokenize(query);
        const targetWords = this.tokenize(target);

        if (queryWords.length === 0 || targetWords.length === 0) return score;

        let matched = 0;
        for (const qWord of queryWords) {
            const exact = targetWords.includes(qWord);
            const fuzzy = !exact && targetWords.some(tWord => this.wordsAreClose(qWord, tWord));
            if (exact) {
                matched += 1;
            } else if (fuzzy) {
                matched += 0.6; // un match approximatif compte un peu moins
            }
        }

        // Score proportionnel à la part de mots de la requête retrouvés dans la cible
        score += (matched / queryWords.length) * 40;

        return score;
    }

    // ---------------------------------------------------------------------
    // Persistance (localStorage)
    // ---------------------------------------------------------------------

    /**
     * Charge la base de connaissances depuis localStorage ou utilise les valeurs par défaut
     * @returns {Array} Entrées de la base de connaissances
     */
    loadKnowledgeBase() {
        const savedKB = localStorage.getItem('localAIKnowledgeBase');
        if (savedKB) {
            try {
                return JSON.parse(savedKB);
            } catch (e) {
                console.error('Erreur de chargement de la base de connaissances :', e);
            }
        }

        // Base de connaissances par défaut
        return [
            {
                question: "Comment faire une boucle for en JavaScript ?",
                answer: "Voici comment faire une boucle for en JavaScript :\n\n```javascript\n// Boucle for basique\nfor (let i = 0; i < 10; i++) {\n  console.log(i); // Affiche 0 à 9\n}\n\n// Boucle for...of pour les tableaux\nconst tableau = [1, 2, 3, 4, 5];\nfor (const element of tableau) {\n  console.log(element);\n}\n\n// Boucle for...in pour les objets\nconst objet = { a: 1, b: 2, c: 3 };\nfor (const cle in objet) {\n  console.log(cle, objet[cle]);\n}\n```",
                tags: ["javascript", "boucle", "for", "code"]
            },
            {
                question: "Comment créer une fonction en JavaScript ?",
                answer: "Voici comment créer une fonction en JavaScript :\n\n```javascript\nfunction direBonjour(nom) {\n  return `Bonjour, ${nom} !`;\n}\n\nconst direBonjour2 = (nom) => {\n  return `Bonjour, ${nom} !`;\n};\n\nfunction multiplier(a, b = 2) {\n  return a * b;\n}\n\nconsole.log(direBonjour(\"Alice\")); // \"Bonjour, Alice !\"\nconsole.log(multiplier(5)); // 10\n```",
                tags: ["javascript", "fonction", "code"]
            },
            {
                question: "Quelle est la différence entre let, const et var en JavaScript ?",
                answer: "Voici les différences entre `let`, `const` et `var` en JavaScript :\n\n| Mot-clé | Portée | Réaffectable | Hoisting |\n|---------|--------|--------------|----------|\n| `var`   | Fonction | Oui | Oui (undefined) |\n| `let`   | Bloc    | Oui | Non (erreur temporelle) |\n| `const` | Bloc    | Non | Non (erreur temporelle) |\n\n```javascript\nvar x = 10;\nif (true) { var x = 20; }\nconsole.log(x); // 20\n\nlet y = 10;\nif (true) { let y = 20; console.log(y); } // 20\nconsole.log(y); // 10\n\nconst z = 10;\n// z = 20; -> Erreur\n```",
                tags: ["javascript", "let", "const", "var", "portee"]
            },
            {
                question: "Comment faire une requête HTTP en JavaScript ?",
                answer: "Voici plusieurs façons de faire des requêtes HTTP en JavaScript :\n\n```javascript\n// fetch (moderne)\nfetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Erreur:', error));\n\n// fetch + async/await\nasync function getData() {\n  try {\n    const response = await fetch('https://api.example.com/data');\n    const data = await response.json();\n    console.log(data);\n  } catch (error) {\n    console.error('Erreur:', error);\n  }\n}\n```",
                tags: ["javascript", "http", "fetch", "api", "code"]
            },
            {
                question: "Comment manipuler le DOM en JavaScript ?",
                answer: "Voici les méthodes essentielles pour manipuler le DOM :\n\n```javascript\nconst element = document.getElementById('monId');\nconst elements = document.querySelectorAll('.maClasse');\n\nelement.textContent = 'Nouveau texte';\nelement.style.color = 'red';\nelement.classList.add('maClasse');\n\nconst newDiv = document.createElement('div');\ndocument.body.appendChild(newDiv);\n\nelement.addEventListener('click', (event) => {\n  console.log('Élément cliqué !', event.target);\n});\n```",
                tags: ["javascript", "dom", "manipulation", "code"]
            },
            {
                question: "Comment gérer les promesses en JavaScript ?",
                answer: "Voici comment gérer les promesses (Promises) en JavaScript :\n\n```javascript\nconst maPromesse = new Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Opération réussie !');\n  }, 1000);\n});\n\nmaPromesse\n  .then(resultat => console.log(resultat))\n  .catch(error => console.error(error));\n\nasync function executerPromesse() {\n  try {\n    const resultat = await maPromesse;\n    console.log(resultat);\n  } catch (error) {\n    console.error(error);\n  }\n}\n\nconst p1 = Promise.resolve(1);\nconst p2 = Promise.resolve(2);\nconst p3 = new Promise(resolve => setTimeout(resolve, 100, 3));\n\nPromise.all([p1, p2, p3]).then(valeurs => console.log(valeurs));\nPromise.race([p1, p2, p3]).then(valeur => console.log(valeur));\n```",
                tags: ["javascript", "promesse", "async", "await", "code"]
            },
            {
                question: "Comment utiliser les tableaux en JavaScript ?",
                answer: "Voici les méthodes essentielles pour manipuler les tableaux en JavaScript :\n\n```javascript\nconst tableau = [1, 2, 3, 4, 5];\n\ntableau.push(6);\ntableau.unshift(0);\ntableau.pop();\ntableau.shift();\n\nconst doubles = tableau.map(x => x * 2);\nconst pairs = tableau.filter(x => x % 2 === 0);\nconst somme = tableau.reduce((acc, val) => acc + val, 0);\n\ntableau.sort((a, b) => a - b);\ntableau.forEach((element, index) => {\n  console.log(`Élément ${index}: ${element}`);\n});\n```",
                tags: ["javascript", "tableau", "array", "code"]
            }
        ];
    }

    /**
     * Charge les templates de code pour la génération
     * @returns {Object} Templates par langage
     */
    loadCodeTemplates() {
        const savedTemplates = localStorage.getItem('localAICodeTemplates');
        if (savedTemplates) {
            try {
                return JSON.parse(savedTemplates);
            } catch (e) {
                console.error('Erreur de chargement des templates de code :', e);
            }
        }

        return {
            javascript: {
                loop: `for (let i = 0; i < {{count}}; i++) {\n  // Votre code ici\n  console.log(i);\n}`,
                function: `function {{name}}({{params}}) {\n  // Votre code ici\n  return {{returnValue}};\n}`,
                class: `class {{name}} {\n  constructor({{params}}) {\n    {{initCode}}\n  }\n\n  {{methods}}\n}`,
                fetch: `fetch('{{url}}')\n  .then(response => response.json())\n  .then(data => {\n    console.log(data);\n  })\n  .catch(error => {\n    console.error('Erreur:', error);\n  });`
            },
            python: {
                loop: `for i in range({{count}}):\n    # Votre code ici\n    print(i)`,
                function: `def {{name}}({{params}}):\n    # Votre code ici\n    return {{returnValue}}`,
                class: `class {{name}}:\n    def __init__(self, {{params}}):\n        {{initCode}}\n\n    {{methods}}`
            },
            html: {
                basic: `<!DOCTYPE html>\n<html>\n<head>\n    <title>{{title}}</title>\n</head>\n<body>\n    <h1>{{heading}}</h1>\n</body>\n</html>`,
                form: `<form id="{{formId}}">\n    <label for="{{fieldName}}">{{label}}:</label>\n    <input type="{{type}}" id="{{fieldName}}" name="{{fieldName}}" />\n    <button type="submit">Envoyer</button>\n</form>`
            },
            css: {
                basic: `/* Sélecteur pour {{element}} */\n{{selector}} {\n    color: #333;\n    background-color: #f5f5f5;\n    padding: 10px;\n    margin: 5px;\n}`
            }
        };
    }

    loadConversations() {
        const savedConversations = localStorage.getItem('localAIConversations');
        if (savedConversations) {
            try {
                this.conversations = JSON.parse(savedConversations);
            } catch (e) {
                console.error('Erreur de chargement des conversations :', e);
                this.conversations = [];
            }
        }
    }

    saveConversations() {
        try {
            localStorage.setItem('localAIConversations', JSON.stringify(this.conversations));
        } catch (e) {
            console.error('Erreur de sauvegarde des conversations :', e);
        }
    }

    saveKnowledgeBase() {
        try {
            localStorage.setItem('localAIKnowledgeBase', JSON.stringify(this.knowledgeBase));
        } catch (e) {
            console.error('Erreur de sauvegarde de la base de connaissances :', e);
        }
    }

    saveCodeTemplates() {
        try {
            localStorage.setItem('localAICodeTemplates', JSON.stringify(this.codeTemplates));
        } catch (e) {
            console.error('Erreur de sauvegarde des templates :', e);
        }
    }

    // ---------------------------------------------------------------------
    // Ajout de données
    // ---------------------------------------------------------------------

    addConversation(messages) {
        this.conversations.push({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            messages: messages.map(msg => ({ ...msg }))
        });
        this.saveConversations();
    }

    addKnowledge(question, answer, tags = []) {
        this.knowledgeBase.push({
            question,
            answer,
            tags,
            timestamp: new Date().toISOString()
        });
        this.saveKnowledgeBase();
    }

    addCodeTemplate(language, name, template) {
        if (!this.codeTemplates[language]) {
            this.codeTemplates[language] = {};
        }
        this.codeTemplates[language][name] = template;
        this.saveCodeTemplates();
    }

    // ---------------------------------------------------------------------
    // Recherche (V2 : basée sur similarityScore, plus sur includes() strict)
    // ---------------------------------------------------------------------

    /**
     * Trouve les entrées de connaissance les plus proches de la requête
     * @param {string} query
     * @param {number} limit
     * @returns {Array}
     */
    findSimilarKnowledge(query, limit = 3) {
        const scoredEntries = this.knowledgeBase.map(entry => {
            let score = this.similarityScore(query, entry.question);

            // Bonus si un tag correspond directement à un mot de la requête
            const queryWords = this.tokenize(query);
            const tagWords = (entry.tags || []).map(t => this.normalize(t));
            const tagBonus = queryWords.filter(w => tagWords.includes(w)).length * 15;
            score += tagBonus;

            return { ...entry, score };
        }).filter(entry => entry.score > 0);

        return scoredEntries.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    /**
     * Trouve les conversations passées les plus proches de la requête
     * @param {string} query
     * @param {number} limit
     * @returns {Array}
     */
    findSimilarConversations(query, limit = 3) {
        const scoredConversations = this.conversations.map(conv => {
            let bestMessageScore = 0;
            conv.messages.forEach(msg => {
                const s = this.similarityScore(query, msg.content);
                if (s > bestMessageScore) bestMessageScore = s;
            });
            return { ...conv, score: bestMessageScore };
        }).filter(conv => conv.score > 0);

        return scoredConversations.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    // ---------------------------------------------------------------------
    // Génération de réponse
    // ---------------------------------------------------------------------

    /**
     * Génère une réponse à partir de la requête
     * @param {string} query
     * @param {Array} conversationHistory
     * @returns {Promise<string>}
     */
    async generateResponse(query, conversationHistory = []) {
        const tokens = this.tokenize(query);
        const tokenSet = new Set(tokens);

        // 1. Requête de génération de code ?
        const codeLanguages = ['javascript', 'js', 'python', 'py', 'html', 'css', 'java', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust'];
        const codeIntentWords = ['code', 'script', 'fonction', 'boucle', 'classe', 'tableau', 'objet', 'requete'];
        const isCodeRequest = codeLanguages.some(lang => tokenSet.has(lang)) ||
                               codeIntentWords.some(word => tokenSet.has(word));

        if (isCodeRequest) {
            return this.generateCodeResponse(query, tokens);
        }

        // 2. Recherche dans la base de connaissances
        const knowledgeMatches = this.findSimilarKnowledge(query, 3);
        if (knowledgeMatches.length > 0 && knowledgeMatches[0].score >= CONFIDENCE_THRESHOLD) {
            return knowledgeMatches[0].answer;
        }

        // 3. Recherche dans les conversations passées
        const conversationMatches = this.findSimilarConversations(query, 3);
        if (conversationMatches.length > 0 && conversationMatches[0].score >= CONFIDENCE_THRESHOLD) {
            const bestConv = conversationMatches[0];
            let bestIndex = -1;
            let bestScore = 0;
            bestConv.messages.forEach((msg, idx) => {
                const s = this.similarityScore(query, msg.content);
                if (s > bestScore) {
                    bestScore = s;
                    bestIndex = idx;
                }
            });

            if (bestIndex >= 0 && bestConv.messages[bestIndex + 1]) {
                return bestConv.messages[bestIndex + 1].content;
            }

            const aiMessages = bestConv.messages.filter(msg => msg.role === 'ai');
            if (aiMessages.length > 0) {
                return aiMessages[aiMessages.length - 1].content;
            }
        }

        // 4. Réponse générique (salutations, remerciements, etc.) ou fallback honnête
        return this.generateGenericResponse(query, tokenSet);
    }

    /**
     * Génère une réponse de type code
     * @param {string} query
     * @param {Array<string>} tokens - tokens déjà normalisés/tokenisés
     * @returns {string}
     */
    generateCodeResponse(query, tokens) {
        const tokenSet = new Set(tokens || this.tokenize(query));

        const languageKeywords = {
            javascript: ['javascript', 'js', 'ecmascript'],
            python: ['python', 'py'],
            html: ['html', 'htm'],
            css: ['css'],
            java: ['java'],
            'c++': ['cpp', 'c'],
            'c#': ['csharp'],
            php: ['php'],
            ruby: ['ruby', 'rb'],
            go: ['go', 'golang'],
            rust: ['rust']
        };

        let language = null;
        for (const [lang, keywords] of Object.entries(languageKeywords)) {
            if (keywords.some(keyword => tokenSet.has(keyword))) {
                language = lang;
                break;
            }
        }
        language = language || 'javascript';

        if (tokenSet.has('boucle')) return this.generateLoopExample(language);
        if (tokenSet.has('fonction')) return this.generateFunctionExample(language);
        if (tokenSet.has('classe')) return this.generateClassExample(language);
        if (tokenSet.has('tableau')) return this.generateArrayExample(language);
        if (tokenSet.has('objet')) return this.generateObjectExample(language);
        if (tokenSet.has('requete')) return this.generateFetchExample(language);

        return `Voici un exemple de code en ${language}. Peux-tu préciser ce que tu veux faire exactement (une boucle, une fonction, une classe, un tableau, un objet, une requête HTTP) pour que je te donne un exemple ciblé ?`;
    }

    generateLoopExample(language) {
        const templates = {
            javascript: `Voici comment faire des boucles en JavaScript :\n\n\`\`\`javascript\n// 1. Boucle for (compteur)\nfor (let i = 0; i < 5; i++) {\n  console.log("Itération " + i);\n}\n\n// 2. Boucle for...of (tableaux)\nconst tableau = [1, 2, 3, 4, 5];\nfor (const element of tableau) {\n  console.log(element);\n}\n\n// 3. Boucle for...in (objets)\nconst objet = { a: 1, b: 2, c: 3 };\nfor (const cle in objet) {\n  console.log(cle + ": " + objet[cle]);\n}\n\n// 4. Boucle while\nlet i = 0;\nwhile (i < 5) {\n  console.log("While: " + i);\n  i++;\n}\n\`\`\`\n\nQuelle boucle souhaites-tu utiliser ?`,
            python: `Voici comment faire des boucles en Python :\n\n\`\`\`python\nfor i in range(5):\n    print("Itération", i)\n\ntableau = [1, 2, 3, 4, 5]\nfor element in tableau:\n    print(element)\n\ni = 0\nwhile i < 5:\n    print("While:", i)\n    i += 1\n\`\`\`\n\nQuelle boucle souhaites-tu utiliser ?`,
            html: `Les boucles ne sont pas possibles directement en HTML, il faut passer par JavaScript :\n\n\`\`\`html\n<!DOCTYPE html>\n<html>\n<body>\n    <div id="output"></div>\n    <script>\n        for (let i = 0; i < 5; i++) {\n            document.getElementById('output').innerHTML += '<p>Itération ' + i + '</p>';\n        }\n    </script>\n</body>\n</html>\n\`\`\``
        };
        return templates[language] || templates.javascript;
    }

    generateFunctionExample(language) {
        const templates = {
            javascript: `Voici comment créer des fonctions en JavaScript :\n\n\`\`\`javascript\nfunction direBonjour(nom) {\n  return "Bonjour, " + nom + " !";\n}\n\nconst direBonjour2 = (nom) => "Bonjour, " + nom + " !";\n\nfunction multiplier(a, b = 2) {\n  return a * b;\n}\n\nconsole.log(direBonjour("Alice"));\nconsole.log(multiplier(5));\n\`\`\`\n\nSouhaites-tu un exemple avec des paramètres spécifiques ?`,
            python: `Voici comment créer des fonctions en Python :\n\n\`\`\`python\ndef dire_bonjour(nom):\n    return "Bonjour, " + nom + " !"\n\ndef multiplier(a, b=2):\n    return a * b\n\ndef somme(*nombres):\n    return sum(nombres)\n\nprint(dire_bonjour("Alice"))\nprint(multiplier(5))\nprint(somme(1, 2, 3, 4))\n\`\`\`\n\nSouhaites-tu un exemple avec des paramètres spécifiques ?`
        };
        return templates[language] || templates.javascript;
    }

    generateClassExample(language) {
        const templates = {
            javascript: `Voici comment créer des classes en JavaScript :\n\n\`\`\`javascript\nclass Personne {\n  constructor(nom, age) {\n    this.nom = nom;\n    this.age = age;\n  }\n\n  sePresenter() {\n    return "Je m'appelle " + this.nom + " et j'ai " + this.age + " ans.";\n  }\n}\n\nclass Etudiant extends Personne {\n  constructor(nom, age, universite) {\n    super(nom, age);\n    this.universite = universite;\n  }\n\n  sePresenter() {\n    return super.sePresenter() + " Je suis étudiant à " + this.universite + ".";\n  }\n}\n\nconst alice = new Personne("Alice", 25);\nconsole.log(alice.sePresenter());\n\`\`\``,
            python: `Voici comment créer des classes en Python :\n\n\`\`\`python\nclass Personne:\n    def __init__(self, nom, age):\n        self.nom = nom\n        self.age = age\n\n    def se_presenter(self):\n        return f"Je m'appelle {self.nom} et j'ai {self.age} ans."\n\nclass Etudiant(Personne):\n    def __init__(self, nom, age, universite):\n        super().__init__(nom, age)\n        self.universite = universite\n\n    def se_presenter(self):\n        return super().se_presenter() + f" Je suis étudiant à {self.universite}."\n\nalice = Personne("Alice", 25)\nprint(alice.se_presenter())\n\`\`\``
        };
        return templates[language] || templates.javascript;
    }

    generateArrayExample(language) {
        const templates = {
            javascript: `Voici comment manipuler les tableaux en JavaScript :\n\n\`\`\`javascript\nconst nombres = [1, 2, 3, 4, 5];\n\nnombres.push(6);\nnombres.unshift(0);\nnombres.pop();\nnombres.shift();\n\nconst doubles = nombres.map(x => x * 2);\nconst pairs = nombres.filter(x => x % 2 === 0);\nconst somme = nombres.reduce((acc, val) => acc + val, 0);\n\nnombres.sort((a, b) => a - b);\n\`\`\`\n\nQuelle opération souhaites-tu effectuer sur un tableau ?`,
            python: `Voici comment manipuler les listes en Python :\n\n\`\`\`python\nnombres = [1, 2, 3, 4, 5]\n\nnombres.append(6)\nnombres.insert(0, 0)\nnombres.pop()\nnombres.remove(3)\n\ncarres = [x**2 for x in nombres]\npairs = [x for x in nombres if x % 2 == 0]\n\nnombres.sort()\n\`\`\`\n\nQuelle opération souhaites-tu effectuer sur une liste ?`
        };
        return templates[language] || templates.javascript;
    }

    generateObjectExample(language) {
        const templates = {
            javascript: `Voici comment travailler avec les objets en JavaScript :\n\n\`\`\`javascript\nconst personne = { nom: "Alice", age: 25, ville: "Paris" };\n\nconsole.log(personne.nom);\npersonne.age = 26;\ndelete personne.ville;\n\nfor (const cle in personne) {\n  console.log(cle + ": " + personne[cle]);\n}\n\nconsole.log(Object.keys(personne));\nconsole.log(Object.values(personne));\nconsole.log(Object.entries(personne));\n\`\`\``
        };
        return templates[language] || templates.javascript;
    }

    generateFetchExample(language) {
        const templates = {
            javascript: `Voici comment faire des requêtes HTTP en JavaScript :\n\n\`\`\`javascript\nfetch('https://api.example.com/data')\n  .then(response => {\n    if (!response.ok) throw new Error('Erreur réseau: ' + response.status);\n    return response.json();\n  })\n  .then(data => console.log('Données reçues:', data))\n  .catch(error => console.error('Erreur:', error));\n\nasync function recupererDonnees() {\n  try {\n    const response = await fetch('https://api.example.com/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Erreur:', error);\n    throw error;\n  }\n}\n\`\`\`\n\nQuelle méthode souhaites-tu utiliser ?`
        };
        return templates[language] || templates.javascript;
    }

    /**
     * Génère une réponse générique (salutations, remerciements, méta-questions, fallback)
     * @param {string} query
     * @param {Set<string>} tokenSet - tokens déjà normalisés/tokenisés de la requête
     * @returns {string}
     */
    generateGenericResponse(query, tokenSet) {
        const tokens = tokenSet || new Set(this.tokenize(query));

        if (tokens.has('salutation')) {
            return "Bonjour ! Comment puis-je t'aider aujourd'hui ? 😊";
        }

        if (tokens.has('remerciement')) {
            return "Avec plaisir ! N'hésite pas si tu as d'autres questions. 😊";
        }

        const normalized = this.normalize(query);

        if (normalized.includes('comment ca va') || normalized.includes('comment vas tu') || normalized.includes('how are you')) {
            return "Je vais très bien, merci ! Et toi, comment vas-tu ? 😊";
        }

        if (normalized.includes('qui es tu') || normalized.includes('qui etes vous') || normalized.includes('who are you')) {
            return "Je suis ton assistant IA local. Je réponds à tes questions, je génère du code, et j'apprends de nos conversations. Je fonctionne entièrement dans ton navigateur, sans API externe. 🚀";
        }

        if (tokens.has('aide') || normalized.includes('que peux tu faire') || normalized.includes('what can you do')) {
            return `Je peux :\n- Répondre à tes questions en me basant sur nos échanges passés\n- Générer du code dans plusieurs langages (JavaScript, Python, HTML, CSS...)\n- T'expliquer des concepts de programmation\n- Apprendre de nos échanges pour devenir plus pertinent avec le temps\n- Fonctionner entièrement en local, sans envoyer tes données à une API externe\n\nEssaie-moi avec une question technique ou une demande de code !`;
        }

        // Fallback honnête : on dit clairement qu'on n'a pas trouvé de bonne correspondance
        return "Je ne suis pas sûr d'avoir bien compris ta question — peux-tu la reformuler ou préciser un peu ? Je suis là pour t'aider ! 😊";
    }

    // ---------------------------------------------------------------------
    // Apprentissage
    // ---------------------------------------------------------------------

    /**
     * Apprend d'une conversation (extrait les paires question/réponse)
     * @param {Array} messages
     */
    learnFromConversation(messages) {
        for (let i = 0; i < messages.length - 1; i++) {
            const question = messages[i];
            const answer = messages[i + 1];

            if (question.role === 'user' && answer.role === 'ai') {
                if (answer.content.length > 20) {
                    // Évite les doublons quasi identiques dans la base
                    const alreadyKnown = this.findSimilarKnowledge(question.content, 1);
                    const isDuplicate = alreadyKnown.length > 0 && alreadyKnown[0].score >= 80;

                    if (!isDuplicate) {
                        this.addKnowledge(
                            question.content,
                            answer.content,
                            this.extractTags(question.content)
                        );
                    }
                }
            }
        }
    }

    /**
     * Extrait des tags pertinents d'une question
     * @param {string} question
     * @returns {Array<string>}
     */
    extractTags(question) {
        const tags = new Set();
        const tokens = this.tokenize(question);

        const languages = ['javascript', 'js', 'python', 'py', 'html', 'css', 'java', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust', 'typescript', 'ts'];
        const topics = ['boucle', 'fonction', 'classe', 'tableau', 'objet', 'dom', 'requete', 'promesse'];

        tokens.forEach(token => {
            if (languages.includes(token)) tags.add(token);
            if (topics.includes(token)) tags.add(token);
        });

        return [...tags];
    }

    // ---------------------------------------------------------------------
    // Import / export / reset
    // ---------------------------------------------------------------------

    clearKnowledge() {
        this.knowledgeBase = [];
        this.conversations = [];
        localStorage.removeItem('localAIKnowledgeBase');
        localStorage.removeItem('localAIConversations');
    }

    exportKnowledge() {
        return {
            knowledgeBase: this.knowledgeBase,
            conversations: this.conversations,
            codeTemplates: this.codeTemplates
        };
    }

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

// Instance singleton
export const localAI = new LocalAI();
export default LocalAI;
