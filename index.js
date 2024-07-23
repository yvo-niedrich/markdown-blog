import fs from 'fs';
import path from 'path';
import unorm from 'unorm';
import natural from 'natural';
import stopword from 'stopword';
import arg from 'arg';

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

	// Aliases
	'-v': '--verbose',
	'-m': '--maxKeywordsPerFile',
});



function resolvePath(p, from = null) {
    if (!p || p.startsWith('/')) {
        return p;
    }

    if (from === null) {
        from = publicPath || '.';
    }

    if (!fs.lstatSync(from).isDirectory()) {
        from = path.posix.dirname(from) + "/";
    }

    return path.posix.resolve(from, p);
}

const applicationBasePath = args['--base'] || '';
const publicPath = path.posix.resolve(args['--publicFolder'] || './public');
const documentRootDirectory = path.posix.resolve(publicPath, args['--documentPath'] || 'documents');
const indexPath = path.posix.resolve(publicPath, args['--indexFile'] || 'searchindex.json');
const registryPath = path.posix.resolve(publicPath, args['--registryFile'] || 'registry.json');
const maxKeywordsPerFile = args['--maxKeywordsPerFile'] || 30;

const excludeTokens = [
    'Zutaten', 'Anweisungen', 'Ingredients', 'Instructions', 'zugeben', 'hinzugeben', 'vermischen', 'streichen', 'Backofen',
    'vegetarisch', 'Minuten', 'geben', 'schneiden', 'hacken', 'gross', 'verarbeiten', 'anschließend', 'dann', 'danach', 'rühren',
    'mahlen', 'einen', 'alternative', 'verrühren', 'nicht', 'schnell', 'Mischung', 'rot', 'gelb', 'dazugeben',
];

const specialCharMap = {
    'ß': 'ss',
    'ä': 'ae',
    'ö': 'oe',
    'ü': 'ue',
    'Ä': 'Ae',
    'Ö': 'Oe',
    'Ü': 'Ue'
};

const tokenizer = new natural.AggressiveTokenizerDe();
const stemmer = (function() {
    function replaceSpecialChars(text) {
        const specialCharMap = {
            'ß': 'ss',
            'ä': 'ae',
            'ö': 'oe',
            'ü': 'ue',
            'Ä': 'Ae',
            'Ö': 'Oe',
            'Ü': 'Ue'
        };
        return text.replace(/[ßäöüÄÖÜ]/g, match => (specialCharMap[match]));
    }
    
    function step1(word) {
        const suffixes = ['ern', 'er', 'em', 'en', 'es', 'e'];
        for (const suffix of suffixes) {
            if (word.endsWith(suffix)) {
                return word.slice(0, -suffix.length);
            }
        }
        return word;
    }
    
    function step2(word) {
        const suffixes = ['nd', 'ig', 'isch', 'lich', 'heit', 'keit', 'ung'];
        for (const suffix of suffixes) {
            if (word.endsWith(suffix)) {
                return word.slice(0, -suffix.length);
            }
        }
        return word;
    }
    
    function step3(word) {
        if (word.endsWith('keit')) {
            word = word.slice(0, -4);
            if (word.endsWith('ig') || word.endsWith('lich')) {
                word = word.slice(0, -2);
            }
        } else if (word.endsWith('lich') || word.endsWith('heit')) {
            word = word.slice(0, -4);
        } else if (word.endsWith('ung')) {
            word = word.slice(0, -3);
        }
        return word;
    }
    
    return function stemmer(word) {
        word = replaceSpecialChars(word);
        word = word.toLowerCase();
        word = step1(word);
        word = step2(word);
        word = step3(word);
        return word;
    }
})();

function getFilesFromDirectory(directoryPath) {
    const files = [];

    fs.readdirSync(directoryPath)
        .forEach(function(p) {
            const fileName = path.join(directoryPath, p);
            if (fs.lstatSync(fileName).isDirectory()) {
                getFilesFromDirectory(directoryPath + '/' + p).forEach(f => files.push(f));
            } else if (path.extname(p) === '.md') {
                files.push(directoryPath + '/' + p)
            }
        });
    return files
        .sort((a, b) => fs.lstatSync(b).mtime.getTime() - fs.lstatSync(a).mtime.getTime());
}

function readFileContent(filePath) {
    return fs.readFileSync(filePath, 'utf-8').replace(/(?:\r\n|\r|\n)/g, "\n");;
}

function UrlRelativeFromPublic(filePath) {
    if (!filePath) return filePath;

    if(!filePath.startsWith('/')) {
        filePath = resolvePath(filePath);
    }

    if (filePath.indexOf(publicPath) >= 0) {
        filePath = filePath.slice(publicPath.length);
    }

    return (applicationBasePath + filePath).replaceAll(/(\/){2,}/g, '/');
}

const markdownImageLink = /\!\[(?:[^\]]*)\]\(([^\)]*)\)/gm;
function buildRegistry(files) {
    const registry = [];
    files.forEach(file => {
        const content = readFileContent(file);
        const stats = fs.lstatSync(file);
        const name = (content.match(/^#\s+(.*?)(?:\r\n?|\n)/gm).pop() || '')
            .substring(1)
            .trim();
        
        const previewImageMarkdown = content.match(markdownImageLink);
        const preview = resolvePath(previewImageMarkdown && previewImageMarkdown[0].split(/[\(\)]/)[1], file);

        registry.push({
            name,
            'slug': name.replace(/([\W]+)/g, '-').substring(0, 25).toLowerCase(),
            'path': UrlRelativeFromPublic(file),
            'preview': UrlRelativeFromPublic(preview),
            'category': file.substring(documentRootDirectory.length + 1).replace(/\/([^\/])+\.md/i, ''),
            'modified': stats.mtime,
        });
    });
    return registry;
}

function normalizeText(text) {
    text = text.replace(/[ßäöüÄÖÜ]/g, match => specialCharMap[match]);
    return unorm.nfkd(text).replace(/[\u0300-\u036f]/g, '');
}

function filterTokens(tokens) {
    tokens = stopword.removeStopwords(tokens, stopword.de)
    return tokens.filter(t => !/^\d/.test(t) && t.length > 4);
}

function normalizeTokens(tokens) {
    return tokens.map(token => stemmer(token));
}

const normalizedExcludes = normalizeTokens(excludeTokens.map(normalizeText));

function extractKeywords(text, max = Infinity) {
    const normalizedText = normalizeText(text).replaceAll(markdownImageLink, '');
    const tokens = tokenizer.tokenize(normalizedText);
    const filteredTokens = filterTokens(tokens);
    const normalizedTokens = normalizeTokens(filteredTokens);
    const frequency = {};
    normalizedTokens
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
        .slice(0, max);
}

function buildIndex(files, maxKeywordsPerFile = Infinity) {
    const index = {};

    files.forEach(file => {
        const content = readFileContent(file).replaceAll(markdownImageLink, '');
        const keywords = extractKeywords(content, maxKeywordsPerFile);
        index[UrlRelativeFromPublic(file)] = keywords;
    });

    return index;
}

function reverseIndex(index, skipSizeGreaterThan) {
    const reverseIndex = {};
    Object.keys(index)
        .forEach(file => {
            index[file].forEach(idx => {
                if (!reverseIndex[idx]) reverseIndex[idx] = [];
                reverseIndex[idx].push(file);
            });
        });

    return Object.keys(reverseIndex)
        .filter( key => reverseIndex[key].length <= skipSizeGreaterThan )
        .reduce( (res, key) => Object.assign(res, { [key]: reverseIndex[key] }), {} );
}

const fileList = getFilesFromDirectory(documentRootDirectory);
const registry = buildRegistry(fileList);
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));


const searchIndex = buildIndex(fileList, maxKeywordsPerFile);
const reverseSearchIndex = reverseIndex(searchIndex, Math.round(fileList.length * 0.8));
fs.writeFileSync(indexPath, JSON.stringify(reverseSearchIndex, null, 2));
