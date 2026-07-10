/**
 * Default Knowledge Base for LocalAI
 * Predefined responses for common questions
 */

export const DEFAULT_KNOWLEDGE_BASE = [
    {
        question: "Comment faire une boucle for en JavaScript ?",
        answer: "Voici comment faire une boucle for en JavaScript :\n\n```javascript\n// Boucle for basique\nfor (let i = 0; i < 5; i++) {\n  console.log(i); // Affiche 0 à 4\n}\n\n// Boucle for...of pour les tableaux\nconst tableau = [1, 2, 3, 4, 5];\nfor (const element of tableau) {\n  console.log(element);\n}\n\n// Boucle for...in pour les objets\nconst objet = { a: 1, b: 2, c: 3 };\nfor (const cle in objet) {\n  console.log(cle, objet[cle]);\n}\n\n// Boucle while\nlet i = 0;\nwhile (i < 5) {\n  console.log(i);\n  i++;
}\n\n// Boucle do...while\nlet j = 0;\ndo {\n  console.log(j);\n  j++;
} while (j < 5);\n```",
        tags: ["javascript", "boucle", "for", "while", "code"]
    },
    {
        question: "Comment créer une fonction en JavaScript ?",
        answer: "Voici comment créer une fonction en JavaScript :\n\n```javascript\n// Fonction classique\nfunction direBonjour(nom) {\n  return `Bonjour, ${nom} !`;\n}\n\n// Fonction fléchée\nconst direBonjour = (nom) => {\n  return `Bonjour, ${nom} !`;\n};\n\n// Fonction avec paramètres par défaut\nfunction multiplier(a, b = 2) {\n  return a * b;\n}\n\n// Appel\nconsole.log(direBonjour("Alice")); // "Bonjour, Alice !"\nconsole.log(multiplier(5)); // 10\n```",
        tags: ["javascript", "fonction", "code"]
    },
    {
        question: "Quelle est la différence entre let, const et var ?",
        answer: "Voici les différences :\n\n| Mot-clé | Portée | Réaffectable | Hoisting |\n|---------|--------|--------------|----------|\n| var | Fonction | ✅ Oui | ✅ Oui |\n| let | Bloc | ✅ Oui | ❌ Non |\n| const | Bloc | ❌ Non | ❌ Non |\n\n**Exemple :**\n```javascript\nvar x = 10;\nlet y = 20;\nconst z = 30;\n\nif (true) {\n  var x = 100; // Même variable !\n  let y = 200; // Nouvelle variable locale\n  const z = 300; // Erreur : Assignment to constant\n}\n\nconsole.log(x); // 100 (var est global dans la fonction)\nconsole.log(y); // 20 (let est limité au bloc)\n```",
        tags: ["javascript", "let", "const", "var", "portée"]
    },
    {
        question: "Comment faire une requête HTTP en JavaScript ?",
        answer: "Voici plusieurs méthodes :\n\n```javascript\n// 1. Avec fetch (recommandé)\nfetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Erreur:', error));\n\n// 2. Avec async/await\nasync function getData() {\n  const response = await fetch('https://api.example.com/data');\n  const data = await response.json();\n  console.log(data);\n}\n\n// 3. Avec des headers\nfetch('https://api.example.com/data', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ key: 'value' })\n});\n```",
        tags: ["javascript", "http", "fetch", "api"]
    },
    {
        question: "Comment manipuler le DOM en JavaScript ?",
        answer: "Voici les méthodes essentielles :\n\n```javascript\n// Sélectionner\nconst element = document.getElementById('id');\nconst elements = document.querySelectorAll('.classe');\n\n// Modifier le contenu\nelement.textContent = 'Texte';
element.innerHTML = '<strong>HTML</strong>';\n\n// Modifier les styles\nelement.style.color = 'red';\nelement.classList.add('classe');\n\n// Créer des éléments\nconst div = document.createElement('div');\ndocument.body.appendChild(div);\n\n// Écouter les événements\nelement.addEventListener('click', () => console.log('Cliqué !'));\n```",
        tags: ["javascript", "dom", "manipulation"]
    },
    {
        question: "Comment utiliser les promesses en JavaScript ?",
        answer: "Voici comment utiliser les promesses :\n\n```javascript\n// Créer une promesse\nconst promesse = new Promise((resolve, reject) => {\n  setTimeout(() => resolve('Succès !'), 1000);\n});\n\n// Utiliser .then()\npromesse.then(result => console.log(result));\n\n// Avec async/await\nasync function executer() {\n  const result = await promesse;\n  console.log(result);\n}\n\n// Promise.all()\nPromise.all([promesse1, promesse2])\n  .then(results => console.log(results));\n```",
        tags: ["javascript", "promesse", "async", "await"]
    }
];

export const DEFAULT_CODE_TEMPLATES = {
    javascript: {
        loop: `for (let i = 0; i < {{count}}; i++) {
  console.log(i);
}`,
        function: `function {{name}}({{params}}) {
  return {{returnValue}};
}`,
        class: `class {{name}} {
  constructor({{params}}) {
    {{initCode}}
  }
  
  {{methods}}
}`
    },
    python: {
        loop: `for i in range({{count}}):
    print(i)`,
        function: `def {{name}}({{params}}):
    return {{returnValue}}`
    }
};

export default {
    DEFAULT_KNOWLEDGE_BASE,
    DEFAULT_CODE_TEMPLATES
};
