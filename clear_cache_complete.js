// Script completo para limpar cache da aplicação
// Execute este código no console do navegador (F12)

console.log('🧹 === LIMPEZA COMPLETA DE CACHE ===');

// 1. Limpar localStorage
try {
  const localStorageKeys = Object.keys(localStorage);
  console.log('📦 LocalStorage antes da limpeza:', localStorageKeys);
  
  localStorage.clear();
  console.log('✅ LocalStorage limpo com sucesso');
} catch (err) {
  console.error('❌ Erro ao limpar localStorage:', err);
}

// 2. Limpar sessionStorage
try {
  const sessionStorageKeys = Object.keys(sessionStorage);
  console.log('📦 SessionStorage antes da limpeza:', sessionStorageKeys);
  
  sessionStorage.clear();
  console.log('✅ SessionStorage limpo com sucesso');
} catch (err) {
  console.error('❌ Erro ao limpar sessionStorage:', err);
}

// 3. Limpar IndexedDB (se existir)
try {
  if ('indexedDB' in window) {
    // Listar bancos de dados IndexedDB
    if (indexedDB.databases) {
      indexedDB.databases().then(databases => {
        console.log('🗄️ Bancos IndexedDB encontrados:', databases);
        
        databases.forEach(db => {
          if (db.name) {
            const deleteReq = indexedDB.deleteDatabase(db.name);
            deleteReq.onsuccess = () => {
              console.log(`✅ Banco IndexedDB '${db.name}' removido`);
            };
            deleteReq.onerror = (err) => {
              console.error(`❌ Erro ao remover banco '${db.name}':`, err);
            };
          }
        });
      });
    }
  }
} catch (err) {
  console.error('❌ Erro ao limpar IndexedDB:', err);
}

// 4. Limpar cache do Service Worker (se existir)
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('🔧 Service Workers encontrados:', registrations.length);
      
      registrations.forEach(registration => {
        registration.unregister().then(success => {
          if (success) {
            console.log('✅ Service Worker removido');
          }
        });
      });
    });
  }
} catch (err) {
  console.error('❌ Erro ao limpar Service Workers:', err);
}

// 5. Limpar cache da API (Cache Storage)
try {
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      console.log('💾 Caches encontrados:', cacheNames);
      
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log(`🗑️ Removendo cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ Todos os caches removidos');
    });
  }
} catch (err) {
  console.error('❌ Erro ao limpar Cache Storage:', err);
}

// 6. Forçar reload sem cache
function forceReload() {
  console.log('🔄 Forçando reload sem cache...');
  
  // Tentar diferentes métodos de reload
  if (window.location.reload) {
    window.location.reload(true); // Força reload sem cache
  } else {
    window.location.href = window.location.href;
  }
}

// 7. Limpar cookies relacionados ao Supabase (opcional)
function clearSupabaseCookies() {
  try {
    const cookies = document.cookie.split(';');
    console.log('🍪 Cookies encontrados:', cookies.length);
    
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Limpar cookies relacionados ao Supabase
      if (name.includes('supabase') || name.includes('auth') || name.includes('session')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        console.log(`🗑️ Cookie removido: ${name}`);
      }
    });
  } catch (err) {
    console.error('❌ Erro ao limpar cookies:', err);
  }
}

// 8. Verificar se há dados residuais do Supabase
function checkSupabaseData() {
  console.log('🔍 Verificando dados residuais do Supabase...');
  
  // Verificar localStorage
  const supabaseKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('auth') || key.includes('session')
  );
  
  if (supabaseKeys.length > 0) {
    console.log('⚠️ Dados residuais encontrados no localStorage:', supabaseKeys);
    supabaseKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removido: ${key}`);
    });
  } else {
    console.log('✅ Nenhum dado residual do Supabase encontrado');
  }
}

// Executar limpeza completa
console.log('🚀 Iniciando limpeza completa...');

// Aguardar um pouco para as operações assíncronas
setTimeout(() => {
  clearSupabaseCookies();
  checkSupabaseData();
  
  console.log('\n🎉 === LIMPEZA CONCLUÍDA ===');
  console.log('📋 Resumo:');
  console.log('✅ LocalStorage limpo');
  console.log('✅ SessionStorage limpo');
  console.log('✅ IndexedDB limpo');
  console.log('✅ Service Workers removidos');
  console.log('✅ Cache Storage limpo');
  console.log('✅ Cookies do Supabase removidos');
  
  console.log('\n🔄 Para aplicar completamente as mudanças:');
  console.log('1. Feche todas as abas desta aplicação');
  console.log('2. Abra uma nova aba');
  console.log('3. Ou execute: forceReload()');
  
  // Perguntar se quer fazer reload automático
  if (confirm('Deseja fazer reload da página agora para aplicar as mudanças?')) {
    forceReload();
  }
}, 2000);

// Disponibilizar função para uso manual
window.forceReload = forceReload;
window.clearSupabaseCookies = clearSupabaseCookies;
window.checkSupabaseData = checkSupabaseData;

console.log('\n🛠️ Funções disponíveis:');
console.log('- forceReload() - Força reload sem cache');
console.log('- clearSupabaseCookies() - Limpa cookies do Supabase');
console.log('- checkSupabaseData() - Verifica dados residuais');