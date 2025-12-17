// admin-login.js
console.log('🔧 Inicializando sistema de login...');

document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ DOM cargado - esperando Supabase Client...');
    
    // Esperar a que Supabase esté listo
    if (typeof window.supabaseClient !== 'undefined') {
        console.log('✅ Cliente Supabase disponible');
        setupLoginSystem();
    } else {
        // Esperar evento de Supabase listo
        window.addEventListener('supabaseReady', setupLoginSystem);
        
        // Timeout de seguridad
        setTimeout(() => {
            if (typeof window.supabaseClient === 'undefined') {
                console.error('❌ Supabase no se cargó en 10 segundos');
                showError('Error de conexión. Recarga la página.');
            }
        }, 10000);
    }
});

function setupLoginSystem() {
    console.log('🔐 Configurando sistema de login...');
    
    const loginForm = document.getElementById('adminLoginForm');
    const loginBtn = document.getElementById('loginBtn');
    
    if (!loginForm || !loginBtn) {
        console.error('❌ Elementos del formulario no encontrados');
        return;
    }
    
    // Verificar si ya hay sesión activa
    checkExistingSession();
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleLogin();
    });
}

async function checkExistingSession() {
    try {
        console.log('🔍 Verificando sesión existente...');
        
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) {
            console.error('❌ Error verificando sesión:', error);
            return;
        }
        
        if (session) {
            console.log('✅ Sesión activa encontrada:', session.user.email);
            // Redirigir al panel de administración
            window.location.href = 'admin.html';
        } else {
            console.log('ℹ️ No hay sesión activa');
        }
    } catch (error) {
        console.error('❌ Error en checkExistingSession:', error);
    }
}

async function handleLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showError('Por favor completa todos los campos');
        return;
    }
    
    try {
        // Cambiar estado del botón
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        
        console.log('🔐 Intentando login para:', email);
        
        // Intentar login con Supabase Auth
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Error de login:', error);
            
            if (error.message.includes('Invalid login credentials')) {
                showError('Credenciales incorrectas');
            } else if (error.message.includes('Email not confirmed')) {
                showError('Email no confirmado');
            } else {
                showError('Error al iniciar sesión: ' + error.message);
            }
            
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            return;
        }
        
        if (data.user) {
            console.log('✅ Login exitoso para:', data.user.email);
            
            // Verificar que sea administrador
            await verifyAdminUser(data.user.id, data.user.email);
        }
        
    } catch (error) {
        console.error('💥 Error inesperado en handleLogin:', error);
        showError('Error inesperado: ' + error.message);
        
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
    }
}

async function verifyAdminUser(userId, userEmail) {
    try {
        console.log('🔐 Verificando permisos de administrador...');
        
        // Lista de emails autorizados (puedes expandir esta lista)
        const adminEmails = [
            'herrajesventasonline@gmail.com',
            'admin@herrajeria.com'
            // Agrega más emails de administradores aquí
        ];
        
        // Verificación básica por email
        if (adminEmails.includes(userEmail.toLowerCase())) {
            console.log('✅ Usuario autorizado como administrador');
            
            // Mostrar mensaje de éxito
            showSuccess('Acceso autorizado. Redirigiendo...');
            
            // Redirigir después de un breve delay
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
            
            return;
        }
        
        // Si no está en la lista, verificar en la tabla admin_users
        try {
            const { data: adminUser, error } = await window.supabaseClient
                .from('admin_users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error || !adminUser) {
                console.warn('❌ Usuario no es administrador');
                await window.supabaseClient.auth.signOut();
                showError('No tienes permisos de administrador');
                return;
            }
            
            console.log('✅ Usuario verificado en tabla admin_users');
            
            // Redirigir al panel
            showSuccess('Acceso autorizado. Redirigiendo...');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
            
        } catch (dbError) {
            console.warn('⚠️ No se pudo verificar tabla admin_users, usando verificación por email');
            
            // Si falla la verificación de la tabla pero el email está autorizado, permitir acceso
            if (adminEmails.includes(userEmail.toLowerCase())) {
                showSuccess('Acceso autorizado. Redirigiendo...');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                await window.supabaseClient.auth.signOut();
                showError('No tienes permisos de administrador');
            }
        }
        
    } catch (error) {
        console.error('❌ Error en verifyAdminUser:', error);
        await window.supabaseClient.auth.signOut();
        showError('Error verificando permisos: ' + error.message);
    }
}

function showError(message) {
    // Crear o mostrar notificación de error
    let errorDiv = document.getElementById('loginError');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'loginError';
        errorDiv.style.cssText = `
            background: #fee;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 12px;
            border-radius: 6px;
            margin: 15px 0;
            text-align: center;
        `;
        
        const form = document.getElementById('adminLoginForm');
        form.parentNode.insertBefore(errorDiv, form);
    }
    
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorDiv.style.display = 'block';
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    // Crear notificación de éxito
    let successDiv = document.getElementById('loginSuccess');
    
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'loginSuccess';
        successDiv.style.cssText = `
            background: #efe;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 12px;
            border-radius: 6px;
            margin: 15px 0;
            text-align: center;
        `;
        
        const form = document.getElementById('adminLoginForm');
        form.parentNode.insertBefore(successDiv, form);
    }
    
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successDiv.style.display = 'block';
}

console.log('✅ admin-login.js cargado');
