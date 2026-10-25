import { listarVentas } from './ventaService.js';

// Formato de fecha YYYY-MM-DD local
export function formatDateISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Obtener rango de la semana (Lunes a Domingo) para una fecha dada
export function getWeekRange(dateInput) {
  const d = new Date(dateInput);
  const day = d.getDay();
  // En JS: 0 es Domingo, 1 es Lunes...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

export async function obtenerReporteDiario(fechaString) {
  const ventas = await listarVentas({
    fechaInicio: fechaString,
    fechaFin: fechaString
  });

  let totalOperaciones = 0;
  let unidadesVendidas = 0;
  let totalIngresos = 0;
  let totalAnuladas = 0;

  ventas.forEach(v => {
    if (v.estado === 'valida') {
      totalOperaciones++;
      unidadesVendidas += Number(v.cantidad) || 0;
      totalIngresos += Number(v.total) || 0;
    } else {
      totalAnuladas++;
    }
  });

  return {
    fecha: fechaString,
    totalOperaciones,
    unidadesVendidas,
    totalIngresos: Math.round(totalIngresos * 100) / 100,
    totalAnuladas,
    ventas
  };
}

export async function obtenerReporteSemanal(fechaReferencia) {
  const { monday, sunday } = getWeekRange(fechaReferencia);
  const fechaInicio = formatDateISO(monday);
  const fechaFin = formatDateISO(sunday);

  const ventas = await listarVentas({
    fechaInicio,
    fechaFin
  });

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const resumenDias = diasSemana.map((nombre, idx) => {
    const curDate = new Date(monday);
    curDate.setDate(monday.getDate() + idx);
    const dateStr = formatDateISO(curDate);
    return {
      dia: nombre,
      fecha: dateStr,
      operaciones: 0,
      unidades: 0,
      total: 0
    };
  });

  let totalOperaciones = 0;
  let totalUnidades = 0;
  let totalIngresos = 0;
  let totalAnuladas = 0;

  ventas.forEach(v => {
    if (v.estado === 'valida') {
      totalOperaciones++;
      const cant = Number(v.cantidad) || 0;
      const tot = Number(v.total) || 0;
      totalUnidades += cant;
      totalIngresos += tot;

      const vDateStr = formatDateISO(v.fecha_hora);
      const diaObj = resumenDias.find(d => d.fecha === vDateStr);
      if (diaObj) {
        diaObj.operaciones++;
        diaObj.unidades += cant;
        diaObj.total = Math.round((diaObj.total + tot) * 100) / 100;
      }
    } else {
      totalAnuladas++;
    }
  });

  return {
    fechaInicio,
    fechaFin,
    totalOperaciones,
    totalUnidades,
    totalIngresos: Math.round(totalIngresos * 100) / 100,
    totalAnuladas,
    resumenDias,
    ventas
  };
}

export async function obtenerReporteMensual(anio, mes) {
  // mes viene 1-12
  const primerDia = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDiaNum = new Date(anio, mes, 0).getDate();
  const ultimoDia = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDiaNum).padStart(2, '0')}`;

  const ventas = await listarVentas({
    fechaInicio: primerDia,
    fechaFin: ultimoDia
  });

  // Estructura de ventas por día del mes para el gráfico
  const diasMes = {};
  for (let i = 1; i <= ultimoDiaNum; i++) {
    const dStr = `${anio}-${String(mes).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    diasMes[dStr] = { dia: i, fecha: dStr, total: 0, operaciones: 0, unidades: 0 };
  }

  let totalOperaciones = 0;
  let totalUnidades = 0;
  let totalIngresos = 0;
  let totalAnuladas = 0;

  ventas.forEach(v => {
    if (v.estado === 'valida') {
      totalOperaciones++;
      const cant = Number(v.cantidad) || 0;
      const tot = Number(v.total) || 0;
      totalUnidades += cant;
      totalIngresos += tot;

      const vDateStr = formatDateISO(v.fecha_hora);
      if (diasMes[vDateStr]) {
        diasMes[vDateStr].operaciones++;
        diasMes[vDateStr].unidades += cant;
        diasMes[vDateStr].total = Math.round((diasMes[vDateStr].total + tot) * 100) / 100;
      }
    } else {
      totalAnuladas++;
    }
  });

  return {
    anio,
    mes,
    totalOperaciones,
    totalUnidades,
    totalIngresos: Math.round(totalIngresos * 100) / 100,
    totalAnuladas,
    ventasPorDia: Object.values(diasMes),
    ventas
  };
}

export function exportarVentasCSV(ventas, nombreArchivo = 'reporte_ventas.csv') {
  if (!ventas || !ventas.length) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const encabezados = [
    'ID Venta',
    'Fecha y Hora',
    'Cliente',
    'Correo Cliente',
    'Producto',
    'Tienda',
    'Precio Unitario',
    'Cantidad',
    'Total',
    'Estado'
  ];

  const filas = ventas.map(v => [
    `"${v.id || ''}"`,
    `"${new Date(v.fecha_hora).toLocaleString('es-ES')}"`,
    `"${(v.clientes?.nombre || '').replace(/"/g, '""')}"`,
    `"${(v.clientes?.correo || '').replace(/"/g, '""')}"`,
    `"${(v.productos?.nombre || '').replace(/"/g, '""')}"`,
    `"${(v.productos?.tiendas?.nombre || '').replace(/"/g, '""')}"`,
    (Number(v.precio_unitario) || 0).toFixed(2),
    v.cantidad,
    (Number(v.total) || 0).toFixed(2),
    `"${v.estado}"`
  ]);

  const contenido = [encabezados.join(';'), ...filas.map(f => f.join(';'))].join('\r\n');
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
