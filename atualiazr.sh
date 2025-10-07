#!/bin/bash

echo "🔧 Iniciando build do React..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Erro na build do React. Corrige antes de continuar."
  exit 1
fi

echo "📦 Copiando build para pasta Flask..."
rm -rf ../build
mkdir ../build
cp -r build/* ../build/

echo "✅ Build copiado com sucesso."

cd ..
echo "📤 Fazendo commit e push..."
git add .
git commit -m "Build atualizado e copiado para Flask"
git push

echo "🚀 Tudo pronto! Render vai compilar e publicar o serviço."
