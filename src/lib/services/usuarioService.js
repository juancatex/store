import { supabase, isSupabaseConfigured } from '../supabase.js';
import { getLocalDatabase, saveLocalDatabase } from './mockData.js';

export async function listarUsuarios({ search = '', rol = '', activo = '' } = {}) {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      const term = search.trim();
      query = query.or(`nombre_completo.ilike.%${term}%,nombre_usuario.ilike.%${term}%,correo.ilike.%${term}%`);
    }

    if (rol) {
      query = query.eq('rol', rol);
    }

    if (activo !== '' && activo !== null) {
      query = query.eq('activo', activo === true || activo === 'true');
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  // Modo demostración
  const db = getLocalDatabase();
  let list = [...db.perfiles];

  if (search.trim()) {
    const s = search.toLowerCase();
    list = list.filter(u =>
      (u.nombre_completo && u.nombre_completo.toLowerCase().includes(s)) ||
      (u.nombre_usuario && u.nombre_usuario.toLowerCase().includes(s)) ||
      (u.correo && u.correo.toLowerCase().includes(s))
    );
  }

  if (rol) {
    list = list.filter(u => u.rol === rol);
  }

  if (activo !== '' && activo !== null) {
    const act = activo === true || activo === 'true';
    list = list.filter(u => u.activo === act);
  }

  return list;
}

export async function obtenerUsuario(id) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const u = db.perfiles.find(item => item.id === id);
  if (!u) throw new Error('Usuario no encontrado');
  return u;
}

export async function crearUsuario({ nombre_usuario, nombre_completo, correo, password, rol }) {
  if (!nombre_usuario?.trim()) throw new Error('El nombre de usuario es obligatorio.');
  if (!nombre_completo?.trim()) throw new Error('El nombre completo es obligatorio.');
  if (!correo?.trim()) throw new Error('El correo electrónico es obligatorio.');
  if (!password || password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
  if (!['administrador', 'cliente'].includes(rol)) throw new Error('Rol no válido.');

  if (isSupabaseConfigured && supabase) {
    // Registro mediante Supabase Auth con metadata que el trigger SQL captura para crear el perfil
    const { data, error } = await supabase.auth.signUp({
      email: correo.trim(),
      password: password,
      options: {
        data: {
          nombre_usuario: nombre_usuario.trim(),
          nombre_completo: nombre_completo.trim(),
          rol: rol
        }
      }
    });

    if (error) throw new Error(error.message);
    return data.user;
  }

  // Demo
  const db = getLocalDatabase();
  if (db.perfiles.some(u => u.correo.toLowerCase() === correo.toLowerCase())) {
    throw new Error('Ya existe un usuario con este correo electrónico.');
  }
  if (db.perfiles.some(u => u.nombre_usuario.toLowerCase() === nombre_usuario.toLowerCase())) {
    throw new Error('Ya existe un usuario con este nombre de usuario.');
  }

  const nuevo = {
    id: 'usr-' + Date.now(),
    nombre_usuario: nombre_usuario.trim(),
    nombre_completo: nombre_completo.trim(),
    correo: correo.trim(),
    rol: rol,
    activo: true,
    created_at: new Date().toISOString()
  };

  db.perfiles.unshift(nuevo);
  saveLocalDatabase(db);
  return nuevo;
}

export async function editarUsuario(id, { nombre_completo, rol, activo }) {
  if (isSupabaseConfigured && supabase) {
    const updates = { nombre_completo };
    if (rol) updates.rol = rol;
    if (typeof activo === 'boolean') updates.activo = activo;

    const { data, error } = await supabase
      .from('perfiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const index = db.perfiles.findIndex(u => u.id === id);
  if (index === -1) throw new Error('Usuario no encontrado');

  db.perfiles[index] = {
    ...db.perfiles[index],
    nombre_completo,
    ...(rol ? { rol } : {}),
    ...(typeof activo === 'boolean' ? { activo } : {})
  };
  saveLocalDatabase(db);
  return db.perfiles[index];
}

export async function cambiarEstadoUsuario(id, activo) {
  return editarUsuario(id, { activo });
}
