addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

addEventListener('scheduled', event => {
  event.waitUntil(handleScheduledEvent(event.scheduledTime));
});

async function handleRequest(request) {
  // Calculate the dates for the request
  const DAYS_CALC = 1;
  let lastWorkday = new Date();
  while (lastWorkday.getDay() > 5) {
    lastWorkday.setDate(lastWorkday.getDate() - 1);
  }
  lastWorkday.setDate(lastWorkday.getDate() - 1); // T-1 to allow time for updates

  let firstDate = new Date(lastWorkday);
  firstDate.setDate(firstDate.getDate() - DAYS_CALC);
  while (firstDate.getDay() > 5) {
    firstDate.setDate(firstDate.getDate() - 1);
  }

  const dates = [firstDate, lastWorkday].map(date => date.toISOString().split('T')[0]);

  // Fetch the fund values
  const urls = dates.map(date => `https://api.cafci.org.ar/estadisticas/informacion/diaria/4/${date}`);
  console.log(urls);
  const responses = await Promise.all(urls.map(url => fetch(url)));
  const jsonResponses = await Promise.all(responses.map(response => response.json()));
  const data = jsonResponses.map(response => response.data.filter(item => item != null));

  // Calculate rates
  const rates = {};
  data[1].forEach((item, index) => {
    if (data[0][index] && item.fondo === data[0][index].fondo) {
      rates[item.fondo] = ((item.vcp / data[0][index].vcp) - 1) * 100;
    }
  });

  // Define funds
  const funds = {
    'Personal Pay': 'Delta Pesos - Clase X',
    'Prex': 'Allaria Ahorro - Clase A',
    'Uala': 'Ualintec Ahorro Pesos - Clase A',
    'Mercado Pago': 'Mercado Fondo - Clase A',
    'Cocos': 'Cocos Ahorro - Clase A',
    'IEB': 'IEB Ahorro - Clase A',
    'Santander': 'Super Ahorro $ - Clase A',
    'Galicia': 'Fima Premium - Clase A',
    'Balanz': 'Balanz Capital Money Market - Clase A',
    'Claro Pay':'SBS Ahorro Pesos - Clase A',
    'n1u':'Delta Pesos - Clase A',
    'ICBC': 'Alpha Pesos - Clase A',
    'BBVA' : 'FBA Renta Pesos - Clase A',
    'Supervielle' : 'Premier Renta CP en Pesos - Clase A',
    'Banza' : 'Adcap Ahorro Pesos Fondo de Dinero - Clase A'
  };
  const updatePromises = [];
  Object.keys(funds).forEach(key => {
    const rate = rates[funds[key]];
    // Check if rate is defined and not equal to 0
    if (rate !== undefined && rate !== 0) {
      updatePromises.push(updateFundRate(key, rate));
    }
  });
  const updateResponses = await Promise.all(updatePromises);

  return new Response(JSON.stringify({ updateResponses }), {
    headers: { 'Content-Type': 'application/json' },
});

}

async function handleScheduledEvent(scheduledTime) {
  return handleRequest();
}

async function updateFundRate(name, rate) {
    console.log(`Actualizando ${name} a ${rate}`);
    const supabaseUrl = `https://thklpacfwtrtuynqlnah.supabase.co/rest/v1/tasas-fci?name=eq.${name}`;
    const apikey = 'SUPABASE_APIKEY'; 
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
    return response.status;
}
