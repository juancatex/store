// Datos de demostración y respaldo sincronizados con el esquema SQL
export const INITIAL_MOCK_DATA = {
  perfiles: [
    {
      id: 'usr-admin-1',
      nombre_usuario: 'admin',
      nombre_completo: 'Administrador del Sistema',
      correo: 'admin@tienda.com',
      rol: 'administrador',
      activo: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'usr-cliente-1',
      nombre_usuario: 'juanm',
      nombre_completo: 'Juan Carlos Mendoza',
      correo: 'juan.mendoza@correo.com',
      rol: 'cliente',
      activo: true,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'usr-cliente-2',
      nombre_usuario: 'marial',
      nombre_completo: 'María Lucía Fernández',
      correo: 'maria.fernandez@correo.com',
      rol: 'cliente',
      activo: true,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    }
  ],
  tiendas: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Tienda Central - Principal',
      descripcion: 'Sede principal de distribución y ventas generales',
      id_usuario: 'usr-admin-1',
      activo: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Sucursal Tecnológica Norte',
      descripcion: 'Especializada en laptops, monitores y accesorios premium',
      id_usuario: 'usr-admin-1',
      activo: true,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      nombre: 'Tienda Móvil & Gadgets Sur',
      descripcion: 'Smartphones, smartwatches y dispositivos inteligentes',
      id_usuario: null,
      activo: true,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString()
    }
  ],
  productos: [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      nombre: 'Laptop Pro 15 Ultra',
      descripcion: 'Intel Core i7 13va Gen, 16GB RAM, 512GB SSD NVMe',
      precio: 1299.99,
      oferta: 10.00,
      id_tienda: '11111111-1111-1111-1111-111111111111',
      activo: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      nombre: 'Monitor Gamer 27" 165Hz IPS',
      descripcion: 'Resolución QHD 2560x1440, 1ms, HDR400, G-Sync',
      precio: 349.50,
      oferta: 15.00,
      id_tienda: '22222222-2222-2222-2222-222222222222',
      activo: true,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      nombre: 'Teclado Mecánico RGB Wireless',
      descripcion: 'Switches mecánicos táctiles, retroiluminado RGB personalizable',
      precio: 89.00,
      oferta: 0.00,
      id_tienda: '22222222-2222-2222-2222-222222222222',
      activo: true,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      nombre: 'Smartphone Flagship 5G 256GB',
      descripcion: 'Cámara triple 108MP, batería 5000mAh, pantalla AMOLED 120Hz',
      precio: 799.00,
      oferta: 5.00,
      id_tienda: '33333333-3333-3333-3333-333333333333',
      activo: true,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString()
    },
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      nombre: 'Audífonos Noise Cancelling Pro',
      descripcion: 'Cancelación activa de ruido inteligente, audio Hi-Res inalámbrico',
      precio: 199.99,
      oferta: 20.00,
      id_tienda: '33333333-3333-3333-3333-333333333333',
      activo: true,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      nombre: 'Mouse Ergonómico Inalámbrico',
      descripcion: 'Sensor óptico de alta precisión, agarre natural para oficina',
      precio: 45.00,
      oferta: 0.00,
      id_tienda: '11111111-1111-1111-1111-111111111111',
      activo: true,
      created_at: new Date(Date.now() - 8 * 86400000).toISOString()
    }
  ],
  clientes: [
    {
      id: '10000000-0000-0000-0000-000000000001',
      nombre: 'Juan Carlos Mendoza',
      correo: 'juan.mendoza@correo.com',
      perfil_id: 'usr-cliente-1',
      activo: true,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      nombre: 'María Lucía Fernández',
      correo: 'maria.fernandez@correo.com',
      perfil_id: 'usr-cliente-2',
      activo: true,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      nombre: 'Carlos Eduardo Rivas',
      correo: 'carlos.rivas@correo.com',
      perfil_id: null,
      activo: true,
      created_at: new Date(Date.now() - 18 * 86400000).toISOString()
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      nombre: 'Ana Patricia Morales',
      correo: 'ana.morales@correo.com',
      perfil_id: null,
      activo: true,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString()
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      nombre: 'Roberto Alejandro Silva',
      correo: 'roberto.silva@correo.com',
      perfil_id: null,
      activo: true,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    }
  ],
  ventas: [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      fecha_hora: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      id_cliente: '10000000-0000-0000-0000-000000000001',
      id_producto: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      precio_unitario: 1169.99,
      cantidad: 1,
      total: 1169.99,
      estado: 'valida',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      fecha_hora: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      id_cliente: '10000000-0000-0000-0000-000000000002',
      id_producto: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      precio_unitario: 297.08,
      cantidad: 2,
      total: 594.16,
      estado: 'valida',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      fecha_hora: new Date(Date.now() - 1 * 86400000).toISOString(),
      id_cliente: '10000000-0000-0000-0000-000000000003',
      id_producto: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      precio_unitario: 89.00,
      cantidad: 3,
      total: 267.00,
      estado: 'valida',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      fecha_hora: new Date(Date.now() - 2 * 86400000).toISOString(),
      id_cliente: '10000000-0000-0000-0000-000000000004',
      id_producto: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      precio_unitario: 759.05,
      cantidad: 1,
      total: 759.05,
      estado: 'valida',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000005',
      fecha_hora: new Date(Date.now() - 3 * 86400000).toISOString(),
      id_cliente: '10000000-0000-0000-0000-000000000005',
      id_producto: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      precio_unitario: 159.99,
      cantidad: 2,
      total: 319.98,
      estado: 'valida',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000006',
      fecha_hora: new Date(Date.now() - 4 * 86400000).toISOString(),
      id_cliente: '10000000-0000-0000-0000-000000000001',
      id_producto: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      precio_unitario: 45.00,
      cantidad: 2,
      total: 90.00,
      estado: 'valida',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'c0000000-0000-0000-0000-000000000007',
      fecha_hora: new Date(Date.now() - 5 * 86400000).toISOString(),
      id_cliente: '10000000-0000-0000-0000-000000000002',
      id_producto: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      precio_unitario: 1169.99,
      cantidad: 1,
      total: 1169.99,
      estado: 'anulada',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ]
};

// Cargar o inicializar almacenamiento local para demo sin Supabase
const LOCAL_STORAGE_KEY = 'tienda_demo_database_v1';

export function getLocalDatabase() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
      return INITIAL_MOCK_DATA;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MOCK_DATA;
  }
}

export function saveLocalDatabase(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error guardando en almacenamiento local:', e);
  }
}
