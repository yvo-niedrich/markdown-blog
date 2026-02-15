import {stemmer} from './stemmer';

const specialCharMap = {
    'ß': 'ss',
    'ä': 'ae',
    'ö': 'oe',
    'ü': 'ue',
    'Ä': 'Ae',
    'Ö': 'Oe',
    'Ü': 'Ue'
};

export function normalizeToken(token: string): string {
    token = token.replace(/[ßäöüÄÖÜ]/g, (match) => specialCharMap[match as keyof typeof specialCharMap]);
    return token;
    // return natural.PorterStemmerDe.stem(token.toLowerCase());
}

export function tokenize(query: string): string[] {
    return query.split(/\s+/g)
        .map(token => {
            // Unwrap: remove braces, quotes, and punctuation from beginning and end
            // This removes: () [] {} "" '' « » ‹ › „ " and common punctuation like : ; , . ! ?
            token = token.replace(/^[\(\[\{"""''«‹„:;,\.!\?]+|[\)\]\}"""''»›":;,\.!\?]+$/g, '');
            return token;
        })
        .map(stemmer);
}