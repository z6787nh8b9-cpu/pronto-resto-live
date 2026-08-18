export function passwordPolicyError(password: string) {
  if (password.length < 12) return "Le mot de passe doit contenir au moins 12 caractères.";
  if (!/[a-z]/.test(password)) return "Le mot de passe doit contenir une minuscule.";
  if (!/[A-Z]/.test(password)) return "Le mot de passe doit contenir une majuscule.";
  if (!/\d/.test(password)) return "Le mot de passe doit contenir un chiffre.";
  return null;
}
