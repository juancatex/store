-- ==============================================================================
-- SISTEMA DE VENTAS, PRODUCTOS, TIENDAS Y RESERVAS
-- Migración Inicial: Esquema de base de datos, relaciones, RLS, funciones y seed
-- ==============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLA: perfiles (Extensión de auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_usuario TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    correo TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('administrador', 'cliente')),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_perfiles_nombre_usuario ON public.perfiles(nombre_usuario);
CREATE INDEX IF NOT EXISTS idx_perfiles_correo ON public.perfiles(correo);
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON public.perfiles(rol);

-- ==============================================================================
-- 2. TABLA: tiendas
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tiendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    id_usuario UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tiendas_id_usuario ON public.tiendas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_tiendas_activo ON public.tiendas(activo);

-- ==============================================================================
-- 3. TABLA: productos
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    oferta NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (oferta >= 0 AND oferta <= 100),
    id_tienda UUID NOT NULL REFERENCES public.tiendas(id) ON DELETE RESTRICT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_id_tienda ON public.productos(id_tienda);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON public.productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON public.productos(nombre);

-- ==============================================================================
-- 4. TABLA: clientes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    perfil_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_correo ON public.clientes(correo);
CREATE INDEX IF NOT EXISTS idx_clientes_perfil_id ON public.clientes(perfil_id);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON public.clientes(activo);

-- ==============================================================================
-- 5. TABLA: ventas
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    id_cliente UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    id_producto UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    estado TEXT NOT NULL CHECK (estado IN ('valida', 'anulada')) DEFAULT 'valida',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha_hora ON public.ventas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_ventas_id_cliente ON public.ventas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_ventas_id_producto ON public.ventas(id_producto);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON public.ventas(estado);

-- ==============================================================================
-- 6. TABLA: reservas (Entidad preparada para futuras ampliaciones)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    id_cliente UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    id_producto UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    a_cuenta NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (a_cuenta >= 0),
    entregado_en TIMESTAMPTZ,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'entregada', 'anulada')) DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservas_id_cliente ON public.reservas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_reservas_id_producto ON public.reservas(id_producto);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON public.reservas(estado);

-- ==============================================================================
-- 7. FUNCIONES DE SEGURIDAD Y CONTROL
-- ==============================================================================

-- Verificar si el usuario autenticado tiene rol de administrador
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE id = auth.uid()
          AND rol = 'administrador'
          AND activo = true
    );
$$;

-- Obtener correo a partir de nombre de usuario para login amigable
CREATE OR REPLACE FUNCTION public.obtener_correo_por_usuario(p_nombre_usuario TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_correo TEXT;
BEGIN
    SELECT correo INTO v_correo
    FROM public.perfiles
    WHERE lower(nombre_usuario) = lower(trim(p_nombre_usuario))
      AND activo = true
    LIMIT 1;

    RETURN v_correo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_correo_por_usuario(TEXT) TO anon, authenticated;

-- Trigger automático para crear perfil cuando se registra un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nombre TEXT;
    v_usuario TEXT;
    v_rol TEXT;
BEGIN
    v_nombre := COALESCE(new.raw_user_meta_data->>'nombre_completo', split_part(new.email, '@', 1));
    v_usuario := COALESCE(new.raw_user_meta_data->>'nombre_usuario', split_part(new.email, '@', 1));
    v_rol := COALESCE(new.raw_user_meta_data->>'rol', 'cliente');

    -- Restricción: Por seguridad, sólo permitir 'cliente' o 'administrador'
    IF v_rol NOT IN ('administrador', 'cliente') THEN
        v_rol := 'cliente';
    END IF;

    -- Insertar en perfiles
    INSERT INTO public.perfiles (id, nombre_usuario, nombre_completo, correo, rol, activo)
    VALUES (new.id, v_usuario, v_nombre, new.email, v_rol, true)
    ON CONFLICT (id) DO UPDATE SET
        correo = EXCLUDED.correo,
        nombre_completo = EXCLUDED.nombre_completo;

    -- Si el rol es cliente, enlazar o crear automáticamente en tabla clientes
    IF v_rol = 'cliente' THEN
        INSERT INTO public.clientes (nombre, correo, perfil_id, activo)
        VALUES (v_nombre, new.email, new.id, true)
        ON CONFLICT (correo) DO UPDATE SET
            perfil_id = EXCLUDED.perfil_id;
    END IF;

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Función transaccional para registro seguro de ventas en el servidor
CREATE OR REPLACE FUNCTION public.registrar_venta(
    p_id_cliente UUID,
    p_id_producto UUID,
    p_cantidad INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_producto RECORD;
    v_cliente RECORD;
    v_precio_unitario NUMERIC(10, 2);
    v_total NUMERIC(10, 2);
    v_id_venta UUID;
    v_resultado JSONB;
BEGIN
    -- Validar que el usuario sea administrador
    IF NOT public.es_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo un administrador puede registrar ventas.';
    END IF;

    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser un entero positivo mayor a cero.';
    END IF;

    -- Validar cliente activo
    SELECT * INTO v_cliente
    FROM public.clientes
    WHERE id = p_id_cliente AND activo = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El cliente seleccionado no existe o está desactivado.';
    END IF;

    -- Validar producto activo
    SELECT * INTO v_producto
    FROM public.productos
    WHERE id = p_id_producto AND activo = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El producto seleccionado no existe o está desactivado.';
    END IF;

    -- Calcular precio unitario con descuento de oferta aplicado
    IF v_producto.oferta > 0 THEN
        v_precio_unitario := ROUND(v_producto.precio * (1.0 - (v_producto.oferta / 100.0)), 2);
    ELSE
        v_precio_unitario := v_producto.precio;
    END IF;

    -- Calcular total
    v_total := ROUND(v_precio_unitario * p_cantidad, 2);

    -- Registrar venta con marca de tiempo del servidor
    INSERT INTO public.ventas (
        id_cliente,
        id_producto,
        precio_unitario,
        cantidad,
        total,
        estado,
        fecha_hora
    )
    VALUES (
        p_id_cliente,
        p_id_producto,
        v_precio_unitario,
        p_cantidad,
        v_total,
        'valida',
        now()
    )
    RETURNING id INTO v_id_venta;

    SELECT jsonb_build_object(
        'id', v_id_venta,
        'id_cliente', p_id_cliente,
        'cliente_nombre', v_cliente.nombre,
        'id_producto', p_id_producto,
        'producto_nombre', v_producto.nombre,
        'precio_unitario', v_precio_unitario,
        'cantidad', p_cantidad,
        'total', v_total,
        'estado', 'valida',
        'fecha_hora', now()
    ) INTO v_resultado;

    RETURN v_resultado;
END;
$$;

-- Función transaccional para anular ventas (sin borrar historial físico)
CREATE OR REPLACE FUNCTION public.anular_venta(p_id_venta UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.es_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo un administrador puede anular ventas.';
    END IF;

    UPDATE public.ventas
    SET estado = 'anulada'
    WHERE id = p_id_venta;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La venta especificada no existe.';
    END IF;

    RETURN true;
END;
$$;

-- ==============================================================================
-- 8. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- 8.1. Perfiles
DROP POLICY IF EXISTS "Lectura de perfiles para autenticados" ON public.perfiles;
CREATE POLICY "Lectura de perfiles para autenticados"
    ON public.perfiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Actualización de propio perfil" ON public.perfiles;
CREATE POLICY "Actualización de propio perfil"
    ON public.perfiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.es_admin())
    WITH CHECK (id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "Administrador puede insertar o eliminar perfiles" ON public.perfiles;
CREATE POLICY "Administrador puede insertar o eliminar perfiles"
    ON public.perfiles FOR ALL
    TO authenticated
    USING (public.es_admin());

-- 8.2. Tiendas
DROP POLICY IF EXISTS "Lectura de tiendas" ON public.tiendas;
CREATE POLICY "Lectura de tiendas"
    ON public.tiendas FOR SELECT
    TO authenticated
    USING (activo = true OR public.es_admin());

DROP POLICY IF EXISTS "Escritura de tiendas solo admin" ON public.tiendas;
CREATE POLICY "Escritura de tiendas solo admin"
    ON public.tiendas FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 8.3. Productos
DROP POLICY IF EXISTS "Lectura de productos" ON public.productos;
CREATE POLICY "Lectura de productos"
    ON public.productos FOR SELECT
    TO authenticated
    USING (activo = true OR public.es_admin());

DROP POLICY IF EXISTS "Gestión de productos solo admin" ON public.productos;
CREATE POLICY "Gestión de productos solo admin"
    ON public.productos FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 8.4. Clientes
DROP POLICY IF EXISTS "Lectura de clientes" ON public.clientes;
CREATE POLICY "Lectura de clientes"
    ON public.clientes FOR SELECT
    TO authenticated
    USING (public.es_admin() OR perfil_id = auth.uid());

DROP POLICY IF EXISTS "Gestión de clientes" ON public.clientes;
CREATE POLICY "Gestión de clientes"
    ON public.clientes FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 8.5. Ventas
DROP POLICY IF EXISTS "Lectura de ventas" ON public.ventas;
CREATE POLICY "Lectura de ventas"
    ON public.ventas FOR SELECT
    TO authenticated
    USING (
        public.es_admin() OR 
        id_cliente IN (SELECT id FROM public.clientes WHERE perfil_id = auth.uid())
    );

DROP POLICY IF EXISTS "Registro y modificación de ventas solo admin" ON public.ventas;
CREATE POLICY "Registro y modificación de ventas solo admin"
    ON public.ventas FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- 8.6. Reservas
DROP POLICY IF EXISTS "Lectura de reservas" ON public.reservas;
CREATE POLICY "Lectura de reservas"
    ON public.reservas FOR SELECT
    TO authenticated
    USING (
        public.es_admin() OR 
        id_cliente IN (SELECT id FROM public.clientes WHERE perfil_id = auth.uid())
    );

DROP POLICY IF EXISTS "Gestión de reservas" ON public.reservas;
CREATE POLICY "Gestión de reservas"
    ON public.reservas FOR ALL
    TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- ==============================================================================
-- 9. DATOS DE PRUEBA (SEED DATA PARA DEMOSTRACIÓN)
-- ==============================================================================

-- Insertar tiendas de prueba (con IDs fijos para poder asociar productos)
INSERT INTO public.tiendas (id, nombre, descripcion, activo)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Tienda Central - Principal', 'Sede principal de distribución y ventas generales', true),
    ('22222222-2222-2222-2222-222222222222', 'Sucursal Tecnológica Norte', 'Especializada en laptops, monitores y accesorios premium', true),
    ('33333333-3333-3333-3333-333333333333', 'Tienda Móvil & Gadgets Sur', 'Smartphones, smartwatches y dispositivos inteligentes', true)
ON CONFLICT (id) DO NOTHING;

-- Insertar productos de prueba
INSERT INTO public.productos (id, nombre, descripcion, precio, oferta, id_tienda, activo)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Laptop Pro 15 Ultra', 'Intel Core i7 13va Gen, 16GB RAM, 512GB SSD NVMe', 1299.99, 10.00, '11111111-1111-1111-1111-111111111111', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Monitor Gamer 27" 165Hz IPS', 'Resolución QHD 2560x1440, 1ms, HDR400, G-Sync', 349.50, 15.00, '22222222-2222-2222-2222-222222222222', true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Teclado Mecánico RGB Wireless', 'Switches mecánicos táctiles, retroiluminado RGB', 89.00, 0.00, '22222222-2222-2222-2222-222222222222', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Smartphone Flagship 5G 256GB', 'Cámara triple 108MP, batería 5000mAh, pantalla AMOLED', 799.00, 5.00, '33333333-3333-3333-3333-333333333333', true),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Audífonos Noise Cancelling Pro', 'Cancelación activa de ruido inteligente, audio Hi-Res', 199.99, 20.00, '33333333-3333-3333-3333-333333333333', true),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Mouse Ergonómico Inalámbrico', 'Sensor óptico de alta precisión, agarre natural para oficina', 45.00, 0.00, '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (id) DO NOTHING;

-- Insertar clientes de prueba
INSERT INTO public.clientes (id, nombre, correo, activo)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Juan Carlos Mendoza', 'juan.mendoza@correo.com', true),
    ('10000000-0000-0000-0000-000000000002', 'María Lucía Fernández', 'maria.fernandez@correo.com', true),
    ('10000000-0000-0000-0000-000000000003', 'Carlos Eduardo Rivas', 'carlos.rivas@correo.com', true),
    ('10000000-0000-0000-0000-000000000004', 'Ana Patricia Morales', 'ana.morales@correo.com', true),
    ('10000000-0000-0000-0000-000000000005', 'Roberto Alejandro Silva', 'roberto.silva@correo.com', true)
ON CONFLICT (id) DO NOTHING;

-- Insertar ventas de prueba con fechas escalonadas para probar reportes diarios, semanales y mensuales
INSERT INTO public.ventas (id, fecha_hora, id_cliente, id_producto, precio_unitario, cantidad, total, estado)
VALUES
    ('c0000000-0000-0000-0000-000000000001', now() - INTERVAL '1 hour', '10000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1169.99, 1, 1169.99, 'valida'),
    ('c0000000-0000-0000-0000-000000000002', now() - INTERVAL '3 hours', '10000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 297.08, 2, 594.16, 'valida'),
    ('c0000000-0000-0000-0000-000000000003', now() - INTERVAL '1 day', '10000000-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 89.00, 3, 267.00, 'valida'),
    ('c0000000-0000-0000-0000-000000000004', now() - INTERVAL '2 days', '10000000-0000-0000-0000-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 759.05, 1, 759.05, 'valida'),
    ('c0000000-0000-0000-0000-000000000005', now() - INTERVAL '3 days', '10000000-0000-0000-0000-000000000005', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 159.99, 2, 319.98, 'valida'),
    ('c0000000-0000-0000-0000-000000000006', now() - INTERVAL '4 days', '10000000-0000-0000-0000-000000000001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 45.00, 2, 90.00, 'valida'),
    ('c0000000-0000-0000-0000-000000000007', now() - INTERVAL '5 days', '10000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1169.99, 1, 1169.99, 'anulada'),
    ('c0000000-0000-0000-0000-000000000008', now() - INTERVAL '10 days', '10000000-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 297.08, 1, 297.08, 'valida')
ON CONFLICT (id) DO NOTHING;
