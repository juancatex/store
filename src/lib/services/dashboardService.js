import { listarVentas } from './ventaService.js';
import { listarProductos } from './productoService.js';
import { listarClientes } from './clienteService.js';
import { formatDateISO, getWeekRange } from './reporteService.js';

export async function obtenerDatosDashboard() {
  const hoyStr = formatDateISO(new Date());
  const { monday, sunday } = getWeekRange(new Date());
  const lunesStr = formatDateISO(monday);
  const domingoStr = formatDateISO(sunday);

  const mesActual = new Date().getMonth() + 1;
  const anioActual = new Date().getFullYear();
  const primerDiaMesStr = `${anioActual}-${String(mesActual).padStart(2, '0')}-01`;

  // Cargar colecciones en paralelo
  const [ventas, productos, clientes] = await Promise.all([
    listarVentas(),
    listarProductos(),
    listarClientes()
  ]);

  let ventasHoyMonto = 0;
  let ventasHoyCount = 0;

  let ventasSemanaMonto = 0;
  let ventasSemanaCount = 0;

  let ventasMesMonto = 0;
  let ventasMesCount = 0;

  const contadorProductos = {};

  ventas.forEach(v => {
    if (v.estado !== 'valida') return;

    const vFechaStr = formatDateISO(v.fecha_hora);
    const monto = Number(v.total) || 0;
    const cant = Number(v.cantidad) || 0;

    // Ventas de hoy
    if (vFechaStr === hoyStr) {
      ventasHoyMonto += monto;
      ventasHoyCount++;
    }

    // Ventas de la semana
    if (vFechaStr >= lunesStr && vFechaStr <= domingoStr) {
      ventasSemanaMonto += monto;
      ventasSemanaCount++;
    }

    // Ventas del mes
    if (vFechaStr >= primerDiaMesStr) {
      ventasMesMonto += monto;
      ventasMesCount++;
    }

    // Conteo para productos con mayor movimiento
    const prodId = v.id_producto;
    const prodNombre = v.productos?.nombre || 'Producto';
    if (!contadorProductos[prodId]) {
      contadorProductos[prodId] = {
        id: prodId,
        nombre: prodNombre,
        unidades: 0,
        montoTotal: 0
      };
    }
    contadorProductos[prodId].unidades += cant;
    contadorProductos[prodId].montoTotal += monto;
  });

  // Top 5 productos con mayor movimiento
  const productosTop = Object.values(contadorProductos)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 5);

  // Historial de ventas para gráfico de los últimos 7 días
  const ultimos7Dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = formatDateISO(d);
    const nombreDia = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    
    // Sumar ventas válidas de ese día
    let totalDia = 0;
    ventas.forEach(v => {
      if (v.estado === 'valida' && formatDateISO(v.fecha_hora) === dStr) {
        totalDia += Number(v.total) || 0;
      }
    });

    ultimos7Dias.push({
      fecha: dStr,
      etiqueta: nombreDia,
      total: Math.round(totalDia * 100) / 100
    });
  }

  // Últimas 5 ventas registradas
  const ultimasVentas = ventas.slice(0, 5);

  return {
    kpis: {
      ventasHoy: Math.round(ventasHoyMonto * 100) / 100,
      ventasHoyCount,
      ventasSemana: Math.round(ventasSemanaMonto * 100) / 100,
      ventasSemanaCount,
      ventasMes: Math.round(ventasMesMonto * 100) / 100,
      ventasMesCount,
      totalProductos: productos.filter(p => p.activo).length,
      totalClientes: clientes.filter(c => c.activo).length
    },
    productosTop,
    grafico7Dias: ultimos7Dias,
    ultimasVentas
  };
}
