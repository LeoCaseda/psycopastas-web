PsycoPastas - Configuracion de Supabase

1. Entra a Supabase.
2. Abri tu proyecto.
3. Anda a SQL Editor.
4. Copia y ejecuta todo el contenido de supabase_schema.sql.
5. Despues reemplaza los archivos de la web por los de este paquete.
6. Abri la pagina y hace Ctrl + F5.

Proteccion de Gestion con Supabase Auth:

1. En Supabase, anda a Authentication > Users.
2. Crea un usuario administrador con email y contraseña.
3. En SQL Editor, ejecuta supabase_auth_policies.sql.
4. Al final de ese archivo hay un INSERT comentado. Copialo, cambiale el email por el del administrador y ejecutalo.
5. En la pagina, entra a Gestion con ese email y contraseña.

Que guarda la base:

- catalog_items: productos, combos y ofertas.
- sauces: salsas.
- orders: pedidos o consultas generadas desde el boton de copiar/enviar.

Notas importantes:

- La pagina conserva localStorage como respaldo si Supabase no responde o si el SQL todavia no fue ejecutado.
- Si la base esta vacia, la primera carga intenta inicializar Supabase con el catalogo actual.
- La SUPABASE_PUBLISHABLE_KEY puede estar en el navegador. No uses nunca la service_role key en esta web.
- Despues de ejecutar supabase_auth_policies.sql, solo los usuarios incluidos en admin_users pueden crear, editar o eliminar catalogo.
