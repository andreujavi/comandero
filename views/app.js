// Estado global del carrito
let cart = [];
let total = 0;

// Función para añadir productos al ticket
function addToCart(name, price) {
    // Buscar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        // Si ya existe, sumamos uno a la cantidad
        existingItem.quantity += 1;
    } else {
        // Si no existe, lo añadimos nuevo
        cart.push({ name, price, quantity: 1 });
    }
    
    updateCartUI();
}

// Función para refrescar la interfaz del ticket
function updateCartUI() {
    const cartList = document.getElementById('cart-items');
    const totalSpan = document.getElementById('cart-total');
    
    // Limpiamos la lista visual antes de redibujarla
    cartList.innerHTML = '';
    total = 0;

    // Recorremos el carrito y creamos los elementos HTML
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal; // Sumamos al total global

        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${item.quantity}x</strong> ${item.name}</span>
            <span>€${itemTotal.toFixed(2)}</span>
        `;
        cartList.appendChild(li);
    });

    // Actualizamos el número gigante del total
    totalSpan.textContent = total.toFixed(2);
}

// Función para enviar la comanda al servidor
async function submitOrder() {
    // Evitar mandar comandas vacías
    if (cart.length === 0) {
        return alert('El ticket está vacío. Añade productos primero.');
    }
    
    const tableNumber = document.getElementById('tableNumber').value;
    
    try {
        // Hacemos la petición POST a nuestro servidor local
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table_number: parseInt(tableNumber),
                items: cart,
                total: parseFloat(total.toFixed(2))
            })
        });

        if (response.ok) {
            // Confirmación visual
            alert(`¡Comanda enviada a cocina! (Mesa ${tableNumber})`);
            
            // Vaciar el carrito y actualizar la interfaz para el siguiente cliente
            cart = []; 
            updateCartUI();
        } else {
            alert('Hubo un problema al guardar la comanda. Revisa la conexión.');
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert('Error de red. Asegúrate de estar conectado al WiFi del local.');
    }
}

sync function enviarComandaReal() {
            const URL_SERVIDOR = 'http://192.168.1.45:3000/api/pedidos'; // <--- Pon tu IP real de Windows

            const inputMesa = document.getElementById('select-mesa').value; 
            
            // Ejemplo básico recogiendo los textos de tu carrito
            const elementosCarrito = document.querySelectorAll('.item-carrito-plato'); 
            let textoDetalles = "";
            
            if (elementosCarrito.length > 0) {
                elementosCarrito.forEach(item => {
                    textoDetalles += item.innerText + ", ";
                });
            } else {
                textoDetalles = "Pedido general de la mesa " + inputMesa;
            }

            const comandaReal = {
                mesa_id: inputMesa,
                detalles: textoDetalles.trim()
            };

            try {
                const response = await fetch(URL_SERVIDOR, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(comandaReal)
                });

                const resultado = await response.json();

                if (resultado.success) {
                    alert("✅ ¡Comanda real enviada a cocina correctamente!");
                } else {
                    alert("❌ Error al procesar la comanda en el servidor.");
                }

            } catch (error) {
                console.error("Error de red:", error);
                alert("❌ No se pudo conectar con el servidor.");
            }
        }

        // Se conecta al botón real de tu tablet
        const botonEnviar = document.getElementById('btn-enviar-pedido');
        if (botonEnviar) {
            botonEnviar.addEventListener('click', enviarComandaReal);
        }