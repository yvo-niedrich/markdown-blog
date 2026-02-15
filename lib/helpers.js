import fs from 'fs';
import path from 'path';
import unorm from 'unorm';
import natural from 'natural';
import stopword from 'stopword';

// Regex used across modules
export const markdownImageLink = /\!\[(?:[^\]]*)\]\(([^\)]*)\)/gm;

export const specialCharMap = {
    'ß': 'ss',
    'ä': 'ae',
    'ö': 'oe',
    'ü': 'ue',
    'Ä': 'Ae',
    'Ö': 'Oe',
    'Ü': 'Ue'
};

export function resolvePath(p, from = null, publicPath = '.') {
    if (!p || p.startsWith('/')) {
        return p;
    }

    if (from === null) {
        from = publicPath || '.';
    }

    try {
        if (!fs.lstatSync(from).isDirectory()) {
            from = path.posix.dirname(from) + "/";
        }
    } catch (e) {
        // if from doesn't exist, leave as-is and let path.resolve decide
    }

    return path.posix.resolve(from, p);
}

export function getFilesFromDirectory(directoryPath) {
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

export function readFileContent(filePath) {
    return fs.readFileSync(filePath, 'utf-8').replace(/(?:\r\n|\r|\n)/g, "\n");;
}

export function UrlRelativeFromPublic(filePath, publicPath, applicationBasePath, resolvePathFn = resolvePath) {
    if (!filePath) return null;

    if(!filePath.startsWith('/')) {
        filePath = resolvePathFn(filePath, undefined, publicPath);
    }

    if (filePath.indexOf(publicPath) >= 0) {
        filePath = filePath.slice(publicPath.length);
    }

    return (applicationBasePath + filePath).replaceAll(/(\/){2,}/g, '/');
}

export function normalizeUmlauts(text) {
    return text.replace(/[ßäöüÄÖÜ]/g, match => specialCharMap[match]);
}

export function normalizeText(text) {
    return unorm.nfkd(normalizeUmlauts(text)).replace(/[\u0300-\u036f]/g, '');
}

/**
 * Strip YAML/TOML frontmatter from the start of a document.
 * Handles common delimiters: ---, +++, and ...
 */
export function stripFrontmatter(text) {
    if (!text) return text;
    return text.replace(/^\s*(?:---|\+\+\+)[\s\S]*?(?:---|\+\+\+|\.\.\.)\s*/, '');
}

/**
 * Parse YAML frontmatter from markdown content.
 * Returns an object with frontmatter fields or empty object if no frontmatter found.
 */
export function parseFrontmatter(text) {
    if (!text) return {};

    const match = text.match(/^\s*---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) return {};

    const frontmatterText = match[1];
    const result = {};

    // Parse simple YAML key: value pairs
    const lines = frontmatterText.split('\n');
    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            if (key) {
                result[key] = value;
            }
        }
    });

    return result;
}

// German tokenizer and a simple stemmer utility used for normalization
export const tokenizer = new natural.AggressiveTokenizerDe();

export const stemmer = (function() {
    // Food/ingredient terms that should not be stemmed
    const STEMMING_EXCEPTIONS = [
        'chicoree',
    ];

    function replaceSpecialChars(text) {
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

        // Check if word is in exception list
        if (STEMMING_EXCEPTIONS.includes(word)) {
            return word;
        }

        word = step1(word);
        word = step2(word);
        word = step3(word);
        return word;
    }
})();

export function normalizeTokens(tokens, filter = true, minLength = 5) {
    const cleaned = tokens.map(token => {
        // First trim whitespace
        token = token.trim();

        // Unwrap: remove braces, quotes, and punctuation from beginning and end
        // This removes: () [] {} "" '' « » ‹ › „ " and common punctuation like : ; , . ! ?
        token = token.replace(/^[\(\[\{"""''«‹„:;,_\.!\?]+|[\)\]\}"""''»›":;,_\.!\?]+$/g, '');

        // Remove trailing suffixes like (n), (s), (e) and trailing hyphens
        token = token.replace(/\([nse]\)$/, '').replace(/-+$/, '');

        return token;
    });

    return (filter ? stopword.removeStopwords(cleaned, stopword.de) : cleaned)
        .filter(t => !/^\d/.test(t) && t.length >= minLength)
        .map(token => stemmer(token));
}
