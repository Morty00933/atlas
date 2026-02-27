const TRANSLIT_MAP = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo',
  'ж':'zh','з':'z','и':'i','й':'j','к':'k','л':'l','м':'m',
  'н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u',
  'ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch',
  'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
};

export function transliterate(text) {
  return text.toLowerCase()
    .split('').map(c => TRANSLIT_MAP[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function isExpired(expiresAt) {
  if (!expiresAt) return false;
  const d = expiresAt instanceof Date ? expiresAt : expiresAt.toDate?.() || new Date(expiresAt);
  return d < new Date();
}
