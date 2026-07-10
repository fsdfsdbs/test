/**
 * LocalAI Class - V3 (Hybride)
 * Moteur d'IA local : templates/mots-clés pour le code + petit modele de langage
 * local (Transformers.js) pour tout le reste. Toujours 100% dans le navigateur,
 * aucune API externe, aucune cle requise.
 *
 * Dependance a installer : npm install @huggingface/transformers
 */

import { getConfig } from '../config.js';
import { createElement, showToast } from '../utils/dom.js';
import { pipeline } from '@huggingface/transformers';

const CONFIDENCE_THRESHOLD = 25;

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

export class LocalAI {
    constructor() {
        this.conversations = [];
        this.knowledgeBase = this.loadKnowledgeBase();
        this.codeTemplates = this.loadCodeTemplates();
        this.loadConversations();

        // --- NOUVEAU : etat du modele local ---
        this.model = null;
        this.modelLoading = null;
        this.modelReady = false;
    }

    // ---------------------------------------------------------------------
    // NOUVEAU : chargement et appel du modele local (Transformers.js)
    // ---------------------------------------------------------------------

    async loadLocalModel(onProgress) {
        if (this.model) return this.model;
        if (this.modelLoading) return this.modelLoading;

        this.modelLoading = pipeline(
            'text-generation',
            'Xenova/Qwen1.5-0.5B-Chat',
            {
                dtype: 'q4',
                device: 'webgpu',
                progress_callback: onProgress
            }
        ).then(model => {
            this.model = model;
            this.modelReady = true;
            return model;
        }).catch(err => {
            console.error('Erreur de chargement du modele local :', err);
            this.modelLoading = null;
            throw err;
        });

        return this.modelLoading;
    }

    async generateModelResponse(query, conversationHistory = [], contextEntries = []) {
        const model = await this.loadLocalModel();

        let systemPrompt = "Tu es un assistant utile qui repond en francais, de facon claire et concise.";
        if (contextEntries.length > 0) {
            const contextText = contextEntries
                .map(e => `Q: ${e.question}\nR: ${e.answer}`)
                .join('\n\n');
            systemPrompt += `\n\nVoici des informations qui peuvent t'aider a repondre (ne les recopie pas telles quelles si non pertinentes) :\n${contextText}`;
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-6),
            { role: 'user', content: query }
        ];

        const output = await model(messages, {
            max_new_tokens: 256,
            temperature: 0.7,
            do_sample: true
        });

        const generated = output[0].generated_text;
        const lastMessage = Array.isArray(generated) ? generated[generated.length - 1] : generated;
        return typeof lastMessage === 'string' ? lastMessage : lastMessage.content;
    }

    // ---------------------------------------------------------------------
    // Normalisation / similarite de texte (inchange depuis la V2)
    // ---------------------------------------------------------------------

    normalize(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    tokenize(str) {
        return this.normalize(str)
            .split(' ')
            .filter(Boolean)
            .map(word => SYNONYMS[word] || word);
    }

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
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        return matrix[a.length][b.length];
    }

    wordsAreClose(wordA, wordB) {
        if (wordA === wordB) return true;
        if (Math.abs(wordA.length - wordB.length) > 2) return false;
        const maxLen = Math.max(wordA.length, wordB.length);
        if (maxLen < 4) return false;
        const distance = this.levenshtein(wordA, wordB);
        return distance <= Math.floor(maxLen / 4) + 1;
    }

    similarityScore(query, target) {
        const queryNorm = this.normalize(query);
        const targetNorm = this.normalize(target);
        if (!queryNorm || !targetNorm) return 0;

        let score = 0;
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
            if (exact) matched += 1;
            else if (fuzzy) matched += 0.6;
        }

        score += (matched / queryWords.length) * 40;
        return score;
    }

    // ---------------------------------------------------------------------
    // Persistance (inchange)
    // ---------------------------------------------------------------------

    loadKnowledgeBase() {
        const savedKB = localStorage.getItem('localAIKnowledgeBase');
        if (savedKB) {
            try {
                return JSON.parse(savedKB);
            } catch (e) {
                console.error('Erreur de chargement de la base de connaissances :', e);
            }
        }
        return [
            {
                question: "Comment faire une boucle for en JavaScript ?",
                answer: "Voici comment faire une boucle for en JavaScript :\n\n```javascript\nfor (let i = 0; i < 10; i++) {\n  console.log(i);\n}\n```",
                tags: ["javascript", "boucle", "for", "code"]
            },
            {
                question: "Comment creer une fonction en JavaScript ?",
                answer: "Voici comment creer une fonction en JavaScript :\n\n```javascript\nfunction direBonjour(nom) {\n  return `Bonjour, ${nom} !`;\n}\n```",
                tags: ["javascript", "fonction", "code"]
            }
            // ... garde le reste de tes entrees existantes de la V2 ici
        ];
    }

    loadCodeTemplates() {
        const savedTemplates = localStorage.getItem('localAICodeTemplates');
        if (savedTemplates) {
            try {
                return JSON.parse(savedTemplates);
            } catch (e) {
                console.error('Erreur de chargement des templates :', e);
            }
        }
        return {
            javascript: {
                loop: `for (let i = 0; i < {{count}}; i++) {\n  console.log(i);\n}`,
                function: `function {{name}}({{params}}) {\n  return {{returnValue}};\n}`
            },
            python: {
                loop: `for i in range({{count}}):\n    print(i)`,
                function: `def {{name}}({{params}}):\n    return {{returnValue}}`
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

    addConversation(messages) {
        this.conversations.push({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            messages: messages.map(msg => ({ ...msg }))
        });
        this.saveConversations();
    }

    addKnowledge(question, answer, tags = []) {
        this.knowledgeBase.push({ question, answer, tags, timestamp: new Date().toISOString() });
        this.saveKnowledgeBase();
    }

    addCodeTemplate(language, name, template) {
        if (!this.codeTemplates[language]) this.codeTemplates[language] = {};
        this.codeTemplates[language][name] = template;
        this.saveCodeTemplates();
    }

    findSimilarKnowledge(query, limit = 3) {
        const scoredEntries = this.knowledgeBase.map(entry => {
            let score = this.similarityScore(query, entry.question);
            const queryWords = this.tokenize(query);
            const tagWords = (entry.tags || []).map(t => this.normalize(t));
            score += queryWords.filter(w => tagWords.includes(w)).length * 15;
            return { ...entry, score };
        }).filter(entry => entry.score > 0);
        return scoredEntries.sort((a, b) => b.score - a.score).slice(0, limit);
    }

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
    // NOUVEAU : generateResponse hybride
    // ---------------------------------------------------------------------

    async generateResponse(query, conversationHistory = []) {
        const tokens = this.tokenize(query);
        const tokenSet = new Set(tokens);

        const codeLanguages = ['javascript', 'js', 'python', 'py', 'html', 'css', 'java', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust'];
        const codeIntentWords = ['code', 'script', 'fonction', 'boucle', 'classe', 'tableau', 'objet', 'requete'];
        const isCodeRequest = codeLanguages.some(lang => tokenSet.has(lang)) ||
                               codeIntentWords.some(word => tokenSet.has(word));

        if (isCodeRequest) {
            return this.generateCodeResponse(query, tokens);
        }

        const knowledgeMatches = this.findSimilarKnowledge(query, 3);
        if (knowledgeMatches.length > 0 && knowledgeMatches[0].score >= 60) {
            return knowledgeMatches[0].answer;
        }

        try {
            const contextEntries = knowledgeMatches.filter(m => m.score >= CONFIDENCE_THRESHOLD).slice(0, 2);
            return await this.generateModelResponse(query, conversationHistory, contextEntries);
        } catch (err) {
            console.error('Le modele local a echoue, fallback sur reponse generique :', err);
            return this.generateGenericResponse(query, tokenSet);
        }
    }

    generateCodeResponse(query, tokens) {
        const tokenSet = new Set(tokens || this.tokenize(query));
        const languageKeywords = {
            javascript: ['javascript', 'js', 'ecmascript'],
            python: ['python', 'py'],
            html: ['html', 'htm'],
            css: ['css']
        };
        let language = null;
        for (const [lang, keywords] of Object.entries(languageKeywords)) {
            if (keywords.some(keyword => tokenSet.has(keyword))) { language = lang; break; }
        }
        language = language || 'javascript';

        if (tokenSet.has('boucle')) {
            return language === 'python'
                ? "```python\nfor i in range(5):\n    print(i)\n```"
                : "```javascript\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n```";
        }
        if (tokenSet.has('fonction')) {
            return language === 'python'
                ? "```python\ndef dire_bonjour(nom):\n    return f\"Bonjour, {nom} !\"\n```"
                : "```javascript\nfunction direBonjour(nom) {\n  return `Bonjour, ${nom} !`;\n}\n```";
        }
        // ... garde tes autres generateurs (classe, tableau, objet, fetch) de la V2 ici

        return `Voici un exemple de code en ${language}. Precise ce que tu veux (boucle, fonction, classe...) pour un exemple cible.`;
    }

    generateGenericResponse(query, tokenSet) {
        const tokens = tokenSet || new Set(this.tokenize(query));
        if (tokens.has('salutation')) return "Bonjour ! Comment puis-je t'aider aujourd'hui ? 😊";
        if (tokens.has('remerciement')) return "Avec plaisir ! N'hesite pas si tu as d'autres questions. 😊";
        return "Je ne suis pas sur d'avoir bien compris ta question — peux-tu la reformuler ? 😊";
    }

    learnFromConversation(messages) {
        for (let i = 0; i < messages.length - 1; i++) {
            const question = messages[i];
            const answer = messages[i + 1];
            if (question.role === 'user' && answer.role === 'ai' && answer.content.length > 20) {
                const alreadyKnown = this.findSimilarKnowledge(question.content, 1);
                const isDuplicate = alreadyKnown.length > 0 && alreadyKnown[0].score >= 80;
                if (!isDuplicate) {
                    this.addKnowledge(question.content, answer.content, this.extractTags(question.content));
                }
            }
        }
    }

    extractTags(question) {
        const tags = new Set();
        const tokens = this.tokenize(question);
        const languages = ['javascript', 'js', 'python', 'py', 'html', 'css'];
        const topics = ['boucle', 'fonction', 'classe', 'tableau', 'objet', 'dom', 'requete', 'promesse'];
        tokens.forEach(token => {
            if (languages.includes(token)) tags.add(token);
            if (topics.includes(token)) tags.add(token);
        });
        return [...tags];
    }

    clearKnowledge() {
        this.knowledgeBase = [];
        this.conversations = [];
        localStorage.removeItem('localAIKnowledgeBase');
        localStorage.removeItem('localAIConversations');
    }

    exportKnowledge() {
        return { knowledgeBase: this.knowledgeBase, conversations: this.conversations, codeTemplates: this.codeTemplates };
    }

    importKnowledge(data) {
        if (data.knowledgeBase) { this.knowledgeBase = data.knowledgeBase; this.saveKnowledgeBase(); }
        if (data.conversations) { this.conversations = data.conversations; this.saveConversations(); }
        if (data.codeTemplates) { this.codeTemplates = data.codeTemplates; this.saveCodeTemplates(); }
    }
}

export const localAI = new LocalAI();
export default LocalAI;
