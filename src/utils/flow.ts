export function throw_if(condition: boolean, message: string): asserts condition is true {
    if (condition) {
        throw new Error(message);
    }
}