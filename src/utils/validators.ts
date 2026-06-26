/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, uppercase, lowercase, number, special char
 */
export function validatePassword(password: string): boolean {
  if (password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

/**
 * Validate amount is positive and has max 2 decimal places
 */
export function validateAmount(amount: number | string): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num) || !isFinite(num)) return false;
  if (num <= 0) return false;
  
  // Check max 2 decimal places
  const decimals = (num.toString().split('.')[1] || '').length;
  return decimals <= 2;
}

/**
 * Validate date format and optionally check if future
 */
export function validateDate(
  date: string | Date,
  options: { allowFuture?: boolean } = {}
): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return false;
  
  if (!options.allowFuture) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj > today) return false;
  }
  
  return true;
}