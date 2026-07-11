// Optional cloud sync + accounts, backed by Supabase.
//
// Requires SUPABASE_URL and SUPABASE_ANON_KEY in .env (see .env.example) and
// the schema in supabase/schema.sql applied to your Supabase project. Without
// those, the app still works fully offline - sign-in/sync just report a
// friendly "not configured" error instead of crashing.
const { safeStorage } = require('electron');

function registerSyncFeature({ ipcMain, getNotesConfig, saveConfig, getWindow }) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  let supabase = null;
  let createClientFn = null;

  try {
    // Lazy require so the app doesn't crash if the dependency hasn't been installed yet.
    ({ createClient: createClientFn } = require('@supabase/supabase-js'));
  } catch {
    createClientFn = null;
  }

  if (url && anonKey && createClientFn) {
    supabase = createClientFn(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  function requireClient() {
    if (!supabase) {
      throw new Error('Cloud sync is not set up yet. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env (see .env.example) and restart the app.');
    }
    return supabase;
  }

  function encode(json) {
    const buffer = Buffer.from(json, 'utf8');
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.encryptString(json).toString('base64');
    }
    return buffer.toString('base64');
  }

  function decode(encoded) {
    const buffer = Buffer.from(encoded, 'base64');
    if (safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(buffer);
      } catch {
        return null;
      }
    }
    return buffer.toString('utf8');
  }

  function getStoredSession() {
    const config = getNotesConfig();
    const encoded = config.global?.account?.session;
    if (!encoded) return null;
    const json = decode(encoded);
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function storeSession(session) {
    const config = getNotesConfig();
    config.global = config.global || {};
    if (!session) {
      delete config.global.account;
    } else {
      config.global.account = {
        session: encode(JSON.stringify(session)),
        email: session.user?.email,
        lastSyncedAt: config.global.account?.lastSyncedAt || null
      };
    }
    saveConfig();
  }

  ipcMain.handle('account:sign-up', async (_event, email, password) => {
    try {
      const client = requireClient();
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (data.session) storeSession(data.session);
      return { ok: true, needsEmailConfirmation: !data.session };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('account:sign-in', async (_event, email, password) => {
    try {
      const client = requireClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      storeSession(data.session);
      return { ok: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('account:sign-out', async () => {
    storeSession(null);
    return { ok: true };
  });

  ipcMain.handle('account:get-session', async () => {
    const session = getStoredSession();
    if (!session) return null;
    const config = getNotesConfig();
    return { email: session.user?.email, lastSyncedAt: config.global?.account?.lastSyncedAt || null };
  });

  ipcMain.handle('account:sync-now', async () => {
    try {
      const client = requireClient();
      const session = getStoredSession();
      if (!session) return { error: 'Not signed in.' };

      const { error: sessionError } = await client.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      if (sessionError) return { error: sessionError.message };

      const userId = session.user.id;
      const config = getNotesConfig();

      const { data: remoteNotes, error: fetchError } = await client
        .from('notes')
        .select('*')
        .eq('user_id', userId);
      if (fetchError) return { error: fetchError.message };

      const remoteById = new Map((remoteNotes || []).map(n => [n.client_note_id, n]));

      // Push local notes that are newer than (or missing from) the remote copy.
      const upserts = [];
      config.notes.forEach(localNote => {
        const remote = remoteById.get(localNote.id);
        const localUpdatedAt = localNote.updatedAt || 0;
        const remoteUpdatedAt = remote ? new Date(remote.updated_at).getTime() : -1;
        if (!localNote.locked && localUpdatedAt > remoteUpdatedAt) {
          upserts.push({
            user_id: userId,
            client_note_id: localNote.id,
            note_text: localNote.noteText || '',
            tags: localNote.tags || [],
            color: localNote.color,
            visual_style: localNote.visualStyle,
            updated_at: new Date(localUpdatedAt || Date.now()).toISOString(),
            deleted: false
          });
        }
      });
      if (upserts.length) {
        const { error: upsertError } = await client
          .from('notes')
          .upsert(upserts, { onConflict: 'user_id,client_note_id' });
        if (upsertError) return { error: upsertError.message };
      }

      // Pull remote notes that are newer than the local copy.
      let pulled = 0;
      (remoteNotes || []).forEach(remote => {
        const local = config.notes.find(n => n.id === remote.client_note_id);
        const remoteUpdatedAt = new Date(remote.updated_at).getTime();
        if (local && !local.locked && remoteUpdatedAt > (local.updatedAt || 0)) {
          local.noteText = remote.note_text || '';
          local.tags = remote.tags || [];
          local.color = remote.color || local.color;
          local.visualStyle = remote.visual_style || local.visualStyle;
          local.updatedAt = remoteUpdatedAt;
          pulled += 1;
          const win = getWindow && getWindow(local.id);
          if (win && !win.isDestroyed()) {
            win.webContents.send('note-updated-externally', {
              noteText: local.noteText,
              tags: local.tags
            });
          }
        }
      });

      config.global = config.global || {};
      config.global.account = { ...(config.global.account || {}), lastSyncedAt: Date.now() };
      saveConfig();
      return { ok: true, pushed: upserts.length, pulled };
    } catch (err) {
      return { error: err.message };
    }
  });
}

module.exports = { registerSyncFeature };
