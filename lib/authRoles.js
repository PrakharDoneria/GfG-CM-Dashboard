const ADMIN_EMAILS = new Set([
  'prakhar.btech2024@ieccollege.com',
]);

export const isAdminEmail = (email = '') => {
  const normalizedEmail = String(email).trim().toLowerCase();
  return ADMIN_EMAILS.has(normalizedEmail) || normalizedEmail.endsWith('@geeksforgeeks.org');
};