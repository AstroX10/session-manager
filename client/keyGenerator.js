/**
 * Generate an access key in the format SESSION_XX_YY_ZZ, where XX, YY, and ZZ are random two-digit numbers.
 * @returns {string} Generated access key
 */
export const generateAccessKey = () => {
 const randomTwoDigit = () => Math.floor(10 + Math.random() * 90); // Generates a random two-digit number
 return `SESSION_${randomTwoDigit()}_${randomTwoDigit()}_${randomTwoDigit()}`;
};
