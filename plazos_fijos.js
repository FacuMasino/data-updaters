const plazosFijos = [
    {
        "entidad" : "BANCO DE LA NACION ARGENTINA",
        "supabaseId" : 29
    },
    {
        "entidad" : "BANCO SANTANDER ARGENTINA S.A.",
        "supabaseId" : 30
    }
];

async function handleRequest(request) {
    try {
        const response = await fetch('https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo');
        const data = await response.json();

        for (const fund of data) {
            const tea = (Math.pow(1 + fund.tnaClientes / 12, 12) - 1);
            const dailyRate = (Math.pow(1 + tea, 1 / 365) - 1) * 100;
            const normalizedEntityName = fund.entidad.trim().toUpperCase();
            const fundInfo = plazosFijos.find(f => f.entidad.trim().toUpperCase() === normalizedEntityName);

            if (fundInfo) {
                const fundId = fundInfo.supabaseId;
                await updateFundRate(fundId, fund.entidad, dailyRate);
            } else {
                console.log(`Entidad no encontrada en plazosFijos: ${fund.entidad}`);
            }
        }
        return new Response(JSON.stringify(data), {status: 200}); // Asegúrate de devolver un objeto Response
    } catch (error) {
        console.error('Error fetching data:', error);
        // Devuelve un objeto Response incluso en caso de error
        return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {status: 500});
    }
}

async function updateFundRate(id, name, rate) {
    const updatedName = name.toUpperCase().replace('NUARS', 'Buenbit');
    console.log(`Updating ${name} (ID: ${id}) to ${rate}`);
    const supabaseUrl = `https://thklpacfwtrtuynqlnah.supabase.co/rest/v1/tasas-fci?id=eq.${id}`;
    const apikey = SUPABASE_API_KEY;
    const data = { tasa_diaria: rate };

    const response = await fetch(supabaseUrl, {
        method: 'PATCH',
        headers: {
            'apikey': apikey,
            'Authorization': `Bearer ${apikey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
    });
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

addEventListener('scheduled', event => {
    event.waitUntil(handleScheduledEvent(event));
});

async function handleScheduledEvent(event) {
    try {
        const response = await handleRequest();
        console.log('Scheduled event executed successfully', response);
    } catch (error) {
        console.error('Error during scheduled event execution:', error);
    }
}
