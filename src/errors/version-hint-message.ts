export function versionErrorHintMessage(
  message: string,
  method: string,
): string {
  return `${message}\nHint: It might not be working because maybe you're not up to date with the Meilisearch version that ${method} call requires.`;
}
