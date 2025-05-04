// MONITOR DE MODO OFFLINE - Hook para identificar onde o modo offline está sendo ativado
console.log('========== MONITOR DE MODO OFFLINE INICIADO ==========');

// Salva valores originais
const originalEnv = { ...process.env };
const originalConsoleLog = console.log;

// Substitui console.log para capturar mensagens
console.log = function(...args) {
  // Se for a mensagem de modo offline
  if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('Modo offline ativado')) {
    originalConsoleLog('INTERCEPTADO: Mensagem de ativação do modo offline');
    originalConsoleLog('Stack trace:');
    originalConsoleLog(new Error().stack);
    originalConsoleLog('Detalhes do ambiente no momento da ativação:');
    originalConsoleLog('OFFLINE_MODE env:', process.env.OFFLINE_MODE);
    originalConsoleLog('OFFLINE_MODE global:', global.OFFLINE_MODE);
  }
  
  // Chama o console.log original
  return originalConsoleLog.apply(console, args);
};

// Monitoramento de alterações em global
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function(obj, prop, descriptor) {
  if (prop === 'OFFLINE_MODE' && obj === global) {
    originalConsoleLog('DETECTADO: Tentativa de definir global.OFFLINE_MODE');
    originalConsoleLog('Valor sendo definido:', descriptor.value);
    originalConsoleLog('Stack trace:');
    originalConsoleLog(new Error().stack);
  }
  return originalDefineProperty(obj, prop, descriptor);
};

// Monitoramento de alterações de process.env
process.env = new Proxy(process.env, {
  set(target, prop, value) {
    if (prop === 'OFFLINE_MODE') {
      originalConsoleLog('DETECTADO: Tentativa de definir process.env.OFFLINE_MODE');
      originalConsoleLog('Novo valor:', value);
      originalConsoleLog('Stack trace:');
      originalConsoleLog(new Error().stack);
    }
    return Reflect.set(target, prop, value);
  }
});

// Força o modo online
global.OFFLINE_MODE = false;
process.env.OFFLINE_MODE = 'false';

originalConsoleLog('========== MONITOR DE MODO OFFLINE PREPARADO ==========');

module.exports = {
  originalEnv,
  disableOffline: () => {
    global.OFFLINE_MODE = false;
    process.env.OFFLINE_MODE = 'false';
    originalConsoleLog('Modo offline desativado pelo hook');
  }
}; 