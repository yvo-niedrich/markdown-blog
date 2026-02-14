function replaceSpecialChars(text: string): string {
    const specialCharMap = {
        'ß': 'ss',
        'ä': 'ae',
        'ö': 'oe',
        'ü': 'ue',
        'Ä': 'Ae',
        'Ö': 'Oe',
        'Ü': 'Ue'
    };
    return text.replace(/[ßäöüÄÖÜ]/g, match => (specialCharMap[match as keyof typeof specialCharMap]));
}

function step1(word: string): string {
    const suffixes = ['ern', 'er', 'em', 'en', 'es', 'e'];
    for (const suffix of suffixes) {
        if (word.endsWith(suffix)) {
            return word.slice(0, -suffix.length);
        }
    }
    return word;
}

function step2(word: string): string {
    const suffixes = ['nd', 'ig', 'isch', 'lich', 'heit', 'keit', 'ung'];
    for (const suffix of suffixes) {
        if (word.endsWith(suffix)) {
            return word.slice(0, -suffix.length);
        }
    }
    return word;
}

function step3(word: string): string {
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

export function stemmer(word: string): string {
    word = replaceSpecialChars(word);
    word = word.toLowerCase();

    word = step1(word);
    word = step2(word);
    word = step3(word);
    return word;
}
