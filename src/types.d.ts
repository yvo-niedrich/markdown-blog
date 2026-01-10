declare const __APP_VERSION__: string;
declare const __APP_URL__: string;
declare const __APP_REPO__: string;


type RecipeRegistryRecord = {
    name: string;
    slug: string;
    preview: ?string;
    path: string;
    category: string;
    modified: Date;
    index: number;
};

type Registry = { [key: string]: RecipeRegistryRecord };

type SearchIndex = { [index: string]: string[] };