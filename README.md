# NovaVentas - Sistema Web de Gestión Comercial, Productos, Tiendas y Reservas

Sistema web profesional, modular y didáctico desarrollado con **Svelte**, **JavaScript** y **Supabase (PostgreSQL + Auth)**, diseñado siguiendo las mejores prácticas de arquitectura frontend, seguridad con Row Level Security (RLS) y transaccionalidad segura en base de datos.

---

## 1. Tecnologías Utilizadas

- **Frontend:** [Svelte 5](https://svelte.dev/) con JavaScript estándar (sin TypeScript, facilitando el aprendizaje y la legibilidad).
- **Herramienta de construcción:** [Vite](https://vitejs.dev/) para desarrollo rápido y empaquetado optimizado.
- **Base de datos:** [Supabase PostgreSQL](https://supabase.com/) con funciones almacenadas seguras (`SECURITY DEFINER`), triggers e índices.
- **Autenticación:** [Supabase Auth](https://supabase.com/docs/guides/auth) con persistencia de sesiones y control de acceso basado en roles (`administrador` y `cliente`).
- **Cliente de base de datos:** `@supabase/supabase-js`.
- **Estilos:** CSS moderno estructurado mediante variables, diseño responsive, tarjetas con micro-sombras, estados interactivos y paleta azul profesional.
- **Gráficos analíticos:** [Chart.js](https://www.chartjs.org/) para métricas de ventas y comparativas temporales.
- **Iconografía:** [Lucide Icons](https://lucide.dev/) (`lucide-svelte`).

---

## 2. Estructura del Proyecto

```text
tienda/
├── public/                     # Recursos estáticos
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Esquema PostgreSQL, RLS, RPCs y Seed
├── src/
│   ├── lib/
│   │   ├── supabase.js         # Inicializador del cliente Supabase
│   │   ├── components/
│   │   │   ├── Sidebar.svelte  # Menú lateral dinámico con control de roles
│   │   │   ├── Topbar.svelte   # Barra superior con info de usuario y estado
│   │   │   ├── Modal.svelte    # Ventana modal accesible y reutilizable
│   │   │   ├── ConfirmDialog.svelte # Diálogo de confirmación para acciones críticas
│   │   │   └── Toast.svelte    # Notificaciones flotantes globales
│   │   └── services/
│   │       ├── authService.js      # Inicio de sesión, roles y sesiones
│   │       ├── usuarioService.js   # CRUD de perfiles y cuentas de usuario
│   │       ├── clienteService.js   # CRUD de clientes e historial de compras
│   │       ├── tiendaService.js    # CRUD de tiendas y productos asociados
│   │       ├── productoService.js  # CRUD de productos, descuentos y precios
│   │       ├── ventaService.js     # Transacciones de venta y anulaciones
│   │       ├── reporteService.js   # Reportes diario, semanal, mensual y CSV
│   │       ├── dashboardService.js # KPIs consolidados e indicadores
│   │       ├── toastService.js     # Store reactivo de notificaciones
│   │       └── mockData.js         # Datos de demostración locales de respaldo
│   ├── routes/
│   │   ├── Login.svelte        # Pantalla de autenticación y cambio de rol
│   │   ├── Dashboard.svelte    # Panel de indicadores y gráficos de ventas
│   │   ├── Usuarios.svelte     # Mantenimiento de usuarios y permisos
│   │   ├── Clientes.svelte     # Mantenimiento de clientes y ventas vinculadas
│   │   ├── Tiendas.svelte      # Mantenimiento de sucursales y responsables
│   │   ├── Productos.svelte    # Mantenimiento de productos y ofertas (%)
│   │   ├── Ventas.svelte       # Registro de ventas, comprobantes y anulación
│   │   └── Reportes.svelte     # Reportes con filtros por fecha y exportación CSV
│   ├── App.svelte              # Componente raíz y enrutador central
│   ├── main.js                 # Punto de entrada de la aplicación Svelte
│   └── app.css                 # Sistema de diseño y estilos globales
├── .env.example                # Plantilla de variables de entorno
├── index.html                  # HTML base con meta tags y tipografía Inter
├── package.json                # Dependencias y scripts
├── svelte.config.js            # Configuración del compilador Svelte
└── vite.config.js              # Configuración de Vite
```

---

## 3. Modelo de Base de Datos en Supabase

El esquema completo se encuentra en `supabase/migrations/001_initial_schema.sql` e incluye:

1. **`perfiles`**: Vinculada con `auth.users(id)` mediante clave foránea con eliminación en cascada. Almacena `nombre_usuario`, `nombre_completo`, `correo`, `rol` ('administrador' | 'cliente') y `activo`.
2. **`tiendas`**: Sucursales comerciales con nombre, descripción, `id_usuario` (responsable) y estado `activo`.
3. **`productos`**: Catálogo con nombre, descripción, precio base, porcentaje de oferta (`oferta`), clave foránea a `tiendas` y estado `activo`.
4. **`clientes`**: Cartera con nombre, correo electrónico único, relación opcional a `perfil_id` y estado `activo`.
5. **`ventas`**: Registro transaccional inmutable de operaciones con `fecha_hora`, cliente, producto, precio unitario congelado, cantidad, total calculado y `estado` ('valida' | 'anulada').
6. **`reservas`**: Entidad preparada para futuras iteraciones del sistema con `a_cuenta`, `entregado_en` y `estado` ('pendiente' | 'entregada' | 'anulada').

### Funciones Transaccionales y de Seguridad (`SECURITY DEFINER`)
- `es_admin()`: Valida si el usuario en sesión es administrador activo.
- `obtener_correo_por_usuario(p_nombre_usuario)`: Permite iniciar sesión ingresando el nombre de usuario resolviendo de forma segura su correo sin exponer contraseñas ni datos sensibles.
- `registrar_venta(p_id_cliente, p_id_producto, p_cantidad)`: Valida en el servidor que el cliente y producto existan y estén activos, extrae el precio y la oferta del producto, calcula el precio unitario y total exactos en la base de datos (evitando manipulaciones maliciosas de precios desde el cliente) y registra la venta con la marca de tiempo oficial de PostgreSQL.
- `anular_venta(p_id_venta)`: Modifica el estado de la venta a `'anulada'` garantizando que el historial físico nunca se borre, permitiendo auditoría.
- `handle_new_user()`: Trigger sobre `auth.users` que crea automáticamente el registro de perfil correspondiente al registrar una cuenta.

---

## 4. Guía de Configuración con Supabase

### Paso 1: Crear proyecto en Supabase
1. Ingresa a [https://supabase.com](https://supabase.com) e inicia sesión.
2. Haz clic en **"New Project"**.
3. Asigna un nombre a tu proyecto (ej: `tienda-ventas`), establece una contraseña segura para la base de datos y selecciona la región más cercana.

### Paso 2: Ejecutar la migración SQL
1. En el panel izquierdo de tu proyecto en Supabase, dirígete a **SQL Editor**.
2. Haz clic en **"New query"**.
3. Abre el archivo local `supabase/migrations/001_initial_schema.sql`, copia todo su contenido y pégalo en el editor de Supabase.
4. Haz clic en **"Run"** (o presiona `Ctrl + Enter`).
5. La consulta creará las tablas, índices, restricciones CHECK, funciones seguras, políticas RLS y los datos de prueba iniciales (tiendas, productos, clientes y ventas).

### Paso 3: Crear el primer usuario Administrador
Existen dos formas seguras de crear el primer administrador:

#### Opción A: Desde el SQL Editor de Supabase (Recomendada)
Ejecuta el siguiente script en el **SQL Editor** para crear la cuenta en `auth.users` y asignarle el rol de administrador en `perfiles`:

```sql
-- 1. Crear el usuario en auth.users con tokens vacíos requeridos por GoTrue
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    reauthentication_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@tienda.com',
    crypt('Admin123456*', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre_completo":"Administrador General","nombre_usuario":"admin","rol":"administrador"}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    ''
);

-- 2. Asegurarse de que el perfil tenga rol de administrador
UPDATE public.perfiles
SET rol = 'administrador', activo = true
WHERE correo = 'admin@tienda.com';
```

#### Opción B: Desde Authentication > Users en el Dashboard
1. Ve a **Authentication > Users** y haz clic en **"Add User" > "Create user"**.
2. Ingresa el correo `admin@tienda.com` y una contraseña segura.
3. Luego, en el **SQL Editor**, asígnale el perfil de administrador:
   ```sql
   UPDATE public.perfiles
   SET rol = 'administrador', nombre_usuario = 'admin', nombre_completo = 'Administrador General'
   WHERE correo = 'admin@tienda.com';
   ```

### Paso 4: Obtener las claves de API
1. En el menú de Supabase, ve a **Project Settings > API**.
2. Copia la **Project URL**.
3. Copia la clave **anon (public)**. (⚠️ **NUNCA** uses ni expongas la clave `service_role` en el frontend).

---

## 5. Instalación y Ejecución Local

### Paso 1: Clonar o abrir el directorio del proyecto
Abre una terminal en la carpeta del proyecto:
```bash
cd e:\ejemplos\tienda
```

### Paso 2: Instalar las dependencias
```bash
npm install
```

### Paso 3: Configurar las variables de entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```
Edita `.env` con tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica-aqui
```

> **Nota didáctica (Modo Demostración):** Si ejecutas la aplicación antes de configurar `.env` o sin conexión a internet, el sistema activa automáticamente un **Modo Demostración local** con almacenamiento en memoria y `localStorage`. Esto permite explorar todas las pantallas, registrar ventas, consultar reportes y alternar roles inmediatamente sin romper el flujo de trabajo.

### Paso 4: Iniciar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en: `http://localhost:5173/`

### Paso 5: Compilar para producción (Opcional)
```bash
npm run build
npm run preview
```

---

## 6. Guía de Pruebas Manuales por Módulo

Para verificar la correcta operatividad del sistema, realiza las siguientes pruebas:

| # | Módulo | Procedimiento de Prueba | Resultado Esperado |
|---|---|---|---|
| 1 | **Login** | Iniciar sesión con nombre de usuario `admin` o correo y contraseña errónea. | Muestra mensaje de error: "Credenciales incorrectas...". |
| 2 | **Login** | Hacer clic en el icono del ojo en el campo de contraseña. | Alterna entre mostrar y ocultar los caracteres de la contraseña. |
| 3 | **Login & Roles** | Iniciar sesión como `admin` y luego verificar el menú lateral. | Acceso completo a Dashboard, Ventas, Reportes, Productos, Tiendas, Clientes y Usuarios. |
| 4 | **Dashboard** | Observar las tarjetas de KPI, el gráfico de barras y las últimas ventas. | Las métricas muestran las ventas del día, semana, mes y productos activos reales. |
| 5 | **CRUD Productos** | Ir a "Productos" > "Nuevo Producto", ingresar nombre, precio `$1000` y descuento `20%`. | El indicador visual calcula en tiempo real un precio final de `$800.00`. |
| 6 | **CRUD Tiendas** | Ir a "Tiendas", hacer clic en el icono de capas de una tienda. | Abre un modal listando exclusivamente los productos asignados a dicha tienda. |
| 7 | **CRUD Clientes** | Ir a "Clientes", hacer clic en el icono de recibo de un cliente. | Abre el modal con el historial completo de compras realizadas por ese cliente. |
| 8 | **Registro de Venta** | Ir a "Ventas" > "Registrar Nueva Venta", elegir cliente, producto con oferta y cantidad `2`. | El sistema calcula el total en servidor mediante `registrar_venta` y muestra la venta como válida. |
| 9 | **Anulación de Venta** | En "Ventas", presionar el botón rojo de anular en una venta válida y confirmar. | El estado cambia a `Anulada`. El registro se conserva y no se borra físicamente. |
| 10 | **Reportes Analíticos** | Ir a "Reportes" y revisar los reportes Diario, Semanal y Mensual. | Los ingresos totales descuentan las operaciones anuladas. Las anuladas aparecen identificadas con badge rojo. |
| 11 | **Exportación CSV** | En "Reportes", presionar el botón "Exportar a CSV". | Descarga un archivo `.csv` formateado con encabezados y las ventas del período. |
| 12 | **Seguridad y Clientes** | Cerrar sesión e iniciar como `cliente` (ej: `juanm`). | El menú lateral restringe el acceso a módulos administrativos y solo permite consultar compras y catálogo. |

---

## 7. Buenas Prácticas de Seguridad Implementadas

1. **Principio de Mínimo Privilegio:** Únicamente se utiliza la clave pública `anon` en el cliente.
2. **Cálculo Transaccional en Base de Datos:** Los precios no son determinados arbitrariamente por el frontend; la función `registrar_venta` en PostgreSQL verifica los precios del producto y liquida el total.
3. **Row Level Security (RLS):** Cada tabla posee políticas que impiden que clientes modifiquen registros de ventas o tiendas ajenas.
4. **Conservación de Historial:** Las anulaciones cambian de estado sin borrado físico (`soft-delete`).
5. **Protección contra Elevación de Privilegios:** La función `es_admin()` y las políticas impiden que un usuario modifique su propio rol para convertirse en administrador.
