console.log('🔄 Inicializando Supabase Client PÚBLICO para Herrajería...');

const SUPABASE_URL = 'https://opueqifkagoonpbubflj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdWVxaWZrYWdvb25wYnViZmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDc3OTksImV4cCI6MjA3ODkyMzc5OX0.8ES1VbCKOu79JrMpPNTkUuDZmo9MOHsVZunui4CJYSI';

// Cliente Supabase global
let supabaseClient = null;

// Función de inicialización mejorada
function initializeSupabasePublic() {
    try {
        // Verificar si Supabase está disponible globalmente
        if (typeof supabase !== 'undefined') {
            console.log('✅ Supabase disponible globalmente');
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            setupGlobalClient();
        } else {
            console.log('⚠️ Supabase no disponible, cargando desde CDN...');
            loadSupabaseFromCDN();
        }
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        loadSupabaseFromCDN();
    }
}

function loadSupabaseFromCDN() {
    console.log('📥 Cargando Supabase desde CDN...');
    
    // Verificar si ya existe el script
    if (document.querySelector('script[src*="supabase-js"]')) {
        console.log('✅ Script de Supabase ya está cargado');
        checkSupabaseAvailability();
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        console.log('✅ Supabase cargado desde CDN');
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setupGlobalClient();
    };
    script.onerror = (error) => {
        console.error('❌ Error cargando Supabase desde CDN:', error);
        showFallbackMessage();
    };
    document.head.appendChild(script);
}

function checkSupabaseAvailability() {
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkInterval = setInterval(() => {
        attempts++;
        if (typeof supabase !== 'undefined') {
            clearInterval(checkInterval);
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            setupGlobalClient();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ Timeout: Supabase no se cargó');
            showFallbackMessage();
        }
    }, 100);
}

function setupGlobalClient() {
    if (!supabaseClient) {
        console.error('❌ supabaseClient no está disponible');
        return;
    }
    
    console.log('✅ Configurando cliente global...');
    
    // Configurar el cliente global
    window.supabaseClient = {
        getProducts: getProducts,
        getCategories: getCategories,
        getBrands: getBrands,
        isReady: true
    };
    
    console.log('✅ Cliente público inicializado correctamente');
    
    // Disparar evento personalizado para notificar que está listo
    window.dispatchEvent(new CustomEvent('supabaseReady'));
}

function showFallbackMessage() {
    console.warn('⚠️ Usando modo fallback - datos locales');
    // Configurar un cliente mock para desarrollo
    window.supabaseClient = {
        getProducts: async () => {
            console.log('📦 Usando datos de ejemplo');
            return getSampleProducts();
        },
        getCategories: async () => [],
        getBrands: async () => [],
        isReady: true
    };
    window.dispatchEvent(new CustomEvent('supabaseReady'));
}

function getSampleProducts() {
    return [
          {
            id: '1',
            name: 'Producto de Ejemplo',
            retail_price: 100,
            wholesale_price: 85,
            wholesale_limit: 10,
            main_image: 'https://via.placeholder.com/300x200?text=Producto+Ejemplo',
            images: ['https://via.placeholder.com/300x200?text=Producto+Ejemplo'],
            categories: { name: 'Ejemplo' },
            brands: { name: 'Marca Ejemplo' },
            description: 'Este es un producto de ejemplo',
            specifications: { Material: 'Acero', Color: 'Plateado' },
            stock: 10,
            min_stock: 2,
            sku: 'EJ-001',
            is_active: true,
            created_at: new Date().toISOString(),
            click_count: Math.floor(Math.random() * 100), // Simular clicks
            sold_count: Math.floor(Math.random() * 50)   // Simular ventas
        }
    ];
}

// En la función getProducts, asegúrate de incluir los campos de conteo
async function getProducts() {
    if (!supabaseClient) {
        console.error('❌ Cliente Supabase no inicializado');
        return [];
    }
    
    try {
        console.log('📦 Obteniendo productos activos...');
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
            console.error('❌ Error de Supabase:', error);
            throw error;
        }
        
        console.log(`✅ ${data?.length || 0} productos cargados`);
        return data || [];
    } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        return getSampleProducts();
    }
}

async function getCategories() {
    if (!supabaseClient) return [];
    
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
}

async function getBrands() {
    if (!supabaseClient) return [];
    
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
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabasePublic);
} else {
    initializeSupabasePublic();
}

console.log('✅ supabase-client-public.js cargado - inicialización en progreso...');