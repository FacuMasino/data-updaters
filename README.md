# data-updaters
Cron jobs actualizando la data de compara tasas.

## ¿Como funciona?

Los distintos scripts se ejecutan cada 3 horas usando [cloudflare workers](https://workers.cloudflare.com/) y buscan el rendimiento a distintas fuentes de informacion.

- [x] Camara Argentina de FCI
- [x] Api de yields de Buenbit
- [x] Api de yields de Fiwind
- [ ] Api de yields de Letsbit
- [x] Argentina datos - Endpoint Plazos Fijos

En supabase se updatea usando como key el id del instrumento (tiene que haber sido dado de alta a mano antes para elegir una imagen, nombre y descripción. Esto por ahora solo puede hacerlo ferminrp.

Un curl de una actualización ejemplo en donde XXXXXXXXX es el id que genero ferminrp en supabase para ese instrumento y 0.29856735 una tasa efectiva diaria de ejemplo

```
curl -X PATCH 'https://thklpacfwtrtuynqlnah.supabase.co/rest/v1/tasas-fci?id=eq.XXXXXXXXX' \
-H "apikey: SUPABASE_KEY" \
-H "Authorization: Bearer SUPABASE_KEY" \
-H "Content-Type: application/json" \
-H "Prefer: return=minimal" \
-d '{ "tasa_diaria": 0.29856735 }'
```

Es importante para calcular la tasa efectiva diaria considerar si es un insturmento que capitaliza todos los dias (fci, crypto) o cada cierto periodo como los plazos fijos.
