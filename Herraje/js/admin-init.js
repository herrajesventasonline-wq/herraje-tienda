// admin-init.js - VERSIÓN CON GESTIÓN CORRECTA DE MÚLTIPLES IMÁGENES EN SUPABASE
console.log('🔄 Cargando panel de administración para Herrajería...');

// ==============================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ==============================================

// Estado de la aplicación
let adminProducts = [];
let allCategories = [];
let allBrands = [];
let adminOrders = [];
let currentProduct = null;
let adminFilteredProducts = [];

// URLs y configuraciones
const STORAGE_URL = 'https://opueqifkagoonpbubflj.supabase.co/storage/v1/object/public/product-images/';
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f8fafc'/%3E%3Cpath d='M80 60h40v30H80z' fill='%23e2e8f0'/%3E%3Ccircle cx='100' cy='45' r='15' fill='%23e2e8f0'/%3E%3Ctext x='100' y='120' text-anchor='middle' font-family='Arial, sans-serif' font-size='12' fill='%2394a3b8'%3ESin imagen%3C/text%3E%3C/svg%3E";

// ==============================================
// INICIALIZACIÓN PRINCIPAL
// ==============================================

document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 Iniciando panel de administración...');

    try {
        // Esperar a que Supabase esté listo
        await waitForSupabase();

        // Verificar sesión de administrador
        await verifyAdminSession();

        // Cargar datos iniciales
        await loadAdminData();

        // Configurar interfaz
        setupAdminEventListeners();
        setupProductForm();
        setupImageUploadListeners();

        console.log('✅ Panel de administración inicializado correctamente');

    } catch (error) {
        console.error('💥 Error en inicialización:', error);
        showNotification('Error inicializando el panel: ' + error.message, 'error');
    }
});

// ==============================================
// FUNCIONES DE INICIALIZACIÓN
// ==============================================

function waitForSupabase() {
    return new Promise((resolve, reject) => {
        console.log('🔍 Verificando estado de Supabase...');

        const maxAttempts = 50;
        let attempts = 0;

        const checkInterval = setInterval(() => {
            attempts++;

            if (window.supabaseClient && window.supabaseClient.isReady()) {
                clearInterval(checkInterval);
                console.log('✅ Supabase listo y funcional');
                resolve();
                return;
            }

            if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('Timeout: No se pudo inicializar Supabase'));
            }
        }, 100);
    });
}

async function verifyAdminSession() {
    console.log('🔐 Verificando sesión de administrador...');

    try {
        const { session } = await window.supabaseClient.getSession();

        if (!session) {
            console.log('❌ No hay sesión activa, redirigiendo...');
            window.location.href = 'admin-login.html';
            return;
        }

        console.log('✅ Sesión activa encontrada:', session.user.email);

        // Verificación de administrador
        const adminEmails = [
            'herrajesventasonline@gmail.com',
            'admin@herrajeria.com',
            'administrador@herrajeria.com'
        ];

        if (!adminEmails.includes(session.user.email.toLowerCase())) {
            console.warn('⚠️ Email no autorizado:', session.user.email);
            await window.supabaseClient.signOut();
            window.location.href = 'admin-login.html?error=unauthorized';
            return;
        }

        // Mostrar información del usuario
        updateAdminUserInfo(session.user);

    } catch (error) {
        console.error('❌ Error en verificación de sesión:', error);
        throw error;
    }
}

function updateAdminUserInfo(user) {
    const adminUserElement = document.getElementById('admin-user');
    if (adminUserElement) {
        const span = adminUserElement.querySelector('span');
        if (span) {
            span.textContent = user.email;
        }
        adminUserElement.title = `Usuario: ${user.email}`;
    }
}

// ==============================================
// CARGA DE DATOS
// ==============================================

async function loadAdminData() {
    try {
        console.log('📦 Cargando datos del administrador...');

        showLoadingState(true);

        // Cargar datos en paralelo
        const [productsData, categoriesData, brandsData, ordersData] = await Promise.allSettled([
            window.supabaseClient.getProducts(),
            window.supabaseClient.getCategories(),
            window.supabaseClient.getBrands(),
            window.supabaseClient.getOrders()
        ]);

        // Procesar resultados
        adminProducts = productsData.status === 'fulfilled' ? productsData.value : [];
        allCategories = categoriesData.status === 'fulfilled' ? categoriesData.value : [];
        allBrands = brandsData.status === 'fulfilled' ? brandsData.value : [];
        adminOrders = ordersData.status === 'fulfilled' ? ordersData.value : [];

        console.log(`✅ Datos cargados: ${adminProducts.length} productos, ${allCategories.length} categorías, ${allBrands.length} marcas, ${adminOrders.length} órdenes`);

        // Actualizar interfaz
        updateAdminStats();
        renderAdminProducts();
        renderStockTable();
        populateCategorySelect();
        populateBrandSelect();
        renderOrders();

        showLoadingState(false);

    } catch (error) {
        console.error('❌ Error cargando datos admin:', error);
        showNotification('Error al cargar los datos: ' + error.message, 'error');
        showLoadingState(false);
    }
}

function showLoadingState(show) {
    const loadingElement = document.getElementById('loading-state');
    if (!loadingElement) {
        if (show) {
            const div = document.createElement('div');
            div.id = 'loading-state';
            div.innerHTML = '<div class="spinner"></div><p>Cargando datos...</p>';
            div.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255,255,255,0.95);
                backdrop-filter: blur(4px);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-size: 16px;
                color: #475569;
            `;
            document.body.appendChild(div);
        }
    } else {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

// ==============================================
// CONFIGURACIÓN DE INTERFAZ
// ==============================================

function setupAdminEventListeners() {
    try {
        console.log('🔧 Configurando event listeners...');

        // Pestañas del panel
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', switchAdminTab);
        });

        // Botones principales
        document.getElementById('add-product-btn')?.addEventListener('click', () => showProductModal(false));
        document.getElementById('logout-btn')?.addEventListener('click', logout);

        // Búsquedas
        const productSearch = document.getElementById('product-search');
        const stockSearch = document.getElementById('stock-search');

        if (productSearch) {
            productSearch.addEventListener('input', debounce(filterProducts, 300));
        }

        if (stockSearch) {
            stockSearch.addEventListener('input', debounce(searchStockProducts, 300));
        }

        // Cerrar modales
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', closeAllModals);
        });

        document.getElementById('close-invoice')?.addEventListener('click', () => hideInvoiceModal());
        document.getElementById('cancel-product')?.addEventListener('click', () => hideProductModal());
        document.getElementById('cancel-adjustment')?.addEventListener('click', () => hidePriceAdjustmentModal());

        // Overlay para cerrar modales
        document.getElementById('overlay')?.addEventListener('click', closeAllModals);

        // Esc para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });

        console.log('✅ Event listeners configurados correctamente');

    } catch (error) {
        console.error('❌ Error configurando event listeners:', error);
    }
}

function setupProductForm() {
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
}

function setupImageUploadListeners() {
    const imageUpload = document.getElementById('image-upload');
    const uploadArea = document.getElementById('upload-area');

    if (!imageUpload || !uploadArea) return;

    // Click en el área de upload
    uploadArea.addEventListener('click', () => {
        imageUpload.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        if (e.dataTransfer.files.length) {
            imageUpload.files = e.dataTransfer.files;
            handleImageUpload({ target: { files: e.dataTransfer.files } });
        }
    });

    // Cambio en el input de archivos
    imageUpload.addEventListener('change', handleImageUpload);
}

// ==============================================
// MANEJO DE IMÁGENES - SISTEMA COMPLETO
// ==============================================

function handleImageUpload(e) {
    const files = e.target.files;
    const preview = document.getElementById('images-preview');
    if (!preview) return;

    console.log('📁 Archivos seleccionados:', files.length);

    // Limpiar solo elementos temporales
    const tempImages = preview.querySelectorAll('.image-preview-item.temporary');
    tempImages.forEach(img => img.remove());

    Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) {
            showNotification(`El archivo "${file.name}" no es una imagen válida`, 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showNotification(`La imagen "${file.name}" es demasiado grande (máximo 5MB)`, 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-preview-item temporary draggable';
            imgContainer.draggable = true;
            imgContainer.dataset.tempId = `temp-${Date.now()}-${index}`;
            imgContainer.dataset.isNew = 'true';
            
            const fileName = file.name.substring(0, 20) + (file.name.length > 20 ? '...' : '');
            
            imgContainer.innerHTML = `
                <div class="preview-header">
                    <span class="image-name">${fileName}</span>
                    <div class="image-actions">
                    
                        <button type="button" class="remove-image" title="Eliminar imagen"><i class="fas fa-times"></i></button>
                   
                    </div>
                </div>
                <img src="${e.target.result}" alt="Nueva imagen ${index + 1}" class="preview-img">
                <div class="image-info">
                    <span class="image-size">${(file.size / 1024).toFixed(1)} KB</span>
                    <span class="image-status new">NUEVA</span>
                    <span class="image-position">Posición: 0</span>
                </div>
            `;

            preview.appendChild(imgContainer);
            setupImageItemListeners(imgContainer);
        };
        reader.readAsDataURL(file);
    });

    updateUploadAreaFeedback();
    updateImageOrderIndicators();
    initImageDragAndDrop();
}

function setupImageItemListeners(container) {
    // Botón para mover arriba


    // Botón para eliminar
    const removeBtn = container.querySelector('.remove-image');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('¿Eliminar esta imagen?')) {
                container.remove();
                updateUploadAreaFeedback();
                updateImageOrderIndicators();
                showNotification('Imagen eliminada', 'warning');
            }
        });
    }

    // Botón para establecer como principal
  
}

function initImageDragAndDrop() {
    const containers = document.querySelectorAll('.draggable');
    containers.forEach(container => {
        container.addEventListener('dragstart', handleDragStart);
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        container.addEventListener('dragend', handleDragEnd);
    });
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => this.style.opacity = '0.4', 0);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(e.clientY);
    const container = document.getElementById('images-preview');
    
    if (afterElement == null) {
        container.appendChild(draggedItem);
    } else {
        container.insertBefore(draggedItem, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
    draggedItem.style.opacity = '';
    updateImageOrderIndicators();
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
    this.style.opacity = '';
}

function getDragAfterElement(y) {
    const draggableElements = [...document.querySelectorAll('.draggable:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function moveImageUp(container) {
    const prev = container.previousElementSibling;
    if (prev && prev.classList.contains('image-preview-item')) {
        container.parentNode.insertBefore(container, prev);
        updateImageOrderIndicators();
    }
}

function moveImageDown(container) {
    const next = container.nextElementSibling;
    if (next && next.classList.contains('image-preview-item')) {
        container.parentNode.insertBefore(next, container);
        updateImageOrderIndicators();
    }
}

function updateImageOrderIndicators() {
    const preview = document.getElementById('images-preview');
    if (!preview) return;

    const items = preview.querySelectorAll('.image-preview-item');
    
    items.forEach((item, index) => {
        const positionIndicator = item.querySelector('.image-position');
        if (positionIndicator) {
            positionIndicator.textContent = `Posición: ${index + 1}`;
        }
        
        // Actualizar indicador de imagen principal
        const mainIndicator = item.querySelector('.image-size');
        if (mainIndicator && index === 0) {
            if (!mainIndicator.classList.contains('main')) {
                // Remover indicador principal de todas
                items.forEach(i => {
                    const ind = i.querySelector('.image-size');
                    if (ind) ind.classList.remove('main');
                });
                // Agregar a la primera
                mainIndicator.textContent = 'PRINCIPAL';
                mainIndicator.classList.add('main');
            }
        } else if (mainIndicator && mainIndicator.classList.contains('main')) {
            mainIndicator.textContent = 'Secundaria';
            mainIndicator.classList.remove('main');
        }
    });
}

function setAsMainImage(container) {
    const preview = document.getElementById('images-preview');
    if (!preview) return;
    
    // Mover al inicio
    preview.prepend(container);
    updateImageOrderIndicators();
    showNotification('Imagen establecida como principal', 'success');
}

// Función para obtener imágenes de producto de manera segura
function getSafeProductImages(product) {
    if (!product) return [];

    console.log('🔍 Obteniendo imágenes para producto:', product.name);
    console.log('📦 Campo images:', product.images);
    console.log('📦 Campo main_image:', product.main_image);

    try {
        let finalImages = [];

        // 1. Procesar campo 'images' (es TEXT en tu BD, puede ser JSON string o array)
        if (product.images) {
            try {
                // Intentar parsear como JSON
                const parsed = JSON.parse(product.images);
                if (Array.isArray(parsed)) {
                    parsed.forEach(img => {
                        if (img && typeof img === 'string' && img.trim()) {
                            const url = ensureImageUrl(img);
                            if (url) {
                                finalImages.push(url);
                            }
                        }
                    });
                } else if (typeof parsed === 'string' && parsed.trim()) {
                    const url = ensureImageUrl(parsed);
                    if (url) {
                        finalImages.push(url);
                    }
                }
            } catch (parseError) {
                console.log('❌ No es JSON válido, tratando como string simple');
                // Si no es JSON válido, tratar como string simple
                if (typeof product.images === 'string' && product.images.trim()) {
                    const url = ensureImageUrl(product.images);
                    if (url) {
                        finalImages.push(url);
                    }
                }
            }
        }

        // 2. Si no hay imágenes en el campo images, usar main_image
        if (finalImages.length === 0 && product.main_image && product.main_image.trim()) {
            const url = ensureImageUrl(product.main_image);
            if (url) {
                finalImages.push(url);
            }
        }

        // 3. Eliminar duplicados
        finalImages = [...new Set(finalImages)];

        console.log('✅ Imágenes finales encontradas:', finalImages.length, finalImages);
        return finalImages;

    } catch (error) {
        console.error('❌ Error obteniendo imágenes:', error);
        return [];
    }
}

function ensureImageUrl(url) {
    if (!url || url === PLACEHOLDER_IMAGE || url === 'null' || url === 'undefined' || url === '""' || url.trim() === '') {
        return null;
    }

    // Limpiar URL si es necesario
    let cleanUrl = url.toString().trim();

    // Si ya es una URL completa, retornarla
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
        return cleanUrl;
    }

    // Si es un nombre de archivo, construir URL de Supabase Storage
    if (cleanUrl.includes('.') && !cleanUrl.includes('/')) {
        return `${STORAGE_URL}${encodeURIComponent(cleanUrl)}`;
    }

    // Si parece ser una ruta de Supabase Storage
    if (cleanUrl.includes('product-images/')) {
        const fileName = cleanUrl.split('product-images/').pop();
        return `${STORAGE_URL}${encodeURIComponent(fileName)}`;
    }

    return cleanUrl;
}

function displayExistingImages(product) {
    console.log('🖼️ Mostrando imágenes existentes...');

    const preview = document.getElementById('images-preview');
    if (!preview) {
        console.error('❌ No se encontró el contenedor de imágenes');
        return;
    }

    preview.innerHTML = '';

    const allImages = getSafeProductImages(product);
    console.log('📋 Total de imágenes a mostrar:', allImages.length, allImages);

    if (allImages.length > 0) {
        allImages.forEach((imgUrl, index) => {
            if (!imgUrl) return;

            console.log(`🖼️ Mostrando imagen ${index + 1}:`, imgUrl);

            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-preview-item existing draggable';
            imgContainer.draggable = true;
            imgContainer.dataset.imageUrl = imgUrl;
            imgContainer.dataset.imageIndex = index;
            
            const fileName = imgUrl.split('/').pop() || `Imagen ${index + 1}`;
            const displayName = fileName.substring(0, 20) + (fileName.length > 20 ? '...' : '');

            imgContainer.innerHTML = `
                <div class="preview-header">
                    <span class="image-name">${displayName}</span>
                    <div class="image-actions">
              
                        <button type="button" class="remove-image" title="Eliminar imagen"><i class="fas fa-times"></i></button>
                      
                    </div>
                </div>
                <img src="${imgUrl}" alt="Imagen ${index + 1}" class="preview-img"
                     onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}'; console.error('❌ Error cargando imagen:', '${imgUrl}')">
                <div class="image-info">
                    <span class="image-size">${index === 0 ? 'PRINCIPAL' : 'Secundaria'}</span>
                    <span class="image-position">Posición: ${index + 1}</span>
                </div>
            `;

            preview.appendChild(imgContainer);
            setupImageItemListeners(imgContainer);
        });
    } else {
        console.log('ℹ️ No hay imágenes para mostrar');
        preview.innerHTML = `
            <div class="no-images" style="text-align: center; padding: 30px; color: #666;">
                <i class="fas fa-image" style="font-size: 48px; margin-bottom: 15px; color: #ddd;"></i>
                <p>No hay imágenes para este producto</p>
            </div>
        `;
    }

    updateUploadAreaFeedback();
    updateImageOrderIndicators();
    initImageDragAndDrop();
}

function updateUploadAreaFeedback() {
    const uploadArea = document.getElementById('upload-area');
    const preview = document.getElementById('images-preview');

    if (!uploadArea || !preview) return;

    const totalImages = preview.querySelectorAll('.image-preview-item').length;
    const uploadText = uploadArea.querySelector('p');
    const uploadIcon = uploadArea.querySelector('i');

    if (uploadText && uploadIcon) {
        if (totalImages === 0) {
            uploadText.textContent = 'Arrastra imágenes aquí o haz clic para seleccionar';
            uploadIcon.className = 'fas fa-cloud-upload-alt';
            uploadArea.classList.remove('has-images');
        } else {
            uploadText.textContent = `${totalImages} imagen(es) cargada(s) - Arrastra para cambiar orden`;
            uploadIcon.className = 'fas fa-images';
            uploadArea.classList.add('has-images');
        }
    }
}

async function processProductImages(isEditing) {
    console.log('📷 Procesando imágenes...');
    const preview = document.getElementById('images-preview');
    const finalImages = [];

    try {
        if (!preview) {
            console.log('❌ No hay contenedor de imágenes');
            return [];
        }

        const imageItems = preview.querySelectorAll('.image-preview-item');
        console.log(`📸 Procesando ${imageItems.length} imágenes en el orden actual`);

        // Procesar cada imagen en el orden actual del DOM
        for (let i = 0; i < imageItems.length; i++) {
            const item = imageItems[i];
            
            if (item.classList.contains('existing')) {
                // Imagen existente - usar URL almacenada
                const imgUrl = item.dataset.imageUrl;
                if (imgUrl && imgUrl.trim()) {
                    console.log(`➕ Imagen existente [${i}]:`, imgUrl);
                    finalImages.push(imgUrl);
                }
            } else if (item.classList.contains('temporary')) {
                // Nueva imagen - subir a Supabase
                const imgElement = item.querySelector('.preview-img');
                if (imgElement && imgElement.src.startsWith('data:')) {
                    try {
                        // Convertir data URL a blob
                        const response = await fetch(imgElement.src);
                        const blob = await response.blob();
                        
                        // Crear archivo desde blob
                        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.jpg`;
                        const file = new File([blob], fileName, { type: 'image/jpeg' });
                        
                        console.log(`📤 Subiendo nueva imagen [${i}]:`, fileName);
                        
                        // Subir a Supabase
                        const url = await window.supabaseClient.uploadImage(file);
                        if (url) {
                            console.log('✅ Nueva imagen subida:', url);
                            finalImages.push(url);
                        } else {
                            throw new Error('No se obtuvo URL de la imagen subida');
                        }
                    } catch (error) {
                        console.error('❌ Error subiendo nueva imagen:', error);
                        showNotification('Error al subir una imagen nueva: ' + error.message, 'error');
                    }
                } else if (imgElement && imgElement.src) {
                    // Si ya tiene URL (por ejemplo, si se recargó la página)
                    console.log(`➕ Imagen ya con URL [${i}]:`, imgElement.src);
                    finalImages.push(imgElement.src);
                }
            }
        }

        console.log('📷 Total de imágenes procesadas:', finalImages.length, finalImages);
        
        if (finalImages.length === 0) {
            console.warn('⚠️ No se procesaron imágenes. Verificando si hay imágenes en currentProduct...');
            if (currentProduct && isEditing) {
                const existingImages = getSafeProductImages(currentProduct);
                if (existingImages.length > 0) {
                    console.log('🔄 Usando imágenes existentes del currentProduct');
                    return existingImages;
                }
            }
        }

        return finalImages;

    } catch (error) {
        console.error('❌ Error en processProductImages:', error);
        throw new Error('Error al procesar imágenes: ' + error.message);
    }
}

// ==============================================
// FUNCIONES DEL PANEL PRINCIPAL
// ==============================================

function switchAdminTab(e) {
    try {
        const tabId = e.target.dataset.tab;
        if (!tabId) return;

        // Actualizar pestañas activas
        document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));

        e.target.classList.add('active');
        const section = document.getElementById(`${tabId}-section`);
        if (section) section.classList.add('active');

        // Acciones específicas por pestaña
        switch (tabId) {
            case 'products':
                renderAdminProducts();
                break;
            case 'stock':
                renderStockTable();
                break;
            case 'analytics':
                renderOrders();
                break;
        }

    } catch (error) {
        console.error('❌ Error cambiando pestaña:', error);
    }
}

function updateAdminStats() {
    try {
        const totalProducts = adminProducts.length;
        const inStockProducts = adminProducts.filter(p => p && p.stock > 0).length;
        const lowStockProducts = adminProducts.filter(p => p && p.stock <= (p.min_stock || 0) && p.stock > 0).length;
        const totalOrders = adminOrders.length;
        const totalRevenue = adminOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

        // Actualizar elementos del dashboard
        updateElementText('total-products', totalProducts);
        updateElementText('in-stock-products', inStockProducts);
        updateElementText('total-sales', lowStockProducts);
        updateElementText('total-orders', totalOrders);
        updateElementText('total-orders-display', totalOrders);
        updateElementText('total-revenue', `$${totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
    }
}

function updateElementText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

// ==============================================
// GESTIÓN DE PRODUCTOS - MODALES
// ==============================================

function showProductModal(isEditing = false) {
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('overlay');

    if (modal) {
        modal.classList.add('active');

        if (!isEditing) {
            resetProductForm();
            document.getElementById('product-modal-title').innerHTML = '<i class="fas fa-box"></i> <span>Nuevo Producto</span>';
            document.getElementById('save-product').innerHTML = '<i class="fas fa-save"></i> Guardar Producto';
            currentProduct = null;
        }
    }

    if (overlay) overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideProductModal() {
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('overlay');

    if (modal) modal.classList.remove('active');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
}

function hideInvoiceModal() {
    const modal = document.getElementById('invoice-modal');
    const overlay = document.getElementById('overlay');

    if (modal) modal.classList.remove('active');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
}

function hidePriceAdjustmentModal() {
    const modal = document.getElementById('price-adjustment-modal');
    const overlay = document.getElementById('overlay');

    if (modal) modal.classList.remove('active');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
}

function closeAllModals() {
    hideProductModal();
    hideInvoiceModal();
    hidePriceAdjustmentModal();
}

function resetProductForm() {
    const form = document.getElementById('product-form');
    if (form) form.reset();

    document.getElementById('product-id').value = '';
    const preview = document.getElementById('images-preview');
    if (preview) preview.innerHTML = '';
    updateUploadAreaFeedback();
}

// ==============================================
// SELECTORES DE CATEGORÍAS Y MARCAS
// ==============================================

function populateCategorySelect() {
    const categorySelect = document.getElementById('product-category');

    const options = '<option value="">Seleccionar categoría</option>' +
        allCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');

    if (categorySelect) categorySelect.innerHTML = options;
}

function populateBrandSelect() {
    const brandSelect = document.getElementById('product-brand');

    const options = '<option value="">Seleccionar marca</option>' +
        allBrands.map(brand => `<option value="${brand.id}">${brand.name}</option>`).join('');

    if (brandSelect) brandSelect.innerHTML = options;
}

// ==============================================
// GUARDADO DE PRODUCTOS - VERSIÓN CORREGIDA
// ==============================================

async function handleProductSubmit(e) {
    e.preventDefault();
    console.log('🔄 Enviando formulario de producto...');

    const submitBtn = document.getElementById('save-product');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        const productId = document.getElementById('product-id').value;
        const isEditing = !!productId;

        // Validar campos requeridos
        const validation = validateProductForm();
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        // Preparar datos del producto
        const productData = prepareProductData();

        // Generar SKU si no existe
        if (!productData.sku || productData.sku.trim() === '') {
            productData.sku = generateSKU(productData.name);
        }

        // Procesar imágenes en el orden actual
        console.log('📷 Procesando imágenes...');
        const finalImages = await processProductImages(isEditing);
        console.log('📸 Imágenes finales a guardar:', finalImages);

        // IMPORTANTE: Debido al trigger sync_images_trigger, debemos manejar las imágenes cuidadosamente
        if (finalImages.length > 0) {
            // La primera imagen es la principal
            productData.main_image = finalImages[0];
            
            // Guardar TODAS las imágenes en el campo images como JSON string
            // Esto es compatible con tu campo TEXT
            productData.images = JSON.stringify(finalImages);
            
            console.log('✅ main_image:', productData.main_image);
            console.log('✅ images (JSON string):', productData.images);
        } else {
            // Si no hay imágenes, limpiar ambos campos
            productData.main_image = '';
            productData.images = JSON.stringify([]);
        }

        console.log('📦 Datos a enviar a Supabase:', productData);

        // Guardar en Supabase
        let result;
        if (isEditing) {
            console.log('📝 Actualizando producto existente:', productId);
            result = await window.supabaseClient.updateProduct(productId, productData);
        } else {
            console.log('🆕 Creando nuevo producto');
            result = await window.supabaseClient.createProduct(productData);
        }

        console.log('✅ Producto guardado en Supabase:', result);
        showNotification(`Producto ${isEditing ? 'actualizado' : 'creado'} correctamente`, 'success');

        hideProductModal();
        await reloadAdminProducts();

    } catch (error) {
        console.error('❌ Error guardando producto:', error);
        showNotification('Error al guardar el producto: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function validateProductForm() {
    const name = document.getElementById('product-name').value.trim();
    const description = document.getElementById('product-description').value.trim();
    const category = document.getElementById('product-category').value;
    const brand = document.getElementById('product-brand').value;
    const wholesalePrice = parseFloat(document.getElementById('product-wholesale-price').value) || 0;
    const retailPrice = parseFloat(document.getElementById('product-retail-price').value) || 0;

    if (!name) return { valid: false, message: 'El nombre del producto es requerido' };
    if (!description) return { valid: false, message: 'La descripción del producto es requerida' };
    if (!category) return { valid: false, message: 'La categoría es requerida' };
    if (!brand) return { valid: false, message: 'La marca es requerida' };
    if (wholesalePrice <= 0) return { valid: false, message: 'El precio mayorista debe ser mayor a 0' };
    if (retailPrice <= 0) return { valid: false, message: 'El precio minorista debe ser mayor a 0' };
    if (retailPrice < wholesalePrice) return { valid: false, message: 'El precio minorista debe ser mayor o igual al precio mayorista' };

    return { valid: true, message: '' };
}

function prepareProductData() {
    const colors = document.getElementById('product-colors').value;
    const colorsArray = colors ? colors.split(',').map(c => c.trim()).filter(c => c) : [];

    const specificationsText = document.getElementById('product-specifications').value;
    let specifications = {};

    if (specificationsText.trim()) {
        specificationsText.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                specifications[key.trim()] = valueParts.join(':').trim();
            }
        });
    }

    return {
        name: document.getElementById('product-name').value.trim(),
        description: document.getElementById('product-description').value.trim(),
        category_id: document.getElementById('product-category').value,
        brand_id: document.getElementById('product-brand').value,
        sku: document.getElementById('product-sku').value.trim(),
        cost_price: parseFloat(document.getElementById('product-cost-price').value) || 0,
        wholesale_price: parseFloat(document.getElementById('product-wholesale-price').value) || 0,
        retail_price: parseFloat(document.getElementById('product-retail-price').value) || 0,
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        min_stock: parseInt(document.getElementById('product-min-stock').value) || 0,
        colors: colorsArray,
        specifications: specifications,
        technical_details: document.getElementById('product-technical-details').value.trim(),
        is_active: true
    };
}

function generateSKU(name) {
    const prefix = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// ==============================================
// RENDERIZADO DE PRODUCTOS
// ==============================================

function filterProducts() {
    try {
        const searchInput = document.getElementById('product-search');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim();

        if (searchTerm === '') {
            adminFilteredProducts = [];
        } else {
            adminFilteredProducts = adminProducts.filter(product => {
                if (!product) return false;

                const searchFields = [
                    product.name || '',
                    product.categories?.name || '',
                    product.description || '',
                    product.brands?.name || '',
                    product.sku || '',
                    product.colors ? (Array.isArray(product.colors) ? product.colors.join(' ') : product.colors) : ''
                ];

                return searchFields.some(field =>
                    field && field.toLowerCase().includes(searchTerm)
                );
            });
        }

        renderAdminProducts();
    } catch (error) {
        console.error('❌ Error filtrando productos:', error);
    }
}

function renderAdminProducts() {
    const adminProductsList = document.getElementById('admin-products-list');
    if (!adminProductsList) return;

    try {
        adminProductsList.innerHTML = '';

        const productsToRender = adminFilteredProducts.length > 0 ? adminFilteredProducts : adminProducts;
        const searchInput = document.getElementById('product-search');
        const hasSearchTerm = searchInput && searchInput.value.trim() !== '';

        if (!Array.isArray(productsToRender) || productsToRender.length === 0) {
            if (hasSearchTerm) {
                adminProductsList.innerHTML = createNoResultsHTML(
                    'No se encontraron productos que coincidan con tu búsqueda.',
                    'Limpiar búsqueda',
                    'clearSearch()'
                );
            } else {
                adminProductsList.innerHTML = createNoResultsHTML(
                    'No hay productos registrados.',
                    'Agregar Primer Producto',
                    'showProductModal()'
                );
            }
            return;
        }

        productsToRender.forEach(product => {
            if (!product) return;

            const productElement = createProductElement(product);
            adminProductsList.appendChild(productElement);
        });

    } catch (error) {
        console.error('❌ Error renderizando productos:', error);
        adminProductsList.innerHTML = '<p class="error">Error al cargar los productos</p>';
    }
}

function createProductElement(product) {
    const div = document.createElement('div');
    div.className = 'product-item';

    const images = getSafeProductImages(product);
    const mainImage = images[0] || PLACEHOLDER_IMAGE;

    const hasStock = (product.stock || 0) > 0;
    const isLowStock = hasStock && (product.stock <= (product.min_stock || 0));
    const stockStatus = hasStock ? (isLowStock ? 'Stock Bajo' : 'En Stock') : 'Sin Stock';
    const stockClass = hasStock ? (isLowStock ? 'low-stock' : 'in-stock') : 'out-of-stock';

    div.innerHTML = `
        <div class="product-image-container">
            <img src="${mainImage}" 
                 alt="${escapeHtml(product.name || 'Producto')}" 
                 class="product-item-image"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}'">
            ${images.length > 1 ? `<div class="images-count-badge" title="${images.length} imágenes">+${images.length - 1}</div>` : ''}
        </div>
        <div class="product-item-info">
            <div class="product-item-name">${escapeHtml(product.name || 'Producto sin nombre')}</div>
            <div class="product-item-category">${escapeHtml(product.categories?.name || 'Sin categoría')}</div>
            <div class="product-item-brand">${escapeHtml(product.brands?.name || 'Sin marca')}</div>
            <div class="product-item-sku">SKU: ${escapeHtml(product.sku || 'N/A')}</div>
            <div class="product-item-stock ${stockClass}">${stockStatus} (${product.stock || 0})</div>
            <div class="product-item-prices">
                <span class="wholesale-price">Mayorista: $${(product.wholesale_price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span class="retail-price">Minorista: $${(product.retail_price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            ${product.colors && product.colors.length > 0 ?
            `<div class="product-item-colors"><strong>Colores:</strong> ${escapeHtml(Array.isArray(product.colors) ? product.colors.join(', ') : product.colors)}</div>` : ''}
            ${images.length > 0 ?
            `<div class="product-item-images-count"><i class="fas fa-images"></i> ${images.length} imagen(es)</div>` : ''}
        </div>
        <div class="product-item-actions">
            <button class="btn btn-edit" onclick="editProduct('${product.id}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-delete" onclick="deleteProduct('${product.id}')">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `;

    return div;
}

function createNoResultsHTML(message, buttonText, buttonAction) {
    return `
        <div class="no-results" style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
            <i class="fas fa-box-open" style="font-size: 64px; color: #cbd5e1; margin-bottom: 20px;"></i>
            <p style="font-size: 16px; color: #64748b; margin-bottom: 24px;">${message}</p>
            <button class="btn btn-primary" onclick="${buttonAction}" style="padding: 12px 24px; font-size: 14px;">
                <i class="fas fa-plus"></i> ${buttonText}
            </button>
        </div>
    `;
}

// ==============================================
// EDICIÓN Y ELIMINACIÓN DE PRODUCTOS
// ==============================================

async function editProduct(id) {
    console.log('✏️ Editando producto:', id);
    try {
        const product = await window.supabaseClient.getProductById(id);
        if (!product) {
            showNotification('Producto no encontrado', 'error');
            return;
        }

        currentProduct = product;
        console.log('📦 Producto cargado para edición:', product);

        // Llenar formulario con datos existentes
        fillProductForm(product);

        // Mostrar imágenes existentes
        displayExistingImages(product);

        // Actualizar UI del modal
        document.getElementById('product-modal-title').innerHTML = '<i class="fas fa-edit"></i> <span>Editar Producto</span>';
        document.getElementById('save-product').innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';

        // Mostrar modal
        showProductModal(true);
        showNotification(`Editando: ${product.name}`, 'info');

    } catch (error) {
        console.error('❌ Error cargando producto para editar:', error);
        showNotification('Error al cargar el producto: ' + error.message, 'error');
    }
}

function fillProductForm(product) {
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-category').value = product.category_id || '';
    document.getElementById('product-brand').value = product.brand_id || '';
    document.getElementById('product-sku').value = product.sku || '';
    document.getElementById('product-cost-price').value = product.cost_price || 0;
    document.getElementById('product-wholesale-price').value = product.wholesale_price || 0;
    document.getElementById('product-retail-price').value = product.retail_price || 0;
    document.getElementById('product-stock').value = product.stock || 0;
    document.getElementById('product-min-stock').value = product.min_stock || 0;

    // Colores
    const colors = product.colors;
    if (Array.isArray(colors)) {
        document.getElementById('product-colors').value = colors.join(', ');
    } else if (typeof colors === 'string') {
        document.getElementById('product-colors').value = colors;
    } else {
        document.getElementById('product-colors').value = '';
    }

    // Especificaciones
    const specsInput = document.getElementById('product-specifications');
    if (specsInput) {
        if (typeof product.specifications === 'object' && product.specifications !== null) {
            const specsText = Object.entries(product.specifications)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
            specsInput.value = specsText;
        } else if (typeof product.specifications === 'string') {
            specsInput.value = product.specifications;
        } else {
            specsInput.value = '';
        }
    }

    document.getElementById('product-technical-details').value = product.technical_details || '';
}

async function deleteProduct(id) {
    const product = adminProducts.find(p => p.id === id);
    if (!product) {
        showNotification('Producto no encontrado', 'error');
        return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${product.name}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        // Eliminar el producto (marcar como inactivo)
        await window.supabaseClient.deleteProduct(id);
        showNotification('Producto eliminado correctamente', 'success');
        await reloadAdminProducts();
    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        showNotification('Error al eliminar el producto: ' + error.message, 'error');
    }
}

async function reloadAdminProducts() {
    try {
        console.log('🔄 Recargando productos...');
        adminProducts = await window.supabaseClient.getProducts();
        updateAdminStats();
        renderAdminProducts();
        renderStockTable();
    } catch (error) {
        console.error('❌ Error recargando productos:', error);
        showNotification('Error al recargar productos', 'error');
    }
}

// ==============================================
// GESTIÓN DE STOCK
// ==============================================

function renderStockTable() {
    const tbody = document.getElementById('stock-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const productsToShow = adminFilteredProducts.length > 0 ? adminFilteredProducts : adminProducts;

    if (productsToShow.length === 0) {
        let message = 'No hay productos registrados';
        const searchInput = document.getElementById('stock-search');
        if (searchInput && searchInput.value.trim() !== '') {
            message = `No se encontraron productos que coincidan con "${searchInput.value}"`;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #cbd5e1; margin-bottom: 20px; display: block;"></i>
                    <p style="font-size: 16px; color: #64748b; margin: 10px 0;">${message}</p>
                    ${searchInput && searchInput.value.trim() !== '' ?
                '<button class="btn btn-secondary" onclick="clearStockSearch()" style="margin-top: 15px;">Limpiar búsqueda</button>' :
                '<button class="btn btn-primary" onclick="showProductModal()" style="margin-top: 15px;">Agregar Producto</button>'}
                </td>
            </tr>
        `;
        return;
    }

    productsToShow.forEach(product => {
        const row = document.createElement('tr');

        const hasStock = (product.stock || 0) > 0;
        const isLowStock = hasStock && (product.stock <= (product.min_stock || 0));
        const stockIndicator = hasStock ?
            (isLowStock ?
                '<span style="color: #f59e0b; font-weight: bold;">●</span>' :
                '<span style="color: #10b981; font-weight: bold;">●</span>') :
            '<span style="color: #ef4444; font-weight: bold;">●</span>';

        const stockStatus = hasStock ? (isLowStock ? 'text-warning' : 'text-success') : 'text-danger';

        row.innerHTML = `
            <td>
                ${stockIndicator}
                <strong>${escapeHtml(product.name || 'Sin nombre')}</strong>
            </td>
            <td>${escapeHtml(product.categories?.name || 'N/A')}</td>
            <td>${escapeHtml(product.brands?.name || 'N/A')}</td>
            <td class="${stockStatus}">${product.stock || 0}</td>
            <td>$${(product.wholesale_price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>$${(product.retail_price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>
                <button class="btn btn-edit" onclick="editProduct('${product.id}')" style="padding: 6px 12px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-delete" onclick="deleteProduct('${product.id}')" style="padding: 6px 12px; font-size: 12px;">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function searchStockProducts() {
    const searchInput = document.getElementById('stock-search');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm === '') {
        adminFilteredProducts = [];
        renderStockTable();
        return;
    }

    adminFilteredProducts = adminProducts.filter(product => {
        const searchFields = [
            product.name || '',
            product.categories?.name || '',
            product.description || '',
            product.brands?.name || '',
            product.sku || ''
        ];

        return searchFields.some(field =>
            field && field.toLowerCase().includes(searchTerm)
        );
    });

    renderStockTable();
}

// ==============================================
// FUNCIONES AUXILIARES
// ==============================================

async function logout() {
    try {
        console.log('🔐 Iniciando proceso de cierre de sesión...');

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.disabled = true;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando sesión...';
        }

        await window.supabaseClient.signOut();

        // Limpiar almacenamiento local
        localStorage.clear();
        sessionStorage.clear();

        showNotification('Sesión cerrada correctamente', 'success');

        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 1000);

    } catch (error) {
        console.error('💥 Error cerrando sesión:', error);
        window.location.href = 'admin-login.html';
    }
}

function showNotification(message, type = 'success') {
    try {
        // Eliminar notificaciones existentes
        document.querySelectorAll('.custom-notification').forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = 'custom-notification';

        const icon = type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icon}"></i>
                <span>${escapeHtml(message)}</span>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);

    } catch (error) {
        console.error('❌ Error mostrando notificación:', error);
        alert(message);
    }
}

// ==============================================
// FUNCIONES DE UTILIDAD
// ==============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==============================================
// FUNCIÓN FALTANTE: renderOrders
// ==============================================

function renderOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    try {
        ordersList.innerHTML = '';

        if (!adminOrders || adminOrders.length === 0) {
            ordersList.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-receipt"></i>
                    <h3>No hay ventas registradas</h3>
                    <p>Cuando los clientes realicen pedidos, aparecerán aquí.</p>
                </div>
            `;
            return;
        }

        adminOrders.forEach(order => {
            const orderElement = createOrderElement(order);
            ordersList.appendChild(orderElement);
        });

    } catch (error) {
        console.error('❌ Error renderizando órdenes:', error);
        ordersList.innerHTML = '<p class="error">Error al cargar las órdenes</p>';
    }
}

function createOrderElement(order) {
    const div = document.createElement('div');
    div.className = 'order-card';

    const orderDate = new Date(order.created_at);
    const formattedDate = orderDate.toLocaleDateString('es-ES');
    const formattedTime = orderDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="order-header">
            <div class="order-info">
                <div class="order-customer">
                    <strong>${escapeHtml(order.customer_name || 'Cliente')}</strong>
                    <span class="order-phone">${escapeHtml(order.customer_phone || 'Sin teléfono')}</span>
                </div>
                <div class="order-meta">
                    <span class="order-id">Factura: ${escapeHtml(order.invoice_number || order.id)}</span>
                    <span class="order-date">${formattedDate} ${formattedTime}</span>
                </div>
            </div>
            <div class="order-total">
                $${(order.total_amount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
        </div>
        <div class="order-actions">
            <button class="btn btn-info" onclick="viewOrderDetail('${order.id}')">
                <i class="fas fa-eye"></i> Ver Detalle
            </button>
        </div>
    `;

    return div;
}

// Asegurar que viewOrderDetail esté disponible globalmente
window.viewOrderDetail = function (orderId) {
    const order = adminOrders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Orden no encontrada', 'error');
        return;
    }

    fillInvoiceModal(order);
    showModal('invoice-modal');
};

function fillInvoiceModal(order) {
    const orderDate = new Date(order.created_at);

    document.getElementById('invoice-number').textContent = order.invoice_number || order.id;
    document.getElementById('invoice-id').textContent = order.invoice_number || order.id;
    document.getElementById('invoice-date').textContent = orderDate.toLocaleDateString('es-ES');
    document.getElementById('invoice-time').textContent = orderDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('invoice-status').textContent = order.status || 'Completado';

    document.getElementById('customer-name').textContent = order.customer_name || 'No especificado';
    document.getElementById('customer-phone').textContent = order.customer_phone || 'No especificado';
    document.getElementById('customer-email').textContent = order.customer_email || 'No especificado';
    document.getElementById('payment-method').textContent = order.payment_method || 'No especificado';

    const itemsContainer = document.getElementById('invoice-items');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';

        const items = order.items || [];
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(item.name || 'Producto')}</td>
                <td>${item.quantity || 1}</td>
                <td>$${(item.price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td>$${((item.price || 0) * (item.quantity || 1)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
            `;
            itemsContainer.appendChild(row);
        });
    }

    document.getElementById('invoice-total').textContent = (order.total_amount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

// ==============================================
// FUNCIONES GLOBALES
// ==============================================

window.clearSearch = function () {
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.value = '';
        adminFilteredProducts = [];
        renderAdminProducts();
    }
};

window.clearStockSearch = function () {
    const stockSearch = document.getElementById('stock-search');
    if (stockSearch) {
        stockSearch.value = '';
        adminFilteredProducts = [];
        renderStockTable();
    }
};

// Exportar funciones principales
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.loadAdminData = loadAdminData;
window.showProductModal = showProductModal;

// Agrega esto al final de tu archivo admin-init.js, justo antes del último console.log

// Configurar botones de eliminar
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que todo esté cargado
    setTimeout(function() {
        setupRemoveImageListeners();
        injectRemoveButtonStyles();
    }, 1000);
});

function setupRemoveImageListeners() {
    // Usar delegación de eventos para manejar clics en el contenedor de imágenes
    document.addEventListener('click', function(e) {
        // Verificar si se hizo clic en un botón de eliminar
        if (e.target.classList.contains('remove-image') || 
            e.target.closest('.remove-image')) {
            
            e.preventDefault();
            e.stopPropagation();
            
            const removeBtn = e.target.classList.contains('remove-image') 
                ? e.target 
                : e.target.closest('.remove-image');
            
            const imageContainer = removeBtn.closest('.image-preview-item');
            if (imageContainer) {
                if (confirm('¿Eliminar esta imagen?')) {
                    imageContainer.remove();
                    updateUploadAreaFeedback();
                    updateImageOrderIndicators();
                    showNotification('Imagen eliminada', 'warning');
                }
            }
        }
    });
}

function injectRemoveButtonStyles() {
    const styles = `
    .image-preview-item .remove-image {
        cursor: pointer;
        background: #fee2e2;
        color: #dc2626;
        border-radius: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        border: 1px solid #fecaca;
    }
    
    .image-preview-item .remove-image:hover {
        background: #dc2626;
        color: white;
        transform: scale(1.1);
    }
    
    .image-preview-item .remove-image i {
        font-size: 12px;
    }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}
console.log('✅ admin-init.js cargado correctamente');