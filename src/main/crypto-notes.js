// Per-note passphrase lock. AES-256-GCM with a PBKDF2-derived key.
// The passphrase itself is never stored anywhere - only the salt, iv, auth tag
// and ciphertext are persisted, so losing the passphrase means losing the note.
const crypto = require('node:crypto');

const PBKDF2_ITERATIONS = 210000;
const KEY_LENGTH = 32; // 256-bit key for aes-256-gcm

function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(String(passphrase), salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts plaintext note content with a user-supplied passphrase.
 * Returns the fields that should be merged into the note's config object.
 */
function lockNote(passphrase, plaintext) {
  if (!passphrase) throw new Error('A passphrase is required to lock a note.');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext || ''), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    locked: true,
    lockSalt: salt.toString('base64'),
    lockIv: iv.toString('base64'),
    lockAuthTag: authTag.toString('base64'),
    lockCiphertext: ciphertext.toString('base64'),
    noteText: ''
  };
}

/**
 * Decrypts a locked note's content given the note config and a passphrase attempt.
 * Throws Error('not-locked') or Error('bad-passphrase') on failure.
 */
function unlockNote(noteConfig, passphrase) {
  if (!noteConfig || !noteConfig.lockSalt || !noteConfig.lockIv || !noteConfig.lockAuthTag || !noteConfig.lockCiphertext) {
    throw new Error('not-locked');
  }
  const salt = Buffer.from(noteConfig.lockSalt, 'base64');
  const iv = Buffer.from(noteConfig.lockIv, 'base64');
  const authTag = Buffer.from(noteConfig.lockAuthTag, 'base64');
  const ciphertext = Buffer.from(noteConfig.lockCiphertext, 'base64');
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new Error('bad-passphrase');
  }
}

module.exports = { lockNote, unlockNote };
