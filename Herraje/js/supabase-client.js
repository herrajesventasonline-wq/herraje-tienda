// supabase-client.js - VERSIÓN PROFESIONAL Y FUNCIONAL
console.log('🚀 Inicializando Supabase Client para Herrajería...');

const SUPABASE_URL = 'https://opueqifkagoonpbubflj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdWVxaWZrYWdvb25wYnViZmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDc3OTksImV4cCI6MjA3ODkyMzc5OX0.8ES1VbCKOu79JrMpPNTkUuDZmo9MOHsVZunui4CJYSI';

// Variable global para el cliente Supabase
let supabaseClient = null;

// Inicialización
function initializeSupabase() {
    try {
        console.log('🔧 Inicializando Supabase...');
        
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase SDK no está disponible');
            throw new Error('La biblioteca Supabase no se cargó correctamente');
        }
        
        // Crear cliente Supabase
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            },
            global: {
                headers: {
                    'x-application-name': 'herrajeria-admin'
                }
            }
        });
        
        console.log('✅ Supabase inicializado correctamente');
        
        // Configurar cliente global
        setupGlobalClient();
        
    } catch (error) {
        console.error('💥 Error inicializando Supabase:', error);
        setupFallbackClient();
    }
}

// Configurar todas las funciones del cliente
function setupGlobalClient() {
    window.supabaseClient = {
        client: supabaseClient,
        auth: supabaseClient.auth,
        storage: supabaseClient.storage,
        
        // ========== PRODUCTOS ==========
        getProducts: async function() {
            try {
                console.log('📦 Obteniendo productos...');
                const { data, error } = await supabaseClient
                    .from('products')
                    .select(`
                        *,
                        categories(name),
                        brands(name)
                    `)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('❌ Error obteniendo productos:', error);
                    throw new Error(`Error al cargar productos: ${error.message}`);
                }
                
                console.log(`✅ ${data?.length || 0} productos cargados`);
                return data || [];
            } catch (error) {
                console.error('❌ Error en getProducts:', error);
                throw error;
            }
        },
        
        getProductById: async function(id) {
            try {
                console.log(`🔍 Obteniendo producto ID: ${id}`);
                const { data, error } = await supabaseClient
                    .from('products')
                    .select(`
                        *,
                        categories(name),
                        brands(name)
                    `)
                    .eq('id', id)
                    .single();
                
                if (error) {
                    console.error('❌ Error obteniendo producto:', error);
                    throw new Error(`Producto no encontrado: ${error.message}`);
                }
                return data;
            } catch (error) {
                console.error('❌ Error en getProductById:', error);
                throw error;
            }
        },
        
        createProduct: async function(productData) {
            try {
                console.log('🆕 Creando nuevo producto:', productData.name);
                const { data, error } = await supabaseClient
                    .from('products')
                    .insert([productData])
                    .select()
                    .single();
                
                if (error) {
                    console.error('❌ Error creando producto:', error);
                    throw new Error(`Error al crear producto: ${error.message}`);
                }
                console.log('✅ Producto creado:', data.id);
                return data;
            } catch (error) {
                console.error('❌ Error en createProduct:', error);
                throw error;
            }
        },
        
        updateProduct: async function(id, productData) {
            try {
                console.log(`✏️ Actualizando producto ID: ${id}`);
                const { data, error } = await supabaseClient
                    .from('products')
                    .update(productData)
                    .eq('id', id)
                    .select()
                    .single();
                
                if (error) throw error;
                console.log('✅ Producto actualizado');
                return data;
            } catch (error) {
                console.error('❌ Error actualizando producto:', error);
                throw new Error(`Error al actualizar producto: ${error.message}`);
            }
        },
        
        deleteProduct: async function(id) {
            try {
                console.log(`🗑️ Eliminando producto ID: ${id}`);
                const { error } = await supabaseClient
                    .from('products')
                    .update({ is_active: false })
                    .eq('id', id);
                
                if (error) throw error;
                console.log('✅ Producto marcado como inactivo');
                return true;
            } catch (error) {
                console.error('❌ Error eliminando producto:', error);
                throw new Error(`Error al eliminar producto: ${error.message}`);
            }
        },
        
        // ========== CATEGORÍAS Y MARCAS ==========
        getCategories: async function() {
            try {
                const { data, error } = await supabaseClient
                    .from('categories')
                    .select('*')
                    .order('name');
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('❌ Error obteniendo categorías:', error);
                return [];
            }
        },
        
        getBrands: async function() {
            try {
                const { data, error } = await supabaseClient
                    .from('brands')
                    .select('*')
                    .order('name');
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('❌ Error obteniendo marcas:', error);
                return [];
            }
        },
        
        // ========== ÓRDENES ==========
        getOrders: async function() {
            try {
                const { data, error } = await supabaseClient
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('❌ Error obteniendo órdenes:', error);
                return [];
            }
        },
        
        getOrderById: async function(id) {
            try {
                const { data, error } = await supabaseClient
                    .from('orders')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('❌ Error obteniendo orden:', error);
                return null;
            }
        },
        
        // ========== STORAGE - IMÁGENES (VERSIÓN SIMPLIFICADA) ==========
// ========== STORAGE - IMÁGENES ==========
uploadImage: async function(file) {
    try {
        console.log('📤 Subiendo imagen:', file.name);
        
        // Verificar tipo y tamaño
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExt)) {
            throw new Error('Formato no permitido. Use JPG, PNG, WEBP o GIF.');
        }
        
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('La imagen debe ser menor a 5MB.');
        }
        
        // Generar nombre único
        const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        console.log('Nombre del archivo:', fileName);
        
        // Subir a Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from('product-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });
        
        if (error) {
            console.error('Error de storage:', error);
            
            // Si el bucket no existe, guía al usuario
            if (error.message.includes('bucket') || error.message.includes('not found')) {
                throw new Error('El bucket "product-images" no existe. Ve a Supabase → Storage → Create new bucket → Nombre: "product-images" → Public → Create bucket');
            }
            
            throw error;
        }
        
        // Obtener URL pública
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
        console.log('✅ Imagen subida:', publicUrl);
        
        return publicUrl;
        
    } catch (error) {
        console.error('❌ Error subiendo imagen:', error);
        throw error;
    }
},

// Función simplificada para verificar bucket
checkStorageBucket: async function() {
    try {
        const { data, error } = await supabaseClient.storage
            .from('product-images')
            .list('', { limit: 1 });
        
        if (error) {
            console.error('Error verificando bucket:', error);
            return false;
        }
        
        console.log('✅ Bucket verificado correctamente');
        return true;
    } catch (error) {
        console.error('Error en checkStorageBucket:', error);
        return false;
    }
},

// Nueva función para asegurar que el bucket existe
ensureBucketExists: async function() {
    try {
        const { data: buckets, error } = await supabaseClient.storage.listBuckets();
        if (error) throw error;
        
        const exists = buckets.some(b => b.name === 'product-images');
        if (!exists) {
            throw new Error('El bucket "product-images" no existe. Crea el bucket en Supabase Storage primero.');
        }
        return true;
    } catch (error) {
        console.error('❌ Error verificando bucket:', error);
        throw error;
    }
},
        
        uploadMultipleImages: async function(files) {
            try {
                console.log(`📤 Subiendo ${files.length} imágenes...`);
                
                const uploadPromises = Array.from(files).map(file => this.uploadImage(file));
                const results = await Promise.all(uploadPromises);
                
                console.log(`✅ ${results.length} imágenes subidas correctamente`);
                return results;
                
            } catch (error) {
                console.error('❌ Error subiendo múltiples imágenes:', error);
                throw error;
            }
        },
        
        deleteImage: async function(imageUrl) {
            try {
                if (!imageUrl || typeof imageUrl !== 'string') {
                    return false;
                }
                
                // Extraer nombre del archivo de la URL
                const fileName = imageUrl.split('/').pop();
                
                if (!fileName) {
                    return false;
                }
                
                console.log(`🗑️ Eliminando imagen: ${fileName}`);
                
                const { error } = await supabaseClient.storage
                    .from('product-images')
                    .remove([fileName]);
                
                if (error) {
                    console.error('❌ Error eliminando imagen:', error);
                    return false;
                }
                
                console.log('✅ Imagen eliminada');
                return true;
                
            } catch (error) {
                console.error('❌ Error en deleteImage:', error);
                return false;
            }
        },
        
        // ========== AUTENTICACIÓN ==========
        getSession: async function() {
            try {
                const { data, error } = await supabaseClient.auth.getSession();
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('❌ Error obteniendo sesión:', error);
                throw error;
            }
        },
        
        signOut: async function() {
            try {
                const { error } = await supabaseClient.auth.signOut();
                if (error) throw error;
                console.log('✅ Sesión cerrada correctamente');
                return true;
            } catch (error) {
                console.error('❌ Error cerrando sesión:', error);
                throw error;
            }
        },
        
        // ========== UTILIDADES ==========
        isReady: function() {
            return supabaseClient !== null;
        },
        
        // Función para verificar conexión
        testConnection: async function() {
            try {
                const { data, error } = await supabaseClient
                    .from('products')
                    .select('id')
                    .limit(1);
                
                if (error) throw error;
                return { success: true, message: 'Conexión exitosa a Supabase' };
            } catch (error) {
                return { success: false, message: `Error de conexión: ${error.message}` };
            }
        }
    };
    
    console.log('✅ Cliente Supabase configurado completamente');
    
    // Disparar evento de que está listo
    const readyEvent = new CustomEvent('supabaseReady', { detail: { timestamp: Date.now() } });
    window.dispatchEvent(readyEvent);
}

// Cliente de respaldo para desarrollo
function setupFallbackClient() {
    console.warn('⚠️ Usando cliente de respaldo (modo desarrollo)');
    
    window.supabaseClient = {
        client: null,
        auth: null,
        storage: null,
        
        getProducts: async () => {
            console.log('📦 Usando datos de ejemplo para productos');
            return [];
        },
        
        getProductById: async (id) => ({ id, name: 'Producto de ejemplo' }),
        createProduct: async () => ({ id: 'temp-' + Date.now() }),
        updateProduct: async () => ({ id: 'updated' }),
        deleteProduct: async () => true,
        getCategories: async () => [{ id: '1', name: 'Linea Baño' }],
        getBrands: async () => [{ id: '1', name: 'Premium' }],
        getOrders: async () => [],
        getOrderById: async () => null,
        uploadImage: async () => 'https://via.placeholder.com/300x200',
        uploadMultipleImages: async () => ['https://via.placeholder.com/300x200'],
        deleteImage: async () => true,
        getSession: async () => ({ session: null }),
        signOut: async () => true,
        isReady: () => true,
        testConnection: async () => ({ success: false, message: 'Modo desarrollo activo' })
    };
    
    console.log('✅ Cliente de respaldo configurado');
    window.dispatchEvent(new CustomEvent('supabaseReady'));
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    initializeSupabase();
}


console.log('✅ supabase-client.js cargado correctamente');
