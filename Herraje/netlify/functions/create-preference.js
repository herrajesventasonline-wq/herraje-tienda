// netlify/functions/create-preference.js
const mercadopago = require('mercadopago');

// 1. Configura Mercado Pago con tu ACCESS_TOKEN secreto
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN // Usa una variable de entorno
});

exports.handler = async (event) => {
  // 2. Solo permite solicitudes POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 3. Obtiene los datos del carrito desde el frontend (tu app.js)
    const cartData = JSON.parse(event.body);

    // 4. Transforma los datos de tu carrito al formato que espera Mercado Pago
    const items = cartData.map(item => ({
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price, // O item.wholesalePrice según la lógica
      currency_id: 'ARS',
    }));

    // 5. Configura la preferencia de pago
    const preference = {
      items: items,
      back_urls: {
        success: 'https://tu-dominio.netlify.app/pago-exitoso.html',
        failure: 'https://tu-dominio.netlify.app/pago-fallido.html',
        pending: 'https://tu-dominio.netlify.app/pago-pendiente.html',
      },
      auto_return: 'approved', // Vuelve automáticamente al sitio tras pago aprobado[citation:6]
      // external_reference: "ID_DE_TU_PEDIDO", // Opcional: para vincular con tu DB
    };

    // 6. Crea la preferencia en los servidores de Mercado Pago[citation:6]
    const response = await mercadopago.preferences.create(preference);

    // 7. Devuelve el ID de la preferencia al frontend
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: response.body.id }),
    };
  } catch (error) {
    console.error('Error creando preferencia:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al crear la preferencia de pago' }),
    };
  }
};