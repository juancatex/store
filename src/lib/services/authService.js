import { supabase, isSupabaseConfigured } from '../supabase.js';
import { getLocalDatabase } from './mockData.js';

let currentUser = null;
let currentProfile = null;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn({ user: currentUser, profile: currentProfile }));
}

export function subscribeAuth(callback) {
  listeners.add(callback);
  callback({ user: currentUser, profile: currentProfile });
  return () => listeners.delete(callback);
}

// Inicializar estado de autenticación al cargar la aplicación
export async function initAuth() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        currentUser = session.user;
        const profile = await cargarPerfilUsuario(session.user.id);
        if (profile && profile.activo) {
          currentProfile = profile;
        } else {
          await supabase.auth.signOut();
          currentUser = null;
          currentProfile = null;
        }
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          currentUser = session.user;
          const profile = await cargarPerfilUsuario(session.user.id);
          if (profile && profile.activo) {
            currentProfile = profile;
          } else {
            currentUser = null;
            currentProfile = null;
          }
        } else {
          currentUser = null;
          currentProfile = null;
        }
        notifyListeners();
      });
    } catch (err) {
      console.warn('Error inicializando sesión con Supabase:', err);
    }
  } else {
    // Modo demostración: recuperar sesión local si existe
    try {
      const saved = localStorage.getItem('tienda_demo_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        currentUser = parsed.user;
        currentProfile = parsed.profile;
      }
    } catch (e) {}
  }
  notifyListeners();
}

async function cargarPerfilUsuario(userId) {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error cargando perfil:', error);
    return null;
  }
  return data;
}

export async function login(identificador, contrasena) {
  const input = identificador ? identificador.trim() : '';
  if (!input) {
    throw new Error('Ingrese su usuario o correo electrónico.');
  }
  if (!contrasena) {
    throw new Error('Ingrese su contraseña.');
  }

  // --- MODO SUPABASE REAL ---
  if (isSupabaseConfigured && supabase) {
    let emailToAuth = input;

    // Si no contiene '@', es un nombre de usuario: resolver a correo
    if (!input.includes('@')) {
      // 1. Intentar por RPC obtener_correo_por_usuario
      const { data: emailRpc, error: rpcErr } = await supabase.rpc('obtener_correo_por_usuario', {
        p_nombre_usuario: input
      });

      if (!rpcErr && emailRpc) {
        emailToAuth = emailRpc;
      } else {
        // Fallback: consulta directa a perfiles
        const { data: perfilData } = await supabase
          .from('perfiles')
          .select('correo')
          .ilike('nombre_usuario', input)
          .single();

        if (perfilData?.correo) {
          emailToAuth = perfilData.correo;
        } else {
          throw new Error('El nombre de usuario especificado no existe o está inactivo.');
        }
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToAuth,
      password: contrasena
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Credenciales incorrectas. Verifique su usuario/correo y contraseña.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('El correo electrónico no ha sido confirmado. Ejecute en Supabase SQL Editor: UPDATE auth.users SET email_confirmed_at = now();');
      }
      throw new Error(error.message);
    }

    const profile = await cargarPerfilUsuario(data.user.id);
    if (!profile) {
      throw new Error('No se encontró el perfil asociado a esta cuenta.');
    }
    if (!profile.activo) {
      await supabase.auth.signOut();
      throw new Error('Su cuenta ha sido desactivada por el administrador.');
    }

    currentUser = data.user;
    currentProfile = profile;
    notifyListeners();
    return { user: currentUser, profile: currentProfile };
  }

  // --- MODO DEMOSTRACIÓN (Cuando no se ha configurado .env) ---
  const db = getLocalDatabase();
  const lower = input.toLowerCase();
  const perfil = db.perfiles.find(p => 
    p.correo.toLowerCase() === lower || 
    p.nombre_usuario.toLowerCase() === lower
  );

  if (!perfil) {
    throw new Error('Usuario o correo no encontrado en el sistema demo.');
  }

  if (!perfil.activo) {
    throw new Error('Esta cuenta ha sido desactivada.');
  }

  // En demo permitimos entrar con cualquier clave de más de 3 caracteres
  if (contrasena.length < 3) {
    throw new Error('La contraseña debe tener al menos 3 caracteres.');
  }

  currentUser = { id: perfil.id, email: perfil.correo };
  currentProfile = perfil;
  try {
    localStorage.setItem('tienda_demo_auth', JSON.stringify({ user: currentUser, profile: currentProfile }));
  } catch (e) {}
  notifyListeners();
  return { user: currentUser, profile: currentProfile };
}

export async function logout() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  } else {
    try {
      localStorage.removeItem('tienda_demo_auth');
    } catch (e) {}
  }
  currentUser = null;
  currentProfile = null;
  notifyListeners();
}

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentProfile() {
  return currentProfile;
}

export function isAdmin() {
  return currentProfile?.rol === 'administrador' && currentProfile?.activo === true;
}
