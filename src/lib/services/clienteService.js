import { supabase, isSupabaseConfigured } from '../supabase.js';
import { getLocalDatabase, saveLocalDatabase } from './mockData.js';

export async function listarClientes({ search = '', activo = '' } = {}) {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('clientes')
      .select('*, perfiles(nombre_usuario, rol)')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      const term = search.trim();
      query = query.or(`nombre.ilike.%${term}%,correo.ilike.%${term}%`);
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
  let list = [...db.clientes];

  if (search.trim()) {
    const s = search.toLowerCase();
    list = list.filter(c =>
      (c.nombre && c.nombre.toLowerCase().includes(s)) ||
      (c.correo && c.correo.toLowerCase().includes(s))
    );
  }

  if (activo !== '' && activo !== null) {
    const act = activo === true || activo === 'true';
    list = list.filter(c => c.activo === act);
  }

  return list;
}

export async function obtenerCliente(id) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*, perfiles(*)')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const c = db.clientes.find(item => item.id === id);
  if (!c) throw new Error('Cliente no encontrado');
  return c;
}

export async function crearCliente({ nombre, correo, perfil_id = null }) {
  if (!nombre?.trim()) throw new Error('El nombre del cliente es obligatorio.');
  if (!correo?.trim() || !correo.includes('@')) throw new Error('Ingrese un correo electrónico válido.');

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        perfil_id: perfil_id || null,
        activo: true
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Ya existe un cliente con este correo electrónico.');
      throw new Error(error.message);
    }
    return data;
  }

  const db = getLocalDatabase();
  if (db.clientes.some(c => c.correo.toLowerCase() === correo.trim().toLowerCase())) {
    throw new Error('Ya existe un cliente con este correo electrónico.');
  }

  const nuevo = {
    id: 'cli-' + Date.now(),
    nombre: nombre.trim(),
    correo: correo.trim().toLowerCase(),
    perfil_id: perfil_id || null,
    activo: true,
    created_at: new Date().toISOString()
  };

  db.clientes.unshift(nuevo);
  saveLocalDatabase(db);
  return nuevo;
}

export async function editarCliente(id, { nombre, correo, activo }) {
  if (!nombre?.trim()) throw new Error('El nombre del cliente es obligatorio.');
  if (!correo?.trim() || !correo.includes('@')) throw new Error('Ingrese un correo electrónico válido.');

  if (isSupabaseConfigured && supabase) {
    const updates = {
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase()
    };
    if (typeof activo === 'boolean') updates.activo = activo;

    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Ya existe otro cliente con este correo electrónico.');
      throw new Error(error.message);
    }
    return data;
  }

  const db = getLocalDatabase();
  const index = db.clientes.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Cliente no encontrado');

  const existeOtro = db.clientes.some(c => c.id !== id && c.correo.toLowerCase() === correo.trim().toLowerCase());
  if (existeOtro) throw new Error('Ya existe otro cliente con este correo electrónico.');

  db.clientes[index] = {
    ...db.clientes[index],
    nombre: nombre.trim(),
    correo: correo.trim().toLowerCase(),
    ...(typeof activo === 'boolean' ? { activo } : {})
  };
  saveLocalDatabase(db);
  return db.clientes[index];
}

export async function cambiarEstadoCliente(id, activo) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('clientes')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const index = db.clientes.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Cliente no encontrado');
  db.clientes[index].activo = activo;
  saveLocalDatabase(db);
  return db.clientes[index];
}

export async function obtenerVentasCliente(clienteId) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('ventas')
      .select('*, productos(nombre, precio, oferta)')
      .eq('id_cliente', clienteId)
      .order('fecha_hora', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  const db = getLocalDatabase();
  const ventas = db.ventas.filter(v => v.id_cliente === clienteId);
  return ventas.map(v => {
    const p = db.productos.find(prod => prod.id === v.id_producto);
    return {
      ...v,
      productos: p ? { nombre: p.nombre, precio: p.precio, oferta: p.oferta } : null
    };
  }).sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
}
