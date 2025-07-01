export function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""

  // Generate 4 groups of 4 characters each
  for (let group = 0; group < 4; group++) {
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (group < 3) result += "-";
  }

  return result
}
