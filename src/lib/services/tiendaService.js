import { supabase, isSupabaseConfigured } from '../supabase.js';
import { getLocalDatabase, saveLocalDatabase } from './mockData.js';

export async function listarTiendas({ search = '', activo = '' } = {}) {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('tiendas')
      .select('*, perfiles(nombre_completo, correo, nombre_usuario)')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      const term = search.trim();
      query = query.or(`nombre.ilike.%${term}%,descripcion.ilike.%${term}%`);
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
  let list = db.tiendas.map(t => {
    const user = db.perfiles.find(u => u.id === t.id_usuario);
    return {
      ...t,
      perfiles: user ? { nombre_completo: user.nombre_completo, correo: user.correo, nombre_usuario: user.nombre_usuario } : null
    };
  });

  if (search.trim()) {
    const s = search.toLowerCase();
    list = list.filter(t =>
      (t.nombre && t.nombre.toLowerCase().includes(s)) ||
      (t.descripcion && t.descripcion.toLowerCase().includes(s))
    );
  }

  if (activo !== '' && activo !== null) {
    const act = activo === true || activo === 'true';
    list = list.filter(t => t.activo === act);
  }

  return list;
}

export async function obtenerTienda(id) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tiendas')
      .select('*, perfiles(*)')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const t = db.tiendas.find(item => item.id === id);
  if (!t) throw new Error('Tienda no encontrada');
  return t;
}

export async function crearTienda({ nombre, descripcion = '', id_usuario = null }) {
  if (!nombre?.trim()) throw new Error('El nombre de la tienda es obligatorio.');

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tiendas')
      .insert([{
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        id_usuario: id_usuario || null,
        activo: true
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const nueva = {
    id: 'tie-' + Date.now(),
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || '',
    id_usuario: id_usuario || null,
    activo: true,
    created_at: new Date().toISOString()
  };

  db.tiendas.unshift(nueva);
  saveLocalDatabase(db);
  return nueva;
}

export async function editarTienda(id, { nombre, descripcion, id_usuario, activo }) {
  if (!nombre?.trim()) throw new Error('El nombre de la tienda es obligatorio.');

  if (isSupabaseConfigured && supabase) {
    const updates = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      id_usuario: id_usuario || null
    };
    if (typeof activo === 'boolean') updates.activo = activo;

    const { data, error } = await supabase
      .from('tiendas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const index = db.tiendas.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Tienda no encontrada');

  db.tiendas[index] = {
    ...db.tiendas[index],
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || '',
    id_usuario: id_usuario || null,
    ...(typeof activo === 'boolean' ? { activo } : {})
  };
  saveLocalDatabase(db);
  return db.tiendas[index];
}

export async function cambiarEstadoTienda(id, activo) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tiendas')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const index = db.tiendas.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Tienda no encontrada');
  db.tiendas[index].activo = activo;
  saveLocalDatabase(db);
  return db.tiendas[index];
}

export async function obtenerProductosDeTienda(tiendaId) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id_tienda', tiendaId)
      .order('nombre');
    if (error) throw new Error(error.message);
    return data || [];
  }

  const db = getLocalDatabase();
  return db.productos.filter(p => p.id_tienda === tiendaId);
}
