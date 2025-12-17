// ============================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ============================================

// Productos y Carrito
let products = [];
let cart = [];
let currentProductDetail = null;
let currentStep = 1;
let bestSellingProducts = [];
let placeholderImages = [];

// Filtros y Categorías
let currentCategory = null;
let activeSubcategoryFilters = [];
let priceRange = { min: 0, max: Infinity };

// Imágenes y Zoom
let currentProductImages = [];
let currentImageIndex = 0;
let isZooming = false;
let zoomLevel = 2;
let touchStartX = 0;
let touchEndX = 0;

// Paginación
let currentPage = 1;
let productsPerPage = 8;
let currentProducts = [];
let totalPages = 1;

// Mercado Pago
let mercadoPagoInstance = null;
let isMercadoPagoInitialized = false;
const MERCADO_PAGO_CONFIG = {
    publicKey: 'TEST-99d1fac3-3364-40cc-877f-9ac3dd6dffca',
    locale: 'es-AR'
};

// Datos de Subcategorías
const subcategoriesData = {
    "Todos los Productos": [
        "Ángulo", "Aldaba", "Alfombra", "Bandeja Extraíble", "Barral", "Barral L",
        "Base de Bocallave", "Bisagra", "Bocallave", "Burlete", "Canasto", "Cerrojo",
        "Cerradura", "Cierre", "Cilindro Euro", "Clavo", "Colgador", "Colgador de Cuadros",
        "Columna", "Corredera", "Cubeta", "Cubiertero", "Distanciador para Vidrio", "Enganche",
        "Espejo", "Esquinero", "Estante", "Falleba", "Gancho", "Grampa", "Hoja Adicional",
        "Imán", "Jabonera", "Juego de Placas", "Kit", "Kit Granero", "Kit para Vidrio",
        "Llavín para baño", "Manija", "Manija Barral", "Manija J", "Manijón", "Ménsula",
        "Mirilla", "Organizador", "Pasacable", "Pasador", "Pata", "Percha", "Perchero",
        "Perfil", "Perfil de Aplicar", "Pistón", "Placa", "Porta Escobilla", "Porta Residuos",
        "Porta Secador", "Portacandado", "Push Open", "Repisa", "Retén", "Riel", "Rueda",
        "Set Baño", "Soporte", "Tamiz", "Tapa", "Tarugo", "Tejido", "Tejido Mosquitero",
        "Tender", "Tirador", "Toallero", "Tope", "Tornillo", "Unión Zócalo", "Vértebra Pasacable", "Zócalo"
    ],
    "Linea Mueble": [
        "Manija Barral", "Imán", "Rueda", "Pata", "Cubeta", "Tirador", "Manija J",
        "Cerradura", "Barral L", "Bisagra", "Pistón", "Corredera",
        "Manija", "Tope", "Push Open", "Soporte", "Ménsula",
        "Percha"
    ],
    "Linea Aluminio": [
        "Tejido", "Tapa", "Zócalo", "Perfil", "Ángulo", "Bisagra", "Unión Zócalo", "Kit", "Hoja Adicional",
        "Tejido Mosquitero", "Tamiz", "Pasador", "Manijón", "Aldaba", "Cierre", "Enganche", "Manija",
        "Falleba"
    ],
    "Linea Baño": [
        "Barral", "Percha", "Espejo", "Porta Escobilla", "Bisagra", "Estante", "Toallero", "Jabonera", "Porta Secador",
        "Set Baño", "Perchero", "Esquinero", "Repisa", "Organizador"
    ],
    "Linea Puerta": [
        "Cierre", "Bisagra", "Mirilla", "Gancho", "Cilindro Euro", "Cerradura", "Retén", "Portacandado", "Pasador", "Manija", "Bocallave", "Base de Bocallave",
        "Llavín para baño", "Manijón", "Placa", "Juego de Placas", "Burlete"
    ],
    "Linea Cocina & Lavadero": [
        "Porta Residuos", "Cubiertero", "Tender", "Alfombra", "Bisagra", "Canasto", "Esquinero", "Bandeja Extraíble", "Columna"
    ],
    "Linea Vidrio": [
        "Vértebra Pasacable", "Pasacable", "Perfil de Aplicar", "Grampa", "Distanciador para Vidrio", "Kit para Vidrio",
        "Cerrojo", "Riel", "Soporte", "Bisagra"
    ],
    "Linea Portones": [
        "Kit Granero", "Rueda"
    ],
    "Herramientas": [
        "Grampa", "Colgador", "Tarugo", "Tornillo", "Clavo", "Retén", "Colgador de Cuadros"
    ]
};

// Instancias de Bootstrap
let modalInstances = {};

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================

document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 DOM cargado - Iniciando aplicación...');

    try {
        // 1. Inicializar modales
        initializeModals();

        // 2. Esperar a que Supabase esté listo
        await waitForSupabase();

        // 3. Cargar datos iniciales
        await loadInitialData();

        // 4. Configurar eventos
        setupEventListeners();

        // 5. Actualizar UI
        updateCartCount();
        updateCartBadge();

        console.log('✅ Aplicación inicializada correctamente');

    } catch (error) {
        console.error('❌ Error crítico en inicialización:', error);
        showErrorFallback();
    }
});

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

async function waitForSupabase() {
    console.log('⏳ Esperando Supabase...');

    // Si ya está listo, continuar
    if (window.supabaseClient && window.supabaseClient.isReady) {
        console.log('✅ Supabase ya está listo');
        return true;
    }

    // Esperar máximo 10 segundos
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 100; // 10 segundos

        const checkInterval = setInterval(() => {
            attempts++;

            if (window.supabaseClient && window.supabaseClient.isReady) {
                clearInterval(checkInterval);
                console.log('✅ Supabase cargado después de ' + (attempts * 100) + 'ms');
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn('⚠️ Timeout esperando Supabase');
                resolve(false);
            }
        }, 100);

        // También escuchar evento personalizado
        window.addEventListener('supabaseReady', () => {
            clearInterval(checkInterval);
            console.log('✅ Supabase listo por evento');
            resolve(true);
        });
    });
}

async function loadInitialData() {
    console.log('📦 Cargando datos iniciales...');

    // Cargar productos
    await loadProductsFromSupabase();

    // Cargar carrito
    loadCartFromStorage();

    // Inicializar Mercado Pago
    await initializeMercadoPago();
}

function initializeModals() {
    console.log('🔧 Inicializando modales...');

    const modals = [
        { id: 'productDetailModal', key: 'productDetail' },
        { id: 'loginModal', key: 'login' },
        { id: 'registerModal', key: 'register' },
        { id: 'checkoutModal', key: 'checkout' }
    ];

    modals.forEach(modal => {
        const element = document.getElementById(modal.id);
        if (element && bootstrap && bootstrap.Modal) {
            modalInstances[modal.key] = new bootstrap.Modal(element, {
                backdrop: 'static',
                keyboard: true
            });

            // Configurar eventos de cierre
            element.addEventListener('hidden.bs.modal', function () {
                if (modal.key === 'productDetail') {
                    resetImageZoom();
                }
                if (modal.key === 'checkout') {
                    resetCheckoutForm();
                }
            });
        }
    });
}

// ============================================
// FUNCIONES DE PRODUCTOS
// ============================================

async function loadProductsFromSupabase() {
    try {
        console.log('🔄 Cargando productos desde Supabase...');

        // Verificar que Supabase esté disponible
        if (!window.supabaseClient) {
            throw new Error('Cliente Supabase no disponible');
        }

        let productsData;

        // Intentar diferentes métodos para obtener productos
        if (typeof window.supabaseClient.getProducts === 'function') {
            productsData = await window.supabaseClient.getProducts();
        } else if (window.supabaseClient.supabase) {
            // Usar método directo
            const { data, error } = await window.supabaseClient.supabase
                .from('products')
                .select(`
                    *,
                    categories(name),
                    brands(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            productsData = data;
        } else {
            throw new Error('No hay método disponible para obtener productos');
        }

        if (!productsData || productsData.length === 0) {
            console.log('ℹ️ No hay productos en la base de datos');
            products = [];
            return;
        }

        console.log(`✅ ${productsData.length} productos recibidos`);

        // Procesar productos
        products = productsData.map(product => processProductData(product)).filter(Boolean);

        // Cargar productos populares
        loadPopularProducts();

        // Actualizar contador
        updateCartCount();

    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showToast('error', 'Error al cargar productos: ' + error.message);
    }
}

function processProductData(product) {
    try {
        // Procesar imágenes
        const productImages = processProductImages(product);

        return {
            id: product.id,
            name: product.name || 'Producto sin nombre',
            price: product.retail_price || 0,
            wholesalePrice: product.wholesale_price || (product.retail_price * 0.85),
            wholesaleLimit: product.wholesale_limit || 10,
            image: productImages.length > 0 ? productImages[0] : getDefaultImage(product.name),
            images: productImages,
            category: product.categories?.name || 'Sin categoría',
            description: product.description || 'Descripción no disponible',
            specifications: product.specifications || {},
            technical_details: product.technical_details || '',
            colors: product.colors || [],
            discount: 0,
            stock: product.stock || 0,
            min_stock: product.min_stock || 0,
            tags: product.colors || [],
            isNew: isProductNew(product.created_at),
            sku: product.sku || '',
            brand: product.brands?.name || '',
            click_count: product.click_count || 0,
            sold_count: product.sold_count || 0
        };
    } catch (error) {
        console.error('Error procesando producto:', error);
        return null;
    }
}

function processProductImages(product) {
    let imagesArray = [];

    // Intentar extraer imágenes del producto
    if (product.images) {
        if (Array.isArray(product.images)) {
            imagesArray = product.images.filter(img => img && typeof img === 'string');
        } else if (typeof product.images === 'string') {
            try {
                const parsed = JSON.parse(product.images);
                if (Array.isArray(parsed)) {
                    imagesArray = parsed.filter(img => img && typeof img === 'string');
                } else if (parsed && typeof parsed === 'string') {
                    imagesArray = [parsed];
                }
            } catch (e) {
                imagesArray = [product.images];
            }
        }
    }

    // Si no hay imágenes, usar la imagen principal
    if (imagesArray.length === 0 && product.main_image && typeof product.main_image === 'string') {
        imagesArray = [product.main_image];
    }

    // Convertir a URLs válidas
    return imagesArray.map(img => {
        if (!img || img === 'null' || img === 'undefined') {
            return getDefaultImage(product.name);
        }

        if (img.startsWith('http://') || img.startsWith('https://')) {
            return img;
        }

        if (img.includes('.') && !img.includes('/')) {
            return `https://opueqifkagoonpbubflj.supabase.co/storage/v1/object/public/product-images/${encodeURIComponent(img)}`;
        }

        return img;
    }).filter(img => img !== null);
}

function isProductNew(createdAt) {
    if (!createdAt) return false;
    try {
        const createdDate = new Date(createdAt);
        const diffTime = Math.abs(new Date() - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    } catch (error) {
        return false;
    }
}

// ============================================
// FUNCIONES DE UI - PRODUCTOS
// ============================================

function displayProducts(productsToDisplay = products, title = "Productos") {
    const section = document.getElementById('products-section');
    const sectionTitle = document.getElementById('products-section-title');
    const showAllBtn = document.getElementById('show-all-btn');

    if (!section) return;

    // Configurar productos actuales
    currentProducts = productsToDisplay;
    currentPage = 1;

    // Mostrar la sección
    section.style.display = 'block';
    if (sectionTitle) sectionTitle.textContent = title;

    // Mostrar botón "Ver Todos"
    if (showAllBtn) {
        showAllBtn.style.display = productsToDisplay.length !== products.length ? 'block' : 'none';
    }

    // Renderizar página actual
    renderCurrentPage();

    // Scroll a la sección
    scrollToProductsSection();
}

function displayProductsPage(productsToDisplay) {
    let container = document.getElementById('filtered-products-container');

    if (!container) {
        container = document.getElementById('products-container');
    }

    if (!container) return;

    container.innerHTML = '';

    if (!productsToDisplay || productsToDisplay.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                <h4 class="text-muted">No se encontraron productos</h4>
                <p class="text-muted">Intenta con otros filtros o categoría</p>
            </div>
        `;
        return;
    }

    productsToDisplay.forEach(product => {
        const discountBadge = product.discount > 0 ?
            `<span class="product-badge">-${product.discount}%</span>` : '';

        const newBadge = product.isNew ?
            `<span class="product-badge" style="background: var(--secondary);">Nuevo</span>` : '';

        const outOfStockBadge = product.stock <= 0 ?
            `<span class="product-badge" style="background: var(--accent);">Sin Stock</span>` : '';

        const lowStockBadge = product.stock > 0 && product.stock <= (product.min_stock || 5) ?
            `<span class="product-badge" style="background: #ffc107; color: #000;">Últimas unidades</span>` : '';

        const isOutOfStock = product.stock <= 0;

        const productCard = `
            <div class="product-card-wrapper">
                <div class="card product-card ${isOutOfStock ? 'opacity-75' : ''} h-100">
                    <div class="position-relative">
                        <img src="${product.image}" class="card-img-top product-image" alt="${product.name}" 
                             onerror="this.src='${getDefaultImage(product.name)}'; this.onerror=null;"
                             onclick="${!isOutOfStock ? `showProductDetail('${product.id}')` : ''}" 
                             style="${isOutOfStock ? 'cursor: not-allowed;' : 'cursor: pointer;'}">
                        ${discountBadge}
                        ${newBadge}
                        ${outOfStockBadge}
                        ${lowStockBadge}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="product-title" onclick="${!isOutOfStock ? `showProductDetail('${product.id}')` : ''}" 
                            style="${isOutOfStock ? 'cursor: not-allowed; color: #6c757d;' : 'cursor: pointer;'}">
                            ${product.name}
                        </h5>
                        <p class="product-category small text-muted">${product.category}</p>
                        ${product.brand ? `<p class="product-brand small text-muted mb-2">Marca: ${product.brand}</p>` : ''}
                        
                        <div class="price-container mt-auto">
                            <div class="price" id="price-${product.id}">$${(product.price || 0).toLocaleString('es-AR')}</div>
                            <div class="wholesale-info" id="wholesale-info-${product.id}" style="display: none;">
                                <div class="wholesale-price">$${(product.wholesalePrice || 0).toLocaleString('es-AR')}</div>
                                <div class="wholesale-limit small text-muted">(Mín. ${product.wholesaleLimit} unid.)</div>
                            </div>
                            <button class="btn btn-outline-secondary btn-sm mt-1" onclick="toggleWholesalePrice('${product.id}')" id="wholesale-btn-${product.id}">
                                <i class="fas fa-eye me-1"></i> Ver mayorista
                            </button>
                        </div>
                        
                        ${!isOutOfStock ? `
                        <div class="quantity-controls mt-2">
                            <button type="button" class="quantity-btn" onclick="decrementQuantity('${product.id}')">-</button>
                            <input type="text" class="quantity-input" id="quantity-${product.id}" value="1" readonly>
                            <button type="button" class="quantity-btn" onclick="incrementQuantity('${product.id}')">+</button>
                        </div>
                        <div class="d-flex gap-2 mt-3">
                            <button type="button" class="btn btn-primary flex-grow-1" onclick="addToCart('${product.id}')">
                                <i class="fas fa-cart-plus me-1"></i> Agregar
                            </button>
                            <button type="button" class="btn btn-outline-primary" onclick="showProductDetail('${product.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        ` : `
                        <div class="mt-3">
                            <button class="btn btn-secondary w-100" disabled>
                                <i class="fas fa-times-circle me-1"></i> Sin Stock
                            </button>
                        </div>
                        `}
                        
                        ${product.stock > 0 && product.stock <= 10 ? `
                            <div class="mt-2 text-warning small">
                                <i class="fas fa-exclamation-triangle"></i> Solo ${product.stock} disponibles
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += productCard;
    });
}

// ============================================
// FUNCIONES DE DETALLE DE PRODUCTO
// ============================================

function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showToast('error', 'Producto no encontrado');
        return;
    }

    currentProductDetail = product;
    currentProductImages = product.images.length > 0 ? product.images : [getDefaultImage(product.name)];
    currentImageIndex = 0;

    // Actualizar contenido del modal
    document.getElementById('detailProductName').textContent = product.name;
    document.getElementById('detailProductCategory').textContent = product.category;
    document.getElementById('detailProductDescription').textContent = product.description;
    document.getElementById('detailRetailPrice').textContent = `$${product.price.toLocaleString('es-AR')}`;
    document.getElementById('detailWholesalePrice').textContent = `$${product.wholesalePrice.toLocaleString('es-AR')}`;
    document.getElementById('detailWholesaleInfoText').textContent = `Mínimo ${product.wholesaleLimit} unidades`;
    document.getElementById('detailQuantity').value = '1';

    // Resetear precios mayoristas
    const wholesaleSection = document.getElementById('detailWholesaleSection');
    const wholesaleBtn = document.getElementById('detailWholesaleBtn');

    if (wholesaleSection) {
        wholesaleSection.style.display = 'none';
    }

    if (wholesaleBtn) {
        wholesaleBtn.innerHTML = '<i class="fas fa-eye me-1"></i> Ver mayorista';
        wholesaleBtn.classList.remove('btn-outline-primary');
        wholesaleBtn.classList.add('btn-outline-secondary');
    }

    // Configurar imágenes
    setupProductImages();

    // Configurar especificaciones
    setupProductSpecifications(product);

    // Mostrar modal
    showModal('productDetail');
}

function setupProductImages() {
    const mainImage = document.getElementById('detailMainImage');
    const thumbnailsContainer = document.getElementById('detailThumbnails');
    const currentImageIndexSpan = document.getElementById('currentImageIndex');
    const totalImagesSpan = document.getElementById('totalImages');

    if (mainImage) {
        mainImage.src = currentProductImages[0];
        mainImage.onerror = function () {
            this.src = getDefaultImage(currentProductDetail.name);
            this.onerror = null;
        };
    }

    if (currentImageIndexSpan && totalImagesSpan) {
        currentImageIndexSpan.textContent = '1';
        totalImagesSpan.textContent = currentProductImages.length.toString();
    }

    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';

        currentProductImages.forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = image;
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.onerror = function () {
                this.src = getDefaultImage(currentProductDetail.name);
                this.onerror = null;
            };
            thumbnail.onclick = () => {
                changeToImage(index);
            };
            thumbnailsContainer.appendChild(thumbnail);
        });
    }

    // Configurar zoom después de un breve delay
    setTimeout(() => {
        setupImageZoom();
        setupTouchGestures();
    }, 100);
}

function setupProductSpecifications(product) {
    const metaContainer = document.getElementById('detailProductMeta');
    if (metaContainer) {
        metaContainer.innerHTML = '';

        if (product.specifications && Object.keys(product.specifications).length > 0) {
            for (const [key, value] of Object.entries(product.specifications)) {
                const metaItem = document.createElement('div');
                metaItem.className = 'meta-item';
                metaItem.innerHTML = `<div class="meta-label">${key}:</div><div class="meta-value">${value}</div>`;
                metaContainer.appendChild(metaItem);
            }
        } else {
            metaContainer.innerHTML = '<div class="text-muted">No hay especificaciones disponibles</div>';
        }
    }
}

// ============================================
// FUNCIONES DE IMÁGENES Y ZOOM
// ============================================

function setupImageZoom() {
    const container = document.getElementById('imageZoomContainer');
    const image = document.getElementById('detailMainImage');
    const lens = document.getElementById('zoomLens');
    const zoomWindow = document.getElementById('zoomWindow');

    if (!container || !image || !lens || !zoomWindow) return;

    // Limpiar eventos previos
    container.removeEventListener('mousemove', handleMouseMove);
    container.removeEventListener('mouseenter', handleMouseEnter);
    container.removeEventListener('mouseleave', handleMouseLeave);
    container.removeEventListener('click', handleImageClick);

    // Configurar eventos
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleImageClick);

    // Crear imagen para la ventana de zoom
    const zoomImg = document.createElement('img');
    zoomImg.src = image.src;
    zoomWindow.innerHTML = '';
    zoomWindow.appendChild(zoomImg);

    function handleMouseEnter() {
        if (window.innerWidth > 768) {
            lens.style.display = 'block';
            zoomWindow.style.display = 'block';
            container.classList.add('zooming');
        }
    }

    function handleMouseLeave() {
        lens.style.display = 'none';
        zoomWindow.style.display = 'none';
        container.classList.remove('zooming');
        isZooming = false;
    }

    function handleMouseMove(e) {
        if (!isZooming || window.innerWidth <= 768) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Mover lente
        const lensSize = 150;
        let lensX = x - lensSize / 2;
        let lensY = y - lensSize / 2;

        // Mantener lente dentro del contenedor
        lensX = Math.max(0, Math.min(lensX, rect.width - lensSize));
        lensY = Math.max(0, Math.min(lensY, rect.height - lensSize));

        lens.style.left = lensX + 'px';
        lens.style.top = lensY + 'px';

        // Calcular posición del zoom
        const zoomX = (lensX / (rect.width - lensSize)) * (zoomImg.naturalWidth - zoomWindow.clientWidth);
        const zoomY = (lensY / (rect.height - lensSize)) * (zoomImg.naturalHeight - zoomWindow.clientHeight);

        // Posicionar ventana de zoom
        zoomWindow.style.left = (rect.right + 10) + 'px';
        zoomWindow.style.top = rect.top + 'px';

        // Aplicar zoom
        zoomImg.style.transform = `scale(${zoomLevel}) translate(-${zoomX}px, -${zoomY}px)`;
    }

    function handleImageClick(e) {
        if (window.innerWidth <= 768) return;

        if (!isZooming) {
            isZooming = true;
            container.classList.add('zooming');
            lens.style.display = 'block';
            zoomWindow.style.display = 'block';

            // Posicionar ventana de zoom
            const rect = container.getBoundingClientRect();
            zoomWindow.style.left = (rect.right + 10) + 'px';
            zoomWindow.style.top = rect.top + 'px';
        } else {
            isZooming = false;
            container.classList.remove('zooming');
            lens.style.display = 'none';
            zoomWindow.style.display = 'none';
        }

        // Actualizar posición inicial
        handleMouseMove(e);
    }
}

function setupTouchGestures() {
    const container = document.getElementById('imageZoomContainer');
    if (!container) return;

    // Limpiar eventos previos
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);

    // Configurar eventos táctiles
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        e.preventDefault();
    }

    function handleTouchMove(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
        }
    }

    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipeGesture();
    }
}

function handleSwipeGesture() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Deslizamiento a la izquierda - siguiente imagen
            changeProductImage(1);
        } else {
            // Deslizamiento a la derecha - imagen anterior
            changeProductImage(-1);
        }
    }
}

function changeProductImage(direction) {
    if (currentProductImages.length <= 1) return;

    currentImageIndex += direction;

    // Circular entre imágenes
    if (currentImageIndex < 0) {
        currentImageIndex = currentProductImages.length - 1;
    } else if (currentImageIndex >= currentProductImages.length) {
        currentImageIndex = 0;
    }

    changeToImage(currentImageIndex);
}

function changeToImage(index) {
    if (index < 0 || index >= currentProductImages.length) return;

    currentImageIndex = index;
    const mainImage = document.getElementById('detailMainImage');
    const currentImageIndexSpan = document.getElementById('currentImageIndex');
    const thumbnails = document.querySelectorAll('.thumbnail');

    if (mainImage) {
        // Agregar animación
        mainImage.classList.remove('fade-in');
        void mainImage.offsetWidth; // Trigger reflow
        mainImage.classList.add('fade-in');

        mainImage.src = currentProductImages[index];
    }

    if (currentImageIndexSpan) {
        currentImageIndexSpan.textContent = (index + 1).toString();
    }

    // Actualizar miniatura activa
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });

    // Actualizar ventana de zoom si está activa
    const zoomWindow = document.getElementById('zoomWindow');
    if (zoomWindow && zoomWindow.style.display === 'block') {
        const zoomImg = zoomWindow.querySelector('img');
        if (zoomImg) {
            zoomImg.src = currentProductImages[index];
        }
    }
}

function resetImageZoom() {
    const lens = document.getElementById('zoomLens');
    const zoomWindow = document.getElementById('zoomWindow');
    const container = document.getElementById('imageZoomContainer');

    if (lens) lens.style.display = 'none';
    if (zoomWindow) zoomWindow.style.display = 'none';
    if (container) container.classList.remove('zooming');

    isZooming = false;
    currentProductImages = [];
    currentImageIndex = 0;
}

// ============================================
// FUNCIONES DE CARRITO
// ============================================

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('nombreSitioCart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            renderCart();
        }
    } catch (error) {
        console.error('Error cargando carrito:', error);
        cart = [];
    }
}

function addToCart(productId, quantity = null) {
    if (!quantity) {
        const quantityInput = document.getElementById(`quantity-${productId}`);
        quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Verificar stock
    if (quantity > product.stock) {
        showToast('error', 'No hay suficiente stock disponible');
        return;
    }

    // Buscar producto en carrito
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity + quantity > product.stock) {
            showToast('error', 'No hay suficiente stock disponible');
            return;
        }
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            wholesalePrice: product.wholesalePrice,
            wholesaleLimit: product.wholesaleLimit,
            image: product.image,
            quantity: quantity
        });
    }

    updateCart();

    // Resetear cantidad
    if (!quantity) {
        const quantityInput = document.getElementById(`quantity-${productId}`);
        if (quantityInput) quantityInput.value = 1;
    }

    showToast('success', `${product.name} agregado al carrito`);
}

function updateCart() {
    renderCart();
    updateCartBadge();
    updateCartCount();
    saveCartToStorage();
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-shopping-cart fa-3x mb-3"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        updateCartTotals();
        return;
    }

    let cartHTML = '';

    cart.forEach(item => {
        const price = item.quantity >= item.wholesaleLimit ? item.wholesalePrice : item.price;
        const itemTotal = price * item.quantity;

        cartHTML += `
            <div class="cart-item">
                <div class="d-flex align-items-start">
                    <img src="${item.image}" class="cart-item-image" alt="${item.name}" 
                         onerror="this.src='${getDefaultImage(item.name)}'; this.onerror=null;"
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
                    <div class="cart-item-details" style="flex: 1;">
                        <div class="cart-item-title" style="font-weight: 600; margin-bottom: 5px;">${item.name}</div>
                        <div class="cart-item-price">$${price.toLocaleString('es-AR')} c/u</div>
                        ${item.quantity >= item.wholesaleLimit ?
                '<span class="badge bg-success mt-1">Precio mayorista</span>' : ''}
                    </div>
                    <div class="cart-item-controls">
                        <div class="d-flex align-items-center mb-2">
                            <button class="btn btn-sm btn-outline-secondary" 
                                    onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <span class="mx-2">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary" 
                                    onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold">$${itemTotal.toLocaleString('es-AR')}</div>
                            <button class="btn btn-sm btn-link text-danger p-0" 
                                    onclick="removeFromCart('${item.id}')">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    cartContainer.innerHTML = cartHTML;
    updateCartTotals();
}

function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
        showToast('error', 'No hay suficiente stock disponible');
        return;
    }

    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        updateCart();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    showToast('success', 'Producto eliminado del carrito');
}

function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function updateCartTotals() {
    let subtotal = 0;

    cart.forEach(item => {
        const price = item.quantity >= item.wholesaleLimit ? item.wholesalePrice : item.price;
        subtotal += price * item.quantity;
    });

    const shipping = 0; // Gratis
    const discount = 0;
    const total = subtotal + shipping - discount;

    // Actualizar UI
    const subtotalElement = document.getElementById('cart-subtotal');
    const shippingElement = document.getElementById('cart-shipping');
    const discountElement = document.getElementById('cart-discount');
    const totalElement = document.getElementById('cart-total');

    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toLocaleString('es-AR')}`;
    if (shippingElement) shippingElement.textContent = shipping === 0 ? 'A confirmar' : `$${shipping.toLocaleString('es-AR')}`;
    if (discountElement) discountElement.textContent = discount === 0 ? '$0.00' : `-$${discount.toLocaleString('es-AR')}`;
    if (totalElement) totalElement.textContent = `$${total.toLocaleString('es-AR')}`;
}

function saveCartToStorage() {
    localStorage.setItem('nombreSitioCart', JSON.stringify(cart));
}

// ============================================
// FUNCIONES DE CHECKOUT
// ============================================

function openCheckoutFromCart() {
    console.log('Abriendo checkout desde carrito...');

    // Cerrar offcanvas del carrito si está abierto
    const cartOffcanvasElement = document.getElementById('cartOffcanvas');
    if (cartOffcanvasElement) {
        const cartOffcanvas = bootstrap.Offcanvas.getInstance(cartOffcanvasElement);
        if (cartOffcanvas) {
            cartOffcanvas.hide();
        }
    }

    // Reiniciar formulario
    resetCheckoutForm();

    // Actualizar resumen
    updateCheckoutSummary();

    // Mostrar modal
    setTimeout(() => {
        showModal('checkout');
    }, 300);
}

function resetCheckoutForm() {
    console.log('Reseteando formulario de checkout...');
    currentStep = 1;

    // Resetear todos los pasos
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active', 'completed');
    });

    // Activar primer paso
    const firstStep = document.querySelector('.checkout-step[data-step="1"]');
    if (firstStep) firstStep.classList.add('active');

    // Resetear formularios
    document.querySelectorAll('.checkout-form').forEach((form, index) => {
        form.classList.remove('active');
        if (index === 0) form.classList.add('active');

        // Limpiar inputs
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit') {
                input.value = '';
            }
        });
    });

    // Resetear selecciones
    document.querySelectorAll('.payment-method, .shipping-option').forEach(element => {
        element.classList.remove('active');
    });

    // Activar primeras opciones por defecto
    const firstPaymentMethod = document.querySelector('.payment-method[data-method="mercado-pago"]');
    const firstShippingOption = document.querySelector('.shipping-option[data-shipping="domicilio"]');

    if (firstPaymentMethod) firstPaymentMethod.classList.add('active');
    if (firstShippingOption) {
        firstShippingOption.classList.add('active');
        const shippingAddressForm = document.getElementById('shippingAddressForm');
        if (shippingAddressForm) shippingAddressForm.style.display = 'block';
    }

    // Resetear resumen
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTotal = document.getElementById('summaryTotal');
    const orderSummary = document.getElementById('orderSummary');

    if (summarySubtotal) summarySubtotal.textContent = '$0';
    if (summaryTotal) summaryTotal.textContent = '$0';
    if (orderSummary) orderSummary.innerHTML = '';
}

function updateCheckoutSummary() {
    const subtotal = cart.reduce((total, item) => {
        const price = item.quantity >= item.wholesaleLimit ? item.wholesalePrice : item.price;
        return total + (price * item.quantity);
    }, 0);

    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTotal = document.getElementById('summaryTotal');

    if (summarySubtotal) summarySubtotal.textContent = `$${subtotal.toLocaleString('es-AR')}`;
    if (summaryTotal) summaryTotal.textContent = `$${subtotal.toLocaleString('es-AR')}`;
}

// ============================================
// FUNCIONES DE MERCADO PAGO
// ============================================

async function initializeMercadoPago() {
    try {
        if (isMercadoPagoInitialized && mercadoPagoInstance) {
            return mercadoPagoInstance;
        }

        // Verificar que el SDK esté disponible
        if (typeof MercadoPago === 'undefined') {
            console.warn('MercadoPago SDK no cargado, intentando cargar...');

            // Cargar SDK dinámicamente
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://sdk.mercadopago.com/js/v2';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        mercadoPagoInstance = new MercadoPago(MERCADO_PAGO_CONFIG.publicKey, {
            locale: MERCADO_PAGO_CONFIG.locale
        });

        isMercadoPagoInitialized = true;
        console.log('✅ Mercado Pago inicializado correctamente');
        return mercadoPagoInstance;

    } catch (error) {
        console.error('❌ Error inicializando Mercado Pago:', error);
        showToast('error', 'No se pudo inicializar el sistema de pagos');
        return null;
    }
}

function showPaymentMethod(method) {
    // Ocultar todos los contenedores primero
    const containers = ['mercado-pago-container', 'transferencia-container', 'tarjeta-container'];
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) container.style.display = 'none';
    });

    // Mostrar el contenedor seleccionado
    switch (method) {
        case 'mercado-pago':
            const mpContainer = document.getElementById('mercado-pago-container');
            if (mpContainer) {
                mpContainer.style.display = 'block';
                initializeMercadoPagoButton();
            }
            break;

        case 'transferencia':
            const transferContainer = document.getElementById('transferencia-container');
            if (transferContainer) transferContainer.style.display = 'block';
            break;

        case 'tarjeta':
            const cardContainer = document.getElementById('tarjeta-container');
            if (cardContainer) {
                cardContainer.style.display = 'block';
                initializeCreditCardButton();
            }
            break;
    }
}

async function initializeMercadoPagoButton() {
    if (!mercadoPagoInstance) {
        await initializeMercadoPago();
    }

    const total = calculateCartTotal();

    // Crear preferencia (en producción esto debe hacerse en el backend)
    const preference = {
        items: cart.map(item => ({
            title: item.name,
            quantity: item.quantity,
            unit_price: item.quantity >= item.wholesaleLimit ? item.wholesalePrice : item.price,
            currency_id: 'ARS'
        })),
        back_urls: {
            success: window.location.origin + '/pago-exitoso.html',
            failure: window.location.origin + '/pago-fallido.html',
            pending: window.location.origin + '/pago-pendiente.html'
        },
        auto_return: 'approved',
        external_reference: `PEDIDO-${Date.now()}`
    };

    // Crear botón de Mercado Pago
    if (mercadoPagoInstance) {
        mercadoPagoInstance.checkout({
            preference: preference,
            render: {
                container: '#mercadopago-button',
                label: 'Pagar con Mercado Pago'
            }
        });
    }
}

function calculateCartTotal() {
    return cart.reduce((total, item) => {
        const price = item.quantity >= item.wholesaleLimit ? item.wholesalePrice : item.price;
        return total + (price * item.quantity);
    }, 0);
}

function confirmTransferenciaPayment() {
    const orderNumber = `PED-${Date.now()}`;
    const total = calculateCartTotal();

    // Crear mensaje para WhatsApp
    let message = `*CONFIRMACIÓN DE TRANSFERENCIA BANCARIA*\n\n`;
    message += `Número de Pedido: ${orderNumber}\n`;
    message += `Monto a Transferir: $${total.toLocaleString('es-AR')}\n\n`;
    message += `*Datos para la transferencia:*\n`;
    message += `Banco: Banco de Ejemplo\n`;
    message += `Titular: Nombre-sitio S.A.\n`;
    message += `CUIL/CUIT: 30-12345678-9\n`;
    message += `CBU: 1234567890123456789012\n`;
    message += `Alias: nombre.sitio.ventas\n\n`;
    message += `*Importante:*\n`;
    message += `1. Realiza la transferencia por el monto exacto\n`;
    message += `2. Envía el comprobante por este chat\n`;
    message += `3. Tu pedido se procesará una vez confirmado el pago`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = '543584363974';
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Abrir WhatsApp
    window.open(whatsappURL, '_blank');

    // Mostrar confirmación
    showToast('success', 'Instrucciones de transferencia enviadas por WhatsApp');

    // Cerrar modal después de un tiempo
    setTimeout(() => {
        hideModal('checkout');
        resetCheckoutForm();
    }, 3000);
}

// ============================================
// FUNCIONES DE FILTROS Y CATEGORÍAS
// ============================================

function filterByCategory(categoryName) {
    console.log(`Filtrando por categoría: ${categoryName}`);

    if (products.length === 0) {
        showToast('error', 'Los productos aún se están cargando. Por favor, espera un momento.');
        return;
    }

    currentCategory = categoryName;
    activeSubcategoryFilters = [];

    // Filtrar productos
    let filteredProducts;
    if (categoryName === 'Todos los Productos') {
        filteredProducts = products;
    } else {
        filteredProducts = products.filter(product =>
            product.category.toLowerCase().includes(categoryName.toLowerCase()) ||
            (product.name && product.name.toLowerCase().includes(categoryName.toLowerCase()))
        );
    }

    // Mostrar resultados y filtros
    displayFilteredProductsWithFilters(filteredProducts, categoryName);
}

function displayFilteredProductsWithFilters(filteredProducts, categoryName) {
    if (!filteredProducts || filteredProducts.length === 0) {
        displayProducts([], `No hay productos en ${categoryName}`);
        showToast('error', `No se encontraron productos en ${categoryName}`);
        return;
    }

    const section = document.getElementById('products-section');
    const sectionTitle = document.getElementById('products-section-title');

    if (section) section.style.display = 'block';
    if (sectionTitle) sectionTitle.textContent = `${categoryName} `;

    currentProducts = filteredProducts;
    currentPage = 1;

    renderSubcategoryFilters(categoryName);
    renderCurrentPage();
    scrollToProductsSection();
}

function renderSubcategoryFilters(categoryName) {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    const subcategories = subcategoriesData[categoryName] || [];

    if (subcategories.length === 0) {
        productsContainer.innerHTML = '<div id="filtered-products-container"></div>';
        return;
    }

    let layoutHTML = `
        <div class="products-with-filters">
            <!-- Columna de Filtros (desktop) -->
            <div class="subcategories-filters desktop-filters">
                <div class="filter-header">
                    <h3 class="filter-title">Filtrar por Subcategorías</h3>
                </div>
                <div class="filter-groups">
    `;

    // Agregar subcategorías
    const sortedSubcategories = [...subcategories].sort();

    sortedSubcategories.forEach(subcategory => {
        const isChecked = activeSubcategoryFilters.includes(subcategory);
        layoutHTML += `
            <div class="filter-option">
                <input type="checkbox" id="filter-${subcategory.replace(/\s+/g, '-')}" 
                       ${isChecked ? 'checked' : ''} 
                       onchange="toggleSubcategoryFilter('${subcategory}')">
                <label for="filter-${subcategory.replace(/\s+/g, '-')}">${subcategory}</label>
            </div>
        `;
    });

    layoutHTML += `
                </div>
                
                <!-- FILTRO DE PRECIO -->
                <div class="filter-group">
                    <div class="filter-group-title">Filtrar por Precio</div>
                    <div class="price-filter">
                        <div class="price-inputs">
                            <input type="number" id="price-min" placeholder="Mínimo" class="form-control" min="0">
                            <span>a</span>
                            <input type="number" id="price-max" placeholder="Máximo" class="form-control" min="0">
                        </div>
                        <button class="btn btn-primary btn-sm mt-2" onclick="applyPriceFilter()">Aplicar</button>
                        <button class="clear-filters" onclick="clearAllFilters()">
                            <i class="fas fa-times"></i> Limpiar
                        </button>
                    </div>
                </div>
                
                <div class="active-filters" id="active-filters-container"></div>
            </div>
            
            <!-- Columna de Productos -->
            <div class="products-content" style="width: 100%;">
                <div class="products-header">
                    <div class="d-flex align-items-center">
                        <span class="me-2 text-muted" id="products-count">Mostrando 0 productos</span>
                        <div class="form-group mb-0 ms-3">
                            <select class="form-select form-select-sm" id="products-per-page">
                                <option value="8">8 por página</option>
                                <option value="12">12 por página</option>
                                <option value="16">16 por página</option>
                                <option value="20">20 por página</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="products-grid" id="filtered-products-container"></div>
                
                <!-- Paginación -->
                <div class="row mt-5">
                    <div class="col-12">
                        <nav aria-label="Paginación de productos">
                            <ul class="pagination justify-content-center" id="products-pagination"></ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    `;

    productsContainer.innerHTML = layoutHTML;

    setupPagination();
    updateActiveFiltersDisplay();
    applySubcategoryFilters();
}

function toggleSubcategoryFilter(subcategory) {
    const index = activeSubcategoryFilters.indexOf(subcategory);

    if (index === -1) {
        activeSubcategoryFilters.push(subcategory);
    } else {
        activeSubcategoryFilters.splice(index, 1);
    }

    applySubcategoryFilters();
}

function applyPriceFilter() {
    const minInput = document.getElementById('price-min');
    const maxInput = document.getElementById('price-max');

    priceRange = {
        min: minInput.value ? parseFloat(minInput.value) : 0,
        max: maxInput.value ? parseFloat(maxInput.value) : Infinity
    };

    applySubcategoryFilters();
}

function applySubcategoryFilters() {
    if (!currentCategory) return;

    let filteredProducts;

    if (currentCategory === "Todos los Productos") {
        filteredProducts = products;
    } else {
        filteredProducts = products.filter(product =>
            product.category.toLowerCase().includes(currentCategory.toLowerCase())
        );
    }

    // Aplicar filtros de subcategorías
    if (activeSubcategoryFilters.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
            const productText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
            return activeSubcategoryFilters.some(filter =>
                productText.includes(filter.toLowerCase())
            );
        });
    }

    // Aplicar filtro de precio
    filteredProducts = filteredProducts.filter(product => {
        const price = product.price;
        return price >= priceRange.min && price <= priceRange.max;
    });

    // Actualizar display
    const sectionTitle = document.getElementById('products-section-title');
    if (sectionTitle) {
        const filterText = activeSubcategoryFilters.length > 0 ?
            ` - Filtros: ${activeSubcategoryFilters.join(', ')}` : '';
        const priceText = (priceRange.min > 0 || priceRange.max < Infinity) ?
            ` - Precio: $${priceRange.min.toLocaleString('es-AR')} - $${priceRange.max === Infinity ? '∞' : priceRange.max.toLocaleString('es-AR')}` : '';

        sectionTitle.textContent = `${currentCategory} (${filteredProducts.length} productos)${filterText}${priceText}`;
    }

    currentProducts = filteredProducts;
    currentPage = 1;
    renderCurrentPage();
    updateActiveFiltersDisplay();
}

function updateActiveFiltersDisplay() {
    const activeFiltersContainer = document.getElementById('active-filters-container');
    if (!activeFiltersContainer) return;

    let activeFiltersHTML = '';

    // Filtros de subcategorías
    activeSubcategoryFilters.forEach(filter => {
        activeFiltersHTML += `
            <div class="active-filter-tag">
                ${filter}
                <button class="remove-filter" onclick="removeSubcategoryFilter('${filter}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });

    // Filtro de precio
    if (priceRange.min > 0 || priceRange.max < Infinity) {
        let priceText = '';
        if (priceRange.min > 0 && priceRange.max < Infinity) {
            priceText = `Precio: $${priceRange.min.toLocaleString('es-AR')} - $${priceRange.max.toLocaleString('es-AR')}`;
        } else if (priceRange.min > 0) {
            priceText = `Precio: desde $${priceRange.min.toLocaleString('es-AR')}`;
        } else if (priceRange.max < Infinity) {
            priceText = `Precio: hasta $${priceRange.max.toLocaleString('es-AR')}`;
        }

        activeFiltersHTML += `
            <div class="active-filter-tag">
                ${priceText}
                <button class="remove-filter" onclick="clearPriceFilter()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    activeFiltersContainer.innerHTML = activeFiltersHTML;
}

function removeSubcategoryFilter(subcategory) {
    const index = activeSubcategoryFilters.indexOf(subcategory);
    if (index !== -1) {
        activeSubcategoryFilters.splice(index, 1);

        const checkbox = document.getElementById(`filter-${subcategory.replace(/\s+/g, '-')}`);
        if (checkbox) checkbox.checked = false;

        applySubcategoryFilters();
    }
}

function clearAllFilters() {
    activeSubcategoryFilters = [];
    priceRange = { min: 0, max: Infinity };

    // Desmarcar checkboxes
    document.querySelectorAll('.subcategories-filters input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Limpiar inputs
    const minInput = document.getElementById('price-min');
    const maxInput = document.getElementById('price-max');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';

    applySubcategoryFilters();
}

// ============================================
// FUNCIONES DE PAGINACIÓN
// ============================================

function setupPagination() {
    const perPageSelect = document.getElementById('products-per-page');
    if (perPageSelect) {
        perPageSelect.addEventListener('change', function (e) {
            productsPerPage = parseInt(e.target.value);
            currentPage = 1;
            renderCurrentPage();
        });
    }
}

function renderCurrentPage() {
    if (currentProducts.length === 0) return;

    // Calcular índices
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = currentProducts.slice(startIndex, endIndex);

    // Mostrar productos
    displayProductsPage(productsToShow);

    // Actualizar contador
    updateProductsCount();

    // Renderizar controles
    renderPaginationControls();
}

function updateProductsCount() {
    const countElement = document.getElementById('products-count');
    if (countElement) {
        const startIndex = (currentPage - 1) * productsPerPage + 1;
        const endIndex = Math.min(currentPage * productsPerPage, currentProducts.length);
        countElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${currentProducts.length} productos`;
    }
}

function renderPaginationControls() {
    const paginationContainer = document.getElementById('products-pagination');
    if (!paginationContainer) return;

    totalPages = Math.ceil(currentProducts.length / productsPerPage);

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Botón Anterior
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})" aria-label="Anterior">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Números de página
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    // Botón Siguiente
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})" aria-label="Siguiente">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderCurrentPage();

    setTimeout(() => {
        const productsSection = document.getElementById('products-section');
        if (productsSection) {
            const subcategoriesFilters = productsSection.querySelector('.subcategories-filters');
            const productsHeader = productsSection.querySelector('.products-header');

            if (subcategoriesFilters) {
                subcategoriesFilters.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else if (productsHeader) {
                productsHeader.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                productsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }, 150);
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function showModal(modalName) {
    try {
        if (modalInstances[modalName]) {
            modalInstances[modalName].show();
        } else {
            // Fallback
            const modalElement = document.getElementById(modalName + 'Modal');
            if (modalElement && bootstrap && bootstrap.Modal) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        }
    } catch (error) {
        console.error(`Error mostrando modal ${modalName}:`, error);
    }
}

function hideModal(modalName) {
    try {
        if (modalInstances[modalName]) {
            modalInstances[modalName].hide();
        }
    } catch (error) {
        console.error(`Error ocultando modal ${modalName}:`, error);
    }
}

function showToast(type, message) {
    let toast;
    let messageElement;

    if (type === 'success') {
        toast = document.getElementById('successToast');
        messageElement = document.getElementById('successMessage');
    } else if (type === 'error') {
        toast = document.getElementById('errorToast');
        messageElement = document.getElementById('errorMessage');
    } else {
        toast = document.getElementById('successToast');
        messageElement = document.getElementById('successMessage');
    }

    if (toast && messageElement) {
        messageElement.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }
}

function getDefaultImage(productName = 'Sin Imagen') {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 300, 200);
    gradient.addColorStop(0, '#4A5568');
    gradient.addColorStop(1, '#2D3748');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 200);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 300, 200);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📦', 150, 80);

    const displayName = productName.length > 30 ?
        productName.substring(0, 27) + '...' : productName;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(displayName, 150, 120);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText('Imagen no disponible', 150, 140);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = 'italic 8px Arial, sans-serif';
    ctx.fillText('Herrajería', 150, 180);

    return canvas.toDataURL('image/png');
}

function showAllProducts() {
    currentCategory = null;
    activeSubcategoryFilters = [];
    priceRange = { min: 0, max: Infinity };
    displayProducts(products, "Todos los Productos");
    showToast('info', 'Mostrando todos los productos');
}

function scrollToProductsSection() {
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
        const subcategoriesFilters = productsSection.querySelector('.subcategories-filters');
        const productsHeader = productsSection.querySelector('.products-header');

        if (subcategoriesFilters) {
            subcategoriesFilters.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else if (productsHeader) {
            productsHeader.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            productsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

function showErrorFallback() {
    console.log('🔧 Mostrando fallback de error...');

    const productsContainer = document.getElementById('products-container');
    if (productsContainer) {
        productsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h4 class="mb-3">Error de conexión</h4>
                <p class="text-muted mb-4">No se pudo conectar con el servidor. Mostrando datos de ejemplo.</p>
                <div class="d-flex justify-content-center gap-3">
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                    <button class="btn btn-outline-primary" onclick="loadSampleProducts()">
                        <i class="fas fa-box me-2"></i>Usar datos de ejemplo
                    </button>
                </div>
            </div>
        `;
    }
}

// ============================================
// FUNCIONES DE CANTIDAD
// ============================================

function incrementQuantity(productId) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    if (!quantityInput) return;

    const currentValue = parseInt(quantityInput.value);
    const product = products.find(p => p.id === productId);

    if (product && currentValue < product.stock) {
        quantityInput.value = currentValue + 1;
    }
}

function decrementQuantity(productId) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    if (!quantityInput) return;

    const currentValue = parseInt(quantityInput.value);
    if (currentValue > 1) quantityInput.value = currentValue - 1;
}

function incrementDetailQuantity() {
    const quantityInput = document.getElementById('detailQuantity');
    if (!quantityInput) return;

    const currentValue = parseInt(quantityInput.value);

    if (currentProductDetail && currentValue < currentProductDetail.stock) {
        quantityInput.value = currentValue + 1;
    }
}

function decrementDetailQuantity() {
    const quantityInput = document.getElementById('detailQuantity');
    if (!quantityInput) return;

    const currentValue = parseInt(quantityInput.value);

    if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
    }
}

function addToCartFromDetail() {
    if (!currentProductDetail) return;
    const quantity = parseInt(document.getElementById('detailQuantity').value);
    addToCart(currentProductDetail.id, quantity);
    hideModal('productDetail');
}

// ============================================
// FUNCIONES DE PRODUCTOS POPULARES
// ============================================

function loadPopularProducts() {
    if (products.length === 0) {
        console.log('📦 No hay productos para mostrar como populares');
        return;
    }

    // Cargar productos más vendidos
    bestSellingProducts = [...products]
        .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
        .slice(0, 4);

    // Mostrar sección de más vendidos
    if (bestSellingProducts.length > 0) {
        displayPopularProducts(bestSellingProducts, 'best-selling-container');
        const bestSellingSection = document.getElementById('best-selling-section');
        if (bestSellingSection) bestSellingSection.style.display = 'block';
    }
}

function displayPopularProducts(productsToDisplay, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    productsToDisplay.forEach(product => {
        const discountBadge = product.discount > 0 ?
            `<span class="product-badge">-${product.discount}%</span>` : '';

        const newBadge = product.isNew ?
            `<span class="product-badge" style="background: var(--secondary);">Nuevo</span>` : '';

        const outOfStockBadge = product.stock <= 0 ?
            `<span class="product-badge" style="background: var(--accent);">Sin Stock</span>` : '';

        const isOutOfStock = product.stock <= 0;

        const productCard = `
            <div class="col-md-4 col-lg-2 mb-4">
                <div class="card product-card ${isOutOfStock ? 'opacity-75' : ''}">
                    <div class="position-relative">
                        <img src="${product.image}" class="card-img-top product-image" alt="${product.name}" 
                             onerror="this.src='${getDefaultImage(product.name)}'; this.onerror=null;"
                             onclick="${!isOutOfStock ? `showProductDetail('${product.id}')` : ''}" 
                             style="${isOutOfStock ? 'cursor: not-allowed;' : 'cursor: pointer;'}">
                        ${discountBadge}
                        ${newBadge}
                        ${outOfStockBadge}
                    </div>
                    <div class="card-body">
                        <h5 class="product-title" onclick="${!isOutOfStock ? `showProductDetail('${product.id}')` : ''}" 
                            style="${isOutOfStock ? 'cursor: not-allowed; color: #6c757d;' : 'cursor: pointer;'}">
                            ${product.name}
                        </h5>
                        <p class="product-category">${product.category}</p>
                        <div class="price-container">
                            <div class="price">$${(product.price || 0).toLocaleString('es-AR')}</div>
                        </div>
                        ${!isOutOfStock ? `
                        <div class="d-flex gap-2 mt-3">
                            <button type="button" class="btn btn-primary flex-grow-1" onclick="addToCart('${product.id}')">
                                <i class="fas fa-cart-plus me-1"></i> Agregar
                            </button>
                            <button type="button" class="btn btn-outline-primary" onclick="showProductDetail('${product.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        ` : `
                        <div class="mt-3">
                            <button class="btn btn-secondary w-100" disabled>
                                <i class="fas fa-times-circle me-1"></i> Sin Stock
                            </button>
                        </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += productCard;
    });
}

// ============================================
// FUNCIONES DE BÚSQUEDA
// ============================================

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (searchTerm === '') {
        showToast('info', 'Ingresa un término de búsqueda');
        return;
    }

    if (products.length === 0) {
        showToast('error', 'Los productos aún se están cargando. Por favor, espera un momento.');
        return;
    }

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        (product.category && product.category.toLowerCase().includes(searchTerm)) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );

    if (filteredProducts.length === 0) {
        displayProducts([], `Búsqueda: "${searchTerm}"`);
        showToast('error', `No se encontraron productos para "${searchTerm}"`);
    } else {
        displayProducts(filteredProducts, `Búsqueda: "${searchTerm}" (${filteredProducts.length} productos)`);
        showToast('success', `Se encontraron ${filteredProducts.length} productos para "${searchTerm}"`);
    }
}

// ============================================
// FUNCIONES DE TOGGLE PRECIOS
// ============================================

function toggleWholesalePrice(productId) {
    const priceElement = document.getElementById(`price-${productId}`);
    const wholesaleInfo = document.getElementById(`wholesale-info-${productId}`);
    const wholesaleBtn = document.getElementById(`wholesale-btn-${productId}`);

    if (wholesaleInfo.style.display === 'none') {
        // Mostrar precio mayorista
        priceElement.style.display = 'none';
        wholesaleInfo.style.display = 'block';
        wholesaleBtn.innerHTML = '<i class="fas fa-eye-slash me-1"></i> Ver unitario';
        wholesaleBtn.classList.remove('btn-outline-secondary');
        wholesaleBtn.classList.add('btn-outline-primary');
    } else {
        // Mostrar precio unitario
        priceElement.style.display = 'block';
        wholesaleInfo.style.display = 'none';
        wholesaleBtn.innerHTML = '<i class="fas fa-eye me-1"></i> Ver mayorista';
        wholesaleBtn.classList.remove('btn-outline-primary');
        wholesaleBtn.classList.add('btn-outline-secondary');
    }
}

function toggleDetailWholesale() {
    const retailPriceElement = document.querySelector('.retail-price');
    const wholesaleSection = document.getElementById('detailWholesaleSection');
    const wholesaleBtn = document.getElementById('detailWholesaleBtn');

    if (!wholesaleSection || !wholesaleBtn || !retailPriceElement) return;

    if (wholesaleSection.style.display === 'none') {
        // Mostrar precio mayorista, ocultar precio unitario
        retailPriceElement.style.display = 'none';
        wholesaleSection.style.display = 'block';
        wholesaleBtn.innerHTML = '<i class="fas fa-eye-slash me-1"></i> Ver unitario';
        wholesaleBtn.classList.remove('btn-outline-secondary');
        wholesaleBtn.classList.add('btn-outline-primary');
    } else {
        // Mostrar precio unitario, ocultar precio mayorista
        retailPriceElement.style.display = 'block';
        wholesaleSection.style.display = 'none';
        wholesaleBtn.innerHTML = '<i class="fas fa-eye me-1"></i> Ver mayorista';
        wholesaleBtn.classList.remove('btn-outline-primary');
        wholesaleBtn.classList.add('btn-outline-secondary');
    }
}

// ============================================
// SETUP EVENT LISTENERS COMPLETO
// ============================================

function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');

    // Búsqueda
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
        searchInput.addEventListener('input', function () {
            if (this.value.trim() === '') showAllProducts();
        });
    }

    // Paginación
    setupPagination();

    // Back to top
    setupBackToTop();

    // Carrito
    const cartLink = document.getElementById('cartLink');
    if (cartLink) cartLink.addEventListener('click', renderCart);

    // Checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', openCheckoutFromCart);
    }

    // Login/Register
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showModal('login');
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showModal('register');
        });
    }

    // Formularios
    setupFormEvents();

    // Checkout events
    setupCheckoutEvents();

    // Resize para el zoom
    window.addEventListener('resize', function () {
        if (document.getElementById('productDetailModal')?.classList.contains('show')) {
            resetImageZoom();
            setTimeout(setupImageZoom, 100);
        }
    });
}

function setupBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;

    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });

    backToTop.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function setupFormEvents() {
    console.log('🔧 Configurando eventos de formularios...');

    // Mostrar/ocultar campos industriales
    document.querySelectorAll('input[name="accountType"]').forEach(radio => {
        radio.addEventListener('change', function () {
            const industrialFields = document.getElementById('industrialFields');
            if (industrialFields) {
                industrialFields.style.display = this.value === 'industrial' ? 'block' : 'none';
            }
        });
    });

    // Formularios de login y registro
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            showToast('success', 'Inicio de sesión exitoso');
            hideModal('login');
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            showToast('success', 'Registro exitoso');
            hideModal('register');
        });
    }
}

function setupCheckoutEvents() {
    console.log('🔧 Configurando eventos de checkout...');

    // Navegación del checkout
    const nextToStep2Btn = document.getElementById('nextToStep2');
    const backToStep1Btn = document.getElementById('backToStep1');
    const nextToStep3Btn = document.getElementById('nextToStep3');
    const backToStep2Btn = document.getElementById('backToStep2');
    const nextToStep4Btn = document.getElementById('nextToStep4');
    const finishCheckoutBtn = document.getElementById('finishCheckout');
    const cancelCheckoutBtn = document.getElementById('cancelCheckout');

    if (nextToStep2Btn) {
        nextToStep2Btn.addEventListener('click', proceedToStep2);
    }

    if (backToStep1Btn) {
        backToStep1Btn.addEventListener('click', returnToStep1);
    }

    if (nextToStep3Btn) {
        nextToStep3Btn.addEventListener('click', proceedToStep3);
    }

    if (backToStep2Btn) {
        backToStep2Btn.addEventListener('click', returnToStep2);
    }

// Reemplaza el evento de nextToStep4Btn
if (nextToStep4Btn) {
    nextToStep4Btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const selectedMethod = document.querySelector('.payment-method.active');
        if (!selectedMethod) {
            showToast('error', 'Por favor selecciona un método de pago');
            return;
        }
        
        const method = selectedMethod.getAttribute('data-method');
        
        if (method === 'mercado-pago' || method === 'tarjeta') {
            // Ejecuta Mercado Pago
            processMercadoPagoPayment();
        } else if (method === 'transferencia') {
            // Muestra instrucciones de transferencia
            confirmTransferenciaPayment();
        }
    });
}

    if (finishCheckoutBtn) {
        finishCheckoutBtn.addEventListener('click', completeCheckout);
    }

    if (cancelCheckoutBtn) {
        cancelCheckoutBtn.addEventListener('click', cancelCheckoutProcess);
    }

    // Métodos de envío
    document.querySelectorAll('.shipping-option').forEach(option => {
        option.addEventListener('click', handleShippingOptionClick);
    });

    // Métodos de pago
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', handlePaymentMethodClick);
    });

    // Botón de WhatsApp
    const confirmWhatsApp = document.getElementById('confirmWhatsApp');
    if (confirmWhatsApp) {
        confirmWhatsApp.addEventListener('click', confirmOrderByWhatsApp);
    }
}

function handleShippingOptionClick() {
    document.querySelectorAll('.shipping-option').forEach(o => o.classList.remove('active'));
    this.classList.add('active');

    const showAddressForm = this.getAttribute('data-shipping') === 'domicilio';
    const shippingAddressForm = document.getElementById('shippingAddressForm');
    if (shippingAddressForm) {
        shippingAddressForm.style.display = showAddressForm ? 'block' : 'none';
    }
}

function handlePaymentMethodClick() {
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
    this.classList.add('active');
}

// ============================================
// FUNCIONES DE NAVEGACIÓN DEL CHECKOUT
// ============================================

function proceedToStep2() {
    console.log('Procediendo al paso 2...');
    if (!validateStep1()) {
        showToast('error', 'Por favor completa todos los campos obligatorios');
        return;
    }
    navigateToStep(2);
}

function returnToStep1() {
    console.log('Volviendo al paso 1...');
    navigateToStep(1);
}

function proceedToStep3() {
    console.log('Procediendo al paso 3...');
    if (!validateStep2()) {
        showToast('error', 'Por favor completa todos los campos obligatorios');
        return;
    }
    updateCheckoutSummary();
    navigateToStep(3);
}

function returnToStep2() {
    console.log('Volviendo al paso 2...');
    navigateToStep(2);
}

function proceedToStep4() {
    console.log('Procediendo al paso 4...');
    if (!validateStep3()) {
        showToast('error', 'Por favor selecciona un método de pago');
        return;
    }
    updateOrderSummary();
    navigateToStep(4);
}

function completeCheckout() {
    console.log('Completando checkout...');
    processOrder();
}

function cancelCheckoutProcess() {
    console.log('Cancelando checkout...');
    hideModal('checkout');
    resetCheckoutForm();
}

function navigateToStep(step) {
    currentStep = step;
    updateCheckoutSteps();

    // Ocultar todos los steps
    document.querySelectorAll('.checkout-form').forEach(form => {
        form.classList.remove('active');
    });

    // Mostrar step actual
    const currentStepElement = document.getElementById(`step${step}`);
    if (currentStepElement) currentStepElement.classList.add('active');
}

function updateCheckoutSteps() {
    document.querySelectorAll('.checkout-step').forEach(step => {
        const stepNumber = parseInt(step.getAttribute('data-step'));
        step.classList.remove('active', 'completed');

        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

function validateStep1() {
    const requiredFields = ['checkoutFirstName', 'checkoutLastName', 'checkoutEmail', 'checkoutPhone', 'checkoutDni'];
    return requiredFields.every(field => {
        const element = document.getElementById(field);
        return element && element.value.trim() !== '';
    });
}

function validateStep2() {
    const shippingMethod = document.querySelector('.shipping-option.active');
    if (!shippingMethod) return false;

    const shippingType = shippingMethod.getAttribute('data-shipping');
    if (shippingType === 'domicilio') {
        const addressFields = ['checkoutAddress', 'checkoutCity', 'checkoutState', 'checkoutZipCode'];
        return addressFields.every(field => {
            const element = document.getElementById(field);
            return element && element.value.trim() !== '';
        });
    }
    return true;
}

function validateStep3() {
    return document.querySelector('.payment-method.active') !== null;
}

function updateOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    if (!orderSummary) return;

    orderSummary.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const price = item.quantity >= item.wholesaleLimit ? item.wholesalePrice : item.price;
        const itemTotal = price * item.quantity;
        total += itemTotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'summary-item';
        itemElement.innerHTML = `
            <span>${item.name} x${item.quantity}</span>
            <span>$${itemTotal.toLocaleString('es-AR')}</span>
        `;
        orderSummary.appendChild(itemElement);
    });

    const orderTotal = document.getElementById('orderTotal');
    if (orderTotal) orderTotal.textContent = `$${total.toLocaleString('es-AR')}`;
}

function processOrder() {
    console.log('Procesando orden...');

    if (cart.length === 0) {
        showToast('error', 'El carrito está vacío');
        return;
    }

    // Obtener método de pago seleccionado
    const selectedPaymentMethod = document.querySelector('.payment-method.active');
    if (!selectedPaymentMethod) {
        showToast('error', 'Por favor selecciona un método de pago');
        return;
    }

    const paymentMethod = selectedPaymentMethod.getAttribute('data-method');

    // Procesar según método seleccionado
    switch (paymentMethod) {
        case 'mercado-pago':
        case 'tarjeta':
            processMercadoPagoPayment();
            break;

        case 'transferencia':
            confirmTransferenciaPayment();
            break;

        case 'google-pay':
            showToast('info', 'Google Pay disponible próximamente');
            break;

        default:
            showToast('error', 'Método de pago no soportado');
    }
}

// En tu app.js, reemplaza la función processMercadoPagoPayment
async function processMercadoPagoPayment() {
    // 1. Verificar que Mercado Pago está inicializado
    if (!mercadoPagoInstance) {
        await initializeMercadoPago();
    }

    // 2. Preparar los datos del carrito para enviar al backend
    const itemsForBackend = cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.quantity >= item.wholesaleLimit ? item.wholesalePrice : item.price,
    }));

    showToast('info', 'Procesando pago...');

    try {
        // 3. Llamar a tu Netlify Function (BACKEND)
        const response = await fetch('/.netlify/functions/create-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemsForBackend)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error en el servidor');
        }

        // 4. Obtener el ID de la preferencia desde la respuesta del backend
        const preferenceId = data.id;

        // 5. Crear e inicializar el botón de pago de Mercado Pago en el frontend[citation:1]
        const bricksBuilder = mercadoPagoInstance.bricks();
        await bricksBuilder.create('wallet', 'walletBrick_container', {
            initialization: {
                preferenceId: preferenceId, // Usamos la preferencia segura creada por el backend
            },
        });

    } catch (error) {
        console.error('Error en el flujo de pago:', error);
        showToast('error', 'No se pudo iniciar el proceso de pago. Intenta nuevamente.');
    }
}

function confirmOrderByWhatsApp() {
    console.log('Confirmando orden por WhatsApp...');

    if (cart.length === 0) {
        showToast('error', 'El carrito está vacío');
        return;
    }

    // Recopilar datos del formulario
    const firstName = document.getElementById('checkoutFirstName')?.value || 'No especificado';
    const lastName = document.getElementById('checkoutLastName')?.value || 'No especificado';
    const email = document.getElementById('checkoutEmail')?.value || 'No especificado';
    const phone = document.getElementById('checkoutPhone')?.value || 'No especificado';
    const dni = document.getElementById('checkoutDni')?.value || 'No especificado';

    // Construir mensaje
    let message = `¡Hola! Quiero confirmar mi pedido:\n\n`;
    message += `*DATOS DEL CLIENTE:*\n`;
    message += `Nombre: ${firstName} ${lastName}\n`;
    message += `Email: ${email}\n`;
    message += `Teléfono: ${phone}\n`;
    message += `DNI: ${dni}\n\n`;

    message += `*RESUMEN DEL PEDIDO:*\n`;

    let total = 0;
    cart.forEach(item => {
        const price = item.quantity >= item.wholesaleLimit ? item.wholesalePrice : item.price;
        const itemTotal = price * item.quantity;
        total += itemTotal;
        message += `• ${item.name} x${item.quantity} - $${itemTotal.toLocaleString('es-AR')}\n`;
    });

    message += `\n*TOTAL: $${total.toLocaleString('es-AR')}*\n\n`;
    message += `Por favor, confirmar disponibilidad.`;

    // Codificar mensaje
    const encodedMessage = encodeURIComponent(message);

    // Número de WhatsApp
    const whatsappNumber = '543584363974';

    // Crear enlace
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Abrir en nueva ventana
    window.open(whatsappURL, '_blank');
}

// ============================================
// CARRUSEL
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Inicializar carrusel si existe
    setTimeout(() => {
        initCarousel();
    }, 1000);
});

function initCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const prevBtn = document.querySelector('.carousel-control.prev');
    const nextBtn = document.querySelector('.carousel-control.next');
    const totalSlides = slides.length;

    if (totalSlides === 0) return;

    function updateCarousel() {
        // Mover el carrusel
        const carouselInner = document.querySelector('.carousel-inner');
        const slideWidth = 100 / totalSlides;
        carouselInner.style.transform = `translateX(-${currentSlide * slideWidth}%)`;

        // Actualizar indicadores
        indicators.forEach((indicator, index) => {
            if (index === currentSlide) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    // Event listeners para los controles
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        });
    }

    // Event listeners para los indicadores
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
        });
    });

    // Auto-rotación del carrusel
    let carouselInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 5000);

    // Pausar auto-rotación al hacer hover
    carousel.addEventListener('mouseenter', () => {
        clearInterval(carouselInterval);
    });

    carousel.addEventListener('mouseleave', () => {
        carouselInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        }, 5000);
    });

    // Inicializar el carrusel
    updateCarousel();
}

// ============================================
// DIAGNÓSTICO FINAL
// ============================================

console.log('=== DIAGNÓSTICO DE CARGA ===');
console.log('Bootstrap disponible:', typeof bootstrap !== 'undefined');
console.log('Supabase disponible:', typeof window.supabaseClient !== 'undefined');
console.log('Productos cargados:', products.length);
console.log('Carrito:', cart.length);
console.log('Modales inicializados:', Object.keys(modalInstances).length);
console.log('✅ app.js cargado completamente');

// Verificar errores de recursos
window.addEventListener('error', function (e) {
    if (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK') {
        console.error('❌ Error cargando recurso:', e.target.src || e.target.href);
    }
}, true);