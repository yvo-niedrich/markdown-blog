import {nextTick} from 'vue';

export default function(title: string) {
    nextTick(() => {
        document.title = title.substring(0, 30) + " :: " + "Rezepte";
    });
}