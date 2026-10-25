import { supabase, isSupabaseConfigured } from '../supabase.js';
import { getLocalDatabase, saveLocalDatabase } from './mockData.js';
import { calcularPrecioFinal } from './productoService.js';

export async function listarVentas({ clienteId = '', search = '', fechaInicio = '', fechaFin = '', estado = '' } = {}) {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('ventas')
      .select(`
        *,
        clientes (id, nombre, correo),
        productos (id, nombre, precio, oferta, tiendas(nombre))
      `)
      .order('fecha_hora', { ascending: false });

    if (clienteId) {
      query = query.eq('id_cliente', clienteId);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (fechaInicio) {
      query = query.gte('fecha_hora', `${fechaInicio}T00:00:00`);
    }

    if (fechaFin) {
      query = query.lte('fecha_hora', `${fechaFin}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let list = data || [];
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(v =>
        v.clientes?.nombre?.toLowerCase().includes(term) ||
        v.clientes?.correo?.toLowerCase().includes(term) ||
        v.productos?.nombre?.toLowerCase().includes(term)
      );
    }

    return list;
  }

  // Modo demostración
  const db = getLocalDatabase();
  let list = db.ventas.map(v => {
    const cli = db.clientes.find(c => c.id === v.id_cliente);
    const prod = db.productos.find(p => p.id === v.id_producto);
    const tie = prod ? db.tiendas.find(t => t.id === prod.id_tienda) : null;
    return {
      ...v,
      clientes: cli ? { id: cli.id, nombre: cli.nombre, correo: cli.correo } : null,
      productos: prod ? { id: prod.id, nombre: prod.nombre, precio: prod.precio, oferta: prod.oferta, tiendas: tie ? { nombre: tie.nombre } : null } : null
    };
  });

  if (clienteId) {
    list = list.filter(v => v.id_cliente === clienteId);
  }

  if (estado) {
    list = list.filter(v => v.estado === estado);
  }

  if (fechaInicio) {
    const fIni = new Date(`${fechaInicio}T00:00:00`).getTime();
    list = list.filter(v => new Date(v.fecha_hora).getTime() >= fIni);
  }

  if (fechaFin) {
    const fFin = new Date(`${fechaFin}T23:59:59`).getTime();
    list = list.filter(v => new Date(v.fecha_hora).getTime() <= fFin);
  }

  if (search.trim()) {
    const term = search.trim().toLowerCase();
    list = list.filter(v =>
      v.clientes?.nombre?.toLowerCase().includes(term) ||
      v.clientes?.correo?.toLowerCase().includes(term) ||
      v.productos?.nombre?.toLowerCase().includes(term)
    );
  }

  return list.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
}

export async function registrarVenta({ id_cliente, id_producto, cantidad }) {
  if (!id_cliente) throw new Error('Debe seleccionar un cliente.');
  if (!id_producto) throw new Error('Debe seleccionar un producto.');
  
  const cant = parseInt(cantidad, 10);
  if (isNaN(cant) || cant <= 0) {
    throw new Error('La cantidad debe ser un número entero mayor a cero.');
  }

  if (isSupabaseConfigured && supabase) {
    // Ejecución segura de la función RPC transaccional en Postgres
    const { data, error } = await supabase.rpc('registrar_venta', {
      p_id_cliente: id_cliente,
      p_id_producto: id_producto,
      p_cantidad: cant
    });

    if (error) throw new Error(error.message);
    return data;
  }

  // Modo demostración
  const db = getLocalDatabase();
  const cli = db.clientes.find(c => c.id === id_cliente && c.activo);
  if (!cli) throw new Error('Cliente no encontrado o inactivo.');

  const prod = db.productos.find(p => p.id === id_producto && p.activo);
  if (!prod) throw new Error('Producto no encontrado o inactivo.');

  const precioUnitario = calcularPrecioFinal(prod.precio, prod.oferta);
  const total = Math.round(precioUnitario * cant * 100) / 100;

  const nuevaVenta = {
    id: 'v-' + Date.now(),
    fecha_hora: new Date().toISOString(),
    id_cliente: id_cliente,
    id_producto: id_producto,
    precio_unitario: precioUnitario,
    cantidad: cant,
    total: total,
    estado: 'valida',
    created_at: new Date().toISOString()
  };

  db.ventas.unshift(nuevaVenta);
  saveLocalDatabase(db);

  return {
    ...nuevaVenta,
    cliente_nombre: cli.nombre,
    producto_nombre: prod.nombre
  };
}

export async function anularVenta(id) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('anular_venta', {
      p_id_venta: id
    });

    if (error) throw new Error(error.message);
    return data;
  }

  const db = getLocalDatabase();
  const index = db.ventas.findIndex(v => v.id === id);
  if (index === -1) throw new Error('Venta no encontrada.');

  db.ventas[index].estado = 'anulada';
  saveLocalDatabase(db);
  return true;
}
