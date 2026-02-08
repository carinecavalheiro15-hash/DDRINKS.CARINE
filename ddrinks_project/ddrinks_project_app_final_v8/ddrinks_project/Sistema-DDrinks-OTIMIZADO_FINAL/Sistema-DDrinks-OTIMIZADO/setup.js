#!/usr/bin/env node

import { initializeDatabase, testConnection } from './database.js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config({ path: './config.env' });

console.log('🚀 Iniciando setup do Sistema DDrinks...\n');

async function setup() {
  try {
    console.log('📡 Testando conexão com MySQL...');
    const connected = await testConnection();
    
    if (!connected) {
      console.log('❌ Não foi possível conectar com MySQL.');
      console.log('📝 Verifique se:');
      console.log('   - MySQL está rodando');
      console.log('   - As credenciais no config.env estão corretas');
      console.log('   - O banco de dados existe');
      process.exit(1);
    }

    console.log('🗄️ Inicializando banco de dados...');
    await initializeDatabase();
    
    console.log('\n✅ Setup concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Execute: npm run dev');
    console.log('   2. Acesse: http://localhost:3000');
    console.log('   3. Faça o cadastro do primeiro usuário');
    console.log('\n🎉 Sistema DDrinks pronto para uso!');

  } catch (error) {
    console.error('❌ Erro durante o setup:', error.message);
    process.exit(1);
  }
}

setup();
