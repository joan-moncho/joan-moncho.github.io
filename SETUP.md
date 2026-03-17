# Guía de configuración — Punto Zero + Supabase

Sigue estos pasos **en orden** para tener la app funcionando con base de datos y login.

---

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Haz clic en **"New project"**
3. Ponle nombre: `punto-zero`
4. Elige una contraseña segura para la base de datos
5. Selecciona región: `West EU (Ireland)` (la más cercana a España)
6. Espera ~2 minutos a que se cree el proyecto

---

## 2. Obtener las credenciales

1. En tu proyecto, ve a **Settings → API**
2. Copia los dos valores y pégalos en `config.js`:

```js
window.SUPABASE_URL      = 'https://XXXXXXXXXXXXXXXX.supabase.co';  // "Project URL"
window.SUPABASE_ANON_KEY = 'eyJ...';  // "anon public"
```

---

## 3. Crear la tabla de reservas

1. En Supabase, ve a **SQL Editor**
2. Haz clic en **"New query"**
3. Pega y ejecuta este SQL:

```sql
-- Tabla de reservas
create table bookings (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  user_email text,
  user_name  text,
  stylist    text not null,
  service    text not null,
  price      integer not null,
  duration   integer not null,
  date       text not null,
  date_key   date not null,
  time       text not null,
  status     text default 'confirmed',
  created_at timestamptz default now()
);

-- Seguridad: activar Row Level Security
alter table bookings enable row level security;

-- Cualquiera puede ver las horas reservadas (para mostrar disponibilidad)
create policy "Ver disponibilidad"
  on bookings for select
  using (true);

-- Solo usuarios autenticados pueden crear reservas
create policy "Crear reserva propia"
  on bookings for insert
  with check (auth.uid() = user_id);

-- Los usuarios solo pueden ver sus propias reservas en detalle
-- (la política de select general ya cubre esto, pero puedes restringirla)
```

---

## 4. Activar autenticación con Google

### En Google Cloud Console:
1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo o usa uno existente
3. Ve a **APIs & Services → Credentials**
4. Crea credenciales → **OAuth 2.0 Client ID**
5. Tipo de aplicación: **Web application**
6. En "Authorized redirect URIs", añade:
   ```
   https://XXXXXXXXXXXXXXXX.supabase.co/auth/v1/callback
   ```
   (sustituye con tu URL de Supabase)
7. Copia el **Client ID** y **Client Secret**

### En Supabase:
1. Ve a **Authentication → Providers**
2. Activa **Google**
3. Pega el **Client ID** y **Client Secret** de Google
4. Guarda

---

## 5. Configurar URL de redirección

1. En Supabase, ve a **Authentication → URL Configuration**
2. En **"Site URL"** pon tu dominio:
   ```
   https://tu-usuario.github.io/punto-zero
   ```
3. En **"Redirect URLs"** añade también esa URL

---

## 6. Configurar el email de admin

En `index.html`, busca esta línea y cambia el email:

```js
const ADMIN_EMAILS = ['admin@puntozero.es']; // ← tu email real
```

El usuario con ese email verá el enlace "Admin" en la navegación.

---

## 7. Subir a GitHub Pages

Sube estos archivos a tu repositorio:

```
punto-zero/
├── index.html
├── styles.css
├── config.js      ← con tus credenciales reales
└── README.md
```

⚠️ **Importante sobre seguridad:** La `SUPABASE_ANON_KEY` es pública por diseño
(es la clave anónima, no la de servicio). Las reglas de seguridad de la base de datos
(Row Level Security) protegen los datos. **Nunca pongas la `service_role` key en el frontend.**

---

## Estructura de archivos

```
punto-zero/
├── index.html     — App completa (HTML + JS)
├── styles.css     — Todos los estilos
├── config.js      — Credenciales Supabase
├── README.md      — Descripción del proyecto
└── SETUP.md       — Esta guía
```

---

## Soporte

Si algo no funciona, comprueba:
- La consola del navegador (F12 → Console) para ver errores
- Que el SQL se ejecutó correctamente en Supabase → Table Editor
- Que la URL de redirección de Google coincide exactamente con la de Supabase
