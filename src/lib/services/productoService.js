import { supabase, isSupabaseConfigured } from '../supabase.js';
import { getLocalDatabase, saveLocalDatabase } from './mockData.js';

export function calcularPrecioFinal(precio, oferta = 0) {
  const p = Number(precio) || 0;
  const o = Number(oferta) || 0;
  if (o <= 0) return p;
  const finalPrice = p * (1 - o / 100);
  return Math.round(finalPrice * 100) / 100;
}

export async function listarProductos({ search = '', id_tienda = '', activo = '' } = {}) {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('productos')
      .select('*, tiendas(nombre)')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      const term = search.trim();
      query = query.or(`nombre.ilike.%${term}%,descripcion.ilike.%${term}%`);
    }

    if (id_tienda) {
      query = query.eq('id_tienda', id_tienda);
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
  let list = db.productos.map(p => {
    const t = db.tiendas.find(tie => tie.id === p.id_tienda);
    return {
      ...p,
      tiendas: t ? { nombre: t.nombre } : null
    };
  });

  if (search.trim()) {
    const s = search.toLowerCase();
    list = list.filter(p =>
      (p.nombre && p.nombre.toLowerCase().includes(s)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(s))
    );
  }

  if (id_tienda) {
    list = list.filter(p => p.id_tienda === id_tienda);
  }

  if (activo !== '' && activo !== null) {
    const act = activo === true || activo === 'true';
    list = list.filter(p => p.activo === act);
  }

  return list;
}

export async function obtenerProducto(id) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('productos')
      .select('*, tiendas(*)')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const p = db.productos.find(item => item.id === id);
  if (!p) throw new Error('Producto no encontrado');
  return p;
}

export async function crearProducto({ nombre, descripcion = '', precio, oferta = 0, id_tienda }) {
  if (!nombre?.trim()) throw new Error('El nombre del producto es obligatorio.');
  
  const numPrecio = Number(precio);
  if (isNaN(numPrecio) || numPrecio < 0) {
    throw new Error('El precio debe ser un número mayor o igual a cero.');
  }

  const numOferta = Number(oferta);
  if (isNaN(numOferta) || numOferta < 0 || numOferta > 100) {
    throw new Error('La oferta o descuento debe ser un porcentaje entre 0 y 100.');
  }

  if (!id_tienda) {
    throw new Error('Debe seleccionar una tienda para el producto.');
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('productos')
      .insert([{
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        precio: numPrecio,
        oferta: numOferta,
        id_tienda: id_tienda,
        activo: true
      }])
      .select('*, tiendas(nombre)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const nuevo = {
    id: 'prod-' + Date.now(),
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || '',
    precio: numPrecio,
    oferta: numOferta,
    id_tienda: id_tienda,
    activo: true,
    created_at: new Date().toISOString()
  };

  db.productos.unshift(nuevo);
  saveLocalDatabase(db);
  const t = db.tiendas.find(tie => tie.id === id_tienda);
  return { ...nuevo, tiendas: t ? { nombre: t.nombre } : null };
}

export async function editarProducto(id, { nombre, descripcion, precio, oferta, id_tienda, activo }) {
  if (!nombre?.trim()) throw new Error('El nombre del producto es obligatorio.');

  const numPrecio = Number(precio);
  if (isNaN(numPrecio) || numPrecio < 0) {
    throw new Error('El precio debe ser un número mayor o igual a cero.');
  }

  const numOferta = Number(oferta);
  if (isNaN(numOferta) || numOferta < 0 || numOferta > 100) {
    throw new Error('La oferta debe ser un porcentaje entre 0 y 100.');
  }

  if (!id_tienda) {
    throw new Error('Debe seleccionar una tienda.');
  }

  if (isSupabaseConfigured && supabase) {
    const updates = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      precio: numPrecio,
      oferta: numOferta,
      id_tienda: id_tienda
    };
    if (typeof activo === 'boolean') updates.activo = activo;

    const { data, error } = await supabase
      .from('productos')
      .update(updates)
      .eq('id', id)
      .select('*, tiendas(nombre)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const index = db.productos.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Producto no encontrado');

  db.productos[index] = {
    ...db.productos[index],
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || '',
    precio: numPrecio,
    oferta: numOferta,
    id_tienda: id_tienda,
    ...(typeof activo === 'boolean' ? { activo } : {})
  };
  saveLocalDatabase(db);
  const t = db.tiendas.find(tie => tie.id === id_tienda);
  return { ...db.productos[index], tiendas: t ? { nombre: t.nombre } : null };
}

export async function cambiarEstadoProducto(id, activo) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('productos')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const index = db.productos.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Producto no encontrado');
  db.productos[index].activo = activo;
  saveLocalDatabase(db);
  return db.productos[index];
}
