import fs from 'fs';
import path from 'path';
import arg from 'arg';

import {
    resolvePath,
    getFilesFromDirectory,
    readFileContent,
    UrlRelativeFromPublic,
    normalizeText,
    stripFrontmatter,
    parseFrontmatter,
    tokenizer,
    normalizeTokens,
    markdownImageLink
} from './lib/helpers.js';

const args = arg({
	// Types
	'--help': Boolean,
	'--version': Boolean,

    '--base': String,
    '--publicFolder': String,
	'--documentPath': String,
	'--indexFile': String,
	'--registryFile': String,

    
	'--maxKeywordsPerFile': Number,
	'--maxKeywordsAverage': Number,

	// Aliases
	'-v': '--verbose',
	'-m': '--maxKeywordsPerFile',
	'-a': '--maxKeywordsAverage',
});

function ensureLeadingTrailing(p) {
    if (!p) return '';
    if (!p.startsWith('/')) p = '/' + p;
    if (!p.endsWith('/')) p = p + '/';
    return p;
}

function detectBase() {
    // CLI override wins
    if (args['--base']) return ensureLeadingTrailing(args['--base']);

    // Try reading vite.config.ts for the base setting
    try {
        const viteConfigPath = path.posix.resolve('./vite.config.ts');
        if (fs.existsSync(viteConfigPath)) {
            const viteCfg = fs.readFileSync(viteConfigPath, 'utf8');
            const m = viteCfg.match(/base\s*:\s*['"`]([^'"`]+)['"`]/);
            if (m && m[1]) return ensureLeadingTrailing(m[1]);
        }
    } catch (e) {
        // ignore
    }

    // Try package.json homepage
    try {
        const pkg = JSON.parse(fs.readFileSync(path.posix.resolve('./package.json'), 'utf8'));
        if (pkg && pkg.homepage) return ensureLeadingTrailing(pkg.homepage);
    } catch (e) {
        // ignore
    }

    return '';
}

const applicationBasePath = detectBase();
const publicPath = path.posix.resolve(args['--publicFolder'] || './public');
const documentRootDirectory = path.posix.resolve(publicPath, args['--documentPath'] || 'documents');
const indexPath = path.posix.resolve(publicPath, args['--indexFile'] || 'searchindex.json');
const registryPath = path.posix.resolve(publicPath, args['--registryFile'] || 'registry.json');
const maxKeywordsPerFile = args['--maxKeywordsPerFile'] || 125;
const maxKeywordsAverage = args['--maxKeywordsAverage'] || 50;

const excludeTokens = [
    'Zutaten', 'Anweisungen', 'Zubereitung', 'Ingredients', 'Instructions', 'Gramm', 'Kilo', 'zugeben', 'hinzugeben', 'vermischen', 
    'streichen', 'Backofen','vegetarisch', 'Minuten', 'geben', 'schneiden', 'hacken', 'gross', 'verarbeiten', 'anschließend', 'dann',
    'danach', 'rühren','mahlen', 'einen', 'alternative', 'verrühren', 'nicht', 'schnell', 'Mischung', 'rot', 'gelb', 'dazugeben',
    'falsch', 'Ofen', 'vorwärmen', 'erhitzen', 'kochen', 'köcheln', 'vorsichtig', 'Bedarf', 'gehackt', 'geschnitten', 'gemahlen', 'klein',
    'Serviervorschlag', 'Tasse', 'Zwischenzeit', 'Pack', 'Packung', 'Dose', 'Linkslauf', 'Stufe', 'für', 'Gläser', 'Glas', 'Teelöffel',
    'Löffel', 'Esslöffel', 'Prise', 'etwa', 'ca', 'circa', 'Backzeit', 'Backtemperatur', 'Umluft', 'Oberunterhitze', 'Zimmertemperatur',
    'Servieren', 'Serviertipp', 'optional', 'jeweils', 'beides', 'weiteren', 'weiteres', 'Zubereitungszeit', 'Portionen', 'Portion',
    'Personen', 'Person', 'Backform', 'Durchmesser', 'Hälfte', 'Hälften', 'verwenden', 'benötigt', 'benötigen', 'benötigst',
    'Schüssel',  'Pfanne', 'Topf', 'Mixer',  'Küchenmaschine',  'Zerkleinerer', 'fügen', 'hinzugefügt', 'möglichst',
    'Wasser', 'Öl', 'Butter', 'Salz', 'Pfeffer', 'Zucker', 'Mehl', 'Dosen', 'kcal', 'Kalorien', 'ein', 'zwei', 'drei', 'vier', 'fünf',
    'zehn', 'fünfzehn', 'zwanzig', 'hundert'
];


export function buildRegistry(files) {
    const registry = [];
    files.forEach(file => {
        const content = readFileContent(file);
        const stats = fs.lstatSync(file);
        const frontmatter = parseFrontmatter(content);

        const name = frontmatter.name || '';
        const categories = frontmatter.categories
            ? frontmatter.categories.split(',').map(c => c.trim()).filter(c => c)
            : [];
        const previewPath = frontmatter.preview ? resolvePath(frontmatter.preview, file, publicPath) : '';

        registry.push({
            name,
            'slug': normalizeText(name).replace(/([\W]+)/g, '-').substring(0, 30).toLowerCase(),
            'path': UrlRelativeFromPublic(file, publicPath, applicationBasePath, resolvePath),
            'preview': UrlRelativeFromPublic(previewPath, publicPath, applicationBasePath, resolvePath),
            'category': categories,
            'modified': stats.mtime,
        });
    });
    return registry;
}


const normalizedExcludes = normalizeTokens(excludeTokens.map(normalizeText), false);

function extractKeywordsWithFrequency(text, max = Infinity) {
    // Parse frontmatter to extract tags before stripping
    const frontmatter = parseFrontmatter(text);
    const tags = frontmatter.tags
        ? frontmatter.tags.split(',').map(t => t.trim()).filter(t => t)
        : [];

    // Remove frontmatter before any processing
    const content = stripFrontmatter(text);
    const normalizedText = normalizeText(content).replaceAll(markdownImageLink, '');
    const frequency = {};

    // Inject Recipe Name (use minLength=3 to include short but meaningful words like "cape")
    const recipeName = (content.match(/^#\s+(.*?)(?:\r\n?|\n)/gm).pop() || '').substring(1).trim();
    const recipeNameTokens = normalizeTokens(tokenizer.tokenize(normalizeText(recipeName)), false, 3)
        .filter(token => !normalizedExcludes.includes(token));

    recipeNameTokens.forEach(token => {
        frequency[token.toLowerCase()] = 10;
    });

    // Inject Tags from frontmatter
    tags.forEach(tag => {
        const normalizedTag = normalizeText(tag);
        const tagTokens = normalizeTokens(tokenizer.tokenize(normalizedTag))
            .filter(token => !normalizedExcludes.includes(token));

        tagTokens.forEach(token => {
            const lowerCaseToken = token.toLowerCase();
            // Give tags weight of 8 (slightly less than recipe name but higher than content)
            frequency[lowerCaseToken] = (frequency[lowerCaseToken] || 0) + 8;
        });
    });

    normalizeTokens(tokenizer.tokenize(normalizedText))
        .filter(token => !normalizedExcludes.includes(token))
        .forEach((token, idx) => {
            const lowerCaseToken = token.toLowerCase();
            const value = Math.ceil(lowerCaseToken.length * 0.25)
            if (frequency[lowerCaseToken]) {
                frequency[lowerCaseToken]+=value;
            } else {
                frequency[lowerCaseToken] = value  + Math.max(Math.ceil((20 - idx) / 5), 0);
            }
        });

    return Object.keys(frequency)
        .filter(k => frequency[k] > 1)
        .sort((a, b) => frequency[b] - frequency[a])
        .slice(0, max)
        .reduce(function (acc, key) {
            acc[key] = frequency[key];
            return acc;
        }, {});
}

export function buildIndex(files, maxKeywordsPerFile = Infinity) {
    const index = {};

    files.forEach(file => {
        const content = readFileContent(file).replaceAll(markdownImageLink, '');
        const keywordFrequency = extractKeywordsWithFrequency(content, maxKeywordsPerFile);
        index[UrlRelativeFromPublic(file, publicPath, applicationBasePath, resolvePath)] = keywordFrequency;
    });

    return index;
}

export function reverseIndex(index, skipSizeGreaterThan, maxKeywords) {
    const reverseIndex = {};
    const frequency = {};
    Object.keys(index)
        .forEach(file => {
            Object.keys(index[file]).forEach((idx, num) => {
                if (!reverseIndex[idx]) reverseIndex[idx] = [];
                reverseIndex[idx].push(file);

                if (!frequency[idx]) frequency[idx] = 0;
                frequency[idx] = Math.max(frequency[idx], Math.min(1, index[file][idx] / Math.ceil(num / 5)));
            });
        });

    return Object.keys(frequency)
        .filter( key => reverseIndex[key].length <= skipSizeGreaterThan )
        .sort((a, b) => frequency[b] - frequency[a])
        .slice(0, maxKeywords)
        .sort()
        .reduce( (res, key) => Object.assign(res, { [key]: reverseIndex[key] }), {} );
}

const fileList = getFilesFromDirectory(documentRootDirectory);
const registry = buildRegistry(fileList);
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));


const searchIndex = buildIndex(fileList, maxKeywordsPerFile);
const reverseSearchIndex = reverseIndex(searchIndex, Math.round(fileList.length * 0.8), maxKeywordsAverage * fileList.length);
fs.writeFileSync(indexPath, JSON.stringify(reverseSearchIndex, null, 2));
