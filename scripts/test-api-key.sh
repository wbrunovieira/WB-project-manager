#!/bin/bash

echo "🧪 Testando API com Bearer Token..."
echo ""

curl -X POST 'http://localhost:3000/api/issues' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer 7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6' \
  -d '{
    "title": "Fase 1: Value Objects - Sistema de Tokens Únicos Zoom",
    "description": "## 🎯 Objetivo\n\nImplementar os Value Objects fundamentais para o sistema de tokens únicos de entrada em sessões Zoom.",
    "workspaceId": "cmge96f200001wa7ouziczg0w",
    "projectId": "cmgfjhyh50005waqglsynsz1d",
    "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
    "statusId": "cmge9i3pv0007walqv7is970v",
    "assigneeId": "cmge96f1y0000wa7olxm69prv",
    "priority": "HIGH",
    "type": "FEATURE",
    "labelIds": ["cmgf23zl50009watfyq73olpr"]
  }'

echo ""
echo ""
