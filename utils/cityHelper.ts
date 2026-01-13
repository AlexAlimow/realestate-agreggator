export function normalizeCityName(city: string): string {
  const cityMap: Record<string, string> = {
    "munich": "muenchen",
    "cologne": "koeln",
    "nuremberg": "nuernberg",
    "hanover": "hannover",
    "vienna": "wien",
    "zurich": "zuerich",
    "geneva": "genf",
    "prague": "prag",
    // Add more if needed
  };

  let normalized = city.toLowerCase().trim();

  // Check map first
  if (cityMap[normalized]) {
    return cityMap[normalized];
  }

  // Replace umlauts
  normalized = normalized
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");

  // Replace spaces with dashes
  normalized = normalized.replace(/\s+/g, "-");

  return normalized;
}
