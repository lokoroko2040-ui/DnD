export function pollinationsUrl(
  prompt: string,
  width: number = 800,
  height: number = 500,
  seed?: number
): string {
  const s = seed ?? Math.floor(Math.random() * 1000000);
  const fullPrompt = prompt + ', Baldur\'s Gate 3 dark fantasy digital painting, cinematic lighting, highly detailed, fantasy RPG art';
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&seed=${s}&nologo=true`;
}

export function pollinationsPortraitUrl(prompt: string, seed?: number): string {
  return pollinationsUrl(prompt, 400, 400, seed);
}

export function pollinationsItemUrl(prompt: string, seed?: number): string {
  return pollinationsUrl(prompt, 300, 300, seed);
}

export function pollinationsSceneUrl(prompt: string, seed?: number): string {
  return pollinationsUrl(prompt, 1200, 500, seed);
}
