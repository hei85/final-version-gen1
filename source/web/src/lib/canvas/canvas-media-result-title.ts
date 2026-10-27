export function mediaResultTitle(existingTitle: string | undefined, prompt: string, fallback: string, inPlace: boolean) {
    return (inPlace && existingTitle?.trim() ? existingTitle : undefined) || prompt.slice(0,32) || fallback;
}
