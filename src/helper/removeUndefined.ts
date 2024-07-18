export default function<T> (item: T | undefined): item is T {
    return !!item;
}