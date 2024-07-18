export default function (path: string, ref: string) {

    if (ref && !ref.endsWith('/')) {
        ref = ref + '/';
    }

    if (!path.startsWith('/')) {
        path = ref + path;
    }
    
    path = path.replace(/(\/){2,}/g, '/').replace(/\/\.\//g, '/');

    const arr = path.split('/');
    let i = 0
    while (i < arr.length) {
        if (arr[i] !== '..') {
            i++;
            continue;
        }

        if (i === 0) {
            arr.splice(0, 1);
            continue;
        }

        arr.splice(i-1, 2);
        i--;
    }
    return arr.join('/');
};